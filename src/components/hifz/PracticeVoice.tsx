import {useEffect,useRef} from "react";
import {Mic,Square} from "lucide-react";
import {Button} from "@/components/ui/button";
import {useAiRecitation,type AiRange} from "@/components/recite/use-ai-recitation";
import {findHesitations,masteryScore,type CheckResult} from "@/lib/hifz-ai";
import {quranPlayer} from "@/lib/quran-player";
import {recitationPlayer} from "@/lib/recitation-player";
import {cleanRecitation} from "@/components/recite/ai-performance";
import {play} from "@/lib/hifzHaptics";
export function PracticeVoice({ranges,wordKeys,onCorrect,noPressure=false}:{ranges:AiRange[];wordKeys:string[];onCorrect?:()=>void;noPressure?:boolean}) {
 const ai=useAiRecitation(ranges[0]?.sura??0,true,wordKeys);
 const processed=useRef<CheckResult|null>(null);
 const success=ai.result?cleanRecitation(ai.result,wordKeys):false;
 useEffect(()=>{
  if(ai.phase!=="finished"||!ai.result||processed.current===ai.result)return;
  processed.current=ai.result;
  if(cleanRecitation(ai.result,wordKeys)&&onCorrect){play("pageComplete");onCorrect();}
 },[ai.phase,ai.result,onCorrect,wordKeys]);
 const start=()=>{quranPlayer.pause();recitationPlayer.pause();void ai.request(ranges);};
 const score=ai.result && ai.phase==="finished"?masteryScore(ai.result,findHesitations(ai.result)):null;
 return <div className="hp-voice"><div className="hp-practice-actions"><Button className="hp-voice-button" aria-label={ai.phase==="listening"?"Stop recitation":"Answer out loud"} disabled={!ranges.length||ai.phase==="loading"||ai.phase==="stopping"} onClick={ai.phase==="listening"?()=>void ai.stop():start}>{ai.phase==="listening"?<Square/>:<Mic/>}</Button></div>
 <p className="hp-status" role="status">{ai.phase==="listening"?"Listening… tap to finish":ai.phase==="stopping"?"Checking…":ai.phase==="loading"?`Preparing checker · ${Math.round(ai.progress*100)}%`:""}</p>
 {ai.phase==="download"&&<div className="hp-practice-surface"><h3>Download voice checker</h3><p className="hp-note">73 MB, one time. Wi-Fi recommended. Works offline after download.</p><div className="hp-practice-actions"><Button onClick={()=>void ai.confirm()}>Download &amp; start</Button><Button variant="ghost" onClick={ai.cancel}>Not now</Button></div></div>}
 {ai.phase==="error"&&<div role="alert"><p className="hp-note">{ai.error}</p><Button onClick={start}>Retry</Button></div>}
 {score&&<div className="hp-mic-result"><div className="hp-score"><b>{score.score}</b><strong>{score.label}</strong></div><p className="hp-note">{noPressure?"Just a gentle recall. Nothing is graded or saved.":success?"Correct — nicely recalled.":"Take another moment, then try again."}</p>
 {ai.result?.words.filter((w)=>w.status==="wrong"||w.status==="skipped").map((w)=><p key={w.key} className="hp-note" dir="rtl">{w.text} · {w.status==="skipped"?"Not heard":"Try again"}</p>)}</div>}
 </div>;
}