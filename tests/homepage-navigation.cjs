'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.equal(html,fs.readFileSync(path.join(root,'FinalHomepage.html.html'),'utf8'),'Both homepage addresses show the same latest design');
const runtime=fs.readFileSync(path.join(root,'learning-project-ddca4d6b5d3f.js'),'utf8');
const start=runtime.indexOf('const pages=')+12;let depth=0,quoted=false,escaped=false,end;
for(let i=start;i<runtime.length;i++){const c=runtime[i];if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false}else if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}'&&!--depth){end=i+1;break}}
const pages=JSON.parse(runtime.slice(start,end));
let checked=0;
function auditLink(href,source){
 const url=new URL(href,'https://example.test/portfolio/'+source);
 if(url.protocol==='mailto:'){assert.equal(url.pathname,'joff.2.22.22@gmail.com');return}
 assert.equal(url.origin,'https://example.test','No invented external destinations');
 const relative=decodeURIComponent(url.pathname.replace(/^\/portfolio\//,''));
 assert.ok(fs.existsSync(path.join(root,relative)),source+' missing '+relative);
 if(url.hash.startsWith('#view=')){
  const params=new URLSearchParams(url.hash.slice(1)),route=params.get('view'),section=params.get('section');
  assert.ok(pages[route],'Real project route '+route);
  if(section)assert.ok(pages[route].includes('id="'+section+'"'),'Real section '+section);
 }else if(url.hash){
  const doc=fs.readFileSync(path.join(root,relative),'utf8');
  assert.ok(doc.includes('id="'+decodeURIComponent(url.hash.slice(1))+'"'),'Real fragment '+url.hash);
 }
 checked++;
}
const vc=new VirtualConsole(),errors=[];
vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(html,{url:'https://example.test/portfolio/index.html',runScripts:'outside-only',virtualConsole:vc,pretendToBeVisual:true});
const w=dom.window;
w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
w.ResizeObserver=class{observe(){} disconnect(){}};
for(const script of w.document.scripts){
 if(script.src){const filename=new URL(script.src).pathname.split('/').pop();assert.ok(fs.existsSync(path.join(root,filename)));continue}
 new Function(script.textContent);w.eval(script.textContent);
}
const language=fs.readFileSync(path.join(root,'portfolio-languages.js'),'utf8');new Function(language);w.eval(language);
for(const link of w.document.querySelectorAll('a[href]'))auditLink(link.getAttribute('href'),'index.html');
for(const node of w.document.querySelectorAll('[src]'))auditLink(node.getAttribute('src'),'index.html');
assert.ok(!html.includes('portfolio-draft-watermark'));
const original=w.document.querySelector('main').textContent;
const expect={es:['No se limite a','más de 30 años de experiencia','PLANTEE UNA MEJOR PREGUNTA'],zh:['阅读我的简历','30 多年的经验','提出更好的问题']};
for(const lang of ['es','zh','en','es','en']){
 w.document.querySelector('[data-language="'+lang+'"]').click();
 assert.equal(w.document.documentElement.lang,lang==='zh'?'zh-CN':lang);
 assert.equal(w.document.querySelectorAll('[data-language][aria-pressed="true"]').length,1);
 assert.equal(w.localStorage.getItem('jp-guide-language'),lang);
 assert.equal(new URL(w.location.href).searchParams.get('lang'),lang);
 if(lang==='en')assert.equal(w.document.querySelector('main').textContent,original);
 else for(const text of expect[lang])assert.ok(w.document.querySelector('main').textContent.includes(text),lang+' body translated: '+text);
}
assert.equal(w.document.querySelector('.portfolio-menu-shell').open,true);
assert.equal(w.document.querySelector('.portfolio-side-nav a').getAttribute('href'),'index.html');
for(const name of ['approach','question','design','test','career','experience','accredited-course-design','audit-accountability','university-institute','cv','addie','featured-work']){
 const alias=fs.readFileSync(path.join(root,name+'.html'),'utf8');
 const redirect=alias.match(/http-equiv="refresh" content="0;url=([^"]+)"/);
 assert.ok(redirect,'Legacy URL has a real redirect '+name);
 auditLink(redirect[1].replaceAll('&amp;','&'),name+'.html');
}
assert.deepEqual(errors,[]);
dom.window.close();
const es=new JSDOM(html,{url:'https://example.test/portfolio/index.html?lang=es',runScripts:'outside-only'});es.window.eval(language);assert.equal(es.window.document.documentElement.lang,'es');assert.ok(es.window.document.querySelector('main').textContent.includes('más de 30 años'));es.window.close();
const denied=new JSDOM(html,{url:'https://example.test/portfolio/index.html',runScripts:'outside-only'});Object.defineProperty(denied.window,'localStorage',{get(){throw new Error('Storage denied')}});denied.window.eval(language);denied.window.document.querySelector('[data-language="zh"]').click();assert.equal(denied.window.document.documentElement.lang,'zh-CN');denied.window.close();
console.log('PASS: '+checked+' local links/assets/legacy redirects; every project route and fragment exists; all three language buttons translate body and metadata, round-trip without corruption, persist to project and work when storage is blocked.');
