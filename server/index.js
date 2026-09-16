import {HttpError,identity,owner,requireOwner,mutation,json,responseHeaders,fail} from './security.js';
import {projectRoutes,publishedProjects,query} from './data.js';
import {mediaRoutes,streamMedia} from './media.js';
import {adminDocument,noticeDocument} from './pages.js';
const html=(body,status=200)=>new Response(body,{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'}});
export default {async fetch(request,env){
  const url=new URL(request.url),path=url.pathname.replace(/\/$/,'')||'/';
  try{
    let response;
    if(path==='/api/session'){
      const u=identity(request);response=json({signedIn:Boolean(u),owner:owner(request,env),configured:Boolean(env.PORTFOLIO_OWNER_ID),user:u?{id:u.id,email:u.email}:null});
    }else if(path==='/admin'){
      response=html(adminDocument());
      response.headers.set('X-Frame-Options','SAMEORIGIN');
    }else if(path==='/privacy'||path==='/credits'){
      response=html(noticeDocument(path.slice(1)));
    }else if(path==='/api/projects'&&['GET','HEAD'].includes(request.method)){
      response=json({projects:await publishedProjects(env)});
    }else if(path.startsWith('/api/admin/')){
      const user=requireOwner(request,env);
      if(!['GET','HEAD'].includes(request.method))mutation(request);
      let result=await projectRoutes(request,env,path);
      if(result===null)result=await mediaRoutes(request,env,path,user);
      if(result===null&&path==='/api/admin/export'&&request.method==='GET'){
        const projects=(await query(env,'SELECT * FROM projects ORDER BY created_at').all()).results;
        const media=(await query(env,"SELECT id,project_id,filename,mime,size,status,created_at FROM media WHERE status NOT IN ('deleted','aborted')").all()).results;
        response=json({format:'bernardo-portfolio-backup',version:1,exportedAt:new Date().toISOString(),projects,media});response.headers.set('Content-Disposition','attachment; filename="portfolio-backup.json"');
      }else if(result!==null)response=json(result);else fail(404,'Not found.');
    }else if(/^\/media\/[a-f0-9-]{36}$/.test(path)){
      response=await streamMedia(request,env,path.split('/')[2]);
    }else if(path.startsWith('/api/')||path.startsWith('/media/'))fail(404,'Not found.');
    else{
      if(!['GET','HEAD'].includes(request.method))fail(405,'Method not allowed.');
      response=env.ASSETS?await env.ASSETS.fetch(request):new Response('Page not found.',{status:404,headers:{'Content-Type':'text/plain; charset=utf-8'}});
    }
    const result=responseHeaders(response,{html:response.headers.get('content-type')?.includes('text/html')});
    if(path==='/admin')result.headers.set('Content-Security-Policy',result.headers.get('Content-Security-Policy')+"; frame-ancestors 'self'");
    return result;
  }catch(e){
    if(!(e instanceof HttpError))console.error('Portfolio request failed',{path,message:e.message});
    return responseHeaders(json({error:e instanceof HttpError?e.message:'The portfolio could not complete this request. Your draft is still here; please try again.'},e instanceof HttpError?e.status:503));
  }
}};
