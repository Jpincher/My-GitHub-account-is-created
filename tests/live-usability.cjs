'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const {JSDOM}=require('jsdom'),{enableLive}=require('../tools/enable-live-usability.cjs');
(async()=>{
 const root=path.resolve(__dirname,'..'),core=await import(pathToFileURL(path.join(root,'supabase/functions/usability-api/core.mjs')).href);
 const fixture=(id='test-response-00000001')=>({schema:core.SCHEMA,id,created:'2026-10-23T12:00:00Z',projectVersion:'test-only',consent:true,profile:{nickname:'PRIVATE_TEST_NAME',email:'private@example.test',followup:true,...Object.fromEntries(core.DEMOGRAPHICS.map(d=>[d,1]))},sections:Object.fromEntries(core.STAGES.map(id=>[id,{outcome:0,ratings:Object.fromEntries(core.METRICS.map(m=>[m,3])),comment:''}])),comments:{worked:'',improve:'',barriers:'',anything:''}});
 const base=fixture();assert.equal(core.cleanRecord(base).profile.nickname,'PRIVATE_TEST_NAME');
 for(const change of [r=>r.schema='jp-usability-draft-v2',r=>r.consent=false,r=>r.sections.overview.ratings.interface=0,r=>r.sections.overview.ratings.interface=6,r=>r.sections.overview.ratings.interface='3',r=>delete r.sections.overview.ratings.next,r=>r.profile.age=5,r=>r.profile.email='invalid']){
  const bad=structuredClone(base);change(bad);assert.throws(()=>core.cleanRecord(bad));
 }
 const a=fixture(),b=fixture('test-response-00000002');for(const stage of core.STAGES){for(const metric of core.METRICS)a.sections[stage].ratings[metric]=null;a.sections[stage].ratings.interface=1;for(const metric of core.METRICS)b.sections[stage].ratings[metric]=5}
 const summary=core.aggregate([a,b]);assert.equal(summary.total,2);assert.equal(summary.sections[0].average,3,'Equal weight per tester, not per answered metric');
 const mail=JSON.stringify(core.notification(base,summary));assert.ok(!mail.includes('PRIVATE_TEST_NAME')&&!mail.includes('private@example.test'));assert.ok(mail.includes('Running average')&&mail.includes('Completed responses so far'));
 const source=fs.readFileSync(path.join(root,'usability-tester.html'),'utf8'),live=source.includes('window.JP_USABILITY_LIVE=')?source:enableLive(source,{endpoint:'https://example.supabase.co/functions/v1/usability-api'});
 assert.ok(!live.includes('First draft')&&!live.includes('CODE_HASH')&&!live.includes('browser-only preview'));
 const records=new Map(),calls=[];let failNext=true;
 const dom=new JSDOM(live,{url:'https://jpincher.github.io/My-GitHub-account-is-created/usability-tester.html',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.scrollTo=()=>{};w.sessionStorage.setItem('jp-usability-draft-session-v2',JSON.stringify({records:[base]}));
 w.fetch=async(url,opts)=>{
  const body=JSON.parse(opts.body),action=body.action;calls.push(action);let status=200,data={};
  if(action==='challenge')data={challenge:{issued:Date.now()-3000,nonce:'00000000-0000-4000-8000-000000000000',signature:'test-signature'}};
  else if(action==='summary')data={summary:core.aggregate([...records.values()])};
  else if(action==='submit'){
   if(failNext){failNext=false;status=503;data={error:'service_unavailable'}}
   else{const record=core.cleanRecord(body.record),duplicate=records.has(record.id);records.set(record.id,record);data={saved:true,duplicate,summary:core.aggregate([...records.values()])}}
  }else if(action==='login'){if(body.code==='test-code-only')data={token:'a'.repeat(64)};else{status=401;data={error:'not_authorized'}}}
  else if(action==='records'){assert.equal(opts.headers['x-admin-session'],'a'.repeat(64));data={records:[...records.values()],hasMore:false}}
  else if(action==='logout')data={locked:true};else throw Error('Unexpected action '+action);
  return {ok:status===200,status,json:async()=>data};
 };
 for(const s of w.document.scripts)w.eval(s.textContent);
 const tick=()=>new Promise(r=>setTimeout(r,15)),action=async name=>{const el=w.document.querySelector('[data-action="'+name+'"]');assert.ok(el,name+' action exists');el.click();await tick()};
 const set=(name,value,checked=false)=>{const el=w.document.querySelector('[name="'+name+'"]');assert.ok(el,name);if(checked)el.checked=value;else el.value=value;el.dispatchEvent(new w.Event('input',{bubbles:true}))};
 await tick();assert.equal(w.sessionStorage.getItem('jp-usability-draft-session-v2'),null);
 assert.equal(w.document.getElementById('brandLabel').textContent,'Jonathan Pincher');
 assert.equal(w.document.querySelector('.draft-strip'),null);
 set('profile.nickname','PRIVATE_TEST_NAME');set('profile.email','private@example.test');set('consent',true,true);await action('start');
 for(let i=0;i<5;i++){
  assert.ok(w.document.getElementById('testerIntroButton'));assert.equal(w.document.querySelectorAll('fieldset').length,7);
  await action('outcome');
  for(const metric of core.METRICS){const el=w.document.querySelector('[name="rating.'+metric+'"][value="'+(i+1)+'"]');el.checked=true;el.dispatchEvent(new w.Event('change',{bubbles:true}))}
  await action('next');
 }
 set('comments.improve','<img src=x onerror=alert(1)>');await action('finished');
 assert.ok(!w.document.getElementById('main').textContent.includes('PRIVATE_TEST_NAME')&&!w.document.getElementById('main').textContent.includes('private@example.test'));
 assert.equal(w.document.querySelector('img[onerror]'),null);
 await action('done');assert.equal(records.size,0);assert.ok(w.document.querySelector('[role="alert"]'),'Failed submission stays in review and explains retry');
 await action('done');assert.equal(records.size,1);assert.ok(w.document.getElementById('main').textContent.includes('Combined scores'));
 const publicText=w.document.getElementById('main').textContent;
 assert.ok(!publicText.includes('PRIVATE_TEST_NAME')&&!publicText.includes('private@example.test')&&!publicText.includes('onerror'));
 assert.ok(!w.sessionStorage.getItem('jp-usability-live-session-v1').includes('PRIVATE_TEST_NAME'),'Submitted profile is cleared from session saving');
 await action('unlock');w.document.getElementById('developerCode').value='wrong';await action('login');assert.ok(!w.document.getElementById('main').textContent.includes('PRIVATE_TEST_NAME'));
 w.document.getElementById('developerCode').value='test-code-only';await action('login');
 assert.ok(w.document.getElementById('main').textContent.includes('PRIVATE_TEST_NAME'));assert.ok(w.document.getElementById('main').textContent.includes('private@example.test'));
 const saved=w.sessionStorage.getItem('jp-usability-live-session-v1');assert.ok(!saved.includes('PRIVATE_TEST_NAME')&&!saved.includes('private@example.test')&&!saved.includes('a'.repeat(64)));
 await action('logout');assert.ok(!w.document.getElementById('main').textContent.includes('PRIVATE_TEST_NAME'));assert.equal(records.size,1);
 assert.ok(calls.includes('submit')&&calls.includes('records')&&calls.includes('logout'));w.close();
 console.log('PASS: live schema/rating validation, equal-weight public averages, private-data-free emails, 5-task form, retry without losing answers, saved-response confirmation, anonymous shared report, server-authenticated developer view, private-data session isolation and logout.');
})().catch(error=>{console.error(error);process.exitCode=1});
