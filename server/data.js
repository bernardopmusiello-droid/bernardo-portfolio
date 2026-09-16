import {fail,projectInput} from './security.js';
export const now=()=>Date.now();
export const record=(row)=>row?{id:row.id,...JSON.parse(row.draft),published:row.published?JSON.parse(row.published):null,version:row.version,deletedAt:row.deleted_at,createdAt:row.created_at,updatedAt:row.updated_at}:null;
export const query=(env,sql,...values)=>env.DB.prepare(sql).bind(...values);
export const audit=(env,action,projectId)=>query(env,'INSERT INTO audit(action,project_id,created_at) VALUES(?,?,?)',action,projectId,now());
export async function findProject(env,id){const row=await query(env,'SELECT * FROM projects WHERE id=?',id).first();if(!row)fail(404,'Project not found.');return row;}
export async function validateMedia(env,projectId,p){
  const ids=[...new Set([...p.mediaIds,p.coverId,p.videoId,p.captionsId].filter(Boolean))];
  if(ids.length>30)fail(400,'Use up to 30 files in one project.');
  for(const id of ids){const m=await query(env,"SELECT * FROM media WHERE id=? AND project_id=? AND status='ready'",id,projectId).first();if(!m)fail(400,'Finish uploading each selected file before saving.');
    if(p.coverId===id&&!m.mime.startsWith('image/'))fail(400,'Choose an image for the cover.');
    if(p.videoId===id&&!m.mime.startsWith('video/'))fail(400,'Choose a video for playback.');
    if(p.captionsId===id&&m.mime!=='text/vtt')fail(400,'Captions must be a WebVTT file.');}
  return {...p,mediaIds:ids};
}
export async function projectRoutes(request,env,path){
  if(path==='/api/admin/projects'){
    if(request.method==='GET'){const rows=await query(env,'SELECT * FROM projects ORDER BY updated_at DESC LIMIT 1000').all();return {projects:rows.results.map(record)};}
    if(request.method==='POST'){
      const {jsonBody}=await import('./security.js');const body=await jsonBody(request);const p=projectInput(body);if(p.mediaIds.length||p.coverId||p.videoId||p.captionsId)fail(400,'Save the project before adding files.');
      const id=crypto.randomUUID(),time=now();await env.DB.batch([query(env,'INSERT INTO projects(id,draft,version,created_at,updated_at) VALUES(?,?,1,?,?)',id,JSON.stringify(p),time,time),audit(env,'created',id)]);return record(await findProject(env,id));
    }
  }
  const match=path.match(/^\/api\/admin\/projects\/([a-f0-9-]{36})(?:\/(publish|unpublish|trash|restore))?$/);
  if(!match)return null;
  const [,id,action]=match;const current=await findProject(env,id);
  if(request.method==='GET'&&!action)return record(current);
  if(request.method==='DELETE'&&!action){
    const {jsonBody}=await import('./security.js');const body=await jsonBody(request);
    if(!current.deleted_at||body.confirm!==true)fail(400,'Move the project to trash and confirm permanent deletion first.');
    if(current.deleted_at!==-1&&body.version!==current.version)fail(409,'The project changed. Reload before deleting.');
    if(await query(env,"SELECT id FROM media WHERE project_id=? AND status='completing' LIMIT 1",id).first())fail(409,'A file is finishing. Wait before deleting this project.');
    if(current.deleted_at!==-1){const lock=await query(env,"UPDATE projects SET deleted_at=-1,version=version+1 WHERE id=? AND version=? AND deleted_at IS NOT NULL AND NOT EXISTS(SELECT id FROM media WHERE project_id=projects.id AND status='completing')",id,current.version).run();if(!lock.meta.changes)fail(409,'The project changed. Reload before deleting.');}
    const files=(await query(env,'SELECT * FROM media WHERE project_id=?',id).all()).results;
    for(const m of files){if(m.status==='uploading')await env.BUCKET.resumeMultipartUpload(m.object_key,m.upload_id).abort().catch(()=>{});await env.BUCKET.delete(m.object_key);}
    await env.DB.batch([query(env,'DELETE FROM upload_parts WHERE media_id IN (SELECT id FROM media WHERE project_id=?)',id),query(env,'DELETE FROM media WHERE project_id=?',id),query(env,'DELETE FROM projects WHERE id=? AND deleted_at=-1',id),audit(env,'permanently deleted',id)]);
    return {deleted:true};
  }
  if(current.deleted_at===-1)fail(409,'This project is being permanently removed. Retry deletion to finish.');
  if(request.method!=='PUT'&&request.method!=='POST')fail(405,'Method not allowed.');
  const {jsonBody}=await import('./security.js');const body=await jsonBody(request);
  if(body.version!==current.version)fail(409,'This project changed in another tab. Reload it before saving.');
  let draft=current.draft,published=current.published,deleted=current.deleted_at;
  if(!action&&request.method==='PUT'){
    if(deleted)fail(409,'Restore the project before editing.');draft=JSON.stringify(await validateMedia(env,id,projectInput(body)));
  }else if(action==='publish'){
    if(deleted)fail(409,'Restore the project before publishing.');
    if(body.rightsConfirmed!==true)fail(400,'Confirm you have permission to publish the work and all included media.');
    const p=await validateMedia(env,id,projectInput(JSON.parse(draft)));
    if(!p.summary)fail(400,'Add a short summary before publishing.');
    if(!p.url&&!p.mediaIds.length)fail(400,'Add a website link or media before publishing.');
    published=JSON.stringify({...p,publishedAt:now()});
  }else if(action==='unpublish'){published=null;}
  else if(action==='trash'){deleted=now();published=null;}
  else if(action==='restore'){deleted=null;}
  else fail(405,'Method not allowed.');
  const result=await query(env,'UPDATE projects SET draft=?,published=?,deleted_at=?,updated_at=?,version=version+1 WHERE id=? AND version=?',draft,published,deleted,now(),id,current.version).run();
  if(!result.meta.changes)fail(409,'This project changed in another tab. Reload it before saving.');
  await audit(env,action||'saved',id).run();return record(await findProject(env,id));
}
export async function isPublishedMedia(env,id){
  return Boolean(await query(env,`SELECT p.id FROM projects p, json_each(p.published,'$.mediaIds') a WHERE p.deleted_at IS NULL AND p.published IS NOT NULL AND a.value=? LIMIT 1`,id).first());
}
export async function publishedProjects(env){
  const rows=await query(env,'SELECT id,published FROM projects WHERE published IS NOT NULL AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT 1000').all();
  return Promise.all(rows.results.map(async r=>{const p={id:r.id,...JSON.parse(r.published)};const media=(await query(env,"SELECT id,filename,mime,size FROM media WHERE project_id=? AND status='ready'",r.id).all()).results;p.media=media.filter(m=>p.mediaIds.includes(m.id)).map(m=>({...m,url:`/media/${m.id}`}));return p;})).then(items=>items.sort((a,b)=>b.year-a.year||b.publishedAt-a.publishedAt));
}
