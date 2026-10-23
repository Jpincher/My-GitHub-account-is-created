'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom'),root=path.resolve(__dirname,'..');
const runtime=fs.readFileSync(path.join(root,'learning-project-ddca4d6b5d3f.js'),'utf8'),html=fs.readFileSync(path.join(root,'how-to-read-this-site.html'),'utf8');
const marker=runtime.indexOf('const pages=')+12;let depth=0,quoted=false,escaped=false,end;
for(let i=marker;i<runtime.length;i++){const c=runtime[i];if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false}else if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}'&&!--depth){end=i+1;break}}
const pages=JSON.parse(runtime.slice(marker,end)),errors=[],vc=new VirtualConsole();
vc.on('jsdomError',e=>{if(!/Not implemented|Could not parse CSS/.test(e.message))errors.push(e.message)});
const guide=new JSDOM(html,{url:'https://example.test/portfolio/how-to-read-this-site.html?lang=en',runScripts:'outside-only',virtualConsole:vc});
for(const s of guide.window.document.scripts)if(s.type!=='application/json')guide.window.eval(s.textContent);
const g=guide.window;
for(const language of ['en','es','zh']){
 const picker=g.document.getElementById('language');picker.value=language;picker.dispatchEvent(new g.Event('change'));
 assert.equal(g.document.documentElement.lang,language==='zh'?'zh-CN':language);
 assert.equal(g.document.querySelectorAll('#interest option').length,6);
 for(let index=0;index<6;index++){
  g.document.getElementById('interest').value=String(index);g.document.getElementById('interest').dispatchEvent(new g.Event('change'));
  assert.equal(g.document.activeElement.id,'routeTitle');
  for(const link of g.document.querySelectorAll('#routeLinks a')){
   const u=new URL(link.href),params=new URLSearchParams(u.hash.slice(1)),route=params.get('view'),section=params.get('section');
   assert.ok(pages[route],route);assert.ok(pages[route].includes('id="'+section+'"'),section);
   assert.equal(u.searchParams.get('lang'),language);assert.ok(link.textContent);
  }
 }
}
assert.ok(g.document.getElementById('title').textContent.includes('如何'));
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://example.test/portfolio/interactive-learning.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
 w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
 w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.ResizeObserver=class{observe(){}disconnect(){}};
 const paused=new WeakMap();Object.defineProperty(w.HTMLMediaElement.prototype,'paused',{get(){return paused.get(this)!==false}});
 w.HTMLMediaElement.prototype.play=function(){paused.set(this,false);this.dispatchEvent(new w.Event('play'));return Promise.resolve()};
 w.HTMLMediaElement.prototype.pause=function(){paused.set(this,true);this.dispatchEvent(new w.Event('pause'))};
 w.HTMLMediaElement.prototype.load=function(){};
}});
const w=dom.window,tick=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 w.eval(runtime);await tick(100);
 const opens=[],acks=[],popup={closed:false,focus(){},postMessage(data){acks.push(data)}};
 w.open=(...args)=>{opens.push(args);return popup};
 const launcher=w.document.getElementById('launchSiteReadingGuide'),tester=w.document.getElementById('launchUsabilityTester');
 assert.equal(launcher.nextElementSibling,tester,'Reading guide must be directly ABOVE the tester');
 assert.ok(launcher.classList.contains('usability-launch'),'Same shared utility-button sizing and appearance');
 launcher.click();assert.equal(opens.length,1);assert.match(opens[0][0],/how-to-read-this-site\.html/);assert.match(opens[0][2],/popup=yes/);
 launcher.click();assert.equal(opens.length,1,'Reuse an existing guide window');
 w.dispatchEvent(new w.MessageEvent('message',{origin:'https://evil.test',source:popup,data:{type:'JP_READING_GUIDE_NAV',route:'learning-compare.html'}}));assert.equal(w.JP_CURRENT,'interactive-learning.html');
 w.dispatchEvent(new w.MessageEvent('message',{origin:w.location.origin,source:popup,data:{type:'JP_READING_GUIDE_NAV',route:'learning-compare.html',section:'section-top',lang:'es'}}));
 await tick(40);assert.equal(w.JP_CURRENT,'learning-compare.html');assert.equal(w.document.documentElement.lang,'es');assert.ok(acks.some(a=>a.type==='JP_READING_GUIDE_ACK'));
 for(const route of Object.keys(pages)){w.projectGo(route);await tick(10);assert.equal(w.document.getElementById('launchSiteReadingGuide').nextElementSibling?.id,'launchUsabilityTester',route+' guide button above tester')}
 w.JP_READING_GUIDE_WINDOW=null;w.open=()=>null;w.document.getElementById('launchSiteReadingGuide').click();assert.ok(w.document.getElementById('readingGuidePopupNote').href.includes('how-to-read-this-site.html'));
 assert.deepEqual(errors,[]);
 w.close();g.close();
 console.log('PASS: three translated reading-guide editions, six interest routes, every destination/anchor, summary above tester on all 19 pages, shared button sizing, popup reuse/fallback and trusted project navigation.');
})().catch(e=>{console.error(e);process.exitCode=1;w.close();g.close()});
