import {readdir,readFile,stat} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
async function walk(folder){const files=[];for(const entry of await readdir(folder,{withFileTypes:true})){const name=resolve(folder,entry.name);files.push(...entry.isDirectory()?await walk(name):[name]);}return files;}
const files=(await Promise.all(['public','server','scripts','tests'].map(walk))).flat();let references=0;
for(const file of files){
  if(/\.m?js$/.test(file)){const check=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(check.status!==0)throw new Error(check.stderr);}
  if(!file.includes('/public/'))continue;const source=await readFile(file,'utf8');
  const patterns=file.endsWith('.html')?[/\b(?:src|href)="([^"]+)"/g]:file.endsWith('.css')?[/url\(["']?([^"')]+)["']?\)/g]:file.endsWith('.js')?[/from\s+["'](\.[^"']+)["']/g]:[];
  for(const pattern of patterns)for(const match of source.matchAll(pattern)){const url=match[1];if(/^(?:[a-z]+:|\/\/|#)/i.test(url)||url.includes('${'))continue;const path=url.startsWith('/')?resolve('public','.'+url.split(/[?#]/)[0]):resolve(dirname(file),url.split(/[?#]/)[0]);if(['/admin','/privacy','/credits'].includes(url))continue;if(!(await stat(path).catch(()=>null))?.isFile())throw new Error(`Missing asset ${url} in ${file}`);references++;}
}
console.log(`Syntax and ${references} local asset references passed.`);
