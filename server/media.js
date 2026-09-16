import {CHUNK_SIZE,fail,bytes,jsonBody,uploadInput,signature,owner} from './security.js';
import {query,now,findProject,isPublishedMedia} from './data.js';
const summary=m=>({id:m.id,projectId:m.project_id,filename:m.filename,mime:m.mime,size:m.size,status:m.status,createdAt:m.created_at,url:`/media/${m.id}`});
export async function mediaRecord(env,id){const m=await query(env,'SELECT * FROM media WHERE id=?',id).first();if(!m)fail(404,'File not found.');return m;}
export async function mediaRoutes(request,env,path,user){
  if(path==='/api/admin/media'&&request.method==='GET'){
    const projectId=new URL(request.url).searchParams.get('project');
    const rows=projectId?await query(env,"SELECT * FROM media WHERE project_id=? AND status NOT IN ('deleted','aborted') ORDER BY created_at DESC",projectId).all():await query(env,"SELECT * FROM media WHERE status NOT IN ('deleted','aborted') ORDER BY created_at DESC LIMIT 1000").all();
    const used=await query(env,"SELECT COALESCE(SUM(size),0) total FROM media WHERE status NOT IN ('deleted','aborted')").first();
    return {media:rows.results.map(summary),used:used.total,limit:Number(env.PORTFOLIO_STORAGE_LIMIT_BYTES)||20*1024**3,chunkSize:CHUNK_SIZE};
  }
  if(path==='/api/admin/uploads'&&request.method==='POST'){
    const b=await jsonBody(request),meta=uploadInput(b),project=await findProject(env,b.projectId);
    if(project.deleted_at)fail(409,'Restore the project before uploading.');
    const count=await query(env,"SELECT COUNT(*) n FROM media WHERE project_id=? AND status NOT IN ('deleted','aborted')",project.id).first();
    if(count.n>=30)fail(409,'This project has 30 files. Remove an unused file before adding another.');
    const id=crypto.randomUUID(),key=`media/${id}`,time=now();
    const multipart=await env.BUCKET.createMultipartUpload(key,{httpMetadata:{contentType:meta.mime}});
    try{
      const inserted=await query(env,`INSERT INTO media(id,project_id,owner_id,filename,mime,size,object_key,status,upload_id,created_at,updated_at)
        SELECT ?,?,?,?,?,?,?,'uploading',?,?,? WHERE EXISTS(SELECT id FROM projects WHERE id=? AND deleted_at IS NULL) AND (SELECT COALESCE(SUM(size),0) FROM media WHERE status NOT IN ('deleted','aborted'))+?<=?`,id,project.id,user.id,meta.filename,meta.mime,meta.size,key,multipart.uploadId,time,time,project.id,meta.size,Number(env.PORTFOLIO_STORAGE_LIMIT_BYTES)||20*1024**3).run();
      if(!inserted.meta.changes)fail(409,'Your media storage is full. Remove unused files before uploading more.');
    }catch(e){await multipart.abort().catch(()=>{});throw e;}
    return {id,chunkSize:CHUNK_SIZE,parts:[],...meta};
  }
  const match=path.match(/^\/api\/admin\/uploads\/([a-f0-9-]{36})(?:\/(\d+|complete|abort))?$/);
  if(match){
    const [,id,action]=match,m=await mediaRecord(env,id);
    if(m.status==='completing'&&now()-m.updated_at>120000){await query(env,"UPDATE media SET status='uploading' WHERE id=? AND status='completing' AND updated_at=?",id,m.updated_at).run();m.status='uploading';}
    if((await findProject(env,m.project_id)).deleted_at===-1)fail(409,'This project is being removed.');
    if(m.owner_id!==user.id)fail(403,'This upload belongs to another account.');
    if(request.method==='GET'&&!action){const parts=await query(env,'SELECT part,size,checksum FROM upload_parts WHERE media_id=? ORDER BY part',id).all();return {...summary(m),parts:parts.results,chunkSize:CHUNK_SIZE};}
    if(m.status==='ready'&&action==='complete')return summary(m);
    if(!['uploading','completing'].includes(m.status))fail(409,'This upload is no longer active.');
    const multipart=env.BUCKET.resumeMultipartUpload(m.object_key,m.upload_id);
    if(action==='abort'&&request.method==='POST'){
      const lock=await query(env,"UPDATE media SET status='aborted',updated_at=? WHERE id=? AND status='uploading'",now(),id).run();if(!lock.meta.changes)fail(409,'This file is finishing. Please wait before cancelling.');await multipart.abort();return {aborted:true};
    }
    if(m.status!=='uploading')fail(409,'This upload is finishing. Retry in a moment.');
    if(/^\d+$/.test(action||'')&&request.method==='PUT'){
      const part=Number(action),total=Math.ceil(m.size/CHUNK_SIZE);
      if(part<1||part>total)fail(400,'Invalid upload part.');
      const expected=part===total?m.size-CHUNK_SIZE*(total-1):CHUNK_SIZE;
      const data=await bytes(request,expected);if(data.length!==expected)fail(400,'The upload part is incomplete. Retry it.');
      if(part===1)signature(data,m.mime);
      else if(!await query(env,'SELECT part FROM upload_parts WHERE media_id=? AND part=1',id).first())fail(409,'Upload the first part before continuing.');
      const checksum=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),b=>b.toString(16).padStart(2,'0')).join('');
      const uploaded=await multipart.uploadPart(part,data);
      await env.DB.batch([query(env,'INSERT INTO upload_parts(media_id,part,etag,size,checksum) VALUES(?,?,?,?,?) ON CONFLICT(media_id,part) DO UPDATE SET etag=excluded.etag,size=excluded.size,checksum=excluded.checksum',id,part,uploaded.etag,data.length,checksum),query(env,'UPDATE media SET updated_at=? WHERE id=?',now(),id)]);
      return {part,size:data.length};
    }
    if(action==='complete'&&request.method==='POST'){
      const parts=(await query(env,'SELECT part,etag,size FROM upload_parts WHERE media_id=? ORDER BY part',id).all()).results;
      if(parts.length!==Math.ceil(m.size/CHUNK_SIZE)||parts.reduce((n,p)=>n+p.size,0)!==m.size||parts.some((p,i)=>p.part!==i+1))fail(409,'Some file parts are missing. Resume the upload.');
      const completionTime=now();const lock=await query(env,"UPDATE media SET status='completing',updated_at=? WHERE id=? AND status='uploading' AND EXISTS(SELECT id FROM projects WHERE id=media.project_id AND deleted_at IS NULL)",completionTime,id).run();if(!lock.meta.changes)fail(409,'This upload is already finishing.');
      try{
        let object=await env.BUCKET.head(m.object_key);
        if(!object)object=await multipart.complete(parts.map(p=>({partNumber:p.part,etag:p.etag})));
        if(object.size!==m.size){await env.BUCKET.delete(m.object_key);fail(400,'The uploaded file size did not match.');}
        const finished=await query(env,"UPDATE media SET status='ready',updated_at=? WHERE id=? AND status='completing' AND updated_at=?",now(),id,completionTime).run();if(!finished.meta.changes)fail(409,'The upload state changed. Refresh before continuing.');
        return summary({...m,status:'ready'});
      }catch(e){await query(env,"UPDATE media SET status='uploading' WHERE id=? AND status='completing' AND updated_at=?",id,completionTime).run();throw e;}
    }
    fail(405,'Method not allowed.');
  }
  const remove=path.match(/^\/api\/admin\/media\/([a-f0-9-]{36})$/);
  if(remove&&request.method==='DELETE'){
    const m=await mediaRecord(env,remove[1]);if(m.status==='deleted')return {deleted:true};
    if((await findProject(env,m.project_id)).deleted_at===-1)fail(409,'This project is being removed.');
    if(m.status==='completing')fail(409,'This file is finishing. Please wait before removing it.');
    const draft=JSON.parse((await findProject(env,m.project_id)).draft);
    if([...(draft.mediaIds||[]),draft.coverId,draft.videoId,draft.captionsId].includes(m.id)||await isPublishedMedia(env,m.id))fail(409,'Remove this file from the draft and any published version before deleting it.');
    const lock=await query(env,"UPDATE media SET status='deleting',updated_at=? WHERE id=? AND status=?",now(),m.id,m.status).run();if(!lock.meta.changes)fail(409,'This file changed. Refresh and try again.');
    if(m.status==='uploading')await env.BUCKET.resumeMultipartUpload(m.object_key,m.upload_id).abort().catch(()=>{});
    await env.BUCKET.delete(m.object_key);await query(env,"UPDATE media SET status='deleted',updated_at=? WHERE id=? AND status='deleting'",now(),m.id).run();return {deleted:true};
  }
  return null;
}
export async function streamMedia(request,env,id){
  const m=await query(env,"SELECT * FROM media WHERE id=? AND status='ready'",id).first();
  if(!m||(!owner(request,env)&&!await isPublishedMedia(env,id)))fail(404,'File not found.');
  if(!['GET','HEAD'].includes(request.method))fail(405,'Method not allowed.');
  const h=new Headers({'Content-Type':m.mime,'Cache-Control':'private, no-store','Accept-Ranges':'bytes','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin'});
  const download=new URL(request.url).searchParams.has('download')||m.mime==='application/pdf';
  if(download)h.set('Content-Disposition',`attachment; filename="${m.filename.replace(/[^a-zA-Z0-9._-]/g,'_')}"; filename*=UTF-8''${encodeURIComponent(m.filename).replace(/'/g,'%27')}`);
  let range=null;const rangeHeader=request.headers.get('range');
  if(rangeHeader){const r=rangeHeader.match(/^bytes=(\d*)-(\d*)$/);if(!r||(!r[1]&&!r[2]))return new Response(null,{status:416,headers:{...Object.fromEntries(h),'Content-Range':`bytes */${m.size}`}});
    const start=r[1]?Number(r[1]):Math.max(0,m.size-Number(r[2]));const end=r[1]?(r[2]?Math.min(Number(r[2]),m.size-1):m.size-1):m.size-1;
    if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=m.size||start>end)return new Response(null,{status:416,headers:{...Object.fromEntries(h),'Content-Range':`bytes */${m.size}`}});
    range={offset:start,length:end-start+1};h.set('Content-Range',`bytes ${start}-${end}/${m.size}`);
  }
  h.set('Content-Length',String(range?.length||m.size));
  if(request.method==='HEAD')return new Response(null,{status:range?206:200,headers:h});
  const object=await env.BUCKET.get(m.object_key,range?{range}:undefined);if(!object)fail(404,'File not found.');
  return new Response(object.body,{status:range?206:200,headers:h});
}
