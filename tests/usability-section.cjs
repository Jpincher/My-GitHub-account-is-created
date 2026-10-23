'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const runtime=fs.readFileSync(path.join(__dirname,'..','learning-project-ddca4d6b5d3f.js'),'utf8');
const start=runtime.indexOf('const pages=')+12;let depth=0,quoted=false,escaped=false,end;
for(let i=start;i<runtime.length;i++){const c=runtime[i];if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false}else if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}'&&!--depth){end=i+1;break}}
const pages=JSON.parse(runtime.slice(start,end)),route='learning-usability-testing.html',html=pages[route];
assert.ok(html,'New usability route is published');
assert.equal(Object.keys(pages).length,19);
new Function(runtime);
const script=(s,id)=>s.match(new RegExp('<script id="'+id+'">([\\s\\S]*?)<\\/script>'))?.[1];
for(const [name,content]of Object.entries(pages)){
 const menu=content.slice(content.indexOf('<aside class="sidebar"'),content.indexOf('</aside>')+8);
 assert.equal((menu.match(/data-nav-key="usabilityTesting"/g)||[]).length,1,name+' has exactly one new entry');
 for(const [step,key]of [['10','deepDive'],['11','usabilityTesting'],['12','curriculum'],['13','reflection'],['14','bibliography']])
  assert.ok(menu.includes('data-step="'+step+'" data-nav-key="'+key+'"'),name+' '+step);
 const entry=menu.match(/<summary data-step="11"[\s\S]*?<\/details>/)[0];
 assert.ok(entry.includes('href="'+route+'#section-top"'));
 for(const m of entry.matchAll(/href="([^"#]+)#([^"]+)"/g))assert.ok(pages[m[1]]?.includes('id="'+m[2]+'"'),name+' has a real destination');
 for(const m of content.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g))if(!/application\/(?:ld\+)?json/.test(m[1]))new Function(m[2]);
 const handlers={},attrs={},summary={dataset:{navKey:'usabilityTesting'},addEventListener:(type,fn)=>handlers[type]=fn,getBoundingClientRect:()=>({width:220,right:220}),setAttribute:(k,v)=>attrs[k]=v};
 const group={open:false,querySelector:sel=>sel===':scope>summary'?summary:{getAttribute:()=>route+'#section-top'}};
 let destination=null;
 new Function('document','window','localStorage',script(content,'linked-main-sidebar-headings'))({querySelectorAll:()=>[group]},{projectGo:target=>destination=target},{setItem(){}});
 handlers.click({preventDefault(){},stopPropagation(){},clientX:65,detail:1});
 assert.equal(destination,route+'#section-top',name+' heading opens new page top');
 destination=null;handlers.click({preventDefault(){},stopPropagation(){},clientX:210,detail:1});
 assert.equal(destination,null,name+' arrow expands without navigation');
 assert.ok(content.includes("usabilityTesting:['Usability testing','Pruebas de usabilidad','可用性测试']"));
}
for(const term of ['school networks','university Wi-Fi','home broadband','mobile internet','ongoing'])assert.ok(runtime.toLowerCase().includes(term.toLowerCase()),term+' in narration');
assert.ok(html.includes('Browser voice preview'),'Voice preview is clearly identified');
assert.ok(html.includes('not automatically sent to Jonathan'),'Collection scope is honest');
assert.ok(html.includes('data-open-usability="true"'),'New section launches actual tester');
for(const url of ['gov.uk/service-manual/user-research','w3.org/WAI/test-evaluate','developer.chrome.com/docs/devtools/network'])assert.ok(html.includes(url));
const playback=script(html,'reliable-avatar-playback'),adapter=playback.slice(playback.indexOf('const speechAdapter='),playback.indexOf('window.JP_SHARED_AUDIO?.pause()'));
class Bus{constructor(){this.listeners={}}addEventListener(t,f){(this.listeners[t]??=[]).push(f)}removeEventListener(t,f){this.listeners[t]=(this.listeners[t]||[]).filter(x=>x!==f)}dispatchEvent(e){for(const f of this.listeners[e.type]||[])f(e)}}
class TestEvent{constructor(type){this.type=type}}
class Utterance{constructor(text){this.text=text}}
const utterances=[];let cancelCount=0,resumeCount=0;
const synth={getVoices:()=>[{name:'Samantha',lang:'en-GB',voiceURI:'en'},{name:'Monica',lang:'es-ES',voiceURI:'es'},{name:'Tingting',lang:'zh-CN',voiceURI:'zh'}],speak:u=>{utterances.push(u);u.onstart()},pause(){},resume(){resumeCount++},cancel(){cancelCount++}};
const scripts={en:'Ongoing usability',es:'Usabilidad continua',zh:'持续测试'};
const win={speechSynthesis:synth,SpeechSynthesisUtterance:Utterance,JP_SCRIPTS:{[route]:scripts}};
const audio=new Function('window','EventTarget','Event','SpeechSynthesisUtterance','DOMException','location','performance','route','URL',adapter+'return speechAdapter;')(win,Bus,TestEvent,Utterance,Error,{href:'https://example.test/project.html'},{now:()=>1000},route,URL);
(async()=>{
 for(const lang of ['en','es','zh']){
  audio.src='jp-speech:'+lang;audio.load();await audio.play();
  assert.equal(audio.paused,false);assert.equal(utterances.at(-1).text,scripts[lang]);assert.equal(utterances.at(-1).voice.voiceURI,lang);
  audio.pause();assert.equal(audio.paused,true);await audio.play();assert.ok(resumeCount>0);
  audio.pause();audio.currentTime=0;const count=utterances.length;await audio.play();assert.equal(utterances.length,count+1,'Stop then Play starts a fresh introduction');
 }
 audio.muted=true;assert.equal(audio.paused,true,'Mute cancels browser speech');
 audio.dispose();assert.ok(cancelCount>0);
 console.log('PASS: 19 menus, real destinations, heading/arrow navigation, numbering, languages, scripts, and speech start/pause/resume/stop/mute/cleanup');
})().catch(error=>{console.error(error);process.exitCode=1});
