import {useMemo,useState} from "react";
import {useSuspenseQuery} from "@tanstack/react-query";
import {useNavigate} from "@tanstack/react-router";
import {BookOpen} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Dialog,DialogContent,DialogTitle} from "@/components/ui/dialog";
import {HeaderBackButton} from "@/components/HeaderBackButton";
import {memoryMap,memorySummary,todayISO,type HifzState,type MemoryLevel} from "@/lib/hifz";
import {quranIndexOptions,saveActiveSession} from "@/lib/hifz/program";
import {reviewItems} from "./practice-rules";
import {PopupHandle} from "./PopupHandle";
import "./practice.css";
const levels:MemoryLevel[]=["strong","good","due","slipping","weak","learning","new"];
export function MyMushaf({state}:{state:HifzState}) {
 const today=todayISO(); const q=useSuspenseQuery(quranIndexOptions).data;
 const map=useMemo(()=>memoryMap(state,today),[state,today]);const summary=memorySummary(state,today);
 const [page,setPage]=useState<number|null>(null);const navigate=useNavigate();const selected=map.find((p)=>p.page===page);
 const review=()=>{if(!page)return;const items=reviewItems(state,[page]);if(!items.length)return;saveActiveSession({date:today,items,done:0,seconds:0});void navigate({to:"/app/hifz/recite",search:{session:today,item:0}});};
 return <main className="hp-page"><header className="hz-home-header"><HeaderBackButton onBack={()=>void navigate({to:"/app/hifz"})}/></header><div className="hp-content"><div className="hp-heading"><BookOpen/><h1>My Mushaf</h1><p>{summary.pages} pages · {summary.averageStrength}% average strength</p></div>
 <div className="hp-memory-legend">{levels.map((l)=><span key={l}><i className={`hp-memory-${l}`}/>{l[0].toUpperCase()+l.slice(1)}</span>)}</div>
 {Array.from({length:30},(_,i)=><section className="hp-juz-row" key={i}><h2>Juz {i+1}</h2><div className="hp-page-grid">{q.pages.filter((p)=>p.juz===i+1).map((p)=>{const memory=map[p.page-1];return <Button key={p.page} variant="ghost" className={`hp-memory-${memory.level}`} aria-label={`Page ${p.page}: ${memory.level}`} onClick={()=>setPage(p.page)}>{p.page}</Button>;})}</div></section>)}
 </div><Dialog open={page!==null} onOpenChange={(open)=>{if(!open)setPage(null);}}><DialogContent className="hz-home-popup hp-detail" aria-describedby={undefined}><PopupHandle dismiss={()=>setPage(null)}/><DialogTitle>Page {page}</DialogTitle><dl><div><dt>Strength</dt><dd>{Math.round((selected?.strength??0)*100)}%</dd></div><div><dt>Last review</dt><dd>{page?state.pages[page]?.memory?.lastReview??"Not reviewed":""}</dd></div></dl><p className="hp-note">{selected?.slipsOn?`Slips on ${selected.slipsOn}`:selected?.level==="learning"?"Still learning this page.":"Not memorized yet."}</p><Button className="hz-primary" disabled={!page||!reviewItems(state,[page]).length} onClick={review}>Review now</Button></DialogContent></Dialog></main>;
}