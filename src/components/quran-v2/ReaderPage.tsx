import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { loadPageFont, recitePageOptions } from "@/lib/recite/data";
import { useEffect } from "react";
import { AyahMarker, MushafFrame, SurahCartouche } from "@/components/mushaf/MushafPage";
import { Button } from "@/components/ui/button";
import { TajweedText, parseTajweed } from "@/lib/tajweed";
import type { Chapter } from "@/lib/quran";
import type { Marks, RecitePage, ReciteWord } from "@/lib/recite/model";
import type { ReaderLayout } from "./reader-rules";

export function ReaderPage({number,chapters,layout,marks,hidden,revealed,highlight,size,tajweed,arabic,translit,translation,translitSize,translationSize,onVisible,onWord,preview=false,translations,peek=false,lessonKeys}: {
  number:number;chapters:Chapter[];layout:ReaderLayout;marks:Marks;hidden:boolean;revealed:Set<string>;highlight:string|null;size:number;tajweed:boolean;arabic:boolean;translit:boolean;translation:boolean;translitSize:number;translationSize:number;
  onVisible?:(page:RecitePage)=>void;onWord?:(word:ReciteWord)=>void;preview?:boolean;translations?:Record<string,string>;peek?:boolean;lessonKeys?:Set<string>;
}) {
  const query=useQuery(recitePageOptions(number));
  const [font,setFont]=useState<string|null>(null);
  const [failed,setFailed]=useState(false);
  const [retry,setRetry]=useState(0);
  const [meaningFor,setMeaningFor]=useState<((text:string)=>string|undefined)|null>(null);
  useEffect(()=>{if(layout!=="Translation"){setMeaningFor(null);return;}let live=true;void import("@/components/arabic/reader-meanings").then(m=>{const r=m.knownWordMeanings();if(live)setMeaningFor(()=>r?.meaningFor??null);});return()=>{live=false;};},[layout]);
  const root=useRef<HTMLElement|null>(null);
  const body=useRef<HTMLDivElement|null>(null);
  useEffect(()=>{let alive=true;setFont(null);setFailed(false);void loadPageFont(number).then(f=>{if(alive){setFont(f);setFailed(!f);}});return()=>{alive=false;};},[number,retry]);
  useEffect(()=>{
    const node=root.current;if(!node||!query.data||!onVisible||preview)return;
    const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))onVisible(query.data);},{threshold:.45});observer.observe(node);return()=>observer.disconnect();
  },[query.data,onVisible,preview]);
  useLayoutEffect(()=>{
    const el=body.current;if(!el||!font||layout==="Translation")return;
    const fit=()=>{
      const lines=[...el.querySelectorAll<HTMLElement>(".q2-line")];let lo=1,hi=38*(size/26);
      const apply=(n:number)=>el.style.setProperty("--q2-glyph-size",`${n}px`);
      for(let i=0;i<15;i++){const mid=(lo+hi)/2;apply(mid);if(lines.every(l=>l.scrollWidth<=l.clientWidth+1))lo=mid;else hi=mid;}apply(lo);
    };
    fit();const observer=new ResizeObserver(fit);observer.observe(el);return()=>observer.disconnect();
  },[font,query.data,layout,size]);
  const page=query.data;
  const word=(w:ReciteWord):ReactNode=>{
    if(w.end)return <span key={w.key} className="q2-marker"><AyahMarker number={Number(w.verse.split(":")[1])} size={19}/></span>;
    const state=marks[w.key];const shown=peek||!hidden||(lessonKeys&&!lessonKeys.has(w.key))||revealed.has(w.key)||state==="correct"||state==="wrong"||state==="skipped";
    const group=tajweed&&w.tajweed?parseTajweed(w.tajweed).find(s=>s.group)?.group:undefined;
    return <Button variant="ghost" key={w.key} className={`q2-word ${shown?"":"q2-concealed"} ${lessonKeys?.has(w.key)?"q2-lesson-word":""} ${state==="wrong"?"q2-wrong":state==="skipped"?"q2-skipped":""} ${highlight===w.key?"q2-highlight":""} ${group?`rc-qcf-tj-${group}`:""}`} data-q2-word={w.key} aria-label={`Word ${w.key}`} onPointerDown={e=>{if(hidden){const el=e.currentTarget;el.setAttribute("data-peek","pending");window.setTimeout(()=>{if(el.getAttribute("data-peek")==="pending")el.setAttribute("data-peek","on");},400);}}} onPointerUp={e=>{e.stopPropagation();e.currentTarget.removeAttribute("data-peek");}} onPointerCancel={e=>e.currentTarget.removeAttribute("data-peek")} onClick={e=>{e.stopPropagation();onWord?.(w);}}>
      <span>{layout==="Translation"?tajweed&&w.tajweed?<TajweedText markup={w.tajweed}/>:w.text:w.glyph}</span>
    </Button>;
  };
  const content=page&&<div ref={body} className={`q2-page-body ${layout==="Translation"?"q2-translation-page":""}`} style={{fontFamily:layout!=="Translation"?font??undefined:undefined}}>
    {layout==="Translation"?page.verses.map(v=><section key={v.key} className="q2-verse" data-q2-verse={v.key}>
      <small>{chapters.find(c=>c.id===v.chapter)?.name_simple} · ayah {v.number}</small>
      {arabic&&<div dir="rtl" className="q2-arabic-row">{v.words.filter(w => !w.end).map(word)}</div>}
      {translit&&<p className="q2-translit" style={{fontSize:translitSize}}>{v.words.filter(w=>!w.end).map(w=>w.transliteration).join(" ")}</p>}
      {translation&&<p style={{fontSize:translationSize}}>{translations?.[v.key]??v.translation}</p>}
    </section>):Array.from({length:15},(_,i)=>{
      const line=i+1;const start=page.verses.find(v=>v.number===1&&v.words[0]?.line===line+2);
      if(start)return <div key={line} className="q2-cartouche"><SurahCartouche name={`سُورَةُ ${chapters.find(c=>c.id===start.chapter)?.name_arabic??""}`} height={40}/></div>;
      const basmala=page.verses.some(v=>v.number===1&&v.chapter!==1&&v.chapter!==9&&v.words[0]?.line===line+1);
      if(basmala)return <div key={line} className="q2-basmala" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>;
      return <div className={`q2-line ${number<=2?"q2-short-line":""}`} key={line} dir="rtl">{page.verses.flatMap(v=>v.words).filter(w=>w.line===line).map(word)}</div>;
    })}
  </div>;
  return <article ref={root} className={`q2-page ${layout==="Framed mushaf"?"q2-framed":""} ${preview?"q2-preview":""}`} data-q2-page={number}>
    {query.isError?<div className="q2-loading"><p>Couldn’t load this page.</p><Button variant="outline" onClick={()=>void query.refetch()}>Retry page</Button></div>:!page||(!font&&layout!=="Translation")?<div className="q2-loading" role="status">{failed?<>The page font couldn’t load.<Button variant="outline" onClick={()=>setRetry(n=>n+1)}>Retry font</Button></>:"Loading mushaf…"}</div>:layout==="Framed mushaf"?<MushafFrame scale={.5} className="q2-frame">{content}</MushafFrame>:content}
    <footer className="q2-page-divider">{number}</footer>
  </article>;
}