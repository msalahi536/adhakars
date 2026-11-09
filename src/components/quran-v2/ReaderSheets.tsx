import {useState} from "react";
import {Bookmark,Check,ChevronRight,Play,RotateCcw,Search,X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Switch} from "@/components/ui/switch";
import {Slider} from "@/components/ui/slider";
import {Dialog,DialogContent,DialogTitle} from "@/components/ui/dialog";
import {RECITERS,reciterName,type Chapter} from "@/lib/quran";
import {useQuery} from "@tanstack/react-query";
import {quranIndexOptions} from "@/lib/hifz/program";
import {juzPages} from "@/lib/hifz";
import type {CheckResult,TajweedHint} from "@/lib/hifz-ai";
import {ReaderPage} from "./ReaderPage";
import {LAYOUTS,matchesSurahSearch,type ReaderLayout,type ReaderPaging} from "./reader-rules";
import {SampleReport} from "@/components/hifz/SampleReport";
import {addedWordKeys} from "@/components/recite/ai-feedback";
import type {Passage} from "@/components/recite/ai-performance";

export type ReaderPreferences={layout:ReaderLayout;paging:ReaderPaging;size:number;tajweed:boolean;highlight:boolean;follow:boolean;arabic:boolean;translit:boolean;translation:boolean;translitSize:number;translationSize:number;translator:number;english:boolean;strictHarakat:boolean};
export type ReadingLocation={s:number;v:number;page:number;name:string};
export function ReaderSheet({title,close,children}:{title:string;close:()=>void;children:React.ReactNode}){
  return <Dialog open onOpenChange={v=>{if(!v)close();}}><DialogContent className="q2-sheet" aria-describedby={undefined}><DialogTitle>{title}</DialogTitle>{children}</DialogContent></Dialog>;
}
export function ReaderNavigation({chapters,recent,bookmarks,go,close}:{chapters:Chapter[];recent:ReadingLocation[];bookmarks:ReadingLocation[];go:(s:number,v?:number,page?:number)=>void;close:()=>void}){
  const [tab,setTab]=useState("Surahs"),[q,setQ]=useState("");
  const index=useQuery(quranIndexOptions).data;
  const start=(id:number)=>index?.surahPages[id]?.[0]??1;
  return <ReaderSheet title="Go to" close={close}>
    {!!recent.length&&<><h3>Recently read</h3><div className="q2-recent">{recent.slice(0,6).map(r=><Button variant="outline" key={`${r.s}:${r.v}`} onClick={()=>go(r.s,r.v,r.page)}>{r.name} · {r.v}<small>Page {r.page}</small></Button>)}</div></>}
    <div className="q2-segments">{["Surahs","Juz","Bookmarks"].map(t=><Button key={t} variant={tab===t?"default":"ghost"} onClick={()=>setTab(t)}>{t}</Button>)}</div>
    <label className="q2-search"><Search size={17}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search surahs…"/></label>
    <div className="q2-nav-list">
      {tab==="Bookmarks"?bookmarks.length?bookmarks.map(r=><Button variant="ghost" className="q2-nav-row" key={`${r.s}:${r.v}`} onClick={()=>go(r.s,r.v,r.page)}><Bookmark size={16}/>{r.name} · {r.v}<small>Page {r.page}</small></Button>):<p>No bookmarks yet.</p>:Array.from({length:30},(_,i)=>i+1).map(j=>{
        const [a,b]=juzPages(j);const list=chapters.filter(c=>start(c.id)>=a&&start(c.id)<=b&&matchesSurahSearch(c,q));
        if(tab==="Surahs"&&!list.length)return null;
        return <section key={j} id={`q2-juz-${j}`}><Button variant="ghost" className="q2-juz-heading" onClick={()=>go(0,1,a)}>Juz {j}<small>Page {a}</small><ChevronRight size={15}/></Button>{tab==="Surahs"&&list.map(c=><Button variant="ghost" className="q2-nav-row" key={c.id} onClick={()=>go(c.id)}><span className="q2-number">{c.id}</span><span>{c.name_simple}<small>{c.verses_count} ayat · Page {start(c.id)}</small></span><span className="q2-surah-name" aria-label={c.name_arabic}>{String(c.id).padStart(3,"0")}</span></Button>)}</section>;
      })}
    </div>
    {tab!=="Bookmarks"&&<aside className="q2-juz-scrubber" aria-label="Juz scrubber">{Array.from({length:30},(_,i)=><Button variant="ghost" key={i} aria-label={`Jump to Juz ${i+1}`} onClick={()=>document.getElementById(`q2-juz-${i+1}`)?.scrollIntoView({block:"start"})}>{i+1}</Button>)}</aside>}
  </ReaderSheet>;
}
export function ReaderSettings({prefs,change,page,chapters,close}:{prefs:ReaderPreferences;change:(p:Partial<ReaderPreferences>)=>void;page:number;chapters:Chapter[];close:()=>void}){
  const toggle=(key:"tajweed"|"highlight"|"follow"|"arabic"|"translit"|"translation"|"strictHarakat",label:string)=><label className="q2-setting-row">{label}<Switch aria-label={label} checked={prefs[key]} onCheckedChange={value=>change({[key]:value})}/></label>;
  const size=(key:"size"|"translitSize"|"translationSize",label:string,min:number,max:number)=><label className="q2-slider-label">{label}<span>{prefs[key]}</span><Slider aria-label={label} min={min} max={max} step={1} value={[prefs[key]]} onValueChange={([value])=>change({[key]:value})}/></label>;
  return <ReaderSheet title="Reading appearance" close={close}>
    <div role="radiogroup" aria-label="Reader layout" className="q2-layout-options">{LAYOUTS.map((l,i)=><Button role="radio" aria-checked={prefs.layout===l} variant="outline" key={l} className={prefs.layout===l?"is-selected":""} onClick={()=>change({layout:l})}><span className={`q2-layout-icon q2-layout-icon-${i}`}><i/><i/><i/></span><span>{l}</span>{prefs.layout===l&&<Check size={16}/>}</Button>)}</div>
    <fieldset><legend>Reading mode</legend><div role="radiogroup" aria-label="Reading mode" className="q2-segments">{([{value:"scroll",label:"Vertical scroll"},{value:"swipe",label:"Page by page (swipe)"}] as const).map(mode=><Button key={mode.value} role="radio" aria-checked={prefs.paging===mode.value} variant={prefs.paging===mode.value?"default":"outline"} onClick={()=>change({paging:mode.value})}>{mode.label}</Button>)}</div></fieldset>
    <div className="q2-live-preview"><ReaderPage number={page} chapters={chapters} {...prefs} marks={{}} hidden={false} revealed={new Set()} highlight={null} preview/></div>
    {prefs.layout==="Translation"&&<>{toggle("arabic","Arabic text")}{toggle("translit","Transliteration")}{size("translitSize","Transliteration size",12,28)}{toggle("translation","Translation")}<fieldset><legend>Translator</legend><div className="q2-segments">{[{id:20,name:"Sahih International"},{id:131,name:"Dr. Mustafa Khattab"}].map(t=><Button key={t.id} variant={prefs.translator===t.id?"default":"outline"} onClick={()=>change({translator:t.id})}>{t.name}</Button>)}</div></fieldset>{size("translationSize","Translation size",12,28)}</>}
    {size("size","Arabic text size",18,40)}{toggle("tajweed","Tajweed colors")}{toggle("highlight","Word-by-word highlight")}{toggle("follow","Follow recitation")}
    <label className="q2-setting-row"><span>Strict harakat (beta)<small className="q2-setting-hint">Also checks harakat, vowel length, heavy/light letters, imalah and tas-hil against Hafs 'an 'Asim. Beta: it can be wrong.</small></span><Switch aria-label="Strict harakat (beta)" checked={prefs.strictHarakat} onCheckedChange={value=>change({strictHarakat:value})}/></label>
   </ReaderSheet>;
}
export function ReaderReciters({selected,select,close}:{selected:number;select:(id:number)=>void;close:()=>void}){
  const [q,setQ]=useState("");return <ReaderSheet title="Choose a reciter" close={close}><label className="q2-search"><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search reciters…"/></label>{RECITERS.filter(r=>reciterName(r).toLowerCase().includes(q.toLowerCase())).map(r=><Button variant="ghost" className="q2-nav-row" key={r.id} onClick={()=>select(r.id)}><span>{reciterName(r)}</span>{selected===r.id&&<Check size={16}/>}</Button>)}</ReaderSheet>;
}
export function ReaderMistakes({result,recording,tips,chapters,correct,close,passages,updates,reset}:{result:CheckResult|null;recording:Blob|null;tips:TajweedHint[];chapters:Chapter[];correct:(key:string)=>void;highlight:(key:string|null)=>void;close:()=>void;passages:Passage[];updates:{elapsed:number;result:CheckResult}[];reset:()=>void;listening?:boolean;stopMic?:()=>void}){
  const words=result?.words.filter(w=>w.status==="wrong"||w.status==="skipped")??[];
  const added=addedWordKeys(result).map(key=>({key,text:result?.words.find(w=>w.key===key)?.text??key}));
  const name=(key:string)=>chapters.find(c=>c.id===Number(key.split(":")[0]))?.name_simple;
  return <ReaderSheet title="Session mistakes" close={close}>
    <Button variant="ghost" onClick={reset}><RotateCcw size={16}/>Reset mistakes</Button>
    {result&&<SampleReport result={result} recording={recording} passages={passages} updates={updates}/>}
    {!words.length&&!added.length&&<p>No mistakes recorded in this session.</p>}
    {words.map(w=><section key={w.key} className="q2-mistake-row"><div><strong dir="rtl">{w.text}</strong><small>{chapters.find(c=>c.id===Number(w.key.split(":")[0]))?.name_simple} · ayah {w.key.split(":")[1]} · {w.issue==="harakah"?"Harakah different from Hafs":w.issue==="length"?"Vowel length different from Hafs":w.issue==="letter"?"Letter made heavy/light (not Hafs)":w.issue==="imalah"?"Imalah (not in Hafs)":w.issue==="tashil"?"Tas-hil (not in Hafs)":w.status}</small></div><div className="q2-segments"><Button variant="outline" onClick={()=>correct(w.key)}>Correct <Play size={14}/></Button></div></section>)}
    {added.map(a=><section key={`added-${a.key}`} className="q2-mistake-row q2-added-row"><div><strong>You added words before <span dir="rtl">{a.text}</span></strong><small>{name(a.key)} · ayah {a.key.split(":")[1]} · added words</small></div></section>)}
    {!!tips.length&&<><h3>Tajweed tips</h3>{tips.map(t=><section key={t.key} className="q2-mistake-row"><strong dir="rtl">{t.text}</strong><small>{t.kind}</small><p>{t.tip}</p><Button variant="ghost" onClick={()=>correct(t.key)}><Play size={15}/>Listen</Button></section>)}<small>Experimental tips, not a tajweed grade. Check with a qualified teacher.</small></>}
  </ReaderSheet>;
}