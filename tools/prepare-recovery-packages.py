"""Build independent, documented recovery packages from this exact Git checkout."""
import hashlib,html,json,pathlib,re,subprocess,zipfile
from datetime import datetime,timezone
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/"_delivery"
BASE="https://jpincher.github.io/My-GitHub-account-is-created/"
def tracked():
 return [p for p in subprocess.check_output(["git","ls-files","-z"],cwd=ROOT).decode().split("\0") if p and (ROOT/p).is_file()]
def data():
 text=(ROOT/"recovery/recovery-guide-data.js").read_text()
 return json.loads(text.split("=",1)[1].strip().rstrip(";"))
def wrap(title,body):
 return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+html.escape(title)+'</title><style>body{font:16px/1.65 Arial,sans-serif;background:#faf8ee;color:#284b37;max-width:1060px;margin:35px auto;padding:24px}h1,h2{font-family:Georgia,serif}h1{font-size:36px}h2{margin-top:35px}td,th{border:1px solid #bdcbb5;padding:10px;text-align:left;vertical-align:top}table{border-collapse:collapse;width:100%;font-size:14px}td:first-child{overflow-wrap:anywhere;min-width:180px}a{color:inherit}code{overflow-wrap:anywhere}.scroll{overflow:auto}</style></head><body><h1>'+html.escape(title)+'</h1>'+body+'</body></html>'
def file_guide(mapping,source_paths,meta):
 lookup={f["path"]:f for f in meta["files"]}
 rows=[]
 for path in sorted(mapping):
  source=source_paths.get(path)
  info=lookup.get(source,{})
  instruction=info.get("instruction","Generated delivery file. Keep with its package; read PACKAGE_NOTES.txt and the recovery manual.")
  if path=="Website/index.html" and meta.get("kind")=="learning":instruction="Standalone learning-project launcher. Redirects to interactive-learning.html and preserves query/hash. Keep at the web root."
  rows.append({"path":path,"source":source,"instruction":instruction,"bytes":len(mapping[path]),"sha256":hashlib.sha256(mapping[path]).hexdigest()})
 content='<p>Every packaged file below has a purpose/action. Support files are developer/recovery material; deploy the contents of Website only. The complete combined backup is the unchanged tracked-source snapshot.</p><div class="scroll"><table><thead><tr><th>File</th><th>What to do with it</th></tr></thead><tbody>'+''.join('<tr><td>'+html.escape(r["path"])+'</td><td>'+html.escape(r["instruction"])+'</td></tr>' for r in rows)+'</tbody></table></div><h2>Embedded learning pages</h2><p>The following routes live inside the shared runtime rather than being missing standalone HTML files.</p>'+''.join('<p><b>'+html.escape(r["path"])+'</b>: '+html.escape(r["instruction"])+'</p>' for r in meta["routes"])
 return rows,wrap("File-by-file recovery guide",content).encode()
