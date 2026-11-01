import {useEffect,useMemo,useState} from "react";
import {useQueries} from "@tanstack/react-query";
import {useNavigate} from "@tanstack/react-router";
import {MoonStar,BookOpen,Sunrise} from "lucide-react";
import {Button} from "@/components/ui/button";
import {slippingSoon,salahPlan,sleepBoost,recordSalah,saveState,addDays,type HifzState,type QuranIndex} from "@/lib/hifz";
import {saveActiveSession} from "@/lib/hifz/program";
import {recitePageOptions} from "@/lib/recite/data";
import {fetchDay,getPrayerSettings,type DayTimes} from "@/lib/prayer-times";
import {reviewItems,sleepWindow,SLEEP_PREVIEW_KEY,type SleepPreview} from "./practice-rules";
import "./practice.css";
export function PracticeCards({state,q,today,names,update}:{state:HifzState;q:QuranIndex;today:string;names:Record<number,string>;update:(s:HifzState)=>void}) {
 const navigate=useNavigate(); const slipping=useMemo(()=>slippingSoon(state,today),[state,today]);
 const candidateKeys=Object.fromEntries(Object.values(state.pages).filter((p)=>p.memory).map((p)=>[p.page,["candidate"]]));
 const candidates=salahPlan(state,today,candidateKeys).map((p)=>p.page);
 // Engine ranking selects from source-backed candidates, not fabricated page/ayah ranges.
 const queries=useQueries({queries:candidates.map(recitePageOptions)});
 const pageVerses=Object.fromEntries(queries.flatMap((r)=>r.data?[[r.data.page,r.data.verses.map((v)=>v.key)]]:[]));
 const portions=salahPlan(state,today,pageVerses);
 const [logged,setLogged]=useState<string[]>([]);
 const [times,setTimes]=useState<{today:DayTimes|null;yesterday:DayTimes|null}>({today:null,yesterday:null});
 const [now,setNow]=useState(()=>new Date()); const [preview,setPreview]=useState<SleepPreview|null>(null);
 useEffect(()=>{let active=true;const settings=getPrayerSettings();const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);void Promise.all([fetchDay(new Date(),settings),fetchDay(yesterday,settings)]).then(([a,b])=>{if(active)setTimes({today:a,yesterday:b});});try{setPreview(JSON.parse(localStorage.getItem(SLEEP_PREVIEW_KEY)||"null"));}catch{ /* no saved preview */ }const t=setInterval(()=>setNow(new Date()),30000);return()=>{active=false;clearInterval(t);};},[today]);
 const window=sleepWindow(now,times.today,times.yesterday);const boost=sleepBoost(state,q,today);
 function review(pages:number[]){const items=reviewItems(state,pages);if(!items.length)return;saveActiveSession({date:today,items,done:0,seconds:0});void navigate({to:"/app/hifz/recite",search:{session:today,item:0}});}
 function portionLabel(keys:string[]){const grouped=new Map<number,number[]>();for(const key of keys){const [s,a]=key.split(":").map(Number);grouped.set(s,[...(grouped.get(s)??[]),a]);}return [...grouped].map(([s,ayat])=>`${names[s]??`Surah ${s}`} ${ayat[0]}${ayat.length>1?`–${ayat[ayat.length-1]}`:""}`).join(" · ");}
 function log(page:number,prayer:string){const next=structuredClone(state);recordSalah(next,[page],today);saveState(next);update(next);setLogged((l)=>[...l,prayer]);}
 const first=slipping[0];
 return <>
 {first&&<div className="hp-home-nudge"><BookOpen/><p>{(first.daysLeft??0)>0?`Page ${first.page} will start slipping in ${first.daysLeft} day${first.daysLeft===1?"":"s"}. Review it today`:`Page ${first.page} is ready for a gentle review.`}</p><Button variant="outline" onClick={()=>review(slipping.map((p)=>p.page))}>Review</Button></div>}
 <section className="hp-salah"><h2><MoonStar size={20}/>Revise in Salah</h2><p className="hp-note">Optional: let your hifz live in your prayers.</p><div className="hp-salah-portions">{portions.map((portion)=><div className="hp-salah-portion" key={portion.prayer}><div><strong>{portion.prayer}</strong><span>{portionLabel(portion.verses)}</span></div><Button variant="outline" disabled={logged.includes(portion.prayer)} onClick={()=>log(portion.page,portion.prayer)}>{logged.includes(portion.prayer)?"Recited":"I recited these"}</Button></div>)}{!portions.length&&<p className="hp-note">{queries.some((r)=>r.isPending)?"Finding today's portions…":"Your memorized portions will appear here."}</p>}</div></section>
 {window==="night"&&boost.tonight&&<div className="hp-sleep-card"><MoonStar/><Button variant="ghost" onClick={()=>void navigate({to:"/app/hifz/sleep",search:{mode:"preview"}})}>Preview tomorrow’s lesson (2 min)</Button></div>}
 {window==="morning"&&preview?.forDate===today&&preview.previewedOn===addDays(today,-1)&&<div className="hp-sleep-card"><Sunrise/><Button variant="ghost" onClick={()=>void navigate({to:"/app/hifz/sleep",search:{mode:"recall"}})}>Recall last night’s preview</Button></div>}
 </>;
}