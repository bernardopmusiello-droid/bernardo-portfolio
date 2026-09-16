import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createPreviewServer } from '../scripts/serve.mjs';

test('preview serves modules and assets without exposing project files', async (t) => {
  const server = createPreviewServer().listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const page = await fetch(base);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Bernardo Musiello/);
  const script = await fetch(`${base}/app.js?v=8`);
  assert.equal(script.status, 200);
  assert.match(script.headers.get('content-type'), /javascript/);
  await script.text();
  const asset = await fetch(`${base}/assets/butterflies.png`, { method: 'HEAD' });
  assert.equal(asset.status, 200);
  assert.equal(asset.headers.get('content-type'), 'image/png');
  assert.equal((await asset.arrayBuffer()).byteLength, 0);
  for (const path of ['/missing.html', '/.git/config', '/%2e%2e%2fpackage.json', '/%E0%A4%A']) {
    const response = await fetch(base + path);
    assert.equal(response.status, 404, path);
    await response.text();
  }
  const post = await fetch(base, { method: 'POST' });
  assert.equal(post.status, 405);
});
