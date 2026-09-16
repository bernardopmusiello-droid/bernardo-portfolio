export class HttpError extends Error { constructor(status,message){super(message);this.status=status;} }
export const fail=(status,message)=>{throw new HttpError(status,message);};
export const CHUNK_SIZE=8*1024*1024;
export const FILE_TYPES={
  'video/mp4':{ext:['mp4','m4v'],max:1024**3}, 'video/webm':{ext:['webm'],max:1024**3},
  'image/jpeg':{ext:['jpg','jpeg'],max:20*1024**2}, 'image/png':{ext:['png'],max:20*1024**2},
  'image/webp':{ext:['webp'],max:20*1024**2}, 'application/pdf':{ext:['pdf'],max:25*1024**2},
  'text/vtt':{ext:['vtt'],max:2*1024**2},
};
export function identity(request){
  const id=request.headers.get('oai-authenticated-user-id');
  const email=request.headers.get('oai-authenticated-user-email');
  return id&&email?{id,email}:null;
}
export function owner(request,env){const u=identity(request);return Boolean(u&&env.PORTFOLIO_OWNER_ID&&u.id===env.PORTFOLIO_OWNER_ID);}
export function requireOwner(request,env){
  if(!identity(request)) fail(401,'Sign in to manage your portfolio.');
  if(!env.PORTFOLIO_OWNER_ID) fail(503,'Owner access is being configured. Your portfolio is still available.');
  if(!owner(request,env)) fail(403,'This dashboard is private.');
  return identity(request);
}
export function mutation(request){
  const origin=new URL(request.url).origin;
  if(request.headers.get('origin')!==origin||request.headers.get('sec-fetch-site')==='cross-site'||request.headers.get('x-portfolio-request')!=='1') fail(403,'This request must come from your dashboard. Refresh and try again.');
}
export async function bytes(request,limit){
  const declared=Number(request.headers.get('content-length'));
  if(declared>limit) fail(413,'This request is too large.');
  if(!request.body) return new Uint8Array();
  const reader=request.body.getReader();let size=0;const pieces=[];
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();fail(413,'This request is too large.');}pieces.push(value);}
  const result=new Uint8Array(size);let offset=0;for(const piece of pieces){result.set(piece,offset);offset+=piece.length;}return result;
}
export async function jsonBody(request,limit=131072){
  if(!request.headers.get('content-type')?.startsWith('application/json')) fail(415,'Send JSON from the dashboard.');
  let value;try{value=JSON.parse(new TextDecoder().decode(await bytes(request,limit)));}catch(e){if(e instanceof HttpError)throw e;fail(400,'The saved data could not be read.');}
  if(!value||Array.isArray(value)||typeof value!=='object') fail(400,'Invalid project data.');return value;
}
export function text(value,max,required=false){
  if(typeof value!=='string') {if(value==null&&!required)return '';fail(400,'A text field is missing.');}
  value=value.trim();if(value.length>max||/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value))fail(400,'A text field is too long or contains invalid characters.');
  if(required&&!value)fail(400,'Add a project title.');return value;
}
export function id(value){if(typeof value!=='string'||!/^[a-f0-9-]{36}$/.test(value))fail(400,'Invalid item.');return value;}
export function safeUrl(value){value=text(value,2000);if(!value)return '';let u;try{u=new URL(value);}catch{fail(400,'Use a complete HTTPS website link.');}if(u.protocol!=='https:'||u.username||u.password)fail(400,'Use a complete HTTPS website link without login details.');return u.href;}
export function projectInput(value){
  const kind=text(value.kind,40);if(!['Website','Video','Broadcast graphic','Product','App','Other'].includes(kind))fail(400,'Choose a project category.');
  const year=Number(value.year);if(!Number.isInteger(year)||year<1900||year>2100)fail(400,'Use a valid project year.');
  const mediaIds=value.mediaIds??[];if(!Array.isArray(mediaIds)||mediaIds.length>30)fail(400,'Use up to 30 files in one project.');
  return {title:text(value.title,100,true),kind,year,summary:text(value.summary,280),description:text(value.description,10000),role:text(value.role,300),url:safeUrl(value.url),credits:text(value.credits,2000),transcript:text(value.transcript,16000),imageAlt:text(value.imageAlt,300),coverId:value.coverId?id(value.coverId):'',videoId:value.videoId?id(value.videoId):'',captionsId:value.captionsId?id(value.captionsId):'',mediaIds:[...new Set(mediaIds.map(id))]};
}
export function uploadInput(value){
  const filename=text(value.filename,180,true);const mime=text(value.mime,100);const type=FILE_TYPES[mime];
  if(!type||!type.ext.includes(filename.split('.').pop().toLowerCase()))fail(415,'Use MP4, WebM, JPG, PNG, WebP, PDF or VTT files.');
  const size=Number(value.size);if(!Number.isSafeInteger(size)||size<1||size>type.max)fail(413,'This file exceeds the upload limit for its type.');
  return {filename:filename.replace(/[\\/]/g,'_'),mime,size};
}
export function signature(data,mime){
  const ascii=(a,b)=>new TextDecoder().decode(data.slice(a,b));const prefix=(a)=>a.every((v,i)=>data[i]===v);
  const valid={
    'image/jpeg':()=>prefix([255,216,255]),'image/png':()=>prefix([137,80,78,71,13,10,26,10]),
    'image/webp':()=>ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP',
    'video/mp4':()=>ascii(4,8)==='ftyp'&&/^(isom|iso[2-9]|mp4[12]|avc1|M4V |MSNV|dash|cmfc|cmfs)$/.test(ascii(8,12)),
    'video/webm':()=>prefix([26,69,223,163]),'application/pdf':()=>ascii(0,5)==='%PDF-',
    'text/vtt':()=>/^\uFEFF?WEBVTT(?:[ \t].*)?(?:\r?\n|$)/.test(new TextDecoder().decode(data)),
  }[mime]?.();
  if(!valid)fail(415,'The file contents do not match its format. Export it again in a supported format.');
}
export function responseHeaders(response,{html=false}={}){
  const headers=new Headers(response.headers);headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','strict-origin-when-cross-origin');
  headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=(), payment=()');
  if(html)headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; media-src 'self' blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'");
  return new Response(response.body,{status:response.status,headers});
}
export const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store'}});
