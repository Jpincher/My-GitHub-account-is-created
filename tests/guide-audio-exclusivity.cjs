'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..'),entry=fs.readFileSync(path.join(root,'interactive-learning.html'),'utf8');
assert(entry.indexOf('guide-audio-coordinator.js')<entry.indexOf('learning-project-ddca4d6b5d3f.js'));
const runtime=fs.readFileSync(path.join(root,'learning-project-ddca4d6b5d3f.js'),'utf8'),coordinator=fs.readFileSync(path.join(root,'guide-audio-coordinator.js'),'utf8');
const marker=runtime.indexOf('const pages=')+12;let depth=0,quoted=false,escaped=false,end;
for(let i=marker;i<runtime.length;i++){const c=runtime[i];if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false}else if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}'&&--depth===0){end=i+1;break}}
const pages=JSON.parse(runtime.slice(marker,end)),errors=[],channels=new Set(),pauseState=new WeakMap(),playing=new Set();
let peak=0;const windows=[];
class Channel{constructor(){this.onmessage=null;channels.add(this)}postMessage(data){for(const other of channels)if(other!==this)other.onmessage?.({data})}close(){channels.delete(this)}}
function makeWindow(){
 const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/Not implemented|Could not parse CSS/.test(e.message))errors.push(e.message)});
 const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://jpincher.github.io/My-GitHub-account-is-created/interactive-learning.html',pretendToBeVisual:true,runScripts:'dangerously',virtualConsole:vc,beforeParse(w){
  w.BroadcastChannel=Channel;w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});w.scrollTo=()=>{};w.ResizeObserver=class{observe(){}disconnect(){}};w.HTMLElement.prototype.scrollIntoView=()=>{};
  Object.defineProperty(w.HTMLMediaElement.prototype,'paused',{get(){return pauseState.get(this)!==false}});
  w.HTMLMediaElement.prototype.play=function(){pauseState.set(this,false);playing.add(this);peak=Math.max(peak,playing.size);this.dispatchEvent(new w.Event('play'));return Promise.resolve()};
  w.HTMLMediaElement.prototype.pause=function(){pauseState.set(this,true);playing.delete(this);this.dispatchEvent(new w.Event('pause'))};
  w.HTMLMediaElement.prototype.load=function(){};
 }});
 windows.push(dom);dom.window.eval(coordinator);dom.window.eval(runtime);return dom;
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const a=makeWindow(),w=a.window;await wait(30);
 w.document.getElementById('voiceMuteToggle').click();await wait(20);
 assert.equal(playing.size,1);
 for(const route of Object.keys(pages)){
  w.projectGo(route);await wait(20);
  if(!w.document.getElementById('avatarWrap'))continue;
  for(const lang of ['en','es','zh']){
   const language=w.document.querySelector('[data-language="'+lang+'"]');assert(language,route+' '+lang);language.click();await wait(20);
   const source=w.JP_AUDIO?.[route]?.[lang];assert(source,route+' recording '+lang);
   assert(fs.existsSync(path.join(root,source)),'Recording exists: '+source);
   assert(w.JP_SCRIPTS?.[route]?.[lang]?.trim().length>30,'Spoken script exists: '+route+' '+lang);
   assert.equal(w.JP_ACTIVE_TRACK.lang,lang);assert.equal(w.JP_ACTIVE_TRACK.audio,w.JP_SHARED_AUDIO);
   assert.equal(playing.size,1,route+' '+lang+' has one audible player');assert(!w.document.body.textContent.includes('Hear the introduction to this page.'));
   w.document.getElementById('guideReliablePlay').click();await wait(5);assert.equal(playing.size,0,'Pause stops sound');assert.equal(w.document.querySelector('.avatar-mute').hidden,false);
   w.document.getElementById('voiceMuteToggle').click();await wait(5);assert.equal(playing.size,1,'Hear restarts one current recording');
   w.document.getElementById('guideReliableStop').click();await wait(5);assert.equal(playing.size,0,'Stop stops sound');assert.equal(w.document.querySelector('.avatar-mute').hidden,false);
   w.document.getElementById('voiceMuteToggle').click();await wait(5);
  }
 }
 const legacy=new w.Audio(w.JP_SHARED_AUDIO.src);await legacy.play().catch(()=>{});assert.equal(playing.size,1,'Obsolete guide cannot overlap shared guide');
 const b=makeWindow(),v=b.window;await wait(20);v.document.getElementById('voiceMuteToggle').click();await wait(20);
 assert.equal(playing.size,1,'A second project tab takes over instead of echoing');assert.equal(w.JP_SHARED_AUDIO.paused,true);
 v.document.getElementById('guideReliableStop').click();w.document.getElementById('voiceMuteToggle').click();await wait(10);assert.equal(playing.size,1);
 w.dispatchEvent(new w.StorageEvent('storage',{key:'jp-guide-audio-owner-v1',newValue:JSON.stringify({type:'guide-claim',owner:'other-window'})}));assert.equal(playing.size,0,'Storage fallback stops the older window');
 assert.equal(peak,1,'Never two simultaneously playing recordings');
 w.JP_GUIDE_AUDIO_COORDINATOR.stop();v.JP_GUIDE_AUDIO_COORDINATOR.stop();a.window.close();b.window.close();
 assert.deepEqual(errors,[]);console.log('PASS: all 18 guides in 3 languages have scripts/media and a single active player; pause, stop, replay, page changes, legacy audio and cross-tab/storage takeover remain exclusive.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{for(const dom of windows){try{dom.window.JP_GUIDE_AUDIO_COORDINATOR?.stop();dom.window.close()}catch{}}});
