import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
async function walk(folder) {
  const result = [];
  for (const item of await readdir(folder, { withFileTypes: true })) {
    const path = resolve(folder, item.name);
    if (item.name === '.openai') throw new Error('Private hosting configuration must stay out of the public source.');
    if (item.isDirectory()) result.push(...await walk(path));
    else result.push(path);
  }
  return result;
}

const files = (await Promise.all(['dist', 'scripts', 'tests'].map(dir => walk(resolve(root, dir))))).flat();
let references = 0;
for (const file of files) {
  if (/\.m?js$/.test(file)) {
    const check = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (check.status !== 0) throw new Error(check.stderr || `Syntax check failed: ${file}`);
  }
  if (!/\.(html|css|js)$/.test(file)) continue;
  const text = await readFile(file, 'utf8');
  const patterns = file.endsWith('.html') ? [/\b(?:src|href)="([^"]+)"/g]
    : file.endsWith('.css') ? [/url\(["']?([^"')]+)["']?\)/g]
    : [/from\s+["'](\.[^"']+)["']/g, /["'](assets\/[^"']+)["']/g];
  for (const pattern of patterns) for (const match of text.matchAll(pattern)) {
    const url = match[1];
    if (/^(?:[a-z]+:|\/\/|#)/i.test(url) || url.includes('${')) continue;
    const path = resolve(dirname(file), url.split(/[?#]/)[0]);
    if (!(await stat(path).catch(() => null))?.isFile()) throw new Error(`Missing asset: ${url} in ${file}`);
    references++;
  }
}
const artwork = JSON.parse(await readFile(resolve(root, 'ARTWORK.json'), 'utf8'));
for (const asset of artwork.assets) {
  if (!(await stat(resolve(root, asset.file)).catch(() => null))?.isFile()) throw new Error(`Missing artwork: ${asset.file}`);
}
for (const provider of ['openai', 'claude', 'grok', 'perplexity']) {
  await stat(resolve(root, `dist/assets/ai/${provider}.svg`));
}
console.log(`Syntax and ${references} local asset references passed.`);
