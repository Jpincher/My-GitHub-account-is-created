"""Decode every installed recording; no provider requests or source edits."""
import json,pathlib,subprocess
ROOT=pathlib.Path(__file__).resolve().parents[1]
files=sorted((ROOT/"learning-media").glob("*.mp3"))
assert len(files)>=50,"Expected the complete installed recording set"
for path in files:
 probe=json.loads(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","json",str(path)],text=True))
 assert float(probe["format"]["duration"])>0,path.name
 subprocess.run(["ffmpeg","-nostdin","-v","error","-i",str(path),"-f","null","-"],check=True,capture_output=True)
print("PASS:",len(files),"installed recordings have positive duration and decode without errors.")
