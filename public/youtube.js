// Shared browser/server parser: only a known YouTube video ID reaches an iframe.
export function youtubeVideo(value) {
  if(typeof value!=='string'||!value.trim()||value.length>2000)return null;
  let input=value.trim();
  if(/^(?:(?:www\.|m\.)?youtube\.com|youtu\.be|www\.youtube-nocookie\.com)\//i.test(input))input='https://'+input;
  let url;try{url=new URL(input);}catch{return null;}
  if(!['https:','http:'].includes(url.protocol)||url.username||url.password||url.port)return null;
  const host=url.hostname.toLowerCase(),path=url.pathname.replace(/\/$/,'');let id;
  if(host==='youtu.be')id=path.slice(1);
  else if(['youtube.com','www.youtube.com','m.youtube.com'].includes(host)){
    if(path==='/watch'&&url.searchParams.getAll('v').length===1)id=url.searchParams.get('v');
    else id=path.match(/^\/(?:shorts|live|embed)\/([A-Za-z0-9_-]{11})$/)?.[1];
  }else if(['youtube-nocookie.com','www.youtube-nocookie.com'].includes(host))id=path.match(/^\/embed\/([A-Za-z0-9_-]{11})$/)?.[1];
  if(!/^[A-Za-z0-9_-]{11}$/.test(id||''))return null;
  return {id,url:`https://www.youtube.com/watch?v=${id}`};
}
export const youtubeHelp='Paste a YouTube video link (youtube.com/watch, youtu.be, Shorts, or live video).';
export function enableYouTubePlayers(root){
  root.addEventListener('click',event=>{
    const button=event.target.closest('[data-youtube-play]');if(!button||!root.contains(button))return;
    const video=youtubeVideo(`https://youtu.be/${button.dataset.youtubePlay}`);if(!video)return;
    const iframe=document.createElement('iframe');
    iframe.src=`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&playsinline=1&rel=0`;
    iframe.title=button.dataset.videoTitle||'YouTube video player';
    iframe.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.allowFullscreen=true;iframe.referrerPolicy='strict-origin-when-cross-origin';
    button.closest('.youtube-frame').replaceChildren(iframe);iframe.focus();
  });
}
export function stopProjectMedia(root){
  for(const video of root.querySelectorAll('video'))video.pause();
  for(const iframe of root.querySelectorAll('.youtube-frame iframe'))iframe.remove();
}
