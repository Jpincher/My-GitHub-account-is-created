import {SCHEMA,STAGES,cleanRecord,notification} from './core.mjs';
const BASE=Deno.env.get('SUPABASE_URL');
let SECRET;
try{SECRET=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default}catch{}
SECRET ||= Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const OWNER='joff.2.22.22@gmail.com';
const ORIGIN='https://jpincher.github.io';
const CODE_HASH='8b44ee8ee83b0d279ac03d4025e7575324be495e2010589273984f16d1accb27';
const enc=new TextEncoder();
const hex=bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
const hash=async text=>hex(await crypto.subtle.digest('SHA-256',enc.encode(text)));
const constantTime=(a,b)=>{if(typeof a!=='string'||typeof b!=='string')return false;let n=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)n|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return n===0};
async function sign(text){const key=await crypto.subtle.importKey('raw',enc.encode(SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(await crypto.subtle.sign('HMAC',key,enc.encode(text)))}
async function db(resource,options={}){
 const headers={'apikey':SECRET,'Content-Type':'application/json','Prefer':'return=representation',...options.headers};
 if(!SECRET.startsWith('sb_secret_'))headers.Authorization='Bearer '+SECRET;
 const r=await fetch(BASE+'/rest/v1/'+resource,{...options,headers,signal:AbortSignal.timeout(15000)});
 const body=await r.text();if(!r.ok)throw Error('database_unavailable');
 return body?JSON.parse(body):null;
}
const rpc=(name,body={})=>db('rpc/jp_usability_live_'+name,{method:'POST',body:JSON.stringify(body)});
async function limited(ip,purpose,max,seconds){
 const window=Math.floor(Date.now()/1000/seconds);
 const bucket=await hash(SECRET+':'+ip+':'+purpose+':'+window);
 return rpc('limit',{p_bucket:bucket,p_limit:max,p_expiry:new Date((window+2)*seconds*1000).toISOString()});
}
async function configuration(){return (await db('jp_usability_live_config?id=eq.true&select=*'))?.[0]||null}
async function session(req){
 const token=req.headers.get('x-admin-session')||'';
 if(!/^[0-9a-f]{64}$/.test(token))return false;
 const rows=await db('jp_usability_live_sessions?token_hash=eq.'+await hash(token)+'&expires_at=gt.'+encodeURIComponent(new Date().toISOString())+'&select=token_hash');
 return rows.length===1;
}
async function email(record,summary,isTest=false){
 const r=await fetch('https://formsubmit.co/ajax/'+OWNER,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json','Referer':ORIGIN+'/My-GitHub-account-is-created/usability-tester.html'},body:JSON.stringify({...notification(record,summary),...(isTest?{_subject:'SETUP TEST — learning-project usability email delivery'}:{})}),signal:AbortSignal.timeout(45000)});
 if(!r.ok)throw Error('delivery_http_'+r.status);
 const result=await r.json();if(!(result.success===true||result.success==='true')){if(isTest)return {accepted:false,message:typeof result.message==='string'?result.message.slice(0,500):JSON.stringify(result).slice(0,500)};throw Error('delivery_not_accepted');}
 return {accepted:true,message:typeof result.message==='string'?result.message.slice(0,300):''};
}
async function flush(){
 const rows=await rpc('claim',{p_max:5});let accepted=0;
 await Promise.all(rows.map(async row=>{
  try{
   const data=await db('jp_usability_live_responses?id=eq.'+encodeURIComponent(row.response_id)+'&select=payload');
   if(!data[0])throw Error('response_missing');
   await email(data[0].payload,row.summary);
   await db('jp_usability_live_outbox?response_id=eq.'+encodeURIComponent(row.response_id),{method:'PATCH',body:JSON.stringify({state:'sent',sent_at:new Date().toISOString(),claimed_until:null,last_error:null})});accepted++;
  }catch{
   const delay=Math.min(3600,30*2**Math.min(row.attempts,7));
   await db('jp_usability_live_outbox?response_id=eq.'+encodeURIComponent(row.response_id),{method:'PATCH',body:JSON.stringify({state:'pending',claimed_until:null,next_attempt_at:new Date(Date.now()+delay*1000).toISOString(),last_error:'Delivery failed; automatic retry scheduled.'})});
  }
 }));
 return {processed:rows.length,accepted};
}
Deno.serve(async req=>{
 const origin=req.headers.get('origin');
 const cors={'Vary':'Origin','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'content-type,x-admin-session','Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8'};
 if(origin===ORIGIN)cors['Access-Control-Allow-Origin']=origin;
 const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
 if(origin&&origin!==ORIGIN)return reply({error:'origin_not_allowed'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(req.method!=='POST')return reply({error:'method_not_allowed'},405);
 if(!BASE||!SECRET)return reply({error:'not_configured'},503);
 try{
  if(Number(req.headers.get('content-length')||0)>100000)return reply({error:'request_too_large'},413);
  const raw=await req.text();if(enc.encode(raw).length>100000)return reply({error:'request_too_large'},413);
  let body;try{body=JSON.parse(raw)}catch{return reply({error:'invalid_request'},400)}
  const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||req.headers.get('cf-connecting-ip')||'unknown';
  if(body.action==='health'){
   const config=await configuration();return reply({schema:SCHEMA,ready:config?.ready===true,deliveryVerified:config?.delivery_verified===true});
  }
  if(body.action==='challenge'){
   if(!await limited(ip,'challenge',120,3600))return reply({error:'try_later'},429);
   const challenge={issued:Date.now(),nonce:crypto.randomUUID()};
   return reply({challenge:{...challenge,signature:await sign(challenge.issued+':'+challenge.nonce)}});
  }
  if(body.action==='summary'){
   if(!await limited(ip,'summary',600,3600))return reply({error:'try_later'},429);
   return reply({summary:await rpc('summary')});
  }
  if(body.action==='submit'){
   if(body.website)return reply({error:'invalid_request'},400);
   const c=body.challenge;
   if(!c||typeof c.nonce!=='string'||!/^[a-z0-9-]{36}$/.test(c.nonce)||!Number.isInteger(c.issued)||Date.now()-c.issued<1000||Date.now()-c.issued>86400000||!constantTime(c.signature,await sign(c.issued+':'+c.nonce)))return reply({error:'refresh_required'},400);
   if(!(await configuration())?.ready)return reply({error:'collection_not_open'},503);
   let record;try{record=cleanRecord(body.record)}catch{return reply({error:'invalid_feedback'},400)}
   // Retries of an already-saved response are idempotent and do not create another email.
   const existing=await db('jp_usability_live_responses?id=eq.'+encodeURIComponent(record.id)+'&select=id');
   if(!existing.length&&!await limited(ip,'submit',60,3600))return reply({error:'try_later'},429);
   const result=await rpc('submit',{p_record:record});
   if(!result.duplicate){if(globalThis.EdgeRuntime?.waitUntil)EdgeRuntime.waitUntil(flush());else await flush()}
   return reply(result);
  }
  if(body.action==='login'){
   if(!await limited(ip,'login',5,900))return reply({error:'try_later'},429);
   if(typeof body.code!=='string'||body.code.length>128||!constantTime(await hash(body.code),CODE_HASH))return reply({error:'not_authorized'},401);
   const token=hex(crypto.getRandomValues(new Uint8Array(32)));
   await db('jp_usability_live_sessions',{method:'POST',body:JSON.stringify({token_hash:await hash(token),expires_at:new Date(Date.now()+45*60000).toISOString()})});
   if(!await configuration())await db('jp_usability_live_config',{method:'POST',body:JSON.stringify({id:true,function_url:BASE+'/functions/v1/usability-api',notify_token:hex(crypto.getRandomValues(new Uint8Array(32)))})});
   return reply({token,expiresIn:2700});
  }
  if(body.action==='flush'){
   const config=await configuration();
   const internal=config&&constantTime(body.notifyToken,config.notify_token);
   if(!internal&&!await session(req))return reply({error:'not_authorized'},401);
   return reply(await flush());
  }
  if(!await session(req))return reply({error:'not_authorized'},401);
  if(body.action==='logout'){
   await db('jp_usability_live_sessions?token_hash=eq.'+await hash(req.headers.get('x-admin-session')),{method:'DELETE'});
   return reply({locked:true});
  }
  if(body.action==='records'){
   const offset=Number(body.offset||0);if(!Number.isSafeInteger(offset)||offset<0)return reply({error:'invalid_offset'},400);
   const rows=await db('jp_usability_live_responses?select=payload,submitted_at&order=submitted_at.asc,id.asc&offset='+offset+'&limit=201');
   return reply({records:rows.slice(0,200).map(r=>({...r.payload,created:r.submitted_at})),hasMore:rows.length>200});
  }
  if(body.action==='delivery-status'){
   const counts=await db('jp_usability_live_outbox?select=state');
   const config=await configuration();
   return reply({ready:config?.ready===true,verified:config?.delivery_verified===true,pending:counts.filter(r=>r.state!=='sent').length,accepted:counts.filter(r=>r.state==='sent').length});
  }
  if(body.action==='delivery-test'){
   let record;try{record=cleanRecord(body.record)}catch{return reply({error:'invalid_feedback'},400)}
   return reply(await email(record,await rpc('summary'),true));
  }
  if(body.action==='enable'){
   const config=await configuration();if(!config?.delivery_verified)return reply({error:'email_not_verified'},409);
   await db('jp_usability_live_config?id=eq.true',{method:'PATCH',body:JSON.stringify({ready:true})});
   return reply({ready:true});
  }
  return reply({error:'unknown_action'},400);
 }catch(error){const message=error instanceof Error?error.message:'';const safe=/^(delivery_(?:http_\d+|not_accepted|provider_unavailable)|database_unavailable)$/.test(message)?message:'service_unavailable';return reply({error:safe},503)}
});
