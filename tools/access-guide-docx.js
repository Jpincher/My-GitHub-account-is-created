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
 const data=root.JP_RECOVERY_GUIDE;if(!data)throw Error('Recovery guide data is missing. Keep recovery/recovery-guide-data.js with this page.');
 const home=links?.home||{},learning=links?.learning||{};
 return [
 {style:'Title',text:'Jonathan Pincher — Private access and recovery guide'},
 {text:'Prepared 23 October 2026. Private owner copy. Keep off public websites and GitHub.'},
 {style:'Heading1',text:'Your developer access code'},
 {text:'Developer code: '+(code||'[Not supplied. Use your private project conversation.]')},
 {text:'Enter this code in Developer only at the live tester. Server-verified developer authentication protects individual feedback. This is not your GitHub, Gmail or Supabase account password.'},
 {text:'Homepage: '+(home.short||home.target||'https://is.gd/JP_Homepage')},
 {text:'Learning project: '+(learning.short||learning.target||'https://is.gd/JP_Learning')},
 ...data.sections.flatMap(([title,lines],i)=>[{style:'Heading1',text:(i+1)+'. '+title},...lines.map(text=>({text}))]),
 {style:'Heading1',text:'File-by-file instructions'},
 ...data.files.flatMap(file=>[{style:'Heading2',text:file.path+' — '+file.group},{text:file.instruction}]),
 {style:'Heading1',text:'Embedded learning pages'},
 ...data.routes.flatMap(file=>[{style:'Heading2',text:file.path},{text:file.instruction}])
 ];
}
function build(code,links){
 const ps=paragraphs(code,links).map(p=>'<w:p>'+(p.style?'<w:pPr><w:pStyle w:val="'+xml(p.style)+'"/></w:pPr>':'')+'<w:r><w:t xml:space="preserve">'+xml(p.text)+'</w:t></w:r></w:p>').join('');
 return zip({
 '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>',
 '_rels/.rels':'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
 'word/_rels/document.xml.rels':'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
 'word/styles.xml':'<?xml version="1.0" encoding="UTF-8"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="140" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:color w:val="284B37"/><w:sz w:val="40"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="260" w:after="140"/></w:pPr><w:rPr><w:b/><w:color w:val="284B37"/><w:sz w:val="28"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/></w:pPr><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:style></w:styles>',
 'word/document.xml':'<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+ps+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080"/></w:sectPr></w:body></w:document>'
 });
}
root.JP_ACCESS_DOCX={build,paragraphs,crc32};
})(globalThis);
