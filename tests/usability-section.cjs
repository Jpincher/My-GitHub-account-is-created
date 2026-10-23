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
assert.ok(!html.includes('const speechAdapter='),'Final introduction uses the standard recorded player');
assert.ok(html.includes('server-verified developer login'),'Live collection scope is honest');
assert.ok(html.includes('data-open-usability="true"'),'New section launches actual tester');
for(const url of ['gov.uk/service-manual/user-research','w3.org/WAI/test-evaluate','developer.chrome.com/docs/devtools/network'])assert.ok(html.includes(url));
const installed=JSON.parse(fs.readFileSync(path.join(__dirname,'..','tools','final-voices-installed.json'),'utf8'));
assert.equal(installed.recordings.length,6);
for(const r of installed.recordings){assert.ok(fs.readFileSync(path.join(__dirname,'..',r.file)).length>1000);assert.ok(r.envelope.length>250);assert.equal(r.envelopeRate,25);assert.ok(r.envelope.some(v=>v>.5));}
console.log('PASS: 19 menus, real destinations, numbering, languages and six synchronized final recordings');
