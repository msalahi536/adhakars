import {test,expect,mock} from "bun:test";

// Isolate the hook's session lifecycle without microphone hardware or a model download.
const captures:{discarded:boolean}[]=[];
const updates:((r:any)=>void)[]=[];
const track={enabled:true,stopped:false,stop(){this.stopped=true;}};
const stream={getTracks:()=>[track]};
const result=(key:string)=>({words:[{key,status:"correct",text:""}],extras:[],startKey:key,startIndex:0,reachedIndex:0});
mock.module("react",()=>({useRef:(current:any)=>({current}),useState:(value:any)=>[value,()=>{}],useEffect:()=>{}}));
mock.module("@/lib/quran-player",()=>({quranPlayer:{pause(){}}}));
mock.module("@/lib/recitation-player",()=>({recitationPlayer:{pause(){}}}));
mock.module("@/lib/hifzHaptics",()=>({play(){}}));
mock.module("@/components/recite/recording",()=>({captureRecording:()=>{const capture={discarded:false};captures.push(capture);return {discard(){capture.discarded=true;},finish:async()=>capture.discarded?null:new Blob(["fresh recording"])};}}));
mock.module("@/lib/hifz-ai/assets",()=>({checkerDownloaded:async()=>true}));
mock.module("@/lib/hifz-ai",()=>({prepareChecker:async()=>{},startSmartRecite:async(o:any)=>{updates.push(o.onUpdate);return {stream,stop:async()=>{o.onUpdate(result("1:1:1"));return result("1:1:1");}};}}));

test("confirmed reset discards old audio, fences old results and keeps the mic track for fresh words",async()=>{
  const {useReaderVoice}=await import("./use-reader-voice");
  const received:any[]=[];
  const voice=useReaderVoice({update:r=>received.push(r),elsewhere(){},position(){},answer(){}});
  await voice.request("smart",[{sura:1,first:1,last:7}]);
  const oldUpdate=updates[0];expect(oldUpdate).toBeDefined();oldUpdate?.(result("1:1:1"));
  expect(received.length).toBe(1);
  await voice.resetMistakes();
  expect(captures[0]?.discarded).toBe(true);
  expect(track.stopped).toBe(false);
  expect(track.enabled).toBe(true);
  expect(captures[1]?.discarded).toBe(false);
  oldUpdate?.(result("1:1:2"));expect(received.length).toBe(1);
  updates[1]?.(result("1:2:1"));
  expect(received.at(-1)?.words.map((w:any)=>w.key)).toEqual(["1:2:1"]);
  voice.discardRecording();expect(captures[1]?.discarded).toBe(true);
  mock.restore();
});