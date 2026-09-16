import {escapeHTML as e,fileSize,projectMedia,projectExtras} from './work-view.js';
const $=s=>document.querySelector(s), form=$('#editor');
const fields=['title','kind','year','summary','description','role','url','credits','transcript','imageAlt'];
let projects=[], current=null, media=[], dirty=false, trashView=false, busy=false, uploads=0, uploadBatch=false;
const blank=()=>({title:'',kind:'Website',year:new Date().getFullYear(),summary:'',description:'',role:'',url:'',credits:'',transcript:'',imageAlt:'',mediaIds:[],coverId:'',videoId:'',captionsId:''});
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').hidden=true,7000);}
async function api(path,{method='GET',body,raw,signal}={}){
  let response;try{response=await fetch(path,{method,credentials:'same-origin',headers:{...(method!=='GET'?{'x-portfolio-request':'1'}:{}),...(body?{'Content-Type':'application/json'}:{})},body:raw|| (body?JSON.stringify(body):undefined),signal});}catch(error){if(error.name==='AbortError')throw error;throw new Error('Connection interrupted. Your saved work is safe; try again.');}
  const data=await response.json().catch(()=>({error:'The server returned an unreadable response. Please retry.'}));
  if(!response.ok){const err=new Error(data.error||'Please try again.');err.status=response.status;throw err;}return data;
}
function markDirty(){dirty=true;$('#save-status').textContent='Unsaved changes';}
function data(){const p={version:current.version,mediaIds:[...current.mediaIds],coverId:current.coverId,videoId:current.videoId,captionsId:current.captionsId};for(const name of fields)p[name]=form.elements[name].value;p.year=Number(p.year);return p;}
function state(p){return p.deletedAt?'In trash':p.published?'Published · draft editable':'Private draft';}
function renderList(){
  const search=$('#project-search').value.toLowerCase();const list=projects.filter(p=>Boolean(p.deletedAt)===trashView&&`${p.title} ${p.kind}`.toLowerCase().includes(search));
  $('#project-list').innerHTML=list.length?list.map(p=>`<button class="project-item ${current?.id===p.id?'selected':''}" data-id="${p.id}" ${current?.id===p.id?'aria-current="true"':''}><strong>${e(p.title)}</strong><span>${e(p.kind)} · ${p.year}</span><small>${state(p)}</small></button>`).join(''):`<p class="library-empty">${search?'No matching projects.':trashView?'Your trash is empty.':'Your next project starts here.'}</p>`;
}
function replaceProject(p){const i=projects.findIndex(x=>x.id===p.id);if(i>=0)projects[i]=p;else projects.unshift(p);}
function fill(p){current=p;dirty=false;form.hidden=false;$('#blank').hidden=true;for(const name of fields)form.elements[name].value=p[name]??'';$('#editor-title').textContent=p.title||'New project';$('#project-state').textContent=state(p);$('#save-status').textContent=p.id?`Saved. ${p.published?'Visitors see the last published version.':'Only you can see this.'}`:'Add a title, then save your draft.';
  const deleted=Boolean(p.deletedAt);for(const element of form.querySelectorAll('input,textarea,select'))element.disabled=deleted||busy;
  for(const id of ['save-project','publish-project','trash-project'])$('#'+id).hidden=deleted;
  $('#restore-project').hidden=!deleted;$('#delete-project').hidden=!deleted;$('#unpublish-project').hidden=!p.published||deleted;$('#publish-project').textContent=p.published?'Publish update':'Publish';
  $('#upload-files').disabled=deleted||busy;renderList();renderMedia();
}
async function confirmAction(title,description,{label='Continue',rights=false}={}){
  $('#confirm-title').textContent=title;$('#confirm-description').textContent=description;$('#confirm-yes').textContent=label;$('#rights-label').hidden=!rights;$('#rights-note').hidden=!rights;$('#rights-confirmed').checked=false;$('#confirm-yes').disabled=rights;
  $('#rights-confirmed').onchange=()=>$('#confirm-yes').disabled=rights&&!$('#rights-confirmed').checked;
  const dialog=$('#confirm-dialog');dialog.returnValue='';dialog.showModal();return new Promise(resolve=>dialog.addEventListener('close',()=>resolve(dialog.returnValue==='confirm'),{once:true}));
}
async function canLeave(){if(busy){toast('Please wait for the current action.');return false;}if(uploads||uploadBatch){toast('Finish or pause your uploads before switching projects.');return false;}if(!dirty)return true;return confirmAction('Leave unsaved changes?','Your last saved draft will still be here.',{label:'Discard changes'});}
async function choose(id){if(!await canLeave())return;await run(async()=>{const p=await api(`/api/admin/projects/${id}`);media=[];$('#upload-queue').replaceChildren();fill(p);await loadMedia();});}
async function newProject(){if(!await canLeave())return;trashView=false;$('#active-tab').setAttribute('aria-pressed','true');$('#trash-tab').setAttribute('aria-pressed','false');media=[];$('#upload-queue').replaceChildren();fill(blank());form.elements.title.focus();}
async function loadMedia(){const result=await api(`/api/admin/media${current?.id?'?project='+current.id:''}`);media=current?.id?result.media:[];$('#storage-used').textContent=`${fileSize(result.used)} of ${fileSize(result.limit)} used`;renderMedia();}
async function save(){
  if(!form.elements.title.value.trim())throw new Error('Add a project title first.');
  if(!form.reportValidity())throw new Error('Please complete the highlighted fields.');
  const p=data();const saved=await api(current.id?`/api/admin/projects/${current.id}`:'/api/admin/projects',{method:current.id?'PUT':'POST',body:p});replaceProject(saved);fill(saved);if(!uploads)for(const row of $('#upload-queue').querySelectorAll('.upload-row'))if(!row.querySelector('button'))row.remove();return saved;
}
async function run(fn){if(uploads||uploadBatch){toast('Finish or pause your uploads first.');return;}if(busy){toast('One moment — finishing the current action.');return;}busy=true;for(const el of form.querySelectorAll('input,textarea,select'))el.disabled=true;$('#save-project').disabled=true;$('#publish-project').disabled=true;try{await fn();}catch(error){toast(error.message);$('#save-status').textContent=error.message;}finally{busy=false;for(const el of form.querySelectorAll('input,textarea,select'))el.disabled=Boolean(current?.deletedAt);$('#save-project').disabled=false;$('#publish-project').disabled=false;}}
form.addEventListener('input',markDirty);form.addEventListener('submit',event=>{event.preventDefault();run(async()=>{await save();await loadMedia();toast('Draft saved.');});});
$('#project-list').addEventListener('click',event=>{const b=event.target.closest('[data-id]');if(b)choose(b.dataset.id);});
$('#new-project').onclick=newProject;$('#first-project').onclick=newProject;$('#project-search').oninput=renderList;
for(const [id,value] of [['active-tab',false],['trash-tab',true]])$('#'+id).onclick=()=>{trashView=value;$('#active-tab').setAttribute('aria-pressed',String(!value));$('#trash-tab').setAttribute('aria-pressed',String(value));renderList();};
$('#publish-project').onclick=()=>run(async()=>{
  if(uploads)throw new Error('Finish or pause your uploads before publishing.');
  if(!form.reportValidity())return;
  if(!await confirmAction(current.published?'Publish this update?':'Ready to share this project?','The saved project and attached files will be visible to anyone who can view your portfolio.',{label:'Publish project',rights:true}))return;
  await save();const p=await api(`/api/admin/projects/${current.id}/publish`,{method:'POST',body:{version:current.version,rightsConfirmed:true}});replaceProject(p);fill(p);toast('Published. Your portfolio now shows this version.');
});
for(const action of ['unpublish','trash','restore'])$('#'+action+'-project').onclick=()=>run(async()=>{
  if(uploads)throw new Error('Finish or pause your uploads first.');if(!current.id){form.hidden=true;$('#blank').hidden=false;current=null;dirty=false;return;}
  const text={unpublish:['Unpublish this project?','It will disappear from your portfolio. Your draft and files stay private.'],trash:['Move this project to trash?','It will be unpublished. You can restore its saved draft and files later.'],restore:['Restore this project?','It will come back as a private draft.']}[action];
  if(action==='trash'&&dirty)text[1]+=' Unsaved edits will be discarded.';
  const pending=action==='unpublish'&&dirty?data():null;
  if(!await confirmAction(...text,{label:action==='trash'?'Move to trash':action==='restore'?'Restore draft':'Unpublish'}))return;
  const p=await api(`/api/admin/projects/${current.id}/${action}`,{method:'POST',body:{version:current.version}});replaceProject(p);fill(pending?{...p,...pending,version:p.version,published:p.published}:p);if(pending)markDirty();toast(action==='restore'?'Draft restored.':action==='trash'?'Moved to trash.':'Project unpublished.');
});
$('#delete-project').onclick=()=>run(async()=>{
  if(!current?.deletedAt)return;
  if(!await confirmAction('Permanently delete this project?', 'The project and all its uploaded files will be erased. This cannot be undone. Download a backup first.', {label:'Delete permanently'}))return;
  const id=current.id;await api(`/api/admin/projects/${id}`,{method:'DELETE',body:{version:current.version,confirm:true}});projects=projects.filter(p=>p.id!==id);current=null;media=[];dirty=false;form.hidden=true;$('#blank').hidden=false;renderList();await loadMedia();toast('Project and files removed.');
});
$('#preview-project').onclick=()=>{const p=data();$('#preview-content').innerHTML=`${projectMedia(p,media)}<h1>${e(p.title||'Untitled project')}</h1><p class="preview-meta">${e(p.kind)} · ${p.year}${p.role?' · '+e(p.role):''}</p><p>${e(p.summary)}</p><p class="work-prose">${e(p.description)}</p>${projectExtras(p,media)}`;$('#preview-dialog').showModal();};
$('.close-preview').onclick=()=>$('#preview-dialog').close();$('#preview-dialog').addEventListener('close',()=>{for(const video of $('#preview-dialog').querySelectorAll('video'))video.pause();});
function renderMedia(){
  $('#media-empty').hidden=media.length>0;$('#media-empty').textContent=current?.id?'Upload images, a video, or supporting files.':'Save this draft to start uploading.';
  $('#media-grid').innerHTML=media.map(m=>{
    const attached=current?.mediaIds?.includes(m.id),ready=m.status==='ready',used=m.id===current?.coverId?'Cover':m.id===current?.videoId?'Main video':m.id===current?.captionsId?'Captions':attached?'Attached':'Not attached';
    return `<article class="media-card">${ready&&m.mime.startsWith('image/')?`<img src="/media/${m.id}" alt="" loading="lazy">`:`<div class="file-symbol" aria-hidden="true">${m.mime.startsWith('video/')?'▶':m.mime==='text/vtt'?'CC':'▧'}</div>`}<strong>${e(m.filename)}</strong><span>${fileSize(m.size)} · ${ready?used:m.status==='completing'?'Finishing':'Upload paused'}</span><div class="file-actions">${ready?`<a href="/media/${m.id}?download">Download</a>${!current.deletedAt?`<button type="button" data-media="${m.id}" data-action="attach">${attached?'Detach':'Attach'}</button>${m.mime.startsWith('image/')?`<button type="button" data-media="${m.id}" data-action="coverId">${current.coverId===m.id?'Clear cover':'Use as cover'}</button>`:m.mime.startsWith('video/')?`<button type="button" data-media="${m.id}" data-action="videoId">${current.videoId===m.id?'Clear main video':'Use as main video'}</button>`:m.mime==='text/vtt'?`<button type="button" data-media="${m.id}" data-action="captionsId">${current.captionsId===m.id?'Clear captions':'Use as captions'}</button>`:''}`:''}`:`<small>Select the same file to resume.</small>`}${!attached&&!current?.deletedAt?`<button type="button" class="danger" data-media="${m.id}" data-action="delete">${ready?'Delete file':'Cancel upload'}</button>`:''}</div></article>`;
  }).join('');
}
$('#media-grid').onclick=event=>{if(busy){toast('Please wait for the current action.');return;}const button=event.target.closest('button[data-media]');if(!button)return;const m=media.find(x=>x.id===button.dataset.media),action=button.dataset.action;
  if(action==='delete'){run(async()=>{if(uploads)throw new Error('Pause or finish current uploads first.');if(!await confirmAction('Permanently remove this file?',`${m.filename} will be removed from storage. Keep a copy if you need it.`,{label:'Remove file'}))return;await api(`/api/admin/media/${m.id}`,{method:'DELETE'});await loadMedia();toast('File removed.');});return;}
  if(action==='attach'){if(current.mediaIds.includes(m.id)){current.mediaIds=current.mediaIds.filter(id=>id!==m.id);for(const key of ['coverId','videoId','captionsId'])if(current[key]===m.id)current[key]='';}else current.mediaIds.push(m.id);}
  else {current[action]=current[action]===m.id?'':m.id;if(current[action]&&!current.mediaIds.includes(m.id))current.mediaIds.push(m.id);}
  markDirty();renderMedia();
};
const mimeByExt={mp4:'video/mp4',m4v:'video/mp4',webm:'video/webm',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',pdf:'application/pdf',vtt:'text/vtt'};
const checksum=async blob=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),b=>b.toString(16).padStart(2,'0')).join('');
async function retryChunk(path,blob,signal){for(let attempt=0;;attempt++){try{return await api(path,{method:'PUT',raw:blob,signal});}catch(error){if(signal.aborted||attempt>=3||(error.status&&error.status<500&&error.status!==429))throw error;await new Promise(resolve=>setTimeout(resolve,750*2**attempt));}}}
async function upload(file,row,projectId=current.id){
  if(busy){toast('Please finish saving first.');return;}
  if(current?.id!==projectId){toast('Open the original project to resume this upload.');return false;}
  const controller=new AbortController();uploads++;row.querySelector('button').textContent='Pause';row.querySelector('button').onclick=()=>controller.abort();
  const message=row.querySelector('span'),progress=row.querySelector('progress');let completed=false;if(uploads>1){uploads--;toast('Finish or pause the current upload first.');return;}
  try{
    const mime=mimeByExt[file.name.split('.').pop().toLowerCase()];if(!mime)throw new Error('Choose an MP4, WebM, JPG, PNG, WebP, PDF or VTT file.');
    let pending=media.find(m=>m.projectId===projectId&&['uploading','completing'].includes(m.status)&&m.filename===file.name&&m.size===file.size);
    let state=pending?await api(`/api/admin/uploads/${pending.id}`):await api('/api/admin/uploads',{method:'POST',body:{projectId,filename:file.name,size:file.size,mime}});
    const size=state.chunkSize,total=Math.ceil(file.size/size);message.textContent='Checking saved progress…';
    for(const part of state.parts||[]){if(controller.signal.aborted)throw new DOMException('Paused','AbortError');if(part.checksum!==await checksum(file.slice((part.part-1)*size,part.part*size)))throw new Error('This is a different version of the file. Cancel its old upload, then upload this version again.');}
    const done=new Set((state.parts||[]).map(p=>p.part));
    for(let part=1;part<=total;part++){
      if(controller.signal.aborted)throw new DOMException('Paused','AbortError');
      if(!done.has(part))await retryChunk(`/api/admin/uploads/${state.id}/${part}`,file.slice((part-1)*size,part*size),controller.signal);
      progress.value=part/total*100;message.textContent=`${Math.round(progress.value)}% · ${fileSize(Math.min(part*size,file.size))} of ${fileSize(file.size)}`;
    }
    message.textContent='Finishing upload…';const result=await api(`/api/admin/uploads/${state.id}/complete`,{method:'POST',body:{}});
    if(current.id===projectId){if(!current.mediaIds.includes(result.id))current.mediaIds.push(result.id);if(result.mime.startsWith('image/')&&!current.coverId)current.coverId=result.id;if(result.mime.startsWith('video/')&&!current.videoId)current.videoId=result.id;if(result.mime==='text/vtt'&&!current.captionsId)current.captionsId=result.id;markDirty();}
    message.textContent='Uploaded · save your draft to attach';completed=true;row.querySelector('button').remove();
  }catch(error){message.textContent=error.name==='AbortError'?'Paused · progress saved':error.message;const button=row.querySelector('button');button.textContent='Resume';button.onclick=()=>upload(file,row,projectId);}
  finally{await loadMedia().catch(error=>toast(error.message));uploads--;if(completed)toast('Upload finished. Save your draft when you’re ready.');}
  return completed;
}
$('#upload-files').onchange=async event=>{
  const files=[...event.target.files];event.target.value='';if(!files.length)return;
  if(!current.id){toast('Add a title and save your draft before uploading.');return;}
  if(busy){toast('Please wait for the current action.');return false;}if(uploads||uploadBatch){toast('Finish or pause the current upload first.');return;}
  const projectId=current.id;uploadBatch=true;
  try{for(const file of files){const row=document.createElement('div');row.className='upload-row';row.innerHTML=`<strong>${e(file.name)}</strong><span>Getting ready…</span><progress max="100" value="0" aria-label="Upload progress"></progress><button type="button" class="text-button">Pause</button>`;$('#upload-queue').append(row);if(!await upload(file,row,projectId))break;}}
  finally{uploadBatch=false;}
};
addEventListener('beforeunload',event=>{if(dirty||uploads||uploadBatch){event.preventDefault();event.returnValue='';}});
try{
  const session=await api('/api/session');$('#signout').hidden=!session.signedIn;
  if(!session.signedIn){$('#gate-message').textContent='Sign in to manage your work. This space is just for the portfolio owner.';$('#signin').hidden=false;}
  else if(!session.configured)$('#gate-message').textContent='Your private studio is being connected to your account. Please check back shortly.';
  else if(!session.owner)$('#gate-message').textContent='This studio belongs to Bernardo. Your account does not have access.';
  else {const result=await api('/api/admin/projects');projects=result.projects;$('#gate').hidden=true;$('#studio').hidden=false;renderList();await loadMedia();}
}catch(error){$('#gate-message').textContent=error.message;const retry=document.createElement('button');retry.className='button';retry.textContent='Try again';retry.onclick=()=>location.reload();$('#gate').append(retry);}
