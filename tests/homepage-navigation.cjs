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
const expect={es:['No te limites a','más de 30 años de experiencia','PLANTEA UNA MEJOR PREGUNTA'],zh:['阅读我的简历','三十余年的经验','提出更好的问题']};
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
assert.equal(new URL(w.document.querySelector('.portfolio-side-nav a').href).pathname,'/portfolio/index.html');

const restored=[{"path":"featured-work.html","label":"See the work","title":"One investigation. Two learning journeys.","lead":"A stick is a simple starting point. What learners do with it reveals the design."},{"path":"approach.html","label":"My approach","title":"A clear need. A purposeful experience.","lead":"Three steps connect the question to something people can use."},{"path":"career.html","label":"Experience overview","title":"Experience with substance.","lead":"Learning design, programme leadership and the responsibility to make delivery work."},{"path":"accredited-course-design.html","label":"Accredited course design","title":"Curriculum that meets the standard. Evidence that stands up to audit."},{"path":"audit-accountability.html","label":"Audit and accountability","title":"Deliver the learning. Account for the funding.","lead":"My CV describes responsibility for the records, reporting and evidence behind publicly funded learning—not just the courses themselves."},{"path":"university-institute.html","label":"University institute","title":"Learning at scale. Designed around people.","lead":"At Manchester Metropolitan University, I founded an institute recruiting and training approximately 6,000 learners annually."},{"path":"experience.html","label":"Learning delivery","title":"Learning design. Built on delivery.","lead":"From founding an education business in 1995 to developing interactive learning today, I connect course design with the realities of running programmes."},{"path":"question.html","label":"Question","title":"What if the same lesson needs two different designs?","lead":"A stick. Two learners. Two different starting points. The question is not what content to show—it is what each learner needs to understand and do."},{"path":"design.html","label":"Design","title":"Turn “what if?” into “try this”.","lead":"Give the learner something to predict, investigate and explain. Then make the design decisions visible so the experience can be questioned and improved."},{"path":"test.html","label":"Test and refine","title":"A polished screen is only the start.","lead":"The useful question is what happens when somebody tries to learn with it."},{"path":"addie.html","label":"Explore ADDIE","title":"ADDIE — how I examine the design process.","lead":"Analyse. Design. Develop. Implement. Evaluate."},{"path":"cv.html","label":"Summary of my CV","title":"The experience behind the work.","lead":"Jonathan Pincher · Learning experience design, digital learning and programme leadership"}];
const menuTargets={"Home":"index.html","See the work":"featured-work.html","My approach":"approach.html","Question":"question.html","Design":"design.html","Test and refine":"test.html","Experience overview":"career.html","Learning delivery":"experience.html","Accredited course design":"accredited-course-design.html","Audit and accountability":"audit-accountability.html","University institute":"university-institute.html","Summary of my CV":"cv.html","Explore ADDIE":"addie.html","Explore my approach":"approach.html","See my experience":"career.html","EXPLORE THE DESIGN":"design.html","ASK A BETTER QUESTION":"question.html","TRY THE EXPERIENCE":"featured-work.html","EXPLORE ADDIE":"addie.html","DESIGN THE EXPERIENCE":"design.html","TEST AND REFINE":"test.html"};
for(const item of restored){
 const source=fs.readFileSync(path.join(root,item.path),'utf8');
 assert.ok(!/http-equiv=["']refresh/i.test(source),'Standalone page, not redirect: '+item.path);
 const page=new JSDOM(source,{url:'https://example.test/portfolio/'+item.path,runScripts:'outside-only'});
 const pw=page.window;
 assert.equal(pw.document.querySelector('h1').textContent,item.title);
 assert.ok(pw.document.querySelector('main').textContent.length>650,'Substantive original content: '+item.path);
 const active=pw.document.querySelector('.portfolio-side-nav [aria-current="page"]');
 assert.equal(active?.getAttribute('href'),item.path,'Current section: '+item.path);
 for(const a of pw.document.querySelectorAll('a[href]'))auditLink(a.getAttribute('href'),item.path);
 for(const a of pw.document.querySelectorAll('.portfolio-side-nav a[href]')){
  const target=a.getAttribute('href');assert.ok(!target.includes('interactive-learning'),'Portfolio menu stays in portfolio: '+item.path);
  const expected=menuTargets[a.textContent.trim()];if(expected)assert.equal(target,expected);
 }
 pw.eval(language);
 const english=pw.document.querySelector('main').textContent;
 for(const lang of ['es','zh','en']){
  pw.document.querySelector('[data-language="'+lang+'"]').click();
  assert.equal(pw.document.documentElement.lang,lang==='zh'?'zh-CN':lang);
  if(lang==='en')assert.equal(pw.document.querySelector('main').textContent,english,'English roundtrip '+item.path);
  else {
   assert.notEqual(pw.document.querySelector('h1').textContent,item.title,'Translated heading '+lang+' '+item.path);
   assert.notEqual(pw.document.querySelector('main').textContent,english,'Translated body '+lang+' '+item.path);
  }
 }
 if(item.path==='addie.html'){
  const stages=pw.document.querySelectorAll('.addie-stage');assert.equal(stages.length,5);
  for(const stage of stages){stage.open=true;assert.equal(stage.open,true);stage.open=false;assert.equal(stage.open,false);assert.ok(stage.querySelector('summary'));}
 }
 page.window.close();
}
for(const a of w.document.querySelectorAll('.portfolio-side-nav a'))assert.ok(!a.href.includes('interactive-learning'),'Homepage menu stays in portfolio');
assert.deepEqual(errors,[]);
dom.window.close();
const es=new JSDOM(html,{url:'https://example.test/portfolio/index.html?lang=es',runScripts:'outside-only'});es.window.eval(language);assert.equal(es.window.document.documentElement.lang,'es');assert.ok(es.window.document.querySelector('main').textContent.includes('más de 30 años'));es.window.close();
const denied=new JSDOM(html,{url:'https://example.test/portfolio/index.html',runScripts:'outside-only'});Object.defineProperty(denied.window,'localStorage',{get(){throw new Error('Storage denied')}});denied.window.eval(language);denied.window.document.querySelector('[data-language="zh"]').click();assert.equal(denied.window.document.documentElement.lang,'zh-CN');denied.window.close();
console.log('PASS: '+checked+' local links/assets and 12 restored portfolio pages; every project route and fragment exists; all three language buttons translate body and metadata, round-trip without corruption, persist to project and work when storage is blocked.');
