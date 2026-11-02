import {useCallback,useEffect,useRef,useState,type ReactNode} from "react";
import {useQuery,useQueryClient} from "@tanstack/react-query";
import {Bookmark,ChevronLeft,Eye,EyeOff,Flag,LayoutList,Mic,MoreHorizontal,Pause,Play,Repeat,Search,Square,X} from "lucide-react";
import {toast} from "sonner";
import {Portal} from "@/components/Portal";
import {BottomNav} from "@/components/BottomNav";
import {Button} from "@/components/ui/button";
import {MushafThemeProvider} from "@/components/mushaf/MushafPage";
import {mushafThemeId} from "@/components/recite/mushaf-theme";
import {getPresetId,resolveVisualPhase} from "@/lib/theme-store";
import {findReciter,reciterName,type Chapter} from "@/lib/quran";
import {quranPlayer,useQuranPlayer} from "@/lib/quran-player";
import {reciteChaptersOptions,reciteDestinationPage,recitePageOptions} from "@/lib/recite/data";
import {pageWords,type Marks,type RecitePage,type ReciteWord} from "@/lib/recite/model";
import type {CheckResult,Elsewhere,FollowPosition,TajweedHint} from "@/lib/hifz-ai";
import {AI_DISCLAIMER} from "@/lib/hifz-ai/notices";
import {play as feedback,cancelHifzFeedback} from "@/lib/hifzHaptics";
import {VoiceBars} from "@/components/quran-voice/VoiceBars";
import {VoiceConsent} from "@/components/quran-voice/VoiceConsent";
import {EchoMode} from "@/components/hifz/EchoMode";
import {ReaderPage} from "./ReaderPage";
import {ReaderMistakes,ReaderNavigation,ReaderReciters,ReaderSettings,ReaderSheet,type ReaderPreferences,type ReadingLocation} from "./ReaderSheets";
import {adjacentPage,ELSEWHERE_DELAY,nextLayout,pageRanges} from "./reader-rules";
import {useReaderVoice} from "./use-reader-voice";
import {SilenceMonitor} from "./SilenceMonitor";
import "./reader.css";
async function verseLocation(key:string):Promise<{page:number;hizb:number}>{
 const response=await fetch(`https://api.quran.com/api/v4/verses/by_key/${key}?fields=page_number,hizb_number`);
 if(!response.ok)throw new Error("Ayah unavailable");const data=await response.json() as {verse:{page_number:number;hizb_number:number}};return {page:data.verse.page_number,hizb:data.verse.hizb_number};
}

