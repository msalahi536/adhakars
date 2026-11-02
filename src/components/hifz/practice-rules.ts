import { slotsForDay, type DayTimes } from "@/lib/prayer-times";
import type { HifzState } from "@/lib/hifz";
import type { SessionItem } from "@/lib/hifz/program";
import type { RecitePage, ReciteWord } from "@/lib/recite/model";
export type SleepPreview = {page:number;fromLine:number;lines:number;forDate:string;previewedOn:string};
export const SLEEP_PREVIEW_KEY="hifzSleepPreview:v1";
export function sleepWindow(now:Date,today:DayTimes|null,yesterday:DayTimes|null):"night"|"morning"|null {
  const slots=today?slotsForDay(today):[];
  const fajr=slots.find((s)=>s.id==="fajr")?.at;
  const isha=slots.find((s)=>s.id==="isha")?.at;
  const previousIsha=yesterday?slotsForDay(yesterday).find((s)=>s.id==="isha")?.at:undefined;
  if(isha && now>=isha) return "night";
  if(fajr && now<fajr && previousIsha && now>=previousIsha) return "night";
  if(fajr && now>=fajr && (!isha || now<isha)) return "morning";
  return null;
}
export function reviewItems(state:HifzState,pages:number[]):SessionItem[] {
  return [...new Set(pages)].flatMap((page)=>{
    const stage=state.pages[page]?.stage;
    return stage==="sabqi"||stage==="manzil"?[{kind:"review" as const,page,stage}]:[];
  });
}
export function previewWords(page:RecitePage,preview:Pick<SleepPreview,"fromLine"|"lines">):ReciteWord[] {
  return page.verses.flatMap((v)=>v.words).filter((w)=>!w.end && w.line>preview.fromLine && w.line<=Math.min(15,preview.fromLine+preview.lines));
}
export function rangesForWords(words:ReciteWord[]) {
  const ranges:{sura:number;first:number;last:number}[]=[];
  for(const w of words){const [sura,aya]=w.verse.split(":").map(Number); const prev=ranges[ranges.length-1];
    if(prev?.sura===sura)prev.last=Math.max(prev.last,aya);else ranges.push({sura,first:aya,last:aya});}
  return ranges;
}
export function positionPages(pages:RecitePage[]) {
  return pages.map((page)=>({page:page.page,verses:page.verses.map((v)=>({key:v.key,words:v.words.filter((w)=>!w.end).map((w)=>w.text)})),
    startLines:Object.fromEntries(page.verses.flatMap((v)=>{
      const word=v.words.find((w)=>!w.end && w.position===1);
      return word?[[v.key,word.line]]:[];
    }))}));
}
export function completedStudyDates(state: Pick<HifzState, "dayLog">) {
  return Object.entries(state.dayLog).filter(([, log]) => log.newLines > 0 || log.reviews > 0).map(([date]) => date).sort();
}
