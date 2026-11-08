import {useCallback,useEffect,useLayoutEffect,useRef,useState,type ReactNode} from "react";
import {useQuery,useQueryClient} from "@tanstack/react-query";
import {Bookmark,ChevronLeft,Eye,EyeOff,MessageSquareCheck,LayoutGrid,Mic,MoreHorizontal,Pause,Play,Repeat,RotateCcw,Search,Square,X} from "lucide-react";
import {toast} from "sonner";
import {Portal} from "@/components/Portal";
import {BottomNav} from "@/components/BottomNav";
import {Button} from "@/components/ui/button";
import {MushafThemeProvider} from "@/components/mushaf/MushafPage";
import {mushafThemeId} from "@/components/recite/mushaf-theme";
import {getPresetId,resolveVisualPhase} from "@/lib/theme-store";
import {findReciter,reciterName,type Chapter} from "@/lib/quran";
import {quranPlayer,useQuranPlayer} from "@/lib/quran-player";
import {loadPageFont,reciteChaptersOptions,reciteDestinationPage,recitePageOptions} from "@/lib/recite/data";
import {pageWords,type Marks,type RecitePage,type ReciteWord} from "@/lib/recite/model";
import type {CheckResult,Elsewhere,FollowPosition,TajweedHint} from "@/lib/hifz-ai";
import {AI_DISCLAIMER} from "@/lib/hifz-ai/notices";
import {play as feedback,cancelHifzFeedback,unlockHifzFeedbackAudio} from "@/lib/hifzHaptics";
import {VoiceBars} from "@/components/quran-voice/VoiceBars";
import {VoiceConsent} from "@/components/quran-voice/VoiceConsent";
import {EchoMode} from "@/components/hifz/EchoMode";
import {ReaderPage} from "./ReaderPage";
import {ReaderMistakes,ReaderNavigation,ReaderReciters,ReaderSettings,ReaderSheet,type ReaderPreferences,type ReadingLocation} from "./ReaderSheets";
import {adjacentPage,nextLayout,pageRanges,swipeDestination,visiblePageNumber,passageContains,topReadingWord,recitationReadingWord,matchesSurahSearch} from "./reader-rules";
import {useReaderVoice} from "./use-reader-voice";
import {SilenceMonitor} from "./SilenceMonitor";
import {debugEnabled} from "@/lib/hifz-debug";
import {extendWindow,openingWindow,preservedScrollOffset,type PageWindow} from "./scroll-window";
import {paintLiveWords} from "./live-marks";
import {addedWordKeys,mistakeCount} from "@/components/recite/ai-feedback";
import "./reader.css";
async function verseLocation(key:string):Promise<{page:number;hizb:number}>{
 const response=await fetch(`https://api.quran.com/api/v4/verses/by_key/${key}?fields=page_number,hizb_number`);
 if(!response.ok)throw new Error("Ayah unavailable");const data=await response.json() as {verse:{page_number:number;hizb_number:number}};return {page:data.verse.page_number,hizb:data.verse.hizb_number};
}

