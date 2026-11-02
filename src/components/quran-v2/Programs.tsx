import {useEffect,useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {Link} from "@tanstack/react-router";
import {BookOpen,GraduationCap} from "lucide-react";
import {Button} from "@/components/ui/button";
import {buildSession,loadState,todayISO} from "@/lib/hifz";
import {quranIndexOptions} from "@/lib/hifz/program";
import "./reader.css";
export function Programs(){
  const [state,setState]=useState<ReturnType<typeof loadState>>(null);
  const index=useQuery(quranIndexOptions).data;
  useEffect(()=>{setState(loadState());},[]);
  const count=state&&index?buildSession(state,index,todayISO()).steps.length:0;
  return <section className="q2-programs"><h2>Programs</h2><div className="q2-program-card"><BookOpen size={27}/><div><strong>Hifz Companion</strong><small>{state?`${count} tasks today`:"Your Quran memorization journey"}</small></div><Button asChild size="sm"><Link to="/app/hifz">{state?"Start":"Start memorizing"}</Link></Button></div><div className="q2-program-card"><GraduationCap size={27}/><div><strong>Arabic Companion</strong><small>Read the Quran, then understand it</small></div><Button asChild size="sm" variant="outline"><Link to="/app/arabic">Open</Link></Button></div></section>;
}