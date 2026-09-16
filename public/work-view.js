import {youtubeVideo} from './youtube.js';
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const fileSize = n => n >= 1024**3 ? `${(n/1024**3).toFixed(1)} GB` : n >= 1024**2 ? `${(n/1024**2).toFixed(1)} MB` : `${Math.ceil(n/1024)} KB`;
export function projectMedia(p, files=p.media||[]) {
  const e=escapeHTML, ready=files.filter(m=>!m.status||m.status==='ready');
  const video=ready.find(m=>m.id===p.videoId), cover=ready.find(m=>m.id===p.coverId), captions=ready.find(m=>m.id===p.captionsId);
  const source=m=>`/media/${encodeURIComponent(m.id)}`;
  const youtube=youtubeVideo(p.youtubeUrl);
  let markup=youtube?`<section class="youtube-card"><div class="youtube-frame"><button type="button" class="youtube-load" data-youtube-play="${youtube.id}" data-video-title="${e(p.title||'YouTube video')}">${cover?`<img src="${source(cover)}" alt="">`:''}<span class="youtube-play-icon" aria-hidden="true">▶</span><span class="youtube-load-label">Play YouTube video</span><span class="youtube-consent">Loads YouTube’s player when you click.</span></button></div><p class="youtube-fallback"><a href="${youtube.url}" target="_blank" rel="noopener noreferrer">Watch on YouTube ↗</a> · If playback is unavailable here, open it on YouTube.</p></section>`:video?`<video controls playsinline preload="metadata" ${cover?`poster="${source(cover)}"`:''}><source src="${source(video)}" type="${e(video.mime)}">${captions?`<track kind="captions" src="${source(captions)}" srclang="en" label="English" default>`:''}Your browser cannot play this video. Download it below.</video>`:cover?`<img src="${source(cover)}" alt="${e(p.imageAlt||p.title)}" decoding="async">`:'';
  const images=ready.filter(m=>m.mime.startsWith('image/')&&m.id!==p.coverId&&p.mediaIds.includes(m.id));
  markup+=images.map(m=>`<img loading="lazy" src="${source(m)}" alt="${e(m.filename)}" decoding="async">`).join('');
  return `<div class="work-media">${markup}</div>`;
}
export function projectExtras(p,files=p.media||[]) {
  const e=escapeHTML, ready=files.filter(m=>(!m.status||m.status==='ready')&&p.mediaIds.includes(m.id));
  const safeLink=(()=>{try{return new URL(p.url).protocol==='https:'?p.url:'';}catch{return '';}})();
  return `${safeLink?`<p><a class="work-link" href="${e(safeLink)}" target="_blank" rel="noopener noreferrer">Visit ${p.kind==='Website'?'website':'project'} ↗</a></p>`:''}${p.credits?`<h3>Credits</h3><p class="work-prose">${e(p.credits)}</p>`:''}${p.transcript?`<details><summary>Read the transcript</summary><p class="work-prose">${e(p.transcript)}</p></details>`:''}${ready.some(m=>!m.mime.startsWith('image/'))?`<details><summary>Project files</summary><ul>${ready.filter(m=>!m.mime.startsWith('image/')).map(m=>`<li><a href="/media/${encodeURIComponent(m.id)}?download">${e(m.filename)} · ${fileSize(m.size)} ↓</a></li>`).join('')}</ul></details>`:''}`;
}
