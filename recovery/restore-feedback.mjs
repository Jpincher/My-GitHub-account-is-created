import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {cleanRecord} from '../supabase/functions/usability-api/core.mjs';
const stable=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
export async function restoreFeedback({document,url,secret,apply=false,request=fetch}){
 if(document?.format!=='jp-usability-live-export-v1'||!Array.isArray(document.responses))throw Error('Expected a Developer-only live feedback export.');
 const endpoint=new URL(url);if(endpoint.protocol!=='https:'||!endpoint.hostname.endsWith('.supabase.co')||endpoint.username||endpoint.password||endpoint.pathname!=='/')throw Error('Use the HTTPS Supabase project URL, without a path.');
 if(!secret)throw Error('Supply the server secret privately through the environment.');
 const records=document.responses.map(cleanRecord),ids=new Set();for(const r of records){if(ids.has(r.id))throw Error('Duplicate identifier inside export.');ids.add(r.id)}
 const headers={'apikey':secret,'Content-Type':'application/json'};if(!secret.startsWith('sb_secret_'))headers.Authorization='Bearer '+secret;
 const call=async(resource,options={})=>{const response=await request(endpoint.origin+'/rest/v1/'+resource,{...options,headers:{...headers,...options.headers},signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error('Database request failed with status '+response.status);return response.status===204?null:response.json()};
 const missing=[];let present=0;
 for(const record of records){
  const existing=await call('jp_usability_live_responses?id=eq.'+encodeURIComponent(record.id)+'&select=payload,submitted_at');
  if(!Array.isArray(existing))throw Error('Unexpected database response.');
  if(existing.length){const normalized=cleanRecord({...existing[0].payload,created:existing[0].submitted_at});if(stable(normalized)!==stable(record))throw Error('Conflicting existing identifier. No further writes performed.');present++}
  else missing.push({id:record.id,submitted_at:record.created,payload:record});
 }
 if(apply)for(let at=0;at<missing.length;at+=100)await call('jp_usability_live_responses?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify(missing.slice(at,at+100))});
 return {mode:apply?'apply':'dry-run',project:endpoint.hostname,validated:records.length,alreadyPresent:present,toRestore:missing.length,emailsCreated:0};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const [file,...flags]=process.argv.slice(2);if(!file||flags.some(f=>f!=='--apply'))throw Error('Usage: node recovery/restore-feedback.mjs PRIVATE-EXPORT.json [--apply]');
  const result=await restoreFeedback({document:JSON.parse(await fs.readFile(file,'utf8')),url:process.env.SUPABASE_URL,secret:process.env.SUPABASE_SERVICE_ROLE_KEY,apply:flags.includes('--apply')});
  console.log(JSON.stringify(result,null,2));
 }catch(error){console.error(error.message);process.exitCode=1}
}
