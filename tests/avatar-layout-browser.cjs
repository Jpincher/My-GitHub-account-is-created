'use strict';
const {chromium}=require('../_checks/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const p=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return}fs.readFile(p,(e,b)=>{if(e)res.writeHead(404).end();else{res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.html')?'text/html':'application/octet-stream');res.end(b)}})});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});
 try{
 const page=await browser.newPage();
 await page.addInitScript(()=>{const paused=new WeakMap();Object.defineProperty(HTMLMediaElement.prototype,'paused',{get(){return paused.get(this)!==false}});HTMLMediaElement.prototype.play=function(){paused.set(this,false);this.dispatchEvent(new Event('play'));return Promise.resolve()};HTMLMediaElement.prototype.pause=function(){paused.set(this,true);this.dispatchEvent(new Event('pause'))};HTMLMediaElement.prototype.load=function(){}});
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:900});await page.goto('http://127.0.0.1:'+server.address().port+'/interactive-learning.html');
  await page.waitForSelector('#voiceMuteToggle');await page.click('#voiceMuteToggle');
  const routes=await page.evaluate(()=>window.JP_PROJECT_PAGES);
  for(const route of routes){
   await page.evaluate(route=>window.projectGo(route),route);await page.waitForTimeout(80);
   if(!await page.locator('#avatarWrap').count())continue;
   await page.locator('#voiceMuteToggle').click();await page.waitForTimeout(30);
   // Hear may mute an already-playing introduction: explicitly start through the page player.
   await page.evaluate(()=>{localStorage.setItem('jp-voice-muted','false');window.JP_SHARED_AUDIO.muted=false;window.JP_PLAY_INTRO?.()});await page.waitForTimeout(30);
   const measure=()=>page.locator('.guide-playback-buttons').evaluate(row=>({top:row.getBoundingClientRect().top,buttons:[...row.children].map(b=>({id:b.id||b.className,top:b.getBoundingClientRect().top,height:b.getBoundingClientRect().height,visible:!b.hidden&&getComputedStyle(b).display!=='none'}))}));
   const playing=await measure();await page.click('#guideReliablePlay');await page.waitForTimeout(50);const paused=await measure();await page.click('#guideReliableStop');await page.waitForTimeout(50);const stopped=await measure();
   for(const state of [playing,paused,stopped]){assert.equal(state.buttons.length,3,route);assert(state.buttons.every(b=>b.visible),route+' all three visible');assert(Math.max(...state.buttons.map(b=>b.top))-Math.min(...state.buttons.map(b=>b.top))<1,route+' same baseline')}
   assert(Math.abs(playing.top-paused.top)<1,route+' pause vertical position at '+width);assert(Math.abs(playing.top-stopped.top)<1,route+' stop vertical position at '+width);
  }
 }
 console.log('PASS: real Chromium layout keeps all three controls visible and at the same vertical position when playing, paused and stopped on all guide pages at desktop and mobile widths.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
