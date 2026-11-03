import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { loadPageFont, recitePageOptions } from "@/lib/recite/data";
import { useEffect } from "react";
import { AyahMarker, MushafFrame, toArabicDigits } from "@/components/mushaf/MushafPage";
import { Button } from "@/components/ui/button";
import { TajweedText, parseTajweed } from "@/lib/tajweed";
import type { Chapter } from "@/lib/quran";
import type { Marks, RecitePage, ReciteWord } from "@/lib/recite/model";
import { currentRecitationWord, hiddenWordVisible, mushafRows, recitedWord, type ReaderLayout } from "./reader-rules";

export function ReaderPage({number,chapters,layout,marks,hidden,revealed,highlight,size,tajweed,arabic,translit,translation,translitSize,translationSize,onVisible,onWord,preview=false,translations,peek=false,lessonKeys,reciting=false}: {
  number:number;chapters:Chapter[];layout:ReaderLayout;marks:Marks;hidden:boolean;revealed:Set<string>;highlight:string|null;size:number;tajweed:boolean;arabic:boolean;translit:boolean;translation:boolean;translitSize:number;translationSize:number;
  onVisible?:(page:RecitePage,ratio:number)=>void;onWord?:(word:ReciteWord)=>void;preview?:boolean;translations?:Record<string,string>;peek?:boolean;lessonKeys?:Set<string>;reciting?:boolean;
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
    const data=query.data;
    const observer=new IntersectionObserver(entries=>{for(const entry of entries)onVisible(data,entry.intersectionRatio);},{root:node.closest(".q2-scroll"),threshold:Array.from({length:101},(_,i)=>i/100)});observer.observe(node);return()=>observer.disconnect();
  },[query.data,onVisible,preview]);
  useLayoutEffect(()=>{
    const el=body.current;if(!el||!font||layout==="Translation")return;
    const fit=()=>{
      const lines=[...el.querySelectorAll<HTMLElement>(".q2-line")];let lo=1,hi=(number<=2?56:38)*(size/26);
      const apply=(n:number)=>el.style.setProperty("--q2-glyph-size",`${n}px`);
      for(let i=0;i<15;i++){const mid=(lo+hi)/2;apply(mid);if(lines.every(l=>l.scrollWidth<=l.clientWidth+1))lo=mid;else hi=mid;}apply(lo);
    };
    fit();const observer=new ResizeObserver(fit);observer.observe(el);return()=>observer.disconnect();
  },[font,query.data,layout,size]);
  const page=query.data;
  const currentWord=currentRecitationWord(page?.verses.flatMap(v=>v.words)??[],marks,reciting);
  const surahStrip=(chapter:number)=><div className="q2-opening-cartouche" dir="rtl"><svg viewBox="0 0 360 46" preserveAspectRatio="none" aria-hidden="true"><path d="M2 23C18 18 17 2 39 2H321C343 2 342 18 358 23 342 28 343 44 321 44H39C17 44 18 28 2 23Z"/><path className="q2-cartouche-inner" d="M52 23C68 23 64 4 86 4H274C296 4 292 23 308 23 292 23 296 42 274 42H86C64 42 68 23 52 23Z"/>{[39,321].map(x=><g key={x} transform={`translate(${x} 23)`}><path d="M0-14C-9-14-9-5 0 0 9-5 9-14 0-14ZM0 14C9 14 9 5 0 0-9 5-9 14 0 14ZM-14 0C-14 9-5 9 0 0-5-9-14-9-14 0ZM14 0C14-9 5-9 0 0 5 9 14 9 14 0M-12-12 12 12M12-12-12 12"/><circle r="2.5"/></g>)}</svg><span>سُورَةُ {chapters.find(c=>c.id===chapter)?.name_arabic??""}</span></div>;
  const word=(w:ReciteWord):ReactNode=>{
    if(w.end)return <span key={w.key} className="q2-marker">{number<=2&&layout!=="Translation"?<span className="q2-opening-marker"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 2 26 6 33 7 34 14 38 20 34 26 33 33 26 34 20 38 14 34 7 33 6 26 2 20 6 14 7 7 14 6Z"/><circle cx="20" cy="20" r="14"/></svg><span>{toArabicDigits(w.verse.split(":")[1])}</span></span>:<AyahMarker number={Number(w.verse.split(":")[1])} size={19}/>}</span>;
    const state=marks[w.key];const shown=peek||!hidden||(lessonKeys&&!lessonKeys.has(w.key))||hiddenWordVisible(state,revealed.has(w.key));
    const group=tajweed&&w.tajweed?parseTajweed(w.tajweed).find(s=>s.group)?.group:undefined;
    return <Button variant="ghost" key={w.key} className={`q2-word ${shown?"":"q2-concealed"} ${lessonKeys?.has(w.key)?"q2-lesson-word":""} ${state==="wrong"?"q2-wrong":state==="skipped"?"q2-skipped":""} ${recitedWord(state)?"q2-recited":""} ${currentWord===w.key?"q2-current":""} ${highlight===w.key?"q2-highlight":""} ${group?`rc-qcf-tj-${group}`:""}`} data-q2-word={w.key} aria-label={`Word ${w.key}`} onPointerDown={e=>{if(hidden){const el=e.currentTarget;el.setAttribute("data-peek","pending");window.setTimeout(()=>{if(el.getAttribute("data-peek")==="pending")el.setAttribute("data-peek","on");},400);}}} onPointerUp={e=>{e.stopPropagation();e.currentTarget.removeAttribute("data-peek");}} onPointerCancel={e=>e.currentTarget.removeAttribute("data-peek")} onClick={e=>{e.stopPropagation();onWord?.(w);}}>
      <span>{layout==="Translation"?tajweed&&w.tajweed?<TajweedText markup={w.tajweed}/>:w.text:w.glyph}</span>
      {layout==="Translation"&&meaningFor&&<span className="q2-word-meaning">{meaningFor(w.text)??""}</span>}
    </Button>;
  };
  const content=page&&<div ref={body} className={`q2-page-body ${layout==="Translation"?"q2-translation-page":""}`} style={{fontFamily:layout!=="Translation"?font??undefined:undefined}}>
    {layout==="Translation"?page.verses.map(v=><section key={v.key} className="q2-verse" data-q2-verse={v.key}>
      {v.number===1&&<>{surahStrip(v.chapter)}{v.chapter!==1&&v.chapter!==9&&<div className="q2-basmala" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>}</>}
      <small>{chapters.find(c=>c.id===v.chapter)?.name_simple} · ayah {v.number}</small>
      {arabic&&<div dir="rtl" className="q2-arabic-row">{v.words.filter(w => !w.end).map(word)}</div>}
      {translit&&<p className="q2-translit" style={{fontSize:translitSize}}>{v.words.filter(w=>!w.end).map(w=>w.transliteration).join(" ")}</p>}
      {translation&&<p style={{fontSize:translationSize}}>{translations?.[v.key]??v.translation}</p>}
    </section>):number<=2?<>
      {surahStrip(page.verses[0]?.chapter??1)}
      {number===2&&<div className="q2-basmala" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>}
      {[...new Set(page.verses.flatMap(v=>v.words).map(w=>w.line))].sort((a,b)=>a-b).map(line=><div className={`q2-line q2-short-line ${number===1&&line===2?"q2-opening-basmala":""}`} key={line} dir="rtl">{page.verses.flatMap(v=>v.words).filter(w=>w.line===line).map(word)}</div>)}
    </>:mushafRows(page).map(({line,words,title,basmala})=>{
      if(title)return <div key={line} className="q2-cartouche">{surahStrip(title)}</div>;
      if(basmala)return <div key={line} className="q2-basmala" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>;
      return <div className="q2-line" key={line} dir="rtl">{words.map(word)}</div>;
    })}
  </div>;
  return <article ref={root} className={`q2-page ${number<=2&&layout!=="Translation"?"q2-opening":""} ${layout==="Framed mushaf"?"q2-framed":""} ${preview?"q2-preview":""}`} data-q2-page={number}>
    {query.isError?<div className="q2-loading"><p>Couldn’t load this page.</p><Button variant="outline" onClick={()=>void query.refetch()}>Retry page</Button></div>:!page||(!font&&layout!=="Translation")?<div className="q2-loading" role="status">{failed?<>The page font couldn’t load.<Button variant="outline" onClick={()=>setRetry(n=>n+1)}>Retry font</Button></>:"Loading mushaf…"}</div>:layout==="Framed mushaf"?<MushafFrame scale={.5} className="q2-frame">{content}</MushafFrame>:content}
    <footer className="q2-page-divider">{number}</footer>
  </article>;
}