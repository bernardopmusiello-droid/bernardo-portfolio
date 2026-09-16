import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createRuntime} from '../scripts/local-runtime.mjs';
let mf,db;const origin='http://portfolio.test';
const headers={'oai-authenticated-user-id':'local-owner','oai-authenticated-user-email':'owner@example.test','Origin':origin,'x-portfolio-request':'1'};
async function req(path,{method='GET',body,raw,auth=true,extra={}}={}){return mf.dispatchFetch(origin+path,{method,headers:{...(auth?headers:{}),...(body?{'Content-Type':'application/json'}:{}),...extra},body:raw||(body?JSON.stringify(body):undefined)});}
async function ok(path,options){const r=await req(path,options);const json=await r.json();assert.equal(r.status,200,JSON.stringify(json));return json;}
const project=overrides=>({title:'A real project',kind:'Website',year:2026,summary:'An example description',description:'Text <script>alert(1)</script>',url:'https://example.com/',mediaIds:[],...overrides});
async function create(overrides){return ok('/api/admin/projects',{method:'POST',body:project(overrides)});}
const png=Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=','base64'));
async function upload(p,raw=png,mime='image/png',filename='cover.png'){
 const u=await ok('/api/admin/uploads',{method:'POST',body:{projectId:p.id,filename,mime,size:raw.length}});
 for(let i=0;i<raw.length;i+=u.chunkSize)await ok(`/api/admin/uploads/${u.id}/${i/u.chunkSize+1}`,{method:'PUT',raw:raw.slice(i,i+u.chunkSize)});
 return ok(`/api/admin/uploads/${u.id}/complete`,{method:'POST',body:{}});
}
before(async()=>{mf=await createRuntime();db=await mf.getD1Database('DB');});after(async()=>{await mf?.dispose();});
test('owner-only API fails closed and cross-origin mutations are refused',async()=>{
 assert.equal((await req('/api/admin/projects',{auth:false})).status,401);
 assert.equal((await req('/api/admin/projects',{extra:{'oai-authenticated-user-id':'someone-else'}})).status,403);
 assert.equal((await req('/api/admin/projects',{method:'POST',body:project(),extra:{origin:'https://attacker.test'}})).status,403);
 assert.equal((await req('/api/admin/projects',{method:'POST',body:project(),extra:{'x-portfolio-request':''}})).status,403);
 const page=await req('/admin');assert.match(page.headers.get('content-security-policy'),/frame-ancestors 'self'/);
});
test('drafts are private; publishing uses a separate snapshot and optimistic versions',async()=>{
 let p=await create({title:'Original title'});const m=await upload(p);
 assert.equal((await req(`/media/${m.id}`,{auth:false})).status,404);
 p=await ok(`/api/admin/projects/${p.id}`,{method:'PUT',body:{...p,mediaIds:[m.id],coverId:m.id}});
 assert.equal((await req(`/api/admin/projects/${p.id}/publish`,{method:'POST',body:{version:p.version}})).status,400);
 p=await ok(`/api/admin/projects/${p.id}/publish`,{method:'POST',body:{version:p.version,rightsConfirmed:true}});
 assert.equal((await req(`/media/${m.id}`,{auth:false})).status,200);
 let published=(await ok('/api/projects',{auth:false})).projects.find(x=>x.id===p.id);assert.equal(published.title,'Original title');assert.equal(published.media[0].id,m.id);
 const old=p;p=await ok(`/api/admin/projects/${p.id}`,{method:'PUT',body:{...p,title:'Private changes'}});
 assert.equal((await req(`/api/admin/projects/${p.id}`,{method:'PUT',body:old})).status,409);
 published=(await ok('/api/projects',{auth:false})).projects.find(x=>x.id===p.id);assert.equal(published.title,'Original title');
 assert.equal((await req(`/api/admin/media/${m.id}`,{method:'DELETE'})).status,409);
 p=await ok(`/api/admin/projects/${p.id}/unpublish`,{method:'POST',body:{version:p.version}});
 assert.equal((await req(`/media/${m.id}`,{auth:false})).status,404);
 p=await ok(`/api/admin/projects/${p.id}/trash`,{method:'POST',body:{version:p.version}});assert.ok(p.deletedAt);
 assert.equal((await req(`/api/admin/projects/${p.id}`,{method:'PUT',body:p})).status,409);
 p=await ok(`/api/admin/projects/${p.id}/restore`,{method:'POST',body:{version:p.version}});assert.equal(p.deletedAt,null);assert.equal(p.published,null);
});
test('multipart upload resumes with verified checksums and video ranges',async()=>{
 const p=await create({kind:'Video'}),video=new Uint8Array(8*1024*1024+101);video.set([0,0,0,24,102,116,121,112,105,115,111,109]);video[video.length-1]=99;
 const u=await ok('/api/admin/uploads',{method:'POST',body:{projectId:p.id,filename:'movie.mp4',mime:'video/mp4',size:video.length}});
 assert.equal((await req(`/api/admin/uploads/${u.id}/2`,{method:'PUT',raw:video.slice(u.chunkSize)})).status,409);
 await ok(`/api/admin/uploads/${u.id}/1`,{method:'PUT',raw:video.slice(0,u.chunkSize)});
 const progress=await ok(`/api/admin/uploads/${u.id}`);assert.equal(progress.parts.length,1);assert.match(progress.parts[0].checksum,/^[a-f0-9]{64}$/);
 assert.equal((await req(`/api/admin/uploads/${u.id}/complete`,{method:'POST',body:{}})).status,409);
 await ok(`/api/admin/uploads/${u.id}/2`,{method:'PUT',raw:video.slice(u.chunkSize)});const m=await ok(`/api/admin/uploads/${u.id}/complete`,{method:'POST',body:{}});
 const r=await req(`/media/${m.id}`,{extra:{range:'bytes=-10'}});assert.equal(r.status,206);assert.equal(r.headers.get('content-length'),'10');const tail=new Uint8Array(await r.arrayBuffer());assert.equal(tail[9],99);
 assert.equal((await req(`/media/${m.id}`,{extra:{range:'bytes=999999999-'}})).status,416);
 const head=await req(`/media/${m.id}`,{method:'HEAD'});assert.equal(head.headers.get('content-length'),String(video.length));assert.equal((await head.arrayBuffer()).byteLength,0);
});
test('interrupted multipart completion recovers; cancellation cannot resurrect a file',async()=>{
 const p=await create();const u=await ok('/api/admin/uploads',{method:'POST',body:{projectId:p.id,filename:'recover.png',mime:'image/png',size:png.length}});
 await ok(`/api/admin/uploads/${u.id}/1`,{method:'PUT',raw:png});
 await db.prepare("UPDATE media SET status='completing',updated_at=? WHERE id=?").bind(Date.now(),u.id).run();
 assert.equal((await req(`/api/admin/uploads/${u.id}/abort`,{method:'POST',body:{}})).status,409);
 assert.equal((await req(`/api/admin/media/${u.id}`,{method:'DELETE'})).status,409);
 await db.prepare('UPDATE media SET updated_at=? WHERE id=?').bind(Date.now()-130000,u.id).run();
 assert.equal((await ok(`/api/admin/uploads/${u.id}/complete`,{method:'POST',body:{}})).status,'ready');
 await ok(`/api/admin/media/${u.id}`,{method:'DELETE'});assert.equal((await req(`/media/${u.id}`)).status,404);
});
test('rejects executable links, unsupported/oversized files, mismatched content and cross-project media',async()=>{
 assert.equal((await req('/api/admin/projects',{method:'POST',body:project({url:'javascript:alert(1)'})})).status,400);
 const p=await create();for(const meta of [{filename:'x.html',mime:'text/html',size:10},{filename:'x.mp4',mime:'video/mp4',size:1024**3+1}])assert.ok((await req('/api/admin/uploads',{method:'POST',body:{projectId:p.id,...meta}})).status>=400);
 const u=await ok('/api/admin/uploads',{method:'POST',body:{projectId:p.id,filename:'fake.png',mime:'image/png',size:8}});assert.equal((await req(`/api/admin/uploads/${u.id}/1`,{method:'PUT',raw:new TextEncoder().encode('<script>')})).status,415);
 const other=await create(),m=await upload(other);assert.equal((await req(`/api/admin/projects/${p.id}`,{method:'PUT',body:{...p,mediaIds:[m.id]}})).status,400);
});
test('storage reservation enforces configured quota, including unfinished uploads',async()=>{
 const small=await createRuntime({limit:100});try{const call=(path,body)=>small.dispatchFetch(origin+path,{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(body)});const p=await (await call('/api/admin/projects',project())).json();let r=await call('/api/admin/uploads',{projectId:p.id,filename:'one.png',mime:'image/png',size:80});assert.equal(r.status,200);r=await call('/api/admin/uploads',{projectId:p.id,filename:'two.png',mime:'image/png',size:80});assert.equal(r.status,409);}finally{await small.dispose();}
});
test('missing owner configuration denies admin access rather than letting a visitor claim it',async()=>{
 const unconfigured=await createRuntime({owner:''});try{assert.equal((await unconfigured.dispatchFetch(origin+'/api/admin/projects',{headers})).status,503);}finally{await unconfigured.dispose();}
});
test('permanent deletion is limited to confirmed trash and removes its media',async()=>{
 let p=await create();const m=await upload(p);
 assert.equal((await req(`/api/admin/projects/${p.id}`,{method:'DELETE',body:{version:p.version,confirm:true}})).status,400);
 p=await ok(`/api/admin/projects/${p.id}/trash`,{method:'POST',body:{version:p.version}});
 assert.equal((await req(`/api/admin/projects/${p.id}`,{method:'DELETE',body:{version:p.version}})).status,400);
 await ok(`/api/admin/projects/${p.id}`,{method:'DELETE',body:{version:p.version,confirm:true}});
 assert.equal((await req(`/api/admin/projects/${p.id}`)).status,404);assert.equal((await req(`/media/${m.id}`)).status,404);
});
test('YouTube-only projects save, publish, keep edits private, and reject unsupported links',async()=>{
  let p=await create({title:'Linked film',kind:'Video',url:'',youtubeUrl:'https://youtu.be/M7lc1UVf-VE?si=tracking'});
  assert.equal(p.youtubeUrl,'https://www.youtube.com/watch?v=M7lc1UVf-VE');
  assert.equal((await ok('/api/projects',{auth:false})).projects.some(item=>item.id===p.id),false);
  p=await ok(`/api/admin/projects/${p.id}/publish`,{method:'POST',body:{version:p.version,rightsConfirmed:true}});
  let published=(await ok('/api/projects',{auth:false})).projects.find(item=>item.id===p.id);assert.equal(published.youtubeUrl,p.youtubeUrl);assert.deepEqual(published.media,[]);
  p=await ok(`/api/admin/projects/${p.id}`,{method:'PUT',body:{...p,youtubeUrl:'https://www.youtube.com/shorts/abcdefghijk'}});
  published=(await ok('/api/projects',{auth:false})).projects.find(item=>item.id===p.id);assert.equal(published.youtubeUrl,'https://www.youtube.com/watch?v=M7lc1UVf-VE');
  assert.equal((await req(`/api/admin/projects/${p.id}`,{method:'PUT',body:{...p,youtubeUrl:'https://youtube.com.evil.test/watch?v=M7lc1UVf-VE'}})).status,400);
  const page=await req('/admin');assert.match(page.headers.get('content-security-policy'),/frame-src https:\/\/www.youtube-nocookie.com;/);
});
test('a video with a story and no short introduction can be published',async()=>{
  let p=await create({title:'A finished film',kind:'Video',year:2025,summary:'',description:'A short film about the effort behind success.',role:'Editor, Filmer, Producer',url:'',youtubeUrl:'https://youtu.be/M7lc1UVf-VE'});
  assert.equal((await ok('/api/projects',{auth:false})).projects.some(item=>item.id===p.id),false);
  p=await ok(`/api/admin/projects/${p.id}/publish`,{method:'POST',body:{version:p.version,rightsConfirmed:true}});
  const published=(await ok('/api/projects',{auth:false})).projects.find(item=>item.id===p.id);
  assert.equal(published.title,'A finished film');
  assert.equal(published.summary,'');
  assert.equal(published.description,'A short film about the effort behind success.');
  assert.equal(published.role,'Editor, Filmer, Producer');
  assert.equal(published.youtubeUrl,'https://www.youtube.com/watch?v=M7lc1UVf-VE');
});
