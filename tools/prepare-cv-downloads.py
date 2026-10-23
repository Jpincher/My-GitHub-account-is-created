"""Create named CV links and a complete source/media backup. No private codes."""
import hashlib,json,os,pathlib,subprocess,time,urllib.error,urllib.parse,urllib.request,zipfile
from datetime import datetime,timezone
ROOT=pathlib.Path(__file__).resolve().parents[1]
BASE="https://jpincher.github.io/My-GitHub-account-is-created/"
REPO="Jpincher/My-GitHub-account-is-created"
TAG="portfolio-backup-2026-10-23"
OUT=ROOT/"_delivery"
def http(url,data=None,method=None,headers=None):
    req=urllib.request.Request(url,data=data,method=method,headers={"User-Agent":"Jonathan-Pincher-Portfolio-Delivery",**(headers or {})})
    with urllib.request.urlopen(req,timeout=45) as response:return response.read(),response.geturl()

def links():
    file=ROOT/"cv-links.json"
    result=json.loads(file.read_text()) if file.exists() else {}
    specs={"home":(BASE,["JP_Homepage","JPincher_Homepage","jpfolio"]),"learning":(BASE+"interactive-learning.html",["JP_Learning","JPincher_Learning","jplearn"])}
    def save():
        file.write_text(json.dumps(result,indent=2)+"\n")
        (ROOT/"cv-links.js").write_text("globalThis.JP_CV_LINKS="+json.dumps(result,separators=(",",":"))+";\n")
        rows=["# CV links","","These links open the public work; viewers need no password.",""]
        for key,label in [("home","Portfolio"),("learning","Learning design")]:
            item=result.get(key,{})
            rows.extend(["## "+label,"",item.get("short",item.get("target","Pending")),"","Full address: "+item.get("target",specs[key][0]),""])
        rows.extend(["Keep the GitHub repository and entry filenames stable so the named short links remain valid.",""])
        (ROOT/"CV_LINKS.md").write_text("\n".join(rows))
    errors=[]
    for key,(target,candidates) in specs.items():
        if result.get(key,{}).get("short") and result[key].get("target")==target and result[key]["short"].rsplit("/",1)[-1] in candidates[:2]:
            try:
                _,destination=http(result[key]["short"])
                if destination.rstrip("/")==target.rstrip("/"):continue
            except Exception:pass
        result[key]={"target":target}
        for candidate in candidates:
            short="https://is.gd/"+candidate
            try:
                data=urllib.parse.urlencode({"format":"json","url":target,"shorturl":candidate}).encode()
                raw,_=http("https://is.gd/create.php",data,headers={"Content-Type":"application/x-www-form-urlencoded"})
                answer=json.loads(raw)
                created=answer.get("shorturl")
                if created:
                    _,destination=http(created)
                    if destination.rstrip("/")!=target.rstrip("/"):raise RuntimeError("Short-link destination mismatch")
                    result[key]={"target":target,"short":created};save();print(key,created,flush=True);break
            except Exception as error:
                print("Short-link attempt:",key,candidate,type(error).__name__,flush=True)
            # If a create response was lost, accept only an alias that already points to this exact target.
            try:
                _,destination=http(short)
                if destination.rstrip("/")==target.rstrip("/"):
                    result[key]={"target":target,"short":short};save();print(key,short,flush=True);break
            except Exception:pass
            time.sleep(2)
        if "short" not in result[key]:errors.append(key)
        save()
    if errors:raise RuntimeError("Named links could not be created: "+", ".join(errors))

