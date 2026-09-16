import {Miniflare} from 'miniflare';
import {readFile,readdir} from 'node:fs/promises';
export async function createRuntime({persist=false,owner='local-owner',limit=20*1024**3}={}){
  const mf=new Miniflare({modules:true,scriptPath:'dist/server/index.js',compatibilityDate:'2026-07-30',bindings:{PORTFOLIO_OWNER_ID:owner,PORTFOLIO_STORAGE_LIMIT_BYTES:String(limit)},d1Databases:['DB'],r2Buckets:['BUCKET'],...(persist?{d1Persist:'.local-state/d1',r2Persist:'.local-state/r2'}:{}),assets:{directory:'public',binding:'ASSETS',routerConfig:{invoke_user_worker_ahead_of_assets:true,has_user_worker:true},assetConfig:{html_handling:'auto-trailing-slash',not_found_handling:'none'}}});
  const db=await mf.getD1Database('DB');await db.prepare('CREATE TABLE IF NOT EXISTS _local_migrations (name TEXT PRIMARY KEY)').run();
  for(const name of (await readdir('drizzle')).filter(n=>n.endsWith('.sql')).sort()){
    if(await db.prepare('SELECT name FROM _local_migrations WHERE name=?').bind(name).first())continue;
    const statements=(await readFile('drizzle/'+name,'utf8')).split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean);
    await db.batch([...statements.map(s=>db.prepare(s)),db.prepare('INSERT INTO _local_migrations(name) VALUES(?)').bind(name)]);
  }
  return mf;
}
