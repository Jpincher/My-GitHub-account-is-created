"""Decode every installed recording without changing source media."""
import pathlib,shutil,subprocess,json
ROOT=pathlib.Path(__file__).resolve().parents[1]
files=sorted((ROOT/"learning-media").glob("*.mp3"))
assert len(files)>=50,"Expected the complete installed recording set"
cli=shutil.which("ffprobe") and shutil.which("ffmpeg")
if not cli:
 import av
 print("Decoder: PyAV",av.__version__)
for path in files:
 if cli:
  probe=json.loads(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","json",str(path)],text=True))
  assert float(probe["format"]["duration"])>0,path.name
  subprocess.run(["ffmpeg","-nostdin","-v","error","-i",str(path),"-f","null","-"],check=True,capture_output=True)
 else:
  with av.open(str(path)) as container:
   assert len(container.streams.audio)>=1,path.name
   samples=0
   for frame in container.decode(audio=0):
    assert frame.sample_rate>0 and frame.samples>0,path.name
    samples+=frame.samples
   assert samples>0,path.name
print("PASS:",len(files),"installed recordings have positive duration and decode without errors.")
