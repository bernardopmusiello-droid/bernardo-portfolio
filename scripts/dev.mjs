// Local-only dispatcher simulation. Never bundled into the production Worker.
import './build.mjs';
import {createServer} from 'node:http';
import {randomBytes} from 'node:crypto';
import {Readable} from 'node:stream';
import {createRuntime} from './local-runtime.mjs';
const port=Number(process.env.PORT)||4320,host=`127.0.0.1:${port}`,origin=`http://${host}`;
const session=randomBytes(32).toString('hex');const mf=await createRuntime({persist:true});
const server=createServer(async(req,res)=>{
  try{
    if(req.headers.host!==host){res.writeHead(403);res.end('Invalid host');return;}
    const url=new URL(req.url,origin),headers=new Headers();for(const [k,v]of Object.entries(req.headers))if(v&&!['oai-authenticated-user-id','oai-authenticated-user-email','host'].includes(k))headers.set(k,Array.isArray(v)?v.join(','):v);
    if(url.pathname==='/signin-with-chatgpt'){
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; form-action 'self'; frame-ancestors 'none'"});res.end('<h1>Local development sign-in</h1><p>This opens only your local test studio.</p><form action="/local-signin" method="post"><button>Open local studio</button></form>');return;
    }
    if(url.pathname==='/local-signin'&&req.method==='POST'){
      if(headers.get('origin')!==origin){res.writeHead(403);res.end('Invalid origin');return;}
      res.writeHead(303,{'Location':'/admin','Set-Cookie':`local_portfolio=${session}; HttpOnly; SameSite=Strict; Path=/`});res.end();return;
    }
    if(url.pathname==='/signout-with-chatgpt'){res.writeHead(303,{'Location':'/admin','Set-Cookie':'local_portfolio=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});res.end();return;}
    if((headers.get('cookie')||'').split(';').some(s=>s.trim()===`local_portfolio=${session}`)){headers.set('oai-authenticated-user-id','local-owner');headers.set('oai-authenticated-user-email','local@example.test');}
    const response=await mf.dispatchFetch(url.href,{method:req.method,headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Readable.toWeb(req),duplex:'half'})});res.writeHead(response.status,Object.fromEntries(response.headers));if(response.body)Readable.fromWeb(response.body).pipe(res);else res.end();
  }catch(error){console.error(error.message);res.writeHead(500);res.end('Local preview failed');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Portfolio preview: ${origin}\nPrivate studio: ${origin}/admin`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(async()=>{await mf.dispose();process.exit(0);}));