def backup():
    OUT.mkdir(exist_ok=True)
    sha=subprocess.check_output(["git","rev-parse","HEAD"],cwd=ROOT,text=True).strip()
    files=subprocess.check_output(["git","ls-files","-z"],cwd=ROOT).decode().split("\0")
    files=[f for f in files if f and (ROOT/f).is_file()]
    checks=[]
    prefix="Jonathan_Pincher_Portfolio_Backup/"
    archive=OUT/"Jonathan_Pincher_Portfolio_Backup.zip"
    readme="""JONATHAN PINCHER — COMPLETE PORTFOLIO BACKUP
Saved: """+datetime.now(timezone.utc).isoformat()+"""
Source commit: """+sha+"""

1. Extract this ZIP, preserving the folder structure.
2. Open START_HERE.html to view the homepage and learning project.
3. Website/ contains every tracked repository file, including all teaching documents, images, recorded voices, mouth timing, source, tests and tools.
4. Keep learning-media/ beside the HTML and JS files. Do not move individual files out of their folders.
5. External references, email and online services require internet. Browsers may require a real click before sound starts.
6. To restore GitHub Pages, upload the CONTENTS of Website/ into the root of the existing repository and commit. Do not upload only this ZIP or put an extra Website folder above index.html.
7. Check GitHub Actions until deployment succeeds.
8. Save your PRIVATE ACCESS GUIDE separately. It is not included here, and must not be published.
9. No GitHub account password, server key or other account credential is present. Live Supabase feedback is not included; export it privately through Developer only. A separate private recovery guide is required for access codes.
10. This is a complete tracked-file snapshot, not the full Git history. FILE_CHECKSUMS.sha256 records the source files.
"""
    start="""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Jonathan Pincher — Portfolio backup</title><style>body{font:17px/1.65 Arial,sans-serif;max-width:760px;margin:7vh auto;padding:24px;background:#faf8ee;color:#284b37}h1{font:36px Georgia,serif}a{display:inline-block;margin:8px 12px 8px 0;padding:9px 14px;background:#e9efdf;border:1px solid #8ca37e;border-radius:7px;color:inherit}p{max-width:650px}</style></head><body><h1>Your complete portfolio backup</h1><p>Keep this folder together. Open either project below. Some browser features and outside references may require internet.</p><a href="Website/index.html">Open portfolio homepage</a><a href="Website/interactive-learning.html">Open learning project</a><a href="Website/learning-usability-testing.html">Open usability testing section</a><p>Read README.txt for restoration instructions. Keep your private access guide separately.</p></body></html>"""
    with zipfile.ZipFile(archive,"w",zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for file in files:
            raw=(ROOT/file).read_bytes()
            z.writestr(prefix+"Website/"+file,raw)
            checks.append(hashlib.sha256(raw).hexdigest()+"  Website/"+file)
        z.writestr(prefix+"README.txt",readme)
        z.writestr(prefix+"START_HERE.html",start)
        z.writestr(prefix+"VERSION.txt",sha+"\n")
        z.writestr(prefix+"FILE_CHECKSUMS.sha256","\n".join(checks)+"\n")
    with zipfile.ZipFile(archive) as z:
        if z.testzip() is not None:raise RuntimeError("Corrupt backup")
        assert len(z.namelist())==len(files)+4
    digest=hashlib.sha256(archive.read_bytes()).hexdigest()
    (OUT/(archive.name+".sha256")).write_text(digest+"  "+archive.name+"\n")
    print("Backup verified:",len(files),"files;",archive.stat().st_size,"bytes; source",sha,flush=True)

def release():
    token=os.environ["GH_TOKEN"]
    api="https://api.github.com/repos/"+REPO
    headers={"Authorization":"Bearer "+token,"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"}
    try:raw,_=http(api+"/releases/tags/"+TAG,headers=headers);record=json.loads(raw)
    except urllib.error.HTTPError as error:
        if error.code!=404:raise
        payload={"tag_name":TAG,"target_commitish":subprocess.check_output(["git","rev-parse","HEAD"],cwd=ROOT,text=True).strip(),"name":"Complete portfolio backup — 23 October 2026","body":"Complete tracked source/media backup for the homepage and learning project, with file inventory, checksums and restoration instructions. Private access codes are intentionally excluded. Download the separate private guide using the owner download page.","draft":False,"prerelease":False}
        raw,_=http(api+"/releases",json.dumps(payload).encode(),"POST",{**headers,"Content-Type":"application/json"});record=json.loads(raw)
    existing={a["name"]:a for a in record.get("assets",[])}
    for path in sorted(OUT.iterdir()):
        if not path.is_file():continue
        if path.name in existing:http(api+"/releases/assets/"+str(existing[path.name]["id"]),method="DELETE",headers=headers)
        upload=record["upload_url"].split("{")[0]+"?"+urllib.parse.urlencode({"name":path.name})
        raw,_=http(upload,path.read_bytes(),"POST",{**headers,"Content-Type":"application/zip" if path.suffix==".zip" else "text/html; charset=utf-8" if path.suffix==".html" else "text/plain"})
        created=json.loads(raw);print("Published download:",created["browser_download_url"],flush=True)

if __name__=="__main__":
    import sys
    {"links":links,"backup":backup,"release":release}[sys.argv[1]]()
