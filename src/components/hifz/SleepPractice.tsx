import {useEffect,useMemo,useRef,useState} from "react";
import {useQuery,useSuspenseQuery} from "@tanstack/react-query";
import {useNavigate} from "@tanstack/react-router";
import {MoonStar,Headphones,Square} from "lucide-react";
import {Button} from "@/components/ui/button";
import {HeaderBackButton} from "@/components/HeaderBackButton";
import {sleepBoost,todayISO,addDays,type HifzState} from "@/lib/hifz";
import {quranIndexOptions} from "@/lib/hifz/program";
import {recitePageOptions} from "@/lib/recite/data";
import {getChapterAudio} from "@/lib/quran";
import {quranPlayer} from "@/lib/quran-player";
import {recitationPlayer} from "@/lib/recitation-player";
import {createAudioRun} from "@/components/recite/lesson-ai";
import {PracticeVoice} from "./PracticeVoice";
import {SLEEP_PREVIEW_KEY,previewWords,rangesForWords,type SleepPreview} from "./practice-rules";
export function SleepPractice({state,mode}:{state:HifzState;mode:"preview"|"recall"}) {
 const q=useSuspenseQuery(quranIndexOptions).data;const today=todayISO();const navigate=useNavigate();
 const [saved,setSaved]=useState<SleepPreview|null>(null);const [hydrated,setHydrated]=useState(false);
 const [playing,setPlaying]=useState(false);const [pass,setPass]=useState(0);const [error,setError]=useState("");
 const [recalling,setRecalling]=useState(false);
 const audio=useRef<HTMLAudioElement|null>(null);const run=useRef(createAudioRun());
 useEffect(()=>{try{setSaved(JSON.parse(localStorage.getItem(SLEEP_PREVIEW_KEY)||"null"));}catch{}setHydrated(true);return()=>{run.current.cancel();audio.current?.pause();};},[]);
 const tonight=sleepBoost(state,q,today).tonight;const target=mode==="preview"?tonight:saved?.forDate===today&&saved.previewedOn===addDays(today,-1)?saved:null;
 const page=useQuery({...recitePageOptions(target?.page??1),enabled:!!target});
 const words=useMemo(()=>page.data&&target?previewWords(page.data,target):[],[page.data,target]);const ranges=useMemo(()=>rangesForWords(words),[words]);
 async function listen(){if(playing){run.current.cancel();audio.current?.pause();setPlaying(false);return;}if(!target||!words.length)return;
  quranPlayer.pause();recitationPlayer.pause();setPlaying(true);setError("");const token=run.current.token();
  try{for(let n=1;n<=3&&run.current.current(token);n++){setPass(n);for(const range of ranges){const data=await getChapterAudio(7,range.sura);if(!run.current.current(token))return;const first=data.timings.find((t)=>t.key===`${range.sura}:${range.first}`);const last=data.timings.find((t)=>t.key===`${range.sura}:${range.last}`);if(!first||!last)throw new Error("Audio unavailable");const a=new Audio(data.url);audio.current=a;const startWord=words.find((w)=>w.verse===first.key);const endWord=words.filter((w)=>w.verse===last.key).at(-1);const from=first.segments.find((s)=>s[0]===startWord?.position)?.[1]??first.from;const to=last.segments.find((s)=>s[0]===endWord?.position)?.[2]??last.to;
   await run.current.wait(token,(finish)=>{a.currentTime=from/1000;a.ontimeupdate=()=>{if(a.currentTime*1000>=to){a.pause();finish();}};a.onended=finish;a.onerror=()=>{setError("Couldn’t play this passage. Try again.");run.current.cancel();finish();};void a.play().catch(()=>{setError("Couldn’t play this passage. Try again.");run.current.cancel();finish();});});}}
   if(run.current.current(token)){const preview={...target,previewedOn:today};localStorage.setItem(SLEEP_PREVIEW_KEY,JSON.stringify(preview));setSaved(preview);}
  }catch{setError("Couldn’t load the recitation. Check your connection and retry.");}finally{setPlaying(false);}
 }
 return <main className="hp-page"><header className="hz-home-header"><HeaderBackButton onBack={()=>void navigate({to:"/app/hifz"})}/></header><div className="hp-content"><div className="hp-heading"><MoonStar/><h1>{mode==="preview"?"Tonight’s preview":"Morning recall"}</h1><p>{mode==="preview"?"A little listening before sleep. No testing.":"Recall last night’s preview. No grading pressure."}</p></div>
 {!hydrated||page.isPending&&target?<p className="hp-empty">Loading your lines…</p>:!target?<p className="hp-empty">{mode==="recall"?"No preview saved from last night.":"No new lesson to preview."}</p>:page.error?<Button onClick={()=>void page.refetch()}>Retry loading</Button>:<section className="hp-practice-surface"><p className="hp-note">Page {target.page} · lines {target.fromLine+1}–{Math.min(15,target.fromLine+target.lines)}</p><p className={`hp-arabic ${recalling?"hp-recall-hidden":""}`} dir="rtl" aria-hidden={recalling}>{words.map((w)=>w.text).join(" ")}</p>
 {mode==="preview"?<><div className="hp-practice-actions"><Button onClick={()=>void listen()}>{playing?<Square size={18}/>:<Headphones size={18}/>} {playing?"Stop preview":"Listen 3 times"}</Button></div><p className="hp-status">{pass?`${pass} of 3 plays`:""}</p>{error&&<p role="alert" className="hp-note">{error}</p>}</>:<PracticeVoice ranges={ranges} wordKeys={words.map((w)=>w.key)} noPressure onListening={setRecalling}/>}</section>}
 </div></main>;
}