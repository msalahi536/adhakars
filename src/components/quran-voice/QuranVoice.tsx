import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, AudioLines, Expand, Loader2, Mic, StopCircle } from "lucide-react";
import { Portal } from "@/components/Portal";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MushafThemeProvider } from "@/components/mushaf/MushafPage";
import { getPresetId, resolveVisualPhase } from "@/lib/theme-store";
import { getVerseByKey, type VerseHit } from "@/lib/quran";
import { loadPageFont, reciteChaptersOptions, recitePageOptions } from "@/lib/recite/data";
import type { FollowPosition, SearchAnswer } from "@/lib/hifz-ai";
import { MadaniPage } from "./MadaniPage";
import { englishByDefault, paintPosition, searchPresentation } from "./rules";
import { useVoiceSession, type Match } from "./useVoiceSession";
import { VoiceConsent } from "./VoiceConsent";
import { VoiceBars } from "./VoiceBars";
import { followPage } from "./page-layout";
import { prepareWordPages, wordPages } from "./word-pages";
import "./voice.css";

export function QuranVoice({mode, initialPage = 1}: {mode:"follow"|"search"|"mushaf"; initialPage?:number}) {
  const navigate = useNavigate();
  const [preset, setPreset] = useState("original");
  const [phase, setPhase] = useState<"morning"|"evening">("morning");
  useEffect(() => { setPreset(getPresetId()); setPhase(resolveVisualPhase()); }, []);
  const theme = preset === "lavender" ? "twilight" : preset === "dark-red" ? "darkred" : preset;
  return <Portal><MushafThemeProvider theme={theme} mode={phase} className="qv-screen" style={{"--m-font-quran":"var(--font-arabic)"} as React.CSSProperties}>
    {mode === "search" ? <VoiceSearch onOpen={(page) => void navigate({to:"/app/quran",search:{voice:"mushaf",page}})} /> : <FollowImam mode={mode} initialPage={initialPage} />}
  </MushafThemeProvider></Portal>;
}
function Back() {
  const navigate = useNavigate();
  return <Button variant="ghost" size="icon" aria-label="Back to Quran" onClick={() => void navigate({to:"/app/quran",search:{}})}><ArrowLeft size={20} /></Button>;
}
function FollowImam({mode,initialPage}: {mode:"follow"|"mushaf"; initialPage:number}) {
  const queryClient = useQueryClient();
  const [preparing, setPreparing] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [page, setPage] = useState(initialPage);
  const [font, setFont] = useState<string|null>(null);
  const [fontError, setFontError] = useState(false);
  const [fontRetry, setFontRetry] = useState(0);
  const [english, setEnglish] = useState(true);
  const [large, setLarge] = useState(false);
  const [tip, setTip] = useState(false);
  const [translation, setTranslation] = useState<VerseHit|null>(null);
  const [previousTranslation, setPreviousTranslation] = useState<VerseHit|null>(null);
  const translationRef = useRef<VerseHit|null>(null);
  const [verseError, setVerseError] = useState(false);
  const [locked, setLocked] = useState(true);
  const [ayah, setAyah] = useState<{sura:number;aya:number}|null>(null);
  const root = useRef<HTMLDivElement|null>(null);
  const label = useRef<HTMLDivElement|null>(null);
  const current = useRef<FollowPosition|null>(null);
  const ayahKey = useRef("");
  const loadedPage = useRef(page);
  const pageData = useQuery(recitePageOptions(page));
  const chapters = useQuery(reciteChaptersOptions);
  const names = useRef(chapters.data); names.current = chapters.data;
  useEffect(() => {
    if (mode === "follow") void prepareWordPages().catch(() => { /* Retry before microphone start. */ });
  }, [mode]);
  useEffect(() => {
    for (const adjacent of [page - 1, page + 1]) {
      if (adjacent < 1 || adjacent > 604) continue;
      void queryClient.prefetchQuery(recitePageOptions(adjacent));
      void loadPageFont(adjacent);
    }
  }, [page, queryClient]);
  useEffect(() => {
    const language = document.documentElement.lang || navigator.language;
    setEnglish(englishByDefault(language));
    if (mode === "follow" && localStorage.getItem("quran:follow-tip") !== "1") setTip(true);
  }, [mode]);
  useEffect(() => {
    let active = true; setFont(null); setFontError(false);
    void loadPageFont(page).then((f) => { if (active) { setFont(f); setFontError(!f); } });
    return () => { active = false; };
  }, [page,fontRetry]);
  const turnToWord = useCallback((p: FollowPosition) => {
    const target = followPage(p, wordPages, loadedPage.current);
    if (target === loadedPage.current) return;
    loadedPage.current = target;
    setPage(target);
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) root.current?.animate([{opacity:.4,transform:"translateX(16px)"},{opacity:1,transform:"translateX(0)"}],{duration:280,easing:"ease-out"});
  }, []);
  const renderHighlight = useCallback(() => {
    const p = current.current; if (!p) return;
    const key = `${p.sura}:${p.aya}:${p.word}`;
    if (p.locked && !root.current?.querySelector(`[data-follow-word="${key}"]`)) turnToWord(p);
    paintPosition(root.current, key, p.locked);
  }, [turnToWord]);
  const onPosition = useCallback((p:FollowPosition) => {
    current.current = p;
    turnToWord(p);
    paintPosition(root.current, `${p.sura}:${p.aya}:${p.word}`, p.locked);
    if (label.current) label.current.textContent = p.locked ? `${names.current?.find((c)=>c.id===p.sura)?.name_simple ?? `Surah ${p.sura}`} · ayah ${p.aya}` : "Finding the imam…";
    setLocked((old) => old === p.locked ? old : p.locked);
    const key = `${p.sura}:${p.aya}`;
    if (p.locked && ayahKey.current !== key) {
      ayahKey.current = key; setAyah({sura:p.sura,aya:p.aya});
    }
  }, [turnToWord]);
  const voice = useVoiceSession("follow",onPosition,()=>undefined);
  useEffect(() => {
    if (!ayah) return;
    let active = true; setVerseError(false);
    const key = `${ayah.sura}:${ayah.aya}`;
    void getVerseByKey(key).then((verse) => {
      if (!active) return;
      setPreviousTranslation(translationRef.current); translationRef.current=verse; setTranslation(verse);
    }).catch(()=> { if(active) setVerseError(true); });
    return()=>{active=false;};
  }, [ayah]);
  // Wake locks are visibility-sensitive: reacquire after a return to the app and release on stop/exit.
  useEffect(() => {
    if (voice.phase !== "active") return;
    let active=true; let wake:WakeLockSentinel|null=null;
    const acquire = async() => {
      if (document.visibilityState !== "visible" || !navigator.wakeLock) return;
      try { const lock=await navigator.wakeLock.request("screen"); if(active) wake=lock; else await lock.release(); } catch { /* Browser does not support an awake screen in this context. */ }
    };
    void acquire(); document.addEventListener("visibilitychange",acquire);
    return()=>{active=false;document.removeEventListener("visibilitychange",acquire);void wake?.release();};
  },[voice.phase]);
  const idle = voice.phase !== "active" && voice.phase !== "finishing";
  const start = async () => {
    setPreparing(true); setLocationError(false);
    try {
      await prepareWordPages();
      if (label.current) label.current.textContent="Finding the imam…";
      setLocked(false); await voice.request();
    } catch { setLocationError(true); }
    finally { setPreparing(false); }
  };
  return <main className={`qv-follow ${english ? "has-english":""} ${large ? "is-large":""}`}>
    <header className="qv-header"><Back /><div ref={label} className="qv-position-pill" role="status">{mode === "mushaf" ? "Madani mushaf" : "Follow the imam"}</div><span className="w-9" /></header>
    <div className="qv-page-slot" ref={root}>
      {pageData.data && font && chapters.data ? <MadaniPage page={pageData.data} font={font} chapters={chapters.data} ready={renderHighlight} /> : <div className="qv-loading">{pageData.error || fontError ? <><p>Couldn’t load this mushaf page.</p><Button variant="outline" onClick={()=>{void pageData.refetch();setFontRetry((n)=>n+1);}}>Retry</Button></> : <><Loader2 className="animate-spin" /><span>Loading mushaf…</span></>}</div>}
    </div>
    {english && <section className="qv-translation" aria-live="polite">{verseError ? <p className="qv-status">Translation unavailable. Checking the next ayah…</p> : translation ? <><p key={`previous-${translation.key}`} className="qv-translation-previous" aria-hidden="true">{previousTranslation?.translation}</p><p key={translation.key}>{translation.translation}</p></> : <p className="qv-status">{mode === "follow" ? "English · Sahih International" : pageData.data?.verses[0]?.translation}</p>}</section>}
    <footer className="qv-dock"><div className="qv-follow-options"><label htmlFor="qv-english">English</label><Switch id="qv-english" checked={english} onCheckedChange={setEnglish}/>{english && <Button variant="ghost" size="icon" aria-label={large?"Smaller English text":"Larger English text"} aria-pressed={large} onClick={()=>setLarge(!large)}><Expand size={16}/></Button>}</div>
      {mode === "follow" && <Button className="qv-action" onClick={idle?()=>void start():()=>void voice.stop()} disabled={preparing || voice.phase === "finishing" || voice.phase === "loading"}>{idle?<AudioLines size={18}/>:<StopCircle size={18}/>} {preparing?"Preparing mushaf…":idle?"Start following":voice.phase==="finishing"?"Stopping…":"Stop following"}</Button>}
      {locationError && <span role="alert" className="qv-status">Couldn’t load word locations. Check your connection and try again.</span>}
      {!locked && voice.phase === "active" && <span className="qv-status">Listening for the next ayah</span>}
    </footer>
    <VoiceConsent {...voice} begin={()=>void voice.begin()}/>
    {tip && <div className="qv-backdrop"><section className="qv-sheet" role="dialog" aria-modal="true" aria-label="Follow the imam tip"><h2>Follow the imam</h2><p>For Taraweeh, halaqa or recordings. Place your phone where you can hear the imam clearly.</p><Button onClick={()=>{localStorage.setItem("quran:follow-tip","1");setTip(false);}}>Got it</Button></section></div>}
  </main>;
}
type Result = {match:Match;verse:VerseHit;page:number};
function VoiceSearch({onOpen}:{onOpen:(page:number)=>void}) {
  const [results,setResults]=useState<Result[]|null>(null);
  const [answer,setAnswer]=useState<SearchAnswer|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const requestId=useRef(0);
  useEffect(()=>()=>{requestId.current++;},[]);
  const chapters=useQuery(reciteChaptersOptions);
  const receive=useCallback((answer:SearchAnswer)=>{
    const id=++requestId.current; setAnswer(answer);setLoading(true);setError("");
    void Promise.all(searchPresentation(answer).matches.map(async(match)=>{
      const key=`${match.sura}:${match.aya}`;
      const [verse,response]=await Promise.all([getVerseByKey(key),fetch(`https://api.quran.com/api/v4/verses/by_key/${key}?fields=page_number`)]);
      if(!response.ok) throw new Error("Could not load ayah");
      const {verse:raw}=await response.json() as {verse:{page_number:number}};
      return {match,verse,page:raw.page_number};
    })).then((data)=>{if(id===requestId.current)setResults(data);}).catch(()=>{if(id===requestId.current)setError("Couldn’t load the ayah. Check your connection and try again.");}).finally(()=>{if(id===requestId.current)setLoading(false);});
  },[]);
  const voice=useVoiceSession("search",()=>undefined,receive);
  const active=voice.phase==="active";
  const start=()=>{requestId.current++;setAnswer(null);setResults(null);setError("");setLoading(false);void voice.request();};
  const samePhrase=answer ? searchPresentation(answer).samePhrase : [];
  const name=(sura:number)=>chapters.data?.find((c)=>c.id===sura)?.name_simple ?? `Surah ${sura}`;
  const openOccurrence=async(sura:number,aya:number)=>{
    const id=requestId.current;
    try {
      const response=await fetch(`https://api.quran.com/api/v4/verses/by_key/${sura}:${aya}?fields=page_number`);
      if(!response.ok) throw new Error("Could not load ayah");
      const {verse}=await response.json() as {verse:{page_number:number}};
      if(id===requestId.current)onOpen(verse.page_number);
    } catch {if(id===requestId.current)setError("Couldn’t load the ayah. Check your connection and try again.");}
  };
  return <main><header className="qv-header"><Back/><h1>Find an ayah</h1><span className="w-9"/></header>
    <div className="qv-search-content"><div className="qv-search-title"><AudioLines className="qv-voice-emblem"/><h1>Find an ayah</h1><p>Recite a few words</p></div>
      {active && <VoiceBars stream={voice.stream}/>}
      {(active || voice.phase==="finishing" || loading) && <p className="qv-status" role="status">{active?"Keep reciting…":"Finding your ayah…"}</p>}
      {error && <p role="alert">{error}</p>}
      {answer && !answer.confident && <><p className="qv-status" role="status">Not sure yet. Recite a little more</p>{!!results?.length && <h2 className="qv-also">Maybe</h2>}</>}
      {results?.map((result)=><article key={result.verse.key} className={`qv-match ${answer?.confident ? "":"qv-guess"}`}><h2>{name(result.match.sura)} · ayah {result.match.aya}</h2><p className="qv-match-arabic" lang="ar" dir="rtl">{result.verse.text}</p><p className="qv-match-english">{result.verse.translation}</p><Button variant={answer?.confident?"default":"outline"} onClick={()=>onOpen(result.page)}>Open in mushaf</Button></article>)}
      {answer?.confident && samePhrase.length>0 && <details className="qv-occurrences"><summary>These words also appear in {samePhrase.length} other places</summary>{samePhrase.map((m)=><Button key={`${m.sura}:${m.aya}`} variant="ghost" onClick={()=>void openOccurrence(m.sura,m.aya)}>{name(m.sura)} · ayah {m.aya}<span aria-hidden="true">→</span></Button>)}</details>}
    </div><footer className="qv-dock"><Button className="qv-action" disabled={voice.phase==="finishing"||voice.phase==="loading"||loading} onClick={active?()=>void voice.stop():start}>{active?<StopCircle size={18}/>:<Mic size={18}/>} {active?"Stop listening":voice.phase==="finishing"?"Finding…":"Recite a few words"}</Button></footer>
    <VoiceConsent {...voice} begin={()=>void voice.begin()}/>
  </main>;
}