def write_zip(name,prefix,mapping,sources,kind,changes):
 meta={**data(),"kind":kind};sha=subprocess.check_output(["git","rev-parse","HEAD"],cwd=ROOT,text=True).strip()
 notes=("JONATHAN PINCHER — "+kind.upper()+" RECOVERY PACKAGE\nSource commit: "+sha+"\nSaved: "+datetime.now(timezone.utc).isoformat()+"\n\nExtract preserving all folders. Serve or publish Website contents only. START_HERE.html explains the entry. Support contains optional development/recovery sources, not secrets or live feedback.\n\n"+("\n".join(changes) if changes else "No website source transformation.")+"\n\nRead RECOVERY_MANUAL.html and FILE_GUIDE.html. Keep your completed private Word guide and feedback exports separately. Localhost/LAN feedback needs a matching API origin; static files do not install a database.\n").encode()
 mapping["PACKAGE_NOTES.txt"]=notes
 mapping["VERSION.txt"]=(sha+"\n").encode()
 mapping["PACKAGE_CHANGES.json"]=(json.dumps({"sourceCommit":sha,"kind":kind,"changes":changes},indent=2)+"\n").encode()
 mapping["RECOVERY_MANUAL.html"]=manual()
 mapping["START_HERE.html"]=wrap("Your "+kind+" backup",'<p>Start a local HTTP server from Website/ or deploy its contents to a static web host. See the recovery manual for the exact steps.</p><p><a href="Website/index.html">Open '+("learning project" if kind=="learning" else "portfolio homepage")+'</a></p><p><a href="RECOVERY_MANUAL.html">Read recovery instructions</a> · <a href="FILE_GUIDE.html">File-by-file guide</a> · <a href="Support/download-access-guide.html">Create private Word recovery guide</a></p><p>The private guide generator runs locally; enter your code from your private records. Keep the completed document outside Website.</p>').encode()
 rows,guide=file_guide(mapping,sources,meta)
 mapping["FILE_GUIDE.html"]=guide
 mapping["FILE_INVENTORY.json"]=(json.dumps(rows,indent=2)+"\n").encode()
 mapping["FILE_CHECKSUMS.sha256"]=("\n".join(hashlib.sha256(raw).hexdigest()+"  "+path for path,raw in sorted(mapping.items()))+"\n").encode()
 archive=OUT/name
 with zipfile.ZipFile(archive,"w",zipfile.ZIP_DEFLATED,compresslevel=6) as z:
  for path,raw in sorted(mapping.items()):z.writestr(prefix+"/"+path,raw)
 with zipfile.ZipFile(archive) as z:
  assert z.testzip() is None
  assert len(z.namelist())==len(mapping)
 (OUT/(name+".sha256")).write_text(hashlib.sha256(archive.read_bytes()).hexdigest()+"  "+name+"\n")
 print("Verified separate package:",name,len(mapping),"files",archive.stat().st_size,"bytes",flush=True)
 return mapping
def manual():
 d=data()
 content='<p>Prepared 23 October 2026. Public recovery copy: no access code or private response data. Download the private Word guide separately.</p>'+''.join('<section><h2>'+str(i+1)+'. '+html.escape(title)+'</h2>'+''.join('<p>'+html.escape(p)+'</p>' for p in paragraphs)+'</section>' for i,(title,paragraphs) in enumerate(d["sections"]))
 content+='<h2>Source file instructions</h2><div class="scroll"><table><tr><th>File</th><th>Purpose and action</th></tr>'+''.join('<tr><td>'+html.escape(f["path"])+'</td><td>'+html.escape(f["instruction"])+'</td></tr>' for f in d["files"])+'</table></div>'
 content+='<h2>Embedded routes</h2>'+''.join('<p><b>'+html.escape(f["path"])+'</b>: '+html.escape(f["instruction"])+'</p>' for f in d["routes"])
 return wrap("Jonathan Pincher — Recovery manual",content).encode()
