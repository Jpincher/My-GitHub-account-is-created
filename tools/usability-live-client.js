let adminSession='',liveChallenge=null,liveBusy=false;
async function liveApi(action,extra={}){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
 try{
  const response=await fetch(window.JP_USABILITY_LIVE.endpoint,{method:'POST',headers:{'Content-Type':'application/json',...(adminSession?{'x-admin-session':adminSession}:{})},body:JSON.stringify({action,...extra}),signal:controller.signal,credentials:'omit',cache:'no-store'});
  const data=await response.json();
  if(!response.ok||data.error){const error=Error(data.error||'service_unavailable');error.status=response.status;throw error}
  return data;
 }finally{clearTimeout(timeout)}
}
async function prepareChallenge(){try{liveChallenge=(await liveApi('challenge')).challenge}catch{liveChallenge=null}}
function acceptSummary(summary){
 if(!summary||summary.schema!=='jp-usability-live-v1'||!Number.isSafeInteger(summary.total)||summary.total<0||!Array.isArray(summary.sections)||summary.sections.length!==5)throw Error('invalid_summary');
 const rows=STAGES.map(stage=>{const row=summary.sections.find(r=>r.id===stage.id);if(!row||!Number.isSafeInteger(row.n)||row.n<0||row.n>summary.total||!(row.average===null||(typeof row.average==='number'&&Number.isFinite(row.average)&&row.average>=1&&row.average<=5)))throw Error('invalid_summary');return {id:row.id,n:row.n,average:row.average}});
 state.summary={total:summary.total,sections:rows};
}
async function loadReport(){acceptSummary((await liveApi('summary')).summary)}
async function loadPrivate(){
 const token=adminSession,records=[];let offset=0;
 do{
  const result=await liveApi('records',{offset});
  if(!token||token!==adminSession)throw Error('not_authorized');
  if(!Array.isArray(result.records)||result.records.length>200)throw Error('invalid_records');
  records.push(...result.records.map(cleanRecord));if(!result.hasMore)break;
  if(!result.records.length)throw Error('invalid_pagination');offset+=result.records.length;
 }while(true);
 state.records=records;
}
async function liveDone(){
 if(liveBusy)return;liveBusy=true;
 const doneButton=document.querySelector('[data-action="done"]');if(doneButton){doneButton.disabled=true;doneButton.textContent=tr('saving')}
 try{
  if(!liveChallenge){await prepareChallenge();if(liveChallenge)await new Promise(resolve=>setTimeout(resolve,1100))}
  if(!liveChallenge)throw Error('service_unavailable');
  const record=makeRecord();
  const result=await liveApi('submit',{record,challenge:liveChallenge,website:''});
  if(result.saved!==true)throw Error('save_not_confirmed');
  acceptSummary(result.summary);lastRecord=record;state.draft=newDraft();state.records=[];state.admin=false;adminSession='';
  state.screen='report';state.notice=tr('submitted');history.replaceState(null,'','#report');signalEnd();render();
 }catch{state.error=tr('submitError');render(false)}
 finally{liveBusy=false}
}
async function liveLogin(){
 if(liveBusy)return;liveBusy=true;const code=$('developerCode').value;$('developerCode').value='';
 try{
  const result=await liveApi('login',{code});if(typeof result.token!=='string')throw Error('not_authorized');
  adminSession=result.token;await loadPrivate();state.admin=true;state.screen='developer';state.notice='';render();
 }catch(error){adminSession='';state.records=[];state.admin=false;state.error=tr(error.status===401?'wrongCode':error.status===429?'loginLimit':'connectionError');render()}
 finally{liveBusy=false}
}
async function liveReport(){
 state.records=[];state.admin=false;state.notice='';state.screen='report';history.replaceState(null,'','#report');render();
 try{await loadReport()}catch{state.error=tr('connectionError')}render(false);
}
async function liveLogout(){
 const token=adminSession;try{if(token)await liveApi('logout')}catch{}finally{adminSession='';state.records=[];state.admin=false;await liveReport()}
}