const wordPages=new Map<string,Promise<number>>();
function followLocation(sura:number,aya:number,word:number){const key=`${sura}:${aya}`;const cached=wordPages.get(`${key}:${word}`);if(cached)return cached;const load=fetch(`https://api.quran.com/api/v4/verses/by_key/${key}?words=true&word_fields=page_number&fields=page_number`).then(r=>r.json()).then((d:{verse:{page_number:number;words:{position:number;page_number:number}[]}})=>d.verse.words.find(w=>w.position===word)?.page_number??d.verse.page_number);wordPages.set(`${key}:${word}`,load);return load;}
const DEFAULTS:ReaderPreferences={layout:"Mushaf text",paging:"scroll",size:26,tajweed:false,highlight:true,follow:true,arabic:true,translit:true,translation:true,translitSize:15,translationSize:16,translator:20,english:true,strictHarakat:false};
const EMPTY_MARKS:Marks={};
export type ReaderLesson={pill:ReactNode;marks:Marks;hidden:boolean;stream:MediaStream|null;busy:boolean;mic:()=>void;listen:()=>void;peek:()=>void;onWord:(w:ReciteWord)=>void;overlays:ReactNode;highlight?:string|null;peeked?:boolean;keys?:Set<string>;onSilence?:(last:number)=>void;onPage?:(page:number)=>void;tools?:ReactNode};
export function UnifiedReader({chapterId=1,verse=1,initialPage,initialMode,back,lesson}:{chapterId?:number;verse?:number;initialPage?:number;initialMode?:"follow"|"search"|"smart";back:()=>void;lesson?:ReaderLesson}){
  const client=useQueryClient();const chapters=useQuery(reciteChaptersOptions).data??[];
  const [page,setPage]=useState(initialPage??1),[loaded,setLoaded]=useState(!!initialPage);
  const [pageWindow,setPageWindow]=useState<PageWindow>(()=>openingWindow(initialPage??1));
  const pendingScroll=useRef<{page:number;key?:string;top:number;landing:boolean}|null>(initialPage?{page:initialPage,top:0,landing:true}:null);
  const loadingBefore=useRef(false);
  const [prefs,setPrefs]=useState<ReaderPreferences>({...DEFAULTS,layout:lesson?"Framed mushaf":"Mushaf text"});
  const [theme,setTheme]=useState("original"),[phase,setPhase]=useState<"morning"|"evening">("morning");
  const [chrome,setChrome]=useState(true),[tabbar,setTabbar]=useState(false),[hidden,setHidden]=useState(false),[revealed,setRevealed]=useState<Set<string>>(new Set());
  const [sheet,setSheet]=useState<"navigation"|"settings"|"mistakes"|"more"|"reciter"|"echo"|"search"|null>(null);
  const [result,setResult]=useState<CheckResult|null>(null),[marks,setMarks]=useState<Marks>({}),[tips,setTips]=useState<TajweedHint[]>([]),[highlight,setHighlight]=useState<string|null>(null);
  const [confirmReset,setConfirmReset]=useState(false),[resetting,setResetting]=useState(false);
  const liveMarks=useRef<Marks>({}),liveAdded=useRef<Set<string>>(new Set()),seenAdded=useRef(new Set<string>()),resetPending=useRef(false),sessionPage=useRef<number|null>(null);
  const [elsewhere,setElsewhere]=useState<(Elsewhere & {page:number})|null>(null),[recent,setRecent]=useState<ReadingLocation[]>([]),[bookmarks,setBookmarks]=useState<ReadingLocation[]>([]);
  const [reciter,setReciter]=useState(7),[error,setError]=useState(""),[translationMap,setTranslationMap]=useState<Record<string,string>>({});
  const [hizb,setHizb]=useState(1);
  const [readingKey,setReadingKey]=useState(`${chapterId}:${verse}`);
  const selectedReading=useRef<string|null>(`${chapterId}:${verse}`);
  const query=useQuery(recitePageOptions(page));const current=query.data;const currentRef=useRef(current);currentRef.current=current;
  const root=useRef<HTMLDivElement|null>(null),scroll=useRef<HTMLDivElement|null>(null),audio=useRef<HTMLAudioElement|null>(null),jumpTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const pointer=useRef<{x:number;y:number;t:number;axis?:"x"|"y"}|null>(null),seenMarks=useRef(new Map<string,string>());
  const turning=useRef(false),swiped=useRef(false),pageTurn=useRef<HTMLDivElement|null>(null);
  const [turnDirection,setTurnDirection]=useState<"forward"|"backward"|null>(null);
  const visiblePages=useRef(new Map<number,{data:RecitePage;ratio:number}>());
  const locationGeneration=useRef(0),navigationGeneration=useRef(0);
  function viewingPage(){
    const container=scroll.current;if(!container)return currentRef.current;
    const bounds=container.getBoundingClientRect();
    const number=visiblePageNumber([...container.querySelectorAll<HTMLElement>("[data-q2-page]")].map(el=>{const r=el.getBoundingClientRect();return {page:Number(el.dataset.q2Page),top:r.top,bottom:r.bottom};}),bounds.top,bounds.bottom);
    return (number?visiblePages.current.get(number)?.data??client.getQueryData<RecitePage>(recitePageOptions(number).queryKey):undefined)??currentRef.current;
  }
  const player=useQuranPlayer();
  const gotoRef=useRef<(s:number,v?:number,p?:number,retain?:boolean)=>Promise<void>>(async()=>{});
  const debugUpdates=useRef<{elapsed:number;result:CheckResult}[]>([]),debugStart=useRef(0);
  const sessionPassages=useRef<ReturnType<typeof pageRanges>>([]);
  const voice=useReaderVoice({
    update:r=>{if(resetPending.current)return;const next:Marks={};for(const w of r.words)next[w.key]=w.status;const rewound=r.words.filter(w=>w.status==="pending"&&liveMarks.current[w.key]&&liveMarks.current[w.key]!=="pending").map(w=>w.key);if(rewound.length){setRevealed(old=>{const fresh=new Set(old);for(const key of rewound)fresh.delete(key);return fresh;});setHighlight(old=>old&&rewound.includes(old)?null:old);}liveMarks.current=next;const added=addedWordKeys(r);liveAdded.current=new Set(added);if(root.current)paintLiveWords(root.current,next,true,null,liveAdded.current);for(const k of added){if(!seenAdded.current.has(k)){seenAdded.current.add(k);feedback("small");}}setResult(r);setMarks(next);if(debugEnabled())debugUpdates.current.push({elapsed:(performance.now()-debugStart.current)/1000,result:structuredClone(r)});for(const w of r.words){if((w.status==="wrong"||w.status==="skipped")&&seenMarks.current.get(w.key)!==w.status)feedback(w.status==="wrong"?"wrong":"skip");seenMarks.current.set(w.key,w.status);}},
    elsewhere:p=>{
      const token=++locationGeneration.current;
      if(jumpTimer.current)clearTimeout(jumpTimer.current);
      const viewed=viewingPage();
      if(viewed&&[p,...p.samePhrase].some(location=>passageContains(viewed,location))){setElsewhere(null);return;}
      void followLocation(p.sura,p.aya,p.word).then(destination=>{
        if(token!==locationGeneration.current)return;
        const now=viewingPage();
        if(now&&(now.page===destination||[p,...p.samePhrase].some(location=>passageContains(now,location)))){setElsewhere(null);return;}
        if(adjacentPage(now?.page??page,destination))void gotoRef.current(p.sura,p.aya,destination,true);
        else setElsewhere({...p,page:destination});
      }).catch(()=>setError("Couldn’t locate that ayah. Keep reading or retry."));
    },
    position:(p:FollowPosition)=>{if(!p.locked)return;const token=++locationGeneration.current;setHighlight(p.key);setReadingKey(`${p.sura}:${p.aya}`);void followLocation(p.sura,p.aya,p.word).then(target=>{if(token!==locationGeneration.current)return;if(target!==viewingPage()?.page)void gotoRef.current(p.sura,p.aya,target,false);}).catch(()=>undefined);},
    answer:a=>{const top=a.matches[0];if(a.confident&&top){void gotoRef.current(top.sura,top.aya,undefined,false).then(()=>{const p=currentRef.current;if(p)void voiceRef.current.request("smart",pageRanges(p));});}else {setError("Not sure yet. Recite a little more.");setSheet("search");}},
  });
  const voiceRef=useRef(voice);voiceRef.current=voice;
  const paintState=useRef({active:false,highlight:null as string|null});
  paintState.current={active:voice.phase==="active"||voice.phase==="finishing",highlight};
  useLayoutEffect(()=>{
    const node=root.current;if(!node||lesson)return;
    const paint=()=>paintLiveWords(node,liveMarks.current,paintState.current.active,paintState.current.highlight,liveAdded.current);
    paint();const observer=new MutationObserver(paint);observer.observe(node,{childList:true,subtree:true});
    return()=>observer.disconnect();
  },[lesson,marks,highlight,voice.phase,hidden,revealed,prefs.layout,prefs.paging]);
  useEffect(()=>{
    if(lesson||voice.phase!=="active"||voice.mode!=="smart"||sessionPage.current===page)return;
    let canceled=false;let timer:ReturnType<typeof setTimeout>;
    const retarget=async()=>{const viewed=viewingPage();if(canceled||!viewed||viewed.page!==page)return;const ok=await voiceRef.current.continueAt(pageRanges(viewed));if(canceled)return;if(ok){sessionPage.current=page;sessionPassages.current.push(...pageRanges(viewed));}else timer=setTimeout(()=>void retarget(),200);};
    timer=setTimeout(()=>void retarget(),250);return()=>{canceled=true;clearTimeout(timer);};
  },[page,voice.phase,voice.mode,lesson]);
  async function resetSession(){
    if(resetPending.current)return;resetPending.current=true;setResetting(true);
    try{
      const accepted=await voiceRef.current.resetMistakes();
      if(accepted===false)return;
      audio.current?.pause();cancelHifzFeedback();
      liveMarks.current={};liveAdded.current=new Set();seenAdded.current.clear();seenMarks.current.clear();setResult(null);setMarks({});setTips([]);setHighlight(null);setElsewhere(null);locationGeneration.current++;
      debugUpdates.current=[];debugStart.current=performance.now();if(root.current)paintLiveWords(root.current,{},voiceRef.current.phase==="active");
      setConfirmReset(false);
    }finally{resetPending.current=false;setResetting(false);}
  }
  useEffect(()=>{if(voice.phase==="active"&&voice.mode==="smart"){debugStart.current=performance.now();debugUpdates.current=[];sessionPassages.current=currentRef.current?pageRanges(currentRef.current):[];}},[voice.phase,voice.mode]);
  useEffect(()=>{
    try{const saved=JSON.parse(localStorage.getItem("quran-v2:preferences")??"null");if(saved)setPrefs({...DEFAULTS,...saved,layout:lesson?"Framed mushaf":saved.layout??"Mushaf text"});setRecent(JSON.parse(localStorage.getItem("quran-v2:recent")??"[]"));setBookmarks(JSON.parse(localStorage.getItem("quran-v2:bookmarks")??"[]"));const p=JSON.parse(localStorage.getItem("adhkar:quran")??"{}");setReciter(p.reciter??7);}catch{/* Defaults remain usable. */}
    const sync=()=>{setTheme(mushafThemeId(getPresetId()));setPhase(resolveVisualPhase("/app/quran"));};sync();
    window.addEventListener("adhkar:theme-change",sync);window.addEventListener("adhkar:visual-phase-change",sync);
    return()=>{window.removeEventListener("adhkar:theme-change",sync);window.removeEventListener("adhkar:visual-phase-change",sync);};
  },[]);
  const change=(p:Partial<ReaderPreferences>)=>setPrefs(old=>{const next={...old,...p};localStorage.setItem("quran-v2:preferences",JSON.stringify(next));return next;});
  async function go(s:number,v=1,p?:number,retain=false){
    const navigation=++navigationGeneration.current;locationGeneration.current++;
    if(jumpTimer.current)clearTimeout(jumpTimer.current);setElsewhere(null);setSheet(null);setError("");
    try{const destination=p??(v>1?(await verseLocation(`${s}:${v}`)).page:await reciteDestinationPage("surah",s));if(!destination)throw new Error("Missing page");
      const data=await client.ensureQueryData(recitePageOptions(destination));if(navigation!==navigationGeneration.current)return;currentRef.current=data;setPage(destination);setPageWindow(openingWindow(destination));setLoaded(true);if(lesson)lesson.onPage?.(destination);
      const selected=data.verses.find(ayah=>ayah.chapter===s&&ayah.number===v)??data.verses[0];
      selectedReading.current=selected?.key??null;if(selected)setReadingKey(selected.key);
      pendingScroll.current={page:destination,key:selected?.words.find(w=>!w.end)?.key,top:0,landing:true};
      if(retain){sessionPassages.current.push(...pageRanges(data));if(await voiceRef.current.continueAt(pageRanges(data)))sessionPage.current=destination;}
    }catch{setError("Couldn’t open that passage. Please try again.");}
  }
  gotoRef.current=go;
  useEffect(()=>{if(initialPage){setPage(initialPage);setPageWindow(openingWindow(initialPage));pendingScroll.current={page:initialPage,top:0,landing:true};setLoaded(true);}else void go(chapterId,verse);},[chapterId,verse,initialPage]);
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
  const visible=useCallback((candidate:RecitePage,ratio:number)=>{
    visiblePages.current.set(candidate.page,{data:candidate,ratio});
    if(pendingScroll.current)return;
    const p=viewingPage();if(!p)return;
    if(!selectedReading.current){const container=scroll.current;if(container){const bounds=container.getBoundingClientRect();const key=topReadingWord([...container.querySelectorAll<HTMLElement>(`[data-q2-page="${p.page}"] [data-q2-word]`)].map(el=>{const r=el.getBoundingClientRect();return {key:el.dataset.q2Word??"",top:r.top,bottom:r.bottom};}),bounds.top,bounds.bottom);if(key)setReadingKey(key.split(":").slice(0,2).join(":"));}}
    if(currentRef.current?.page===p.page)return;
    locationGeneration.current++;if(jumpTimer.current)clearTimeout(jumpTimer.current);setElsewhere(null);
    const v=p.verses[0];if(!v)return;currentRef.current=p;setPage(p.page);
    if(lesson)return;
    const location={s:v.chapter,v:v.number,page:p.page,name:chapters.find(c=>c.id===v.chapter)?.name_simple??"Quran"};
    setRecent(old=>{const next=[location,...old.filter(r=>r.page!==p.page)].slice(0,12);localStorage.setItem("quran-v2:recent",JSON.stringify(next));return next;});
    if(!quranPlayer.get().playing)localStorage.setItem("adhkar:quran:last",JSON.stringify({...location,mode:"read"}));
  },[chapters,lesson]);
  const liveReading=recitationReadingWord(current?.verses.flatMap(v=>v.words)??[],lesson?.marks??marks);
  const activeKey=(lesson?.stream||voice.phase==="active")?liveReading?.verse??readingKey:readingKey;
  const first=current?.verses.find(v=>v.key===activeKey)??current?.verses[0];
  const readingChapter=Number(activeKey.split(":")[0]);
  useEffect(()=>{let alive=true;if(activeKey)void verseLocation(activeKey).then(v=>{if(alive)setHizb(v.hizb);}).catch(()=>undefined);return()=>{alive=false;};},[activeKey]);
  const name=readingChapter===1?"Al-Fātiḥah":chapters.find(c=>c.id===readingChapter)?.name_simple??"Quran";
  const singlePage=prefs.paging==="swipe"||prefs.layout==="Framed mushaf";
  // The browser's own anchoring is disabled: restore the same page/word's pixel
  // position after prepends, including asynchronous font/content layout changes.
  useLayoutEffect(()=>{
    const container=scroll.current,body=pageTurn.current;if(!container||!body)return;
    let frame=0;
    const restore=()=>{
      const pending=pendingScroll.current;if(!pending)return;
      const article=body.querySelector<HTMLElement>(`[data-q2-page="${pending.page}"]`);
      const target=pending.key?article?.querySelector<HTMLElement>(`[data-q2-word="${pending.key}"]`):article;
      if(!target)return;
      const top=target.getBoundingClientRect().top-container.getBoundingClientRect().top;
      container.scrollTop=preservedScrollOffset(container.scrollTop,pending.top,top);
      const ready=[...body.querySelectorAll<HTMLElement>("[data-q2-page]")].every(el=>el.querySelector(".q2-page-body"));
      if(ready){cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
        if(pendingScroll.current!==pending)return;
        container.scrollTop=preservedScrollOffset(container.scrollTop,pending.top,target.getBoundingClientRect().top-container.getBoundingClientRect().top);
        pendingScroll.current=null;const viewed=viewingPage();if(viewed)visible(viewed,1);
      });}
    };
    const resize=new ResizeObserver(restore),mutation=new MutationObserver(restore);
    resize.observe(body);mutation.observe(body,{childList:true,subtree:true});restore();
    return()=>{resize.disconnect();mutation.disconnect();cancelAnimationFrame(frame);};
  },[pageWindow,singlePage,page,loaded,prefs.layout,visible]);
  async function loadEarlier(){
    const container=scroll.current;
    if(!container||singlePage||pageWindow.first===1||pendingScroll.current||loadingBefore.current)return;
    loadingBefore.current=true;const generation=navigationGeneration.current;
    const next=extendWindow(pageWindow,"before");
    try{
      await Promise.all(Array.from({length:pageWindow.first-next.first},(_,i)=>next.first+i).map(async n=>{
        await client.ensureQueryData(recitePageOptions(n));if(prefs.layout!=="Translation")await loadPageFont(n);
      }));
      if(generation!==navigationGeneration.current)return;
      const viewed=viewingPage();const article=container.querySelector<HTMLElement>(`[data-q2-page="${viewed?.page}"]`);if(!article)return;
      pendingScroll.current={page:Number(article.dataset.q2Page),top:article.getBoundingClientRect().top-container.getBoundingClientRect().top,landing:false};
      setPageWindow(old=>({...old,first:next.first}));
    }catch{setError("Couldn’t load earlier pages. Scroll up to retry.");}finally{loadingBefore.current=false;}
  }
  useEffect(()=>{
    const node=root.current?.querySelector(".q2-load-next");if(!node||prefs.paging==="swipe"||prefs.layout==="Framed mushaf")return;
    const observer=new IntersectionObserver(entries=>{if(!pendingScroll.current&&entries.some(e=>e.isIntersecting))setPageWindow(old=>extendWindow(old,"after"));},{root:scroll.current,rootMargin:"250px"});observer.observe(node);return()=>observer.disconnect();
  },[pageWindow,prefs.layout,prefs.paging]);
  useEffect(()=>{if(!singlePage)return;for(const n of [page-1,page+1])if(n>=1&&n<=604){void client.prefetchQuery(recitePageOptions(n));if(prefs.layout!=="Translation")void loadPageFont(n);}},[page,singlePage,client,prefs.layout]);
  useEffect(()=>{pendingScroll.current={page,top:0,landing:true};setPageWindow(openingWindow(page));},[prefs.paging,prefs.layout]);
  const pages=singlePage?[page]:Array.from({length:pageWindow.last-pageWindow.first+1},(_,i)=>pageWindow.first+i);
  async function turn(destination:number,dx:number){
    if(turning.current||destination===page)return;
    turning.current=true;
    try{
      await Promise.all([client.ensureQueryData(recitePageOptions(destination)),prefs.layout!=="Translation"?loadPageFont(destination):Promise.resolve()]);
      setTurnDirection(dx>0?"forward":"backward");
      await go(0,1,destination);
      scroll.current?.scrollTo({top:0});
    }finally{pageTurn.current?.style.removeProperty("--q2-drag");turning.current=false;}
  }
  const words=current?pageWords(current):[];
  const reveal=(ayah:boolean)=>{const pending=words.find(w=>!revealed.has(w.key));if(!pending)return;setRevealed(old=>{const next=new Set(old);for(const w of words)if(w.key===pending.key||(ayah&&w.verse===pending.verse))next.add(w.key);return next;});feedback("reveal");};
  const wordAction=useRef<(w:ReciteWord)=>void>(()=>{});
  wordAction.current=w=>{if(lesson)lesson.onWord(w);else if(hidden)reveal(false);else{setChrome(v=>!v);setTabbar(chrome);}};
  const onReaderWord=useCallback((w:ReciteWord)=>wordAction.current(w),[]);
  const play=()=>{if(lesson){lesson.listen();return;}if(player.playing){quranPlayer.pause();return;}voice.cancel();if(first)void quranPlayer.select(reciter,first.chapter,name,true,first.key).catch(()=>setError("This reciter’s audio is unavailable. Choose another reciter."));};
  const correct=(key:string)=>{audio.current?.pause();const w=words.find(w=>w.key===key);if(w?.audio){const a=new Audio(w.audio);audio.current=a;void a.play().catch(()=>setError("Tap again to play this word."));}};
  const bookmark=()=>{if(!first)return;const r={s:first.chapter,v:first.number,page,name};setBookmarks(old=>{const next=old.some(b=>b.page===page)?old.filter(b=>b.page!==page):[r,...old];localStorage.setItem("quran-v2:bookmarks",JSON.stringify(next));return next;});toast("Bookmark updated");};
  const mic=()=>{unlockHifzFeedbackAudio();if(lesson){lesson.mic();return;}if(voice.phase==="active")void voice.stop();else {const viewed=viewingPage();if(viewed){currentRef.current=viewed;sessionPage.current=viewed.page;setPage(viewed.page);seenMarks.current.clear();liveMarks.current={};setMarks({});setResult(null);setTips([]);setHighlight(null);locationGeneration.current++;setElsewhere(null);if(jumpTimer.current)clearTimeout(jumpTimer.current);void voice.request("smart",pageRanges(viewed));}}};
  return <Portal><MushafThemeProvider theme={theme} mode={phase} className={`q2-reader q2-theme-${theme} q2-phase-${phase} ${chrome?"q2-chrome-visible":""}`}><div ref={root}>
    <header className="q2-topbar" inert={!chrome}><div className="q2-header-left"><Button variant="ghost" size="icon" aria-label="Back to Quran" onClick={()=>{voice.cancel();back();}}><ChevronLeft/></Button></div><Button variant="ghost" className="q2-location" onClick={()=>setSheet("navigation")}>{voice.phase==="active"&&voice.mode==="follow"?"Following the imam":<>{name}<small>Page {page} · Juz {first?.juz??1} · Hizb {hizb}</small></>}</Button><div className="q2-header-right"><Button variant="ghost" size="icon" aria-label="Search Quran" onClick={()=>setSheet("search")}><Search size={22}/></Button><Button variant="ghost" size="icon" aria-label="Reading appearance" onClick={()=>setSheet("settings")}>Aa</Button></div></header>
    {lesson&&<><div className="q2-lesson-pill">{lesson.pill}</div><div className="q2-lesson-tools">{lesson.tools}</div><SilenceMonitor stream={lesson.stream} onSilence={last=>lesson.onSilence?.(last)}/></>}
    <div className={`q2-scroll ${singlePage?"q2-paged":""}`} ref={scroll}
      onScroll={()=>{const p=viewingPage();if(p)visible(p,1);if((scroll.current?.scrollTop??Infinity)<250)void loadEarlier();}}
      onWheel={()=>{selectedReading.current=null;}}
      onKeyDown={e=>{if(["ArrowDown","ArrowUp","PageDown","PageUp","Home","End"," "].includes(e.key))selectedReading.current=null;}}
      onPointerDownCapture={e=>{if(turning.current)return;swiped.current=false;pointer.current={x:e.clientX,y:e.clientY,t:e.timeStamp};}}
      onPointerMove={e=>{const p=pointer.current;if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;if(Math.abs(dy)>10)selectedReading.current=null;if(!singlePage)return;if(!p.axis&&Math.hypot(dx,dy)>10)p.axis=Math.abs(dx)>Math.abs(dy)*1.3?"x":"y";if(p.axis!=="x")return;swiped.current=true;e.currentTarget.setPointerCapture(e.pointerId);const atEnd=swipeDestination(page,dx,0)===page;pageTurn.current?.style.setProperty("--q2-drag",`${dx*(atEnd?.15:.65)}px`);}}
      onPointerCancel={()=>{pointer.current=null;pageTurn.current?.style.removeProperty("--q2-drag");}}
      onPointerUpCapture={e=>{const p=pointer.current;pointer.current=null;if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;pageTurn.current?.style.removeProperty("--q2-drag");if(singlePage&&swiped.current){e.stopPropagation();void turn(swipeDestination(page,dx,dy),dx);return;}if(!(e.target as HTMLElement).closest("button")&&Math.hypot(dx,dy)<10&&e.timeStamp-p.t<300){setChrome(v=>!v);setTabbar(chrome);}}}
      onClickCapture={e=>{if(swiped.current){e.preventDefault();e.stopPropagation();swiped.current=false;}}}>
      <div key={singlePage?page:"scroll"} ref={pageTurn} className={`q2-page-turn ${singlePage&&turnDirection?`q2-turn-${turnDirection}`:""}`} onAnimationEnd={()=>setTurnDirection(null)}>
      {loaded?pages.map(n=><ReaderPage key={n} number={n} chapters={chapters} {...prefs} reciting={lesson?!!lesson.stream:false} marks={lesson?.marks??EMPTY_MARKS} hidden={(lesson?.hidden??false)||hidden} revealed={revealed} highlight={lesson?.highlight??null} peek={lesson?.peeked} lessonKeys={lesson?.keys} translations={translationMap} onVisible={lesson||singlePage?undefined:visible} onWord={onReaderWord}/>):<div className="q2-loading">Opening Quran…</div>}
      </div>
      {!singlePage&&pageWindow.last<604&&<Button variant="ghost" className="q2-load-next" onClick={()=>setPageWindow(old=>extendWindow(old,"after"))}>Next page <ChevronLeft size={15}/></Button>}
    </div>
    <div className="q2-bottom" inert={!chrome}>
      {elsewhere&&<section className="q2-elsewhere"><div>You’re reciting {chapters.find(c=>c.id===elsewhere.sura)?.name_simple} · ayah {elsewhere.aya}</div><Button size="sm" onClick={()=>void go(elsewhere.sura,elsewhere.aya,elsewhere.page,true)}>Go there</Button><Button variant="ghost" size="icon" aria-label="Dismiss recitation location" onClick={()=>{locationGeneration.current++;if(jumpTimer.current)clearTimeout(jumpTimer.current);setElsewhere(null);}}><X size={16}/></Button></section>}
      {error&&<p className="q2-notice" role="alert">{error}</p>}
      {voice.phase==="active"&&voice.mode==="follow"&&prefs.english&&first&&<p className="q2-english">{first.translation}</p>}
      {(player.playing||player.loading)&&<div className="q2-player"><Button variant="ghost" size="icon" aria-label={player.playing?"Pause recitation":"Play recitation"} onClick={()=>quranPlayer.toggle()}>{player.playing?<Pause size={17}/>:<Play size={17}/>}</Button><Button variant="ghost" onClick={()=>setSheet("reciter")}>{reciterName(findReciter(player.reciterId))}</Button><Button variant="ghost" onClick={()=>quranPlayer.setRate(player.rate===1?1.25:player.rate===1.25?.75:1)}>{player.rate}×</Button><Button variant="ghost" size="icon" aria-label="Close player" onClick={()=>quranPlayer.stop()}><X size={16}/></Button></div>}
      {voice.phase==="active"&&<><small className="q2-disclaimer">{voice.mode==="follow"?"Following only · no grading":AI_DISCLAIMER}{voice.mode==="smart"&&<span className="q2-disclaimer-hafs">Checks your recitation against Hafs 'an 'Asim.</span>}</small>{voice.mode==="follow"&&<Button variant="outline" onClick={()=>void voice.stop()}><Square size={13}/>Stop following</Button>}</>}
      {(hidden||lesson?.hidden)&&<div className="q2-reveal"><Button variant="outline" size="sm" onClick={()=>lesson?lesson.peek():reveal(false)}>Reveal word</Button><Button variant="outline" size="sm" onClick={()=>lesson?lesson.peek():reveal(true)}>Reveal ayah</Button></div>}
      <nav className="q2-actionbar" aria-label="Reader actions"><Button variant="ghost" onClick={play}><Play size={22}/><small>Play</small></Button><Button variant="ghost" onClick={()=>{const layout=nextLayout(prefs.layout);change({layout});toast(layout);}}><LayoutGrid size={22}/><small>Layout</small></Button><Button className="q2-mic" aria-label={voice.phase==="active"?"Stop microphone":"Start smart microphone"} disabled={lesson?.busy||voice.phase==="loading"||voice.phase==="finishing"} onClick={mic}>{voice.phase==="active"?<VoiceBars stream={voice.stream}/>:lesson?.stream?<VoiceBars stream={lesson.stream}/>:<Mic size={32}/>}</Button><Button variant="ghost" onClick={()=>setHidden(v=>!v)}>{hidden?<Eye size={22}/>:<EyeOff size={22}/>}<small>{hidden?"Show":"Hide"}<br/>verses</small></Button><Button variant="ghost" aria-label="Mistakes" onClick={()=>setSheet("mistakes")}><span className="q2-badge-icon"><MessageSquareCheck size={22}/>{!!mistakeCount(result)&&<b>{mistakeCount(result)}</b>}</span><small>Mistakes</small></Button><Button variant="ghost" size="icon" aria-label="More reader actions" onClick={()=>setSheet("more")}><MoreHorizontal size={20}/></Button></nav>
    </div>
    {tabbar&&chrome&&<div className="q2-tabs"><BottomNav/></div>}
    <VoiceConsent phase={voice.phase} progress={voice.progress} error={voice.error} begin={()=>{unlockHifzFeedbackAudio();seenMarks.current.clear();void voice.begin();}} cancel={voice.cancel}/>
    {sheet==="navigation"&&<ReaderNavigation chapters={chapters} recent={recent} bookmarks={bookmarks} go={(s,v,p)=>void go(s,v,p)} close={()=>setSheet(null)}/>}
    {sheet==="settings"&&<ReaderSettings prefs={prefs} change={change} page={page} chapters={chapters} close={()=>setSheet(null)}/>}
    {sheet==="reciter"&&<ReaderReciters selected={reciter} select={id=>{setReciter(id);const existing=JSON.parse(localStorage.getItem("adhkar:quran")??"{}");localStorage.setItem("adhkar:quran",JSON.stringify({...existing,reciter:id}));setSheet(null);}} close={()=>setSheet(null)}/>}
    {sheet==="mistakes"&&<ReaderMistakes result={result} recording={voice.recording} tips={tips} chapters={chapters} correct={correct} highlight={setHighlight} passages={sessionPassages.current} updates={debugUpdates.current} reset={()=>setConfirmReset(true)} listening={voice.phase==="active"||voice.phase==="finishing"} stopMic={()=>void voice.stop()} close={()=>setSheet(null)}/>}
    {sheet==="search"&&<ReaderSheet title="Find an ayah" close={()=>setSheet(null)}><ReaderSearch chapters={chapters} go={go}/><Button onClick={()=>{setSheet(null);if(lesson?.stream){toast("Stop your lesson microphone first");return;}void voice.request("search");}}><Mic size={18}/>Recite anything</Button></ReaderSheet>}
    {sheet==="more"&&<ReaderSheet title="Reader" close={()=>setSheet(null)}><div className="q2-menu">{!lesson&&voice.phase==="active"&&<Button variant="ghost" onClick={()=>setConfirmReset(true)}><RotateCcw/>Reset mistakes</Button>}<Button variant="ghost" onClick={()=>setSheet("echo")}><Repeat/>Echo mode</Button><Button variant="ghost" onClick={()=>{setSheet(null);if(lesson?.stream){toast("Stop your lesson microphone first");return;}void voice.request("follow");}}><Mic/>Follow the imam</Button><Button variant="ghost" onClick={()=>setSheet("reciter")}><Play/>Reciter</Button><Button variant="ghost" onClick={()=>{setSheet(null);if(lesson?.stream){toast("Stop your lesson microphone first");return;}void voice.request("search");}}><Search/>Find an ayah</Button><Button variant="ghost" onClick={bookmark}><Bookmark/>Bookmark this page</Button><Button variant="ghost" onClick={()=>setSheet("navigation")}><Bookmark/>Bookmarks</Button></div></ReaderSheet>}
    {sheet==="echo"&&<EchoMode modern keys={current?.verses.map(v=>v.key)??[]} reciter={reciter} close={()=>setSheet(null)} highlight={(keys,h)=>{setHidden(h);setHighlight(keys[0]?`${keys[0]}:1`:null);}}/>}
    {confirmReset&&<ReaderSheet title="Clear all mistakes from this session?" close={()=>{if(!resetting)setConfirmReset(false);}}><div className="q2-segments"><Button variant="outline" disabled={resetting} onClick={()=>setConfirmReset(false)}>Cancel</Button><Button disabled={resetting} onClick={()=>void resetSession()}><RotateCcw size={16}/>{resetting?"Clearing…":"Clear mistakes"}</Button></div></ReaderSheet>}
    {lesson?.overlays}
  </div></MushafThemeProvider></Portal>;
}
function ReaderSearch({chapters,go}:{chapters:Chapter[];go:(s:number,v?:number,p?:number)=>Promise<void>}){const[q,setQ]=useState("");return <><label className="q2-search"><Search size={17}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Surah name or ayah (67:3)"/></label>{/^\d+:\d+$/.test(q)&&<Button variant="outline" onClick={()=>{const[s,v]=q.split(":").map(Number);void go(s,v);}}>Open {q}</Button>}{chapters.filter(c=>matchesSurahSearch(c,q)).map(c=><Button variant="ghost" className="q2-nav-row" key={c.id} onClick={()=>void go(c.id)}>{c.name_simple}<span className="q2-surah-name">{String(c.id).padStart(3,"0")}</span></Button>)}</>;}