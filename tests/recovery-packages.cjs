'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'jp-recovery-'));
(async()=>{
 execFileSync('python',['-c','import sys,zipfile; zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])',path.join(root,'_delivery/Jonathan_Pincher_Homepage_Standalone.zip'),tmp]);
 execFileSync('python',['-c','import sys,zipfile; zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])',path.join(root,'_delivery/Jonathan_Pincher_Learning_Standalone.zip'),tmp]);
 const home=path.join(tmp,'Homepage_Standalone','Website'),learning=path.join(tmp,'Learning_Standalone','Website');
 const homeHTML=fs.readFileSync(path.join(home,'index.html'),'utf8');
 for(const match of homeHTML.matchAll(/(?:href|src)=["']([^"']+)["']/g)){
  const href=match[1];if(/^(?:https?:|mailto:|#|data:)/.test(href))continue;
  assert(fs.existsSync(path.join(home,href.split(/[?#]/)[0])),'Homepage local dependency '+href);
 }
 assert(homeHTML.includes('https://jpincher.github.io/My-GitHub-account-is-created/interactive-learning.html'));
 assert(!fs.existsSync(path.join(home,'learning-project-ddca4d6b5d3f.js')),'Homepage does not require a local learning runtime');
 assert(fs.existsSync(path.join(learning,'guide-audio-coordinator.js')));
 const entry=fs.readFileSync(path.join(learning,'index.html'),'utf8');assert(entry.includes('location.search+location.hash'));
 const tester=fs.readFileSync(path.join(learning,'usability-tester.html'),'utf8');assert(tester.includes("ROOT=new URL('.',location.href).href"));assert(tester.includes('data-language="es"'));
 for(const folder of ['Homepage_Standalone','Learning_Standalone']){
  const base=path.join(tmp,folder),inventory=JSON.parse(fs.readFileSync(path.join(base,'FILE_INVENTORY.json'),'utf8'));
  assert(inventory.length>25);assert(inventory.every(f=>f.instruction.length>20));
  for(const row of inventory){assert(fs.existsSync(path.join(base,row.path)),row.path);assert.equal(fs.statSync(path.join(base,row.path)).size,row.bytes,row.path)}
  assert(fs.readFileSync(path.join(base,'RECOVERY_MANUAL.html'),'utf8').includes('127.0.0.1'));
  assert(fs.existsSync(path.join(base,'Support/recovery/recovery-guide-data.js')));
 }
 const {restoreFeedback}=await import(pathToFileURL(path.join(root,'recovery/restore-feedback.mjs')).href);
 const core=await import(pathToFileURL(path.join(root,'supabase/functions/usability-api/core.mjs')).href);
 const record={schema:core.SCHEMA,id:'recovery-test-only-00001',created:'2026-10-23T12:00:00Z',projectVersion:'test',consent:true,profile:{nickname:'PRIVATE_FIXTURE',email:'',followup:false,...Object.fromEntries(core.DEMOGRAPHICS.map(d=>[d,0]))},sections:Object.fromEntries(core.STAGES.map(id=>[id,{outcome:0,ratings:Object.fromEntries(core.METRICS.map(m=>[m,3])),comment:''}])),comments:{worked:'',improve:'',barriers:'',anything:''}};
 let saved=null,posts=0;const request=async(url,options)=>{assert(!url.includes('outbox'));if(options.method==='POST'){posts++;saved=JSON.parse(options.body)[0];return {ok:true,status:204}}return {ok:true,status:200,json:async()=>saved?[{payload:saved.payload,submitted_at:saved.submitted_at}]:[]}};
 const options={document:{format:'jp-usability-live-export-v1',responses:[record]},url:'https://example.supabase.co',secret:'test-only-secret',request};
 const dry=await restoreFeedback(options);assert.equal(dry.toRestore,1);assert.equal(posts,0);
 await restoreFeedback({...options,apply:true});assert.equal(posts,1);await restoreFeedback({...options,apply:true});assert.equal(posts,1,'Idempotent restore does not resend/reinsert');
 saved.payload.profile.nickname='CONFLICT';await assert.rejects(()=>restoreFeedback({...options,apply:true}),/Conflicting/);assert.equal(posts,1);
 await assert.rejects(()=>restoreFeedback({...options,document:{format:'old-draft',responses:[record]}}),/live feedback export/);
 console.log('PASS: separate self-contained Website folders, homepage dependencies, local tester routing, inventories/manual, and dry-run/idempotent/conflict-safe private data restore.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>fs.rmSync(tmp,{recursive:true,force:true}));