const wordPages=new Map<string,Promise<number>>();
function followLocation(sura:number,aya:number,word:number){const key=`${sura}:${aya}`;const cached=wordPages.get(`${key}:${word}`);if(cached)return cached;const load=fetch(`https://api.quran.com/api/v4/verses/by_key/${key}?words=true&word_fields=page_number&fields=page_number`).then(r=>r.json()).then((d:{verse:{page_number:number;words:{position:number;page_number:number}[]}})=>d.verse.words.find(w=>w.position===word)?.page_number??d.verse.page_number);wordPages.set(`${key}:${word}`,load);return load;}
const DEFAULTS:ReaderPreferences={layout:"Mushaf text",size:26,tajweed:false,highlight:true,follow:true,arabic:true,translit:true,translation:true,translitSize:15,translationSize:16,translator:20,english:true};
export type ReaderLesson={pill:ReactNode;marks:Marks;hidden:boolean;stream:MediaStream|null;busy:boolean;mic:()=>void;listen:()=>void;peek:()=>void;onWord:(w:ReciteWord)=>void;overlays:ReactNode;highlight?:string|null;peeked?:boolean;keys?:Set<string>;onSilence?:(last:number)=>void;onPage?:(page:number)=>void;tools?:ReactNode};
export function UnifiedReader({chapterId=1,verse=1,initialPage,initialMode,back,lesson}:{chapterId?:number;verse?:number;initialPage?:number;initialMode?:"follow"|"search"|"smart";back:()=>void;lesson?:ReaderLesson}){
  const client=useQueryClient();const chapters=useQuery(reciteChaptersOptions).data??[];
  const [page,setPage]=useState(initialPage??1),[loaded,setLoaded]=useState(!!initialPage);
  const [anchor,setAnchor]=useState(initialPage??1);
  const [prefs,setPrefs]=useState<ReaderPreferences>({...DEFAULTS,layout:lesson?"Framed mushaf":"Mushaf text"});
  const [theme,setTheme]=useState("original"),[phase,setPhase]=useState<"morning"|"evening">("morning");
  const [chrome,setChrome]=useState(true),[tabbar,setTabbar]=useState(false),[hidden,setHidden]=useState(false),[revealed,setRevealed]=useState<Set<string>>(new Set());
  const [sheet,setSheet]=useState<"navigation"|"settings"|"mistakes"|"more"|"reciter"|"echo"|"search"|null>(null);
  const [result,setResult]=useState<CheckResult|null>(null),[marks,setMarks]=useState<Marks>({}),[tips,setTips]=useState<TajweedHint[]>([]),[highlight,setHighlight]=useState<string|null>(null);
  const [elsewhere,setElsewhere]=useState<Elsewhere|null>(null),[recent,setRecent]=useState<ReadingLocation[]>([]),[bookmarks,setBookmarks]=useState<ReadingLocation[]>([]);
  const [reciter,setReciter]=useState(7),[error,setError]=useState(""),[translationMap,setTranslationMap]=useState<Record<string,string>>({});
  const [hizb,setHizb]=useState(1);
  const query=useQuery(recitePageOptions(page));const current=query.data;const currentRef=useRef(current);currentRef.current=current;
  const root=useRef<HTMLDivElement|null>(null),scroll=useRef<HTMLDivElement|null>(null),audio=useRef<HTMLAudioElement|null>(null),jumpTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const pointer=useRef<{x:number;y:number;t:number}|null>(null),seenMarks=useRef(new Map<string,string>());
  const player=useQuranPlayer();
  const gotoRef=useRef<(s:number,v?:number,p?:number,retain?:boolean)=>Promise<void>>(async()=>{});
  const voice=useReaderVoice({
    update:r=>{setResult(r);const next:Marks={};for(const w of r.words){next[w.key]=w.status;if((w.status==="wrong"||w.status==="skipped")&&seenMarks.current.get(w.key)!==w.status)feedback(w.status==="wrong"?"wrong":"skip");seenMarks.current.set(w.key,w.status);}setMarks(next);},
    elsewhere:p=>{
      void verseLocation(`${p.sura}:${p.aya}`).then(v=>{
        if(adjacentPage(currentRef.current?.page??page,v.page??0))void gotoRef.current(p.sura,p.aya,v.page,true);
        else {setElsewhere(p);if(jumpTimer.current)clearTimeout(jumpTimer.current);jumpTimer.current=setTimeout(()=>void gotoRef.current(p.sura,p.aya,v.page,true),ELSEWHERE_DELAY);}
      }).catch(()=>setError("Couldn’t locate that ayah. Keep reading or retry."));
    },
    position:(p:FollowPosition)=>{if(!p.locked)return;setHighlight(p.key);void followLocation(p.sura,p.aya,p.word).then(target=>{if(target!==currentRef.current?.page)void gotoRef.current(p.sura,p.aya,target,false);}).catch(()=>undefined);},
    answer:a=>{const top=a.matches[0];if(a.confident&&top){void gotoRef.current(top.sura,top.aya,undefined,false).then(()=>{const p=currentRef.current;if(p)void voiceRef.current.request("smart",pageRanges(p));});}else {setError("Not sure yet. Recite a little more.");setSheet("search");}},
  });
  const voiceRef=useRef(voice);voiceRef.current=voice;
  useEffect(()=>{
    try{const saved=JSON.parse(localStorage.getItem("quran-v2:preferences")??"null");if(saved)setPrefs({...DEFAULTS,...saved,layout:lesson?"Framed mushaf":saved.layout??"Mushaf text"});setRecent(JSON.parse(localStorage.getItem("quran-v2:recent")??"[]"));setBookmarks(JSON.parse(localStorage.getItem("quran-v2:bookmarks")??"[]"));const p=JSON.parse(localStorage.getItem("adhkar:quran")??"{}");setReciter(p.reciter??7);}catch{/* Defaults remain usable. */}
    const sync=()=>{setTheme(mushafThemeId(getPresetId()));setPhase(resolveVisualPhase("/app/quran"));};sync();
    window.addEventListener("adhkar:theme-change",sync);window.addEventListener("adhkar:visual-phase-change",sync);
    return()=>{window.removeEventListener("adhkar:theme-change",sync);window.removeEventListener("adhkar:visual-phase-change",sync);};
  },[]);
  const change=(p:Partial<ReaderPreferences>)=>setPrefs(old=>{const next={...old,...p};localStorage.setItem("quran-v2:preferences",JSON.stringify(next));return next;});
  async function go(s:number,v=1,p?:number,retain=false){
    if(jumpTimer.current)clearTimeout(jumpTimer.current);setElsewhere(null);setSheet(null);setError("");
    try{const destination=p??(v>1?(await verseLocation(`${s}:${v}`)).page:await reciteDestinationPage("surah",s));if(!destination)throw new Error("Missing page");
      const data=await client.ensureQueryData(recitePageOptions(destination));currentRef.current=data;setPage(destination);setAnchor(destination);setLoaded(true);if(lesson)lesson.onPage?.(destination);
      requestAnimationFrame(()=>root.current?.querySelector(`[data-q2-page="${destination}"]`)?.scrollIntoView({behavior:retain?"smooth":"instant",block:"start"}));
      if(retain)await voiceRef.current.continueAt(pageRanges(data));
    }catch{setError("Couldn’t open that passage. Please try again.");}
  }
  gotoRef.current=go;
  useEffect(()=>{if(initialPage){setPage(initialPage);setAnchor(initialPage);setLoaded(true);}else void go(chapterId,verse);},[chapterId,verse,initialPage]);
  const started=useRef(false);
  useEffect(()=>{if(loaded&&current&&initialMode&&!started.current){started.current=true;void voice.request(initialMode,pageRanges(current));}},[loaded,current,initialMode]);
  useEffect(()=>()=>{if(jumpTimer.current)clearTimeout(jumpTimer.current);audio.current?.pause();cancelHifzFeedback();},[]);
  useEffect(()=>{
    if(!result||!current)return;let alive=true;
    void import("@/lib/hifz-ai").then(engine=>engine.tajweedHints(result,pageRanges(current),3)).then(t=>{if(alive)setTips(t);}).catch(()=>undefined);
    return()=>{alive=false;};
  },[result,current]);
  useEffect(()=>{
    if(prefs.translator===20||!current){setTranslationMap({});return;}let canceled=false;
    void fetch(`https://api.quran.com/api/v4/verses/by_page/${page}?translations=${prefs.translator}&per_page=50`).then(r=>r.json()).then((data:{verses:{verse_key:string;translations?:{text:string}[]}[]})=>{if(!canceled)setTranslationMap(Object.fromEntries(data.verses.map(v=>[v.verse_key,(v.translations?.[0]?.text??"").replace(/<[^>]*>/g,"")])));}).catch(()=>setError("Translation couldn’t load. Sahih International remains available."));return()=>{canceled=true;};
  },[page,prefs.translator,current]);
  useEffect(()=>{
    if(!prefs.highlight||!player.pos.key)return;setHighlight(player.pos.word?`${player.pos.key}:${player.pos.word}`:null);
    if(prefs.follow&&player.playing){const element=root.current?.querySelector(`[data-q2-word="${player.pos.key}:${player.pos.word}"]`);element?.scrollIntoView({behavior:"smooth",block:"center"});if(!element)void verseLocation(player.pos.key).then(v=>{if(v.page&&v.page!==page)void go(0,1,v.page);}).catch(()=>undefined);}
  },[player.pos.key,player.pos.word,prefs.highlight,prefs.follow]);
  useEffect(()=>{
    if(voice.phase!=="active")return;let wake:WakeLockSentinel|undefined;
    void navigator.wakeLock?.request("screen").then(w=>{wake=w;}).catch(()=>undefined);return()=>{void wake?.release();};
  },[voice.phase]);
  const visible=useCallback((p:RecitePage)=>{
    const v=p.verses[0];if(!v)return;currentRef.current=p;setPage(p.page);
    if(lesson)return;
    const location={s:v.chapter,v:v.number,page:p.page,name:chapters.find(c=>c.id===v.chapter)?.name_simple??"Quran"};
    setRecent(old=>{const next=[location,...old.filter(r=>r.page!==p.page)].slice(0,12);localStorage.setItem("quran-v2:recent",JSON.stringify(next));return next;});
    if(!quranPlayer.get().playing)localStorage.setItem("adhkar:quran:last",JSON.stringify({...location,mode:"read"}));
  },[chapters,lesson]);
  const first=current?.verses[0];
  useEffect(()=>{if(first)void verseLocation(first.key).then(v=>setHizb(v.hizb)).catch(()=>undefined);},[first?.key]);
  const name=chapters.find(c=>c.id===first?.chapter)?.name_simple??"Quran";
  const [tail,setTail]=useState(1);
  useEffect(()=>setTail(1),[anchor]);
  useEffect(()=>{
    const node=root.current?.querySelector(".q2-load-next");if(!node||prefs.layout==="Framed mushaf")return;
    const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))setTail(n=>Math.min(n+2,604-anchor));},{root:scroll.current,rootMargin:"250px"});observer.observe(node);return()=>observer.disconnect();
  },[tail,anchor,prefs.layout]);
  const pages=prefs.layout==="Framed mushaf"?[page]:Array.from({length:Math.min(tail+1,605-anchor)},(_,i)=>anchor+i);
  const words=current?pageWords(current):[];
  const reveal=(ayah:boolean)=>{const pending=words.find(w=>!revealed.has(w.key));if(!pending)return;setRevealed(old=>{const next=new Set(old);for(const w of words)if(w.key===pending.key||(ayah&&w.verse===pending.verse))next.add(w.key);return next;});feedback("reveal");};
  const play=()=>{if(lesson){lesson.listen();return;}if(player.playing){quranPlayer.pause();return;}voice.cancel();if(first)void quranPlayer.select(reciter,first.chapter,name,true,first.key).catch(()=>setError("This reciter’s audio is unavailable. Choose another reciter."));};
  const correct=(key:string)=>{audio.current?.pause();const w=words.find(w=>w.key===key);if(w?.audio){const a=new Audio(w.audio);audio.current=a;void a.play().catch(()=>setError("Tap again to play this word."));}};
  const bookmark=()=>{if(!first)return;const r={s:first.chapter,v:first.number,page,name};setBookmarks(old=>{const next=old.some(b=>b.page===page)?old.filter(b=>b.page!==page):[r,...old];localStorage.setItem("quran-v2:bookmarks",JSON.stringify(next));return next;});toast("Bookmark updated");};
  const mic=()=>{if(lesson){lesson.mic();return;}if(voice.phase==="active")void voice.stop();else if(current)void voice.request("smart",pageRanges(current));};
  return <Portal><MushafThemeProvider theme={theme} mode={phase} className={`q2-reader ${chrome?"q2-chrome-visible":""}`}><div ref={root}>
    <header className="q2-topbar" inert={!chrome}><Button variant="ghost" size="icon" aria-label="Back to Quran" onClick={()=>{voice.cancel();back();}}><ChevronLeft/></Button><Button variant="ghost" className="q2-location" onClick={()=>setSheet("navigation")}>{voice.phase==="active"&&voice.mode==="follow"?"Following the imam":<>{name}<small>Page {page} · Juz {first?.juz??1} · Hizb {hizb}</small></>}</Button><Button variant="ghost" size="icon" aria-label="Search Quran" onClick={()=>setSheet("search")}><Search size={19}/></Button><Button variant="ghost" size="icon" aria-label="Reading appearance" onClick={()=>setSheet("settings")}>Aa</Button></header>
    {lesson&&<><div className="q2-lesson-pill">{lesson.pill}</div><div className="q2-lesson-tools">{lesson.tools}</div><SilenceMonitor stream={lesson.stream} onSilence={last=>lesson.onSilence?.(last)}/></>}
    <div className="q2-scroll" ref={scroll} onPointerDown={e=>{pointer.current={x:e.clientX,y:e.clientY,t:e.timeStamp};}} onPointerUp={e=>{const p=pointer.current;pointer.current=null;if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;if(prefs.layout==="Framed mushaf"&&Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.3){void go(0,1,Math.max(1,Math.min(604,page+(dx>0?1:-1))));return;}if(Math.hypot(dx,dy)<10&&e.timeStamp-p.t<300){setChrome(v=>!v);setTabbar(chrome);}}}>
      {loaded?pages.map(n=><ReaderPage key={n} number={n} chapters={chapters} {...prefs} marks={lesson?.marks??marks} hidden={(lesson?.hidden??false)||hidden} revealed={revealed} highlight={lesson?.highlight??highlight} peek={lesson?.peeked} lessonKeys={lesson?.keys} translations={translationMap} onVisible={lesson?undefined:visible} onWord={w=>{if(lesson)lesson.onWord(w);else if(hidden)reveal(false);else{setChrome(v=>!v);setTabbar(chrome);}}}/>):<div className="q2-loading">Opening Quran…</div>}
      {prefs.layout!=="Framed mushaf"&&anchor+tail<604&&<Button variant="ghost" className="q2-load-next" onClick={()=>setTail(n=>n+2)}>Next page <ChevronLeft size={15}/></Button>}
    </div>
    <div className="q2-bottom" inert={!chrome}>
      {elsewhere&&<section className="q2-elsewhere"><div>You’re reciting {chapters.find(c=>c.id===elsewhere.sura)?.name_simple} · ayah {elsewhere.aya}</div><Button size="sm" onClick={()=>void go(elsewhere.sura,elsewhere.aya,undefined,true)}>Go there</Button><Button variant="ghost" size="icon" aria-label="Dismiss recitation location" onClick={()=>{if(jumpTimer.current)clearTimeout(jumpTimer.current);setElsewhere(null);}}><X size={16}/></Button></section>}
      {error&&<p className="q2-notice" role="alert">{error}</p>}
      {voice.phase==="active"&&voice.mode==="follow"&&prefs.english&&first&&<p className="q2-english">{first.translation}</p>}
      {(player.playing||player.loading)&&<div className="q2-player"><Button variant="ghost" size="icon" aria-label={player.playing?"Pause recitation":"Play recitation"} onClick={()=>quranPlayer.toggle()}>{player.playing?<Pause size={17}/>:<Play size={17}/>}</Button><Button variant="ghost" onClick={()=>setSheet("reciter")}>{reciterName(findReciter(player.reciterId))}</Button><Button variant="ghost" onClick={()=>quranPlayer.setRate(player.rate===1?1.25:player.rate===1.25?.75:1)}>{player.rate}×</Button><Button variant="ghost" size="icon" aria-label="Close player" onClick={()=>quranPlayer.stop()}><X size={16}/></Button></div>}
      {voice.phase==="active"&&<><small className="q2-disclaimer">{voice.mode==="follow"?"Following only · no grading":AI_DISCLAIMER}</small>{voice.mode==="follow"&&<Button variant="outline" onClick={()=>void voice.stop()}><Square size={13}/>Stop following</Button>}</>}
      {(hidden||lesson?.hidden)&&<div className="q2-reveal"><Button variant="outline" size="sm" onClick={()=>lesson?lesson.peek():reveal(false)}>Reveal word</Button><Button variant="outline" size="sm" onClick={()=>lesson?lesson.peek():reveal(true)}>Reveal ayah</Button></div>}
      <nav className="q2-actionbar" aria-label="Reader actions"><Button variant="ghost" onClick={play}><Play size={20}/><small>Play</small></Button><Button variant="ghost" onClick={()=>{const layout=nextLayout(prefs.layout);change({layout});toast(layout);}}><LayoutList size={20}/><small>Layout</small></Button><Button className="q2-mic" aria-label={voice.phase==="active"?"Stop microphone":"Start smart microphone"} disabled={lesson?.busy||voice.phase==="loading"||voice.phase==="finishing"} onClick={mic}>{voice.phase==="active"?<VoiceBars stream={voice.stream}/>:lesson?.stream?<VoiceBars stream={lesson.stream}/>:<Mic size={27}/>}</Button><Button variant="ghost" onClick={()=>setHidden(v=>!v)}>{hidden?<Eye size={20}/>:<EyeOff size={20}/>}<small>Hide</small></Button><Button variant="ghost" aria-label="Mistakes" onClick={()=>setSheet("mistakes")}><span className="q2-badge-icon"><Flag size={20}/>{!!result?.words.filter(w=>w.status==="wrong"||w.status==="skipped").length&&<b>{result.words.filter(w=>w.status==="wrong"||w.status==="skipped").length}</b>}</span><small>Mistakes</small></Button><Button variant="ghost" size="icon" aria-label="More reader actions" onClick={()=>setSheet("more")}><MoreHorizontal size={18}/></Button></nav>
    </div>
    {tabbar&&chrome&&<div className="q2-tabs"><BottomNav/></div>}
    <VoiceConsent phase={voice.phase} progress={voice.progress} error={voice.error} begin={()=>void voice.begin()} cancel={voice.cancel}/>
    {sheet==="navigation"&&<ReaderNavigation chapters={chapters} recent={recent} bookmarks={bookmarks} go={(s,v,p)=>void go(s,v,p)} close={()=>setSheet(null)}/>}
    {sheet==="settings"&&<ReaderSettings prefs={prefs} change={change} page={page} chapters={chapters} close={()=>setSheet(null)}/>}
    {sheet==="reciter"&&<ReaderReciters selected={reciter} select={id=>{setReciter(id);const existing=JSON.parse(localStorage.getItem("adhkar:quran")??"{}");localStorage.setItem("adhkar:quran",JSON.stringify({...existing,reciter:id}));setSheet(null);}} close={()=>setSheet(null)}/>}
    {sheet==="mistakes"&&<ReaderMistakes result={result} recording={voice.recording} tips={tips} chapters={chapters} correct={correct} highlight={setHighlight} close={()=>{voice.discardRecording();setSheet(null);}}/>}
    {sheet==="search"&&<ReaderSheet title="Find an ayah" close={()=>setSheet(null)}><ReaderSearch chapters={chapters} go={go}/><Button onClick={()=>{setSheet(null);if(lesson?.stream){toast("Stop your lesson microphone first");return;}void voice.request("search");}}><Mic size={18}/>Recite anything</Button></ReaderSheet>}
    {sheet==="more"&&<ReaderSheet title="Reader" close={()=>setSheet(null)}><div className="q2-menu"><Button variant="ghost" onClick={()=>setSheet("echo")}><Repeat/>Echo mode</Button><Button variant="ghost" onClick={()=>{setSheet(null);if(lesson?.stream){toast("Stop your lesson microphone first");return;}void voice.request("follow");}}><Mic/>Follow the imam</Button><Button variant="ghost" onClick={()=>setSheet("reciter")}><Play/>Reciter</Button><Button variant="ghost" onClick={()=>{setSheet(null);if(lesson?.stream){toast("Stop your lesson microphone first");return;}void voice.request("search");}}><Search/>Find an ayah</Button><Button variant="ghost" onClick={bookmark}><Bookmark/>Bookmark this page</Button><Button variant="ghost" onClick={()=>setSheet("navigation")}><Bookmark/>Bookmarks</Button></div></ReaderSheet>}
    {sheet==="echo"&&<EchoMode modern keys={current?.verses.map(v=>v.key)??[]} reciter={reciter} close={()=>setSheet(null)} highlight={(keys,h)=>{setHidden(h);setHighlight(keys[0]?`${keys[0]}:1`:null);}}/>}
    {lesson?.overlays}
  </div></MushafThemeProvider></Portal>;
}
function ReaderSearch({chapters,go}:{chapters:Chapter[];go:(s:number,v?:number,p?:number)=>Promise<void>}){const[q,setQ]=useState("");return <><label className="q2-search"><Search size={17}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Surah name or ayah (67:3)"/></label>{/^\d+:\d+$/.test(q)&&<Button variant="outline" onClick={()=>{const[s,v]=q.split(":").map(Number);void go(s,v);}}>Open {q}</Button>}{chapters.filter(c=>`${c.name_simple} ${c.id}`.toLowerCase().includes(q.toLowerCase())).map(c=><Button variant="ghost" className="q2-nav-row" key={c.id} onClick={()=>void go(c.id)}>{c.name_simple}<span className="q2-surah-name">{String(c.id).padStart(3,"0")}</span></Button>)}</>;}