'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
require('../tools/access-guide-docx.js');
const fake='SAMPLE_NOT_A_REAL_CODE',links={home:{target:'https://example.test/',short:'https://is.gd/example'},learning:{target:'https://example.test/learn'}};
const bytes=globalThis.JP_ACCESS_DOCX.build(fake,links);
assert.equal(bytes[0],0x50);assert.equal(bytes[1],0x4b);
const view=new DataView(bytes.buffer);let at=0,count=0;
while(view.getUint32(at,true)===0x04034b50){
 const size=view.getUint32(at+18,true),nameLength=view.getUint16(at+26,true),extra=view.getUint16(at+28,true),start=at+30+nameLength+extra;
 const name=new TextDecoder().decode(bytes.slice(at+30,at+30+nameLength)),data=bytes.slice(start,start+size);
 assert.equal(JP_ACCESS_DOCX.crc32(data),view.getUint32(at+14,true),name+' checksum');
 if(name==='word/document.xml'){
  const xml=new TextDecoder().decode(data);
  assert(xml.includes(fake));assert(xml.includes('https://is.gd/example'));assert(xml.includes('server-verified developer authentication'));
  assert(xml.includes('GitHub account password'));assert(xml.includes('Automatic shared feedback collection'));
 }
 count++;at=start+size;
}
assert.equal(count,5);
const page=fs.readFileSync(path.join(__dirname,'..','download-access-guide.html'),'utf8');
assert(page.includes("connect-src 'none'"));assert(page.includes("history.replaceState"));assert(!page.includes('localStorage'));
assert(page.includes("code.value=fragment.get('code')||''"));
for(const match of page.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new Function(match[1]);
console.log('PASS: valid Word ZIP, CRCs, private client-supplied code, access/recovery content and no browser storage or network transmission');
