'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const config=JSON.parse(fs.readFileSync(path.join(__dirname,'..','usability-live-config.json'),'utf8')),url=config.endpoint;
 const call=async(action,extra={},origin='https://jpincher.github.io')=>{
  const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({action,...extra}),signal:AbortSignal.timeout(20000)});
  return {response,data:await response.json()};
 };
 const health=await call('health');assert.equal(health.response.status,200);assert.equal(health.data.ready,true);assert.equal(health.data.deliveryVerified,true);assert.equal(health.response.headers.get('access-control-allow-origin'),'https://jpincher.github.io');
 const summary=await call('summary');assert.equal(summary.response.status,200);assert.deepEqual(Object.keys(summary.data.summary).sort(),['schema','sections','total']);assert.equal(summary.data.summary.sections.length,5);
 for(const stage of summary.data.summary.sections)assert.deepEqual(Object.keys(stage).sort(),['average','id','n']);
 const privateResult=await call('records');assert.equal(privateResult.response.status,401);assert.equal(privateResult.data.error,'not_authorized');
 const evil=await call('summary',{},'https://untrusted.example');assert.equal(evil.response.status,403);assert.equal(evil.response.headers.get('access-control-allow-origin'),null);
 const challenge=await call('challenge');assert.match(challenge.data.challenge.signature,/^[0-9a-f]{64}$/);
 await new Promise(r=>setTimeout(r,1200));
 const invalid=await call('submit',{challenge:challenge.data.challenge,record:{schema:'jp-usability-draft-v2'}});assert.equal(invalid.response.status,400);assert.equal(invalid.data.error,'invalid_feedback');
 console.log('PASS: deployed health/readiness, live public aggregate shape, CORS, unauthorized records rejection, signed challenge and server validation. No live response or email created.');
})().catch(error=>{console.error(error);process.exitCode=1});