def build():
 OUT.mkdir(exist_ok=True);files=tracked();d=data()
 indexed={f["path"] for f in d["files"]};assert not set(files)-indexed,"Every tracked file must have an instruction: "+repr(set(files)-indexed)
 support_names=[p for p in files if p.startswith(("recovery/","supabase/")) or p in ["download-access-guide.html","tools/access-guide-docx.js","cv-links.js","cv-links.json","CONTRIBUTING.md","USABILITY_TESTING.md","COMPLETION_STATUS.md","CV_LINKS.md","HOMEPAGE_NAVIGATION_REPAIR.md"]]
 common={"Support/"+p:(ROOT/p).read_bytes() for p in support_names}
 common_sources={"Support/"+p:p for p in support_names}
 redirect_names=["accredited-course-design.html","addie.html","approach.html","audit-accountability.html","career.html","cv.html","design.html","experience.html","featured-work.html","question.html","test.html","university-institute.html"]
 home_names=["index.html","FinalHomepage.html.html","portfolio-languages.js","education.html",*redirect_names]
 home=dict(common);home_sources=dict(common_sources)
 for p in home_names:
  raw=(ROOT/p).read_text()
  if p.endswith(".html"):raw=raw.replace("interactive-learning.html",BASE+"interactive-learning.html")
  home["Website/"+p]=raw.encode();home_sources["Website/"+p]=p
 home["Website/.nojekyll"]=b""
 learning=dict(common);learning_sources=dict(common_sources)
 learning_names=[p for p in files if p.startswith("learning-media/") or p in ["interactive-learning.html","learning-usability-testing.html","learning-project-ddca4d6b5d3f.js","guide-audio-coordinator.js","usability-tester.html","how-to-read-this-site.html","usability-live-config.json"]]
 for p in learning_names:
  raw=(ROOT/p).read_bytes()
  if p=="usability-tester.html":
   old=b"ROOT='https://jpincher.github.io/My-GitHub-account-is-created/'"
   assert raw.count(old)==1
   raw=raw.replace(old,b"ROOT=new URL('.',location.href).href")
  learning["Website/"+p]=raw;learning_sources["Website/"+p]=p
 for p in files:
  if p.startswith(("tools/final-voices","tools/generate-final-voices","tools/install-final-voices","tools/usability-live","tools/enable-live")):
   learning["Support/"+p]=(ROOT/p).read_bytes();learning_sources["Support/"+p]=p
 learning["Website/index.html"]=b'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Learning by design</title><script>location.replace("interactive-learning.html"+location.search+location.hash)</script></head><body><p><a href="interactive-learning.html">Open the learning project</a></p></body></html>'
 learning["Website/.nojekyll"]=b""
 write_zip("Jonathan_Pincher_Homepage_Standalone.zip","Homepage_Standalone",home,home_sources,"homepage",["Homepage evidence and redirect links use the published learning-project address, so learning files are not required beside the homepage.","No original site source is overwritten; transformations affect this package only."])
 write_zip("Jonathan_Pincher_Learning_Standalone.zip","Learning_Standalone",learning,learning_sources,"learning",["A new index.html launcher opens interactive-learning.html and preserves query/hash.","Tester project ROOT becomes relative to the restored folder for local navigation. Its online API endpoint is preserved and CORS still requires an explicitly allowed origin.","Portfolio/Home links remain intentional links to the published portfolio.","All installed media are copied unchanged, including original recorded voices and mouth envelopes in the runtime."])
 (OUT/"Jonathan_Pincher_Recovery_Manual.html").write_bytes(manual())
 (OUT/"Jonathan_Pincher_Recovery_Manual.html.sha256").write_text(hashlib.sha256(manual()).hexdigest()+"  Jonathan_Pincher_Recovery_Manual.html\n")
 # Enrich the full exact source snapshot without changing anything under Website/.
 complete=OUT/"Jonathan_Pincher_Portfolio_Backup.zip"
 with zipfile.ZipFile(complete,"a",zipfile.ZIP_DEFLATED,compresslevel=6) as z:
  mapping={"Website/"+p:(ROOT/p).read_bytes() for p in files};sources={"Website/"+p:p for p in files}
  rows,guide=file_guide(mapping,sources,d)
  z.writestr("Jonathan_Pincher_Portfolio_Backup/FILE_GUIDE.html",guide)
  z.writestr("Jonathan_Pincher_Portfolio_Backup/FILE_INVENTORY.json",json.dumps(rows,indent=2)+"\n")
  z.writestr("Jonathan_Pincher_Portfolio_Backup/RECOVERY_MANUAL.html",manual())
 with zipfile.ZipFile(complete) as z:assert z.testzip() is None
 (OUT/(complete.name+".sha256")).write_text(hashlib.sha256(complete.read_bytes()).hexdigest()+"  "+complete.name+"\n")
 print("Verified complete snapshot with recovery manual and per-file inventory.",flush=True)
if __name__=="__main__":build()
