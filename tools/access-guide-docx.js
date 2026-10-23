/* Local-only Word document builder. No passwords, network calls or storage. */
(function(root){
'use strict';
const utf8=s=>new TextEncoder().encode(s);
const xml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const crcTable=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0});
function crc32(bytes){let crc=0xffffffff;for(const b of bytes)crc=crcTable[(crc^b)&255]^(crc>>>8);return(crc^0xffffffff)>>>0}
function zip(files){
 const chunks=[],central=[];let offset=0;
 const put16=(view,at,v)=>view.setUint16(at,v,true),put32=(view,at,v)=>view.setUint32(at,v,true);
 for(const [name,text]of Object.entries(files)){
  const n=utf8(name),data=utf8(text),crc=crc32(data),head=new Uint8Array(30+n.length),v=new DataView(head.buffer);
  put32(v,0,0x04034b50);put16(v,4,20);put16(v,10,0);put16(v,12,33);put32(v,14,crc);put32(v,18,data.length);put32(v,22,data.length);put16(v,26,n.length);head.set(n,30);
  const c=new Uint8Array(46+n.length),cv=new DataView(c.buffer);
  put32(cv,0,0x02014b50);put16(cv,4,20);put16(cv,6,20);put16(cv,12,0);put16(cv,14,33);put32(cv,16,crc);put32(cv,20,data.length);put32(cv,24,data.length);put16(cv,28,n.length);put32(cv,42,offset);c.set(n,46);
  chunks.push(head,data);central.push(c);offset+=head.length+data.length;
 }
 const directorySize=central.reduce((n,b)=>n+b.length,0),end=new Uint8Array(22),e=new DataView(end.buffer);
 put32(e,0,0x06054b50);put16(e,8,central.length);put16(e,10,central.length);put32(e,12,directorySize);put32(e,16,offset);
 const result=new Uint8Array(offset+directorySize+end.length);let at=0;for(const b of [...chunks,...central,end]){result.set(b,at);at+=b.length}return result;
}
function paragraphs(code,links){
 const base='https://jpincher.github.io/My-GitHub-account-is-created/';
 const home=links?.home||{target:base},learning=links?.learning||{target:base+'interactive-learning.html'};
 const section=(title,lines)=>[{style:'Heading1',text:title},...lines.map(text=>({text}))];
 return [
 {style:'Title',text:'Jonathan Pincher — Private access and recovery guide'},
 {text:'Prepared 23 October 2026. Owner copy: keep this document on your computer and out of the public repository.'},
 ...section('1. Share these CV links',[
 'Portfolio: '+(home.short||home.target),
 'Learning design: '+(learning.short||learning.target),
 'Both published projects are public. Visitors need no account or password.',
 'Full homepage address: '+home.target,
 'Full learning-project address: '+learning.target,
 'Usability explanation: '+base+'learning-usability-testing.html',
 'Tester questionnaire: '+base+'usability-tester.html'
 ]),
 ...section('2. Developer preview code',[
 'Code supplied in this private download: '+(code||'[Not supplied. Obtain it from your private conversation with ChatGPT.]'),
 'Where to use it: open the tester questionnaire, complete or view its report, then choose Developer only.',
 'Enter the code exactly, including capital letters and the final symbol.',
 'This currently opens a browser-only developer preview. It is not secure server authentication and does not collect or reveal responses from other people’s browsers.',
 'Public reports omit identity and demographic details. Responses remain in the current tester browser session; export any feedback files you want to keep.'
 ]),
 ...section('3. GitHub editing and recovery',[
 'Account username: Jpincher',
 'Repository: https://github.com/Jpincher/My-GitHub-account-is-created',
 'Main branch: main. Current publishing location: GitHub Pages, repository root.',
 'Your GitHub account password, passkeys, two-factor authentication and recovery codes are your own account credentials. They are not available to this project or included here.',
 'If you cannot sign in, use GitHub’s account-recovery process. Do not substitute the developer-preview code for your GitHub password.',
 'No repository token, API key or GitHub password is embedded in the website.',
 'The GitHub Actions workflow uses GitHub’s temporary runner token; there is no permanent token for you to copy from this project.'
 ]),
 ...section('4. Complete backup and restoration',[
 'Complete backup ZIP: https://github.com/Jpincher/My-GitHub-account-is-created/releases/download/portfolio-backup-2026-10-23/Jonathan_Pincher_Portfolio_Backup.zip',
 'Download the ZIP and this private Word document separately. Extract the ZIP and retain its folder structure.',
 'Open START_HERE.html for the viewing links. Website/index.html is the homepage; Website/interactive-learning.html is the learning-project entry.',
 'The ZIP contains all tracked source files, images, recorded voices, mouth-timing data, teaching resources, tests and build tools at its recorded commit. It does not contain Git history or feedback stored in other browsers.',
 'External references, email links and online services still need internet access. Browser rules may require a real click before sound plays.',
 'To restore online: sign in to GitHub, open the same repository, upload the contents of Website into the repository root, then commit. Do not upload only the ZIP or create an extra Website folder above index.html.',
 'Keep publishing set to main / root if using branch-based Pages. Check Actions until deployment succeeds.',
 'Keep the repository name and entry filenames unchanged so your CV links continue to work.',
 'The backup includes a file inventory and SHA-256 checksums for verification.'
 ]),
 ...section('5. Important project files',[
 'index.html — portfolio homepage.',
 'education.html — education and learning design landing page.',
 'interactive-learning.html — learning-project entry.',
 'learning-project-ddca4d6b5d3f.js — shared learning-project source and embedded page content.',
 'learning-media/ — images, audio, downloadable teaching documents and other assets. Keep this folder beside the HTML files.',
 'learning-usability-testing.html — direct entry to section 11.',
 'usability-tester.html — questionnaire and local report prototype.',
 'tools/final-voices.json — fixed Elena voice choices and introduction scripts.',
 'tools/final-voices-installed.json — installed audio identifiers, transcripts, checksums and mouth envelopes.',
 'CONTRIBUTING.md, USABILITY_TESTING.md and COMPLETION_STATUS.md — design rules, testing details and remaining limitations.',
 'tests/ — automated regression checks. Install test dependencies and run npm --prefix tests test when developing.'
 ]),
 ...section('6. Voices and animation',[
 'Elena: English en-US-JennyNeural; Spanish es-MX-DaliaNeural; Mandarin zh-CN-XiaoxiaoNeural.',
 'Her school-dashboard and usability introductions use recorded MP3 files. Mouth envelopes are measured from each recording at 25 samples per second.',
 'Other guides retain their installed recordings. No speech-provider account or API key is needed to play those files.',
 'For regeneration, use the Finish and verify project recordings workflow in GitHub Actions. It installs its own tools, tests before and after generation, and commits verified outputs only.',
 'The voice generator uses edge-tts 7.3.1. Future service changes may require maintenance; do not delete the installed MP3 files when updating tools.'
 ]),
 ...section('7. Other access and unfinished services',[
 'An older private mobile copy exists at https://jonathan-learning-design.yummykrill4.chatgpt.site . It uses your ChatGPT account access, not a separate project password. The current master copy is the GitHub version above.',
 'Automatic shared feedback collection, durable research storage and genuine developer authentication are not deployed. There are no live server or database credentials to record for those features yet.',
 'The current tester is an illustrative draft. Use fictional personal details until secure collection is connected.',
 'The public short-link service uses no owner password for these links. Its links cannot be retargeted; maintain the full GitHub destinations.',
 'This guide cannot include account passwords or recovery keys that were never supplied. Store those separately in your own password manager.'
 ]),
 ...section('8. Keep private',[
 'Do not add this completed access guide to GitHub, a public website, your CV or the backup release.',
 'The download page assembles this file locally in your browser. It does not send the developer code to a server or save it in browser storage.'
 ])
 ];
}
function build(code,links){
 const ps=paragraphs(code,links).map(p=>'<w:p>'+(p.style?'<w:pPr><w:pStyle w:val="'+xml(p.style)+'"/></w:pPr>':'')+'<w:r><w:t xml:space="preserve">'+xml(p.text)+'</w:t></w:r></w:p>').join('');
 return zip({
 '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>',
 '_rels/.rels':'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
 'word/_rels/document.xml.rels':'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
 'word/styles.xml':'<?xml version="1.0" encoding="UTF-8"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="140" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:color w:val="284B37"/><w:sz w:val="40"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="260" w:after="140"/></w:pPr><w:rPr><w:b/><w:color w:val="284B37"/><w:sz w:val="28"/></w:rPr></w:style></w:styles>',
 'word/document.xml':'<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+ps+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080"/></w:sectPr></w:body></w:document>'
 });
}
root.JP_ACCESS_DOCX={build,paragraphs,crc32};
})(globalThis);
