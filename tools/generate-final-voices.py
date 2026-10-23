"""Generate Elena's final multilingual recordings and matching 25 Hz RMS envelopes.
Only the fictional section-introduction text in final-voices.json is sent for synthesis.
No visitor data, account credentials or unrelated files are transmitted.
"""
import asyncio, array, hashlib, json, math, pathlib, subprocess, sys, tempfile
from datetime import datetime, timezone
import edge_tts
ROOT=pathlib.Path(__file__).resolve().parents[1]
CONFIG=json.loads((ROOT/"tools/final-voices.json").read_text())
MEDIA=ROOT/"learning-media"
OUT=ROOT/"tools/final-voices-installed.json"
RATE=16000
FRAME=RATE//25

def envelope(path):
    raw=subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-i",str(path),"-f","s16le","-acodec","pcm_s16le","-ac","1","-ar",str(RATE),"-"],check=True,stdout=subprocess.PIPE).stdout
    pcm=array.array("h");pcm.frombytes(raw)
    if sys.byteorder!="little":pcm.byteswap()
    if len(pcm)<RATE:raise ValueError("Recording too short")
    values=[]
    for start in range(0,len(pcm),FRAME):
        frame=pcm[start:start+FRAME]
        values.append(math.sqrt(sum(x*x for x in frame)/max(1,len(frame)))/32768)
    positive=sorted(x for x in values if x>0.002)
    if not positive:raise ValueError("Recording contains no audible speech")
    reference=max(0.01,positive[int((len(positive)-1)*0.95)])
    return [round(min(1,x/reference),3) for x in values],round(len(pcm)/RATE,3)

async def main():
    MEDIA.mkdir(exist_ok=True)
    old=json.loads(OUT.read_text()) if OUT.exists() else {"recordings":[]}
    cache={(r["route"],r["language"]):r for r in old["recordings"]}
    voices=await edge_tts.list_voices()
    names={v["ShortName"] for v in voices}
    for voice in CONFIG["voices"].values():
        if voice not in names:raise ValueError("Configured voice is unavailable: "+voice)
    results=[]
    for route,scripts in CONFIG["routes"].items():
        for language,text in scripts.items():
            voice=CONFIG["voices"][language]
            fingerprint=hashlib.sha256((CONFIG["providerVersion"]+"\0"+voice+"\0"+text).encode()).hexdigest()
            prev=cache.get((route,language))
            if prev and prev.get("sourceFingerprint")==fingerprint and (ROOT/prev["file"]).is_file():
                results.append(prev);continue
            with tempfile.TemporaryDirectory() as directory:
                target=pathlib.Path(directory)/"voice.mp3"
                last=None
                for attempt in range(3):
                    try:
                        communicator=edge_tts.Communicate(text,voice,rate="-5%")
                        await asyncio.wait_for(communicator.save(str(target)),timeout=90)
                        points,duration=envelope(target)
                        break
                    except Exception as error:
                        last=error
                        if attempt==2:raise RuntimeError("Voice generation failed for "+route+" / "+language) from last
                        await asyncio.sleep(2+attempt*3)
                data=target.read_bytes()
                digest=hashlib.sha256(data).hexdigest()
                file="learning-media/"+digest[:20]+".mp3"
                (ROOT/file).write_bytes(data)
                results.append({"route":route,"language":language,"guide":"elena","voice":voice,"file":file,"sha256":digest,"sourceFingerprint":fingerprint,"duration":duration,"envelopeRate":25,"envelope":points,"transcript":text})
                print("Generated",route,language,round(duration,1),"seconds",flush=True)
    result={"schema":1,"provider":CONFIG["provider"],"providerVersion":CONFIG["providerVersion"],"generatedAt":datetime.now(timezone.utc).isoformat(),"recordings":results}
    OUT.write_text(json.dumps(result,ensure_ascii=False,separators=(",",":"))+"\n")
    print("Installed manifest:",len(results),"recordings")
if __name__=="__main__":asyncio.run(main())
