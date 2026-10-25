
/* Owner request: remove developing portfolio homepage links across all rendered learning pages. */
(()=>{if(window.JP_NO_HOME_WRITE_GUARD)return;window.JP_NO_HOME_WRITE_GUARD=true;const write=Document.prototype.write;const snippet="<script data-home-links-removed=\"true\">(()=>{'use strict';function clean(){for(const a of document.querySelectorAll('a[href]')){const raw=a.getAttribute('href')||'';const label=(a.textContent||'').trim().replace(/\\s+/g,' ').toLowerCase();let portfolio=false;try{const u=new URL(raw,location.href);portfolio=/(?:^|\\/)(?:index|education)\\.html$/.test(u.pathname)||(u.hostname==='jpincher.github.io'&&/^\\/My-GitHub-account-is-created\\/?$/.test(u.pathname))}catch{}if(portfolio||/^(?:home|project home|inicio|inicio del proyecto|项目首页|首页)$/.test(label)){if(/^(?:home|project home|inicio|inicio del proyecto|项目首页|首页)$/.test(label))a.remove();else a.replaceWith(...a.childNodes)}}}clean();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',clean,{once:true});new MutationObserver(clean).observe(document.documentElement,{childList:true,subtree:true});})();</script>";Document.prototype.write=function(...chunks){return write.apply(this,chunks.map(chunk=>{if(typeof chunk!=='string'||!chunk.includes('<html')||chunk.includes('data-home-links-removed'))return chunk;const end=chunk.lastIndexOf('</body>');return end<0?chunk:chunk.slice(0,end)+snippet+chunk.slice(end)}))};})();
/* One recorded guide at a time, including other open learning-project tabs. */
(()=>{
'use strict';
if(window.JP_GUIDE_AUDIO_COORDINATOR)return;
const proto=window.HTMLMediaElement?.prototype;if(!proto)return;
const nativePlay=proto.play,nativePause=proto.pause,active=new Set();
const synthesis=window.speechSynthesis;if(synthesis&&typeof synthesis.speak==='function'){const nativeSpeak=synthesis.speak.bind(synthesis);synthesis.speak=function(utterance){if(window.JP_AUDIO?.[window.JP_CURRENT])return;return nativeSpeak(utterance)}}
let currentTrack=window.JP_ACTIVE_TRACK;
Object.defineProperty(window,'JP_ACTIVE_TRACK',{configurable:true,get(){return currentTrack},set(value){const shared=window.JP_SHARED_AUDIO;if(!shared||value?.audio===shared||(!value&&shared.paused))currentTrack=value}});
const owner=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),key='jp-guide-audio-owner-v1';
let channel=null;
function stopAll(){for(const audio of [...active]){try{nativePause.call(audio)}catch{}active.delete(audio)}try{window.speechSynthesis?.cancel()}catch{}}
function receive(message){if(message?.type==='guide-claim'&&typeof message.owner==='string'&&message.owner!==owner)stopAll()}
try{channel=new BroadcastChannel('jp-learning-guide-audio-v1');channel.onmessage=event=>receive(event.data)}catch{}
window.addEventListener('storage',event=>{if(event.key===key&&event.newValue){try{receive(JSON.parse(event.newValue))}catch{}}});
function claim(){const message={type:'guide-claim',owner,at:Date.now(),nonce:Math.random()};try{channel?.postMessage(message)}catch{}try{localStorage.setItem(key,JSON.stringify(message))}catch{}}
function blocked(){return Promise.reject(Object.assign(new Error('This guide player has been replaced or is in a background tab.'),{name:'AbortError'}))}
proto.play=function(){
 // Older embedded section scripts must never create a second audible guide.
 if(this!==window.JP_SHARED_AUDIO||document.hidden)return blocked();
 for(const previous of [...active])if(previous!==this){try{nativePause.call(previous)}catch{}active.delete(previous)}
 try{window.speechSynthesis?.cancel()}catch{}
 if(!active.has(this)){
  const clear=()=>active.delete(this);
  this.addEventListener('pause',clear);this.addEventListener('ended',clear);this.addEventListener('error',clear);
 }
 active.add(this);claim();
 let result;try{result=nativePlay.call(this)}catch(error){active.delete(this);throw error}
 return Promise.resolve(result).catch(error=>{active.delete(this);throw error});
};
window.addEventListener('pagehide',stopAll);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAll()});
window.JP_GUIDE_AUDIO_COORDINATOR={stop:stopAll,activeCount:()=>active.size};
})();