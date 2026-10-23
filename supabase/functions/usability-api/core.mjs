export const SCHEMA='jp-usability-live-v1';
export const STAGES=['overview','comparison','activities','dashboards','materials'];
export const METRICS=['interface','next','readability','engagement','function','orientation','purpose'];
export const DEMOGRAPHICS=['age','gender','role','experience','device'];
export const STAGE_NAMES=['First impressions','Compare the designs','Learner activities','Tutor dashboards','Materials and reflection'];
const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const str=(v,n)=>{if(v===undefined||v===null)return '';if(typeof v!=='string'||v.length>n)throw Error('Invalid text');return v.replace(/\u0000/g,'')};
export const isScore=v=>typeof v==='number'&&Number.isInteger(v)&&v>=1&&v<=5;
export function cleanRecord(input){
 if(!isObject(input)||input.schema!==SCHEMA||input.consent!==true||!isObject(input.profile)||!isObject(input.sections))throw Error('Invalid feedback');
 if(typeof input.id!=='string'||!/^[a-zA-Z0-9-]{12,100}$/.test(input.id))throw Error('Invalid response identifier');
 const profile={nickname:str(input.profile.nickname,80),email:str(input.profile.email,254),followup:input.profile.followup===true};
 if(profile.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email))throw Error('Invalid email');
 if(!profile.email)profile.followup=false;
 for(const key of DEMOGRAPHICS){const v=input.profile[key];if(!Number.isInteger(v)||v<0||v>4)throw Error('Invalid demographic answer');profile[key]=v}
 const sections={};
 for(const key of STAGES){
  const s=input.sections[key];if(!isObject(s)||!Number.isInteger(s.outcome)||s.outcome<0||s.outcome>3||!isObject(s.ratings))throw Error('Invalid task outcome');
  const ratings={};for(const m of METRICS){const v=s.ratings[m];if(v!==null&&!isScore(v))throw Error('Invalid rating');ratings[m]=v}
  sections[key]={outcome:s.outcome,ratings,comment:str(s.comment,2000)};
 }
 const comments={};for(const key of ['worked','improve','barriers','anything'])comments[key]=str(input.comments?.[key],3000);
 const created=str(input.created,40);if(!created||!Number.isFinite(Date.parse(created)))throw Error('Invalid date');
 return {schema:SCHEMA,id:input.id,created,projectVersion:str(input.projectVersion,80),consent:true,profile,sections,comments};
}
const average=v=>v.length?v.reduce((a,b)=>a+b,0)/v.length:null;
export function aggregate(records){
 return {schema:SCHEMA,total:records.length,sections:STAGES.map(id=>{
  const scores=records.map(r=>average(METRICS.map(m=>r.sections[id].ratings[m]).filter(isScore))).filter(v=>v!==null);
  return {id,n:scores.length,average:average(scores)};
 })};
}
export function notification(record,summary){
 const result={},outcomes=['Completed','Partly completed','Could not complete','Not attempted'];
 STAGES.forEach((id,i)=>{
  const s=record.sections[id];
  result[STAGE_NAMES[i]+' — task']=outcomes[s.outcome];
  result[STAGE_NAMES[i]+' — ratings']=METRICS.map(m=>m+': '+(s.ratings[m]===null?'Not tested':s.ratings[m]+'/5')).join('; ');
 });
 result['Completed responses so far']=String(summary.total);
 summary.sections.forEach((s,i)=>{result['Running average — '+STAGE_NAMES[i]]=(s.average===null?'Not scored':s.average.toFixed(2)+'/5')+' ('+s.n+' scored responses)'});
 return {_subject:'Learning project usability: response '+record.id.slice(-8),_template:'table',_captcha:'false',
  'Response identifier':record.id,'Score scale':'1 unusable; 3 usable; 5 excellent and engaging',...result,
  'Private response report':'https://jpincher.github.io/My-GitHub-account-is-created/usability-tester.html#developer',
  'Privacy':'Names, email addresses, demographic answers and written comments are available only in the protected developer report, not this email or the public report.'};
}
