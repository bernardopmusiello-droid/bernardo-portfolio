import {test} from 'node:test';
import assert from 'node:assert/strict';
import {youtubeVideo} from '../public/youtube.js';
import {projectMedia} from '../public/work-view.js';
const id='M7lc1UVf-VE';
test('accepts common YouTube video links and removes tracking and playlist parameters',()=>{
  for(const url of [`https://www.youtube.com/watch?v=${id}&list=unused&si=tracking`,`https://youtu.be/${id}?si=tracking`,`https://m.youtube.com/shorts/${id}`,`https://youtube.com/live/${id}`,`https://www.youtube-nocookie.com/embed/${id}`,`youtu.be/${id}`,`http://youtube.com/watch?v=${id}`])assert.deepEqual(youtubeVideo(url),{id,url:`https://www.youtube.com/watch?v=${id}`},url);
});
test('rejects deceptive hosts, active content and non-video YouTube pages',()=>{
  for(const url of [`https://youtube.com.evil.test/watch?v=${id}`,`https://evil.test/watch?v=${id}`,`https://user@youtube.com/watch?v=${id}`,`https://youtube.com:444/watch?v=${id}`,`javascript:alert(1)`,`<iframe src="https://youtube.com/embed/${id}"></iframe>`,`https://youtube.com/playlist?list=test`,`https://youtube.com/@channel`,`https://youtu.be/${id}/extra`,`https://youtube.com/watch?v=${id}&v=aaaaaaaaaaa`,`https://youtube.com/watch?v=short`])assert.equal(youtubeVideo(url),null,url);
});
test('YouTube preview uses an explicit load button without remote thumbnail or eager iframe',()=>{
  const html=projectMedia({title:'<script>no</script>',youtubeUrl:`https://youtu.be/${id}`,mediaIds:[]});
  assert.match(html,/data-youtube-play="M7lc1UVf-VE"/);assert.match(html,/Watch on YouTube/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<iframe|<script|<img/);
});
test('YouTube takes playback precedence; uploaded video remains usable when the link is removed',()=>{
  const file={id:'uploaded',mime:'video/mp4',status:'ready'},p={title:'Video',videoId:'uploaded',mediaIds:['uploaded']};
  assert.match(projectMedia(p,[file]),/<video/);assert.doesNotMatch(projectMedia({...p,youtubeUrl:`https://youtu.be/${id}`},[file]),/<video/);
});
