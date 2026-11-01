import {useEffect,useState} from "react";
import {useSuspenseQuery} from "@tanstack/react-query";
import {useNavigate} from "@tanstack/react-router";
import {loadState,saveState,todayISO,type HifzState} from "@/lib/hifz";
import {quranIndexOptions} from "@/lib/hifz/program";
import {Button} from "@/components/ui/button";
import {HeaderBackButton} from "@/components/HeaderBackButton";
import {MyMushaf} from "./MyMushaf";
import {SleepPractice} from "./SleepPractice";
import {LineQuiz} from "./LineQuiz";
import {DrillSheet} from "./DrillSheet";
import "./practice.css";
export function PracticeEntry({mode}:{mode:"mushaf"|"preview"|"recall"|"lines"|"drills"}) {
 const [state,setState]=useState<HifzState|null|undefined>(undefined);const q=useSuspenseQuery(quranIndexOptions).data;const navigate=useNavigate();
 useEffect(()=>setState(loadState()),[]);
 if(state===undefined)return null;
 if(!state)return <main className="hp-page"><p>Set up your Hifz plan first.</p><Button onClick={()=>void navigate({to:"/app/hifz"})}>Your Hifz</Button></main>;
 if(mode==="mushaf")return <MyMushaf state={state}/>;
 if(mode==="preview"||mode==="recall")return <SleepPractice state={state} mode={mode}/>;
 if(mode==="lines")return <LineQuiz state={state} q={q}/>;
 return <main className="hp-page"><header className="hz-home-header"><HeaderBackButton onBack={()=>void navigate({to:"/app/hifz"})}/></header><div className="hp-content"><DrillSheet state={state} q={q} today={todayISO()} done={(passed,failed)=>{const next=structuredClone(state);for(const key of passed){const spot=next.weakSpots[key];if(spot)spot.passes++;}for(const key of failed){const spot=next.weakSpots[key];if(spot){spot.fails++;spot.lastFailed=todayISO();}}saveState(next);void navigate({to:"/app/hifz"});}}/></div></main>;
}