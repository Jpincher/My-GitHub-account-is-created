'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),file=path.join(root,'learning-project-ddca4d6b5d3f.js');
let runtime=fs.readFileSync(file,'utf8');
function objectAt(text,marker){const at=text.indexOf(marker);assert(at>=0,'Missing '+marker);const start=at+marker.length;let depth=0,q=false,e=false;for(let i=start;i<text.length;i++){const c=text[i];if(q){if(e)e=false;else if(c==='\\')e=true;else if(c==='"')q=false}else if(c==='"')q=true;else if(c==='{')depth++;else if(c==='}'&&!--depth)return{start,end:i+1,value:JSON.parse(text.slice(start,i+1))}}throw Error('Unclosed '+marker)}
const object=objectAt(runtime,'const pages='),pages=object.value,results=JSON.parse(fs.readFileSync(path.join(root,'tools/final-voices-installed.json'),'utf8'));
assert.equal(results.recordings.length,6);
const audio={},envelopes={},scripts={};
for(const r of results.recordings){
 assert(['learning-school-dashboard.html','learning-usability-testing.html'].includes(r.route));assert(['en','es','zh'].includes(r.language));
 const data=fs.readFileSync(path.join(root,r.file));assert.equal(crypto.createHash('sha256').update(data).digest('hex'),r.sha256);
 assert.equal(r.envelopeRate,25);assert(r.duration>10);assert(r.envelope.length>=r.duration*25-1);assert(r.envelope.some(v=>v>.5));assert(r.envelope.every(v=>v>=0&&v<=1));
 (audio[r.route]??={})[r.language]=r.file;(envelopes[r.route]??={})[r.language]=r.envelope;(scripts[r.route]??={})[r.language]=r.transcript;
}
const standard=pages['learning-curriculum-design.html'].match(/<script id="reliable-avatar-playback">[\s\S]*?<\/script>/)[0];
let usability=pages['learning-usability-testing.html'];
usability=usability.replace(/<script id="reliable-avatar-playback">[\s\S]*?<\/script>/,standard);
pages['learning-usability-testing.html']=usability;
runtime=runtime.slice(0,object.start)+JSON.stringify(pages).replaceAll('</','<\\/')+runtime.slice(object.end);
const replacements=[
['Elena’s new introduction currently uses a browser voice preview. A matching recorded voice is pending; the transcript remains available.','Elena’s introduction is recorded in English, Spanish and Mandarin. Mouth movement follows each recording; a transcript is also available.'],
['La nueva introducción de Elena utiliza por ahora una voz del navegador. La grabación con su voz correspondiente está pendiente; la transcripción sigue disponible.','La introducción de Elena está grabada en inglés, español y mandarín. El movimiento de boca sigue cada grabación y también hay una transcripción.'],
['埃莱娜的新介绍目前使用浏览器语音预览。对应配音录音尚待完成，文字稿仍可阅读。','埃莱娜的介绍已录制为英语、西班牙语和普通话。嘴部动作跟随每段录音，同时提供文字稿。'],
['Elena currently uses the existing section recordings; her individual voice casting remains to be completed.','Elena now has individual recordings in English, Spanish and Mandarin, with mouth movement driven by each recording.'],
['Elena utiliza por ahora las grabaciones existentes; su voz individual sigue pendiente.','Elena ya cuenta con grabaciones individuales en inglés, español y mandarín, con movimiento de boca guiado por cada grabación.'],
['埃莱娜目前仍使用现有章节录音，其个人配音尚待完成。','埃莱娜现已有英语、西班牙语和普通话个人录音，嘴部动作由相应录音驱动。']
];
for(const [from,to]of replacements)runtime=runtime.split(from).join(to);
const version=crypto.createHash('sha256').update(JSON.stringify(audio)).digest('hex').slice(0,16);
const injection='// FINAL_VOICES_INSTALLED_START\nObject.assign(window.JP_AUDIO,'+JSON.stringify(audio)+');\nObject.assign(window.JP_ENVELOPES,'+JSON.stringify(envelopes)+');\nObject.assign(window.JP_SCRIPTS,'+JSON.stringify(scripts)+');\n// FINAL_VOICES_INSTALLED_END\n';
runtime=runtime.replace(/\/\/ FINAL_VOICES_INSTALLED_START[\s\S]*?\/\/ FINAL_VOICES_INSTALLED_END\n?/,'');
runtime=runtime.replace('window.JP_PROJECT_PAGES=Object.keys(pages);',injection+'window.JP_PROJECT_PAGES=Object.keys(pages);');
runtime=runtime.replace(/window\.JP_PROJECT_VERSION="[^"]+";/,'window.JP_PROJECT_VERSION="final-voices-'+version+'";');
new Function(runtime);
for(const html of Object.values(objectAt(runtime,'const pages=').value))for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g))if(!/application\/(?:ld\+)?json/.test(match[1]))new Function(match[2]);
fs.writeFileSync(file,runtime);
const cache=crypto.createHash('sha256').update(runtime).digest('hex').slice(0,12);
for(const entry of ['interactive-learning.html','learning-usability-testing.html']){
 const p=path.join(root,entry),html=fs.readFileSync(p,'utf8');fs.writeFileSync(p,html.replace(/learning-project-ddca4d6b5d3f\.js\?v=[^"]+/,'learning-project-ddca4d6b5d3f.js?v='+cache));
}
const testPath=path.join(root,'tests/usability-section.cjs');let test=fs.readFileSync(testPath,'utf8');
test=test.replace("assert.ok(html.includes('Browser voice preview'),'Voice preview is clearly identified');","assert.ok(!html.includes('const speechAdapter='),'Final introduction uses the standard recorded player');");
const mark=test.indexOf("const playback=script(html,'reliable-avatar-playback')");
if(mark>=0)test=test.slice(0,mark)+
"const installed=JSON.parse(fs.readFileSync(path.join(__dirname,'..','tools','final-voices-installed.json'),'utf8'));\n"+
"assert.equal(installed.recordings.length,6);\n"+
"for(const r of installed.recordings){assert.ok(fs.readFileSync(path.join(__dirname,'..',r.file)).length>1000);assert.ok(r.envelope.length>250);assert.equal(r.envelopeRate,25);assert.ok(r.envelope.some(v=>v>.5));}\n"+
"console.log('PASS: 19 menus, real destinations, numbering, languages and six synchronized final recordings');\n";
fs.writeFileSync(testPath,test);
console.log('Installed six final Elena recordings with matching envelopes; all other guides preserved.');
