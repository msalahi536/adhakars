import {useMemo,useState} from "react";
import {useQueries} from "@tanstack/react-query";
import {useNavigate} from "@tanstack/react-router";
import {MapPin} from "lucide-react";
import {Button} from "@/components/ui/button";
import {HeaderBackButton} from "@/components/HeaderBackButton";
import {positionQuiz,todayISO,type HifzState,type QuranIndex} from "@/lib/hifz";
import {drillPages} from "@/lib/hifz/program";
import {recitePageOptions} from "@/lib/recite/data";
import {positionPages} from "./practice-rules";
export function LineQuiz({state,q}:{state:HifzState;q:QuranIndex}) {
 const today=todayISO();const navigate=useNavigate();const pages=drillPages(state,q,today,5);
 const queries=useQueries({queries:pages.map(recitePageOptions)});
 const ready=queries.every((r)=>r.isSuccess);
 const loaded=queries.flatMap((r)=>r.data?[r.data]:[]);
 const quizzes=useMemo(()=>ready?positionQuiz(positionPages(loaded),today,5):[],[today,ready]);
 const [index,setIndex]=useState(0);const [picked,setPicked]=useState<number|null>(null);const quiz=quizzes[index];
 const verse=loaded.find((p)=>p.page===quiz?.page)?.verses.find((v)=>v.key===quiz?.verse);
 return <main className="hp-page"><header className="hz-home-header"><HeaderBackButton onBack={()=>void navigate({to:"/app/hifz"})}/></header><div className="hp-content"><div className="hp-heading"><MapPin/><h1>Where is it on the page?</h1><p>{quiz?`Page ${quiz.page} · ${index+1} of ${quizzes.length}`:"A little spatial recall"}</p></div>
 {queries.some((r)=>r.isPending)?<p className="hp-empty">Loading your pages…</p>:!quiz?<p className="hp-empty">{pages.length?"Practice complete.":"Memorize a page to begin."}</p>:<><p className="hp-arabic" dir="rtl">{verse?.words.filter((w)=>!w.end).slice(0,3).map((w)=>w.text).join(" ")}</p><div className="hp-line-board" role="group" aria-label="Fifteen mushaf lines">{Array.from({length:15},(_,i)=><Button key={i} variant="ghost" aria-label={`Line ${i+1}`} disabled={picked!==null} className={picked!==null&&i+1===quiz.answerLine?"is-right":picked===i+1?"is-wrong":""} onClick={()=>setPicked(i+1)}><span>{i+1}</span><i/></Button>)}</div><p className="hp-status">{picked===null?"Tap the line where this ayah begins.":picked===quiz.answerLine?`Yes — line ${quiz.answerLine}.`:`It starts on line ${quiz.answerLine}.`}</p>{picked!==null&&<div className="hp-practice-actions"><Button onClick={()=>{setIndex((i)=>i+1);setPicked(null);}}>Next</Button></div>}</>}
 </div></main>;
}