import {useEffect,useRef,useState} from "react";
import type {CheckResult,Elsewhere,FollowPosition,FollowSession,ListenSession,SearchAnswer} from "@/lib/hifz-ai";
import {captureRecording} from "@/components/recite/recording";
import {quranPlayer} from "@/lib/quran-player";
import {recitationPlayer} from "@/lib/recitation-player";
import {play as feedback} from "@/lib/hifzHaptics";

type Range={sura:number;first:number;last:number};
export function useReaderVoice({update,elsewhere,position,answer}:{update:(r:CheckResult)=>void;elsewhere:(p:Elsewhere)=>void;position:(p:FollowPosition)=>void;answer:(a:SearchAnswer)=>void}) {
  const [phase,setPhase]=useState("idle"),[mode,setMode]=useState<"smart"|"follow"|"search">("smart");
  const [progress,setProgress]=useState(0),[error,setError]=useState("");
  const [stream,setStream]=useState<MediaStream|null>(null),[recording,setRecording]=useState<Blob|null>(null);
  const session=useRef<ListenSession|FollowSession|null>(null),generation=useRef(0),busy=useRef(false);
  const capture=useRef<ReturnType<typeof captureRecording>>(null);
  const intent=useRef<{mode:"smart"|"follow"|"search";ranges:Range[]}>({mode:"smart",ranges:[]});
  const callbacks=useRef({update,elsewhere,position,answer});callbacks.current={update,elsewhere,position,answer};
  const release=()=>{const s=session.current;session.current=null;if(s){s.stream.getTracks().forEach(t=>t.stop());void s.stop().catch(()=>undefined);}capture.current?.discard();capture.current=null;};
  useEffect(()=>()=>{generation.current++;release();},[]);
  function cancel(){generation.current++;release();busy.current=false;setStream(null);setPhase("idle");setRecording(null);}
  async function begin(){
    if(busy.current)return;busy.current=true;const id=++generation.current;
    release();setRecording(null);setPhase("loading");setError("");setMode(intent.current.mode);quranPlayer.pause();recitationPlayer.pause();
    try{
      const engine=await import("@/lib/hifz-ai");await engine.prepareChecker(p=>{if(id===generation.current)setProgress(p);});
      if(id!==generation.current)return;
      const failure=(e:unknown)=>{if(id!==generation.current)return;release();setStream(null);setPhase("error");setError(e instanceof Error&&e.name==="NotAllowedError"?"Allow microphone access in your browser or phone settings, then retry.":"Couldn’t start listening. Please try again.");};
      const current=intent.current.mode==="smart"?await engine.startSmartRecite({passages:intent.current.ranges,keepStream:true,onUpdate:r=>{if(id===generation.current)callbacks.current.update(r);},onElsewhere:p=>{if(id===generation.current)callbacks.current.elsewhere(p);},onError:failure}):intent.current.mode==="follow"?await engine.startFollowing({onPosition:p=>{if(id===generation.current)callbacks.current.position(p);},onError:failure}):await engine.startVoiceSearch({maxSeconds:15,onError:failure,onAnswer:a=>{if(id===generation.current){session.current=null;setStream(null);setPhase("idle");callbacks.current.answer(a);}}});
      if(id!==generation.current){current.stream.getTracks().forEach(t=>t.stop());await current.stop();return;}
      session.current=current;setStream(current.stream);setPhase("active");feedback("micStart");
      if(intent.current.mode==="smart")capture.current=captureRecording(current.stream);
    }catch(e){if(id===generation.current){release();setPhase("error");setError(e instanceof Error&&e.name==="NotAllowedError"?"Microphone access is off. Allow it, then retry.":"Couldn’t start listening. Check your connection and retry.");}}
    finally{if(id===generation.current)busy.current=false;}
  }
  async function request(mode:"smart"|"follow"|"search",ranges:Range[]=[]){
    if(busy.current)return;intent.current={mode,ranges};setMode(mode);
    const {checkerDownloaded}=await import("@/lib/hifz-ai/assets");
    if(await checkerDownloaded())await begin();else setPhase("consent");
  }
  async function stop(){
    if(busy.current)return;busy.current=true;setPhase("finishing");const id=generation.current;
    const current=session.current;session.current=null;
    const blob=capture.current?.finish();capture.current=null;
    try{const result=await current?.stop();if(id===generation.current){if(result)callbacks.current.update(result);setRecording(await blob??null);current?.stream.getTracks().forEach(t=>t.stop());setStream(null);setPhase("idle");feedback("micStop");}}
    catch {if(id===generation.current){current?.stream.getTracks().forEach(t=>t.stop());setStream(null);setError("Couldn’t finish this recording. Tap the mic to retry.");setPhase("error");}}
    finally{if(id===generation.current)busy.current=false;}
  }
  async function continueAt(ranges:Range[]){
    const current=session.current;if(!current||mode!=="smart"||busy.current)return;
    busy.current=true;const id=generation.current;const held=current.stream;
    // Keep the same permission/track while settling the old page's audio context.
    held.getTracks().forEach(t=>t.enabled=false);
    try{
      await current.stop();
      if(id!==generation.current)return;
      const engine=await import("@/lib/hifz-ai");
      const next=await engine.startSmartRecite({passages:ranges,stream:held,keepStream:true,onUpdate:r=>{if(id===generation.current)callbacks.current.update(r);},onElsewhere:p=>{if(id===generation.current)callbacks.current.elsewhere(p);}});
      if(id!==generation.current){next.stream.getTracks().forEach(t=>t.stop());await next.stop();return;}
      session.current=next;held.getTracks().forEach(t=>t.enabled=true);intent.current.ranges=ranges;
    }catch{cancel();setError("Listening stopped. Tap the mic to continue.");setPhase("error");}finally{busy.current=false;}
  }
  function discardRecording(){setRecording(null);}
  return {phase,mode,progress,error,stream,recording,request,begin,stop,cancel,continueAt,discardRecording};
}