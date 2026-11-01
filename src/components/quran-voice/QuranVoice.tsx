import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, AudioLines, Expand, Loader2, Mic, StopCircle } from "lucide-react";
import { Portal } from "@/components/Portal";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MushafThemeProvider } from "@/components/mushaf/MushafPage";
import { getPresetId, resolveVisualPhase } from "@/lib/theme-store";
import { getVerseByKey, type VerseHit } from "@/lib/quran";
import { loadPageFont, reciteChaptersOptions, recitePageOptions } from "@/lib/recite/data";
import type { FollowPosition } from "@/lib/hifz-ai/follow";
import { MadaniPage } from "./MadaniPage";
import { distinctMatches, englishByDefault, paintPosition } from "./rules";
import { useVoiceSession, type Match } from "./useVoiceSession";
import { VoiceConsent } from "./VoiceConsent";
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
  const [page, setPage] = useState(initialPage);
  const [font, setFont] = useState<string|null>(null);
  const [fontError, setFontError] = useState(false);
  const [fontRetry, setFontRetry] = useState(0);
  const [english, setEnglish] = useState(true);
  const [large, setLarge] = useState(false);
  const [tip, setTip] = useState(false);
  const [translation, setTranslation] = useState<VerseHit|null>(null);
  const [verseError, setVerseError] = useState(false);
  const [locked, setLocked] = useState(true);
  const [ayah, setAyah] = useState<{sura:number;aya:number}|null>(null);
  const root = useRef<HTMLDivElement|null>(null);
  const label = useRef<HTMLDivElement|null>(null);
  const current = useRef<FollowPosition|null>(null);
  const ayahKey = useRef("");
  const loadedPage = useRef(page); loadedPage.current = page;
  const pageData = useQuery(recitePageOptions(page));
  const chapters = useQuery(reciteChaptersOptions);
  const names = useRef(chapters.data); names.current = chapters.data;
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
  const renderHighlight = useCallback(() => {
    if (current.current) paintPosition(root.current, current.current.key, current.current.locked);
  }, []);
  const onPosition = useCallback((p:FollowPosition) => {
    current.current = p;
    paintPosition(root.current, `${p.sura}:${p.aya}:${p.word}`, p.locked);
    if (label.current) label.current.textContent = p.locked ? `${names.current?.find((c)=>c.id===p.sura)?.name_simple ?? `Surah ${p.sura}`} · ayah ${p.aya}` : "Finding the imam…";
    setLocked((old) => old === p.locked ? old : p.locked);
    const key = `${p.sura}:${p.aya}`;
    if (p.locked && ayahKey.current !== key) {
      ayahKey.current = key; setAyah({sura:p.sura,aya:p.aya});
    }
  }, []);
  const voice = useVoiceSession("follow",onPosition,()=>undefined);
  useEffect(() => {
    if (!ayah) return;
    let active = true; setVerseError(false);
    const key = `${ayah.sura}:${ayah.aya}`;
    void Promise.all([
      getVerseByKey(key),
      fetch(`https://api.quran.com/api/v4/verses/by_key/${key}?fields=page_number`).then(async(r) => {
        if (!r.ok) throw new Error("Page unavailable");
        return (await r.json() as {verse:{page_number:number}}).verse.page_number;
      }),
    ]).then(([verse,target]) => {
      if (!active) return; setTranslation(verse);
      if (target !== loadedPage.current) {
        setPage(target);
        if (!matchMedia("(prefers-reduced-motion: reduce)").matches) root.current?.animate([{opacity:.4,transform:"translateX(16px)"},{opacity:1,transform:"translateX(0)"}],{duration:280,easing:"ease-out"});
      }
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
  const start = () => { if (label.current) label.current.textContent="Finding the imam…"; setLocked(false); void voice.request(); };
  return <main className={`qv-follow ${english ? "has-english":""} ${large ? "is-large":""}`}>
    <header className="qv-header"><Back /><div ref={label} className="qv-position-pill" role="status">{mode === "mushaf" ? "Madani mushaf" : "Follow the imam"}</div><span className="w-9" /></header>
    <div className="qv-page-slot" ref={root}>
      {pageData.data && font && chapters.data ? <MadaniPage page={pageData.data} font={font} chapters={chapters.data} ready={renderHighlight} /> : <div className="qv-loading">{pageData.error || fontError ? <><p>Couldn’t load this mushaf page.</p><Button variant="outline" onClick={()=>{void pageData.refetch();setFontRetry((n)=>n+1);}}>Retry</Button></> : <><Loader2 className="animate-spin" /><span>Loading mushaf…</span></>}</div>}
    </div>
    {english && <section className="qv-translation" aria-live="polite">{verseError ? <p className="qv-status">Translation unavailable. Checking the next ayah…</p> : translation ? <p key={translation.key}>{translation.translation}</p> : <p className="qv-status">{mode === "follow" ? "English · Sahih International" : pageData.data?.verses[0]?.translation}</p>}</section>}
    <footer className="qv-dock"><div className="qv-follow-options"><label htmlFor="qv-english">English</label><Switch id="qv-english" checked={english} onCheckedChange={setEnglish}/>{english && <Button variant="ghost" size="icon" aria-label={large?"Smaller English text":"Larger English text"} aria-pressed={large} onClick={()=>setLarge(!large)}><Expand size={16}/></Button>}</div>
      {mode === "follow" && <Button className="qv-action" onClick={idle?start:()=>void voice.stop()} disabled={voice.phase === "finishing" || voice.phase === "loading"}>{idle?<AudioLines size={18}/>:<StopCircle size={18}/>} {idle?"Start following":voice.phase==="finishing"?"Stopping…":"Stop following"}</Button>}
      {!locked && voice.phase === "active" && <span className="qv-status">Listening for the next ayah</span>}
    </footer>
    <VoiceConsent {...voice} begin={()=>void voice.begin()}/>
    {tip && <div className="qv-backdrop"><section className="qv-sheet" role="dialog" aria-modal="true" aria-label="Follow the imam tip"><h2>Follow the imam</h2><p>For Taraweeh, halaqa or recordings. Place your phone where you can hear the imam clearly.</p><Button onClick={()=>{localStorage.setItem("quran:follow-tip","1");setTip(false);}}>Got it</Button></section></div>}
  </main>;
}
type Result = {match:Match;verse:VerseHit;page:number};
function VoiceSearch({onOpen}:{onOpen:(page:number)=>void}) {
  const [results,setResults]=useState<Result[]|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const requestId=useRef(0);
  useEffect(()=>()=>{requestId.current++;},[]);
  const chapters=useQuery(reciteChaptersOptions);
  const receive=useCallback((matches:Match[])=>{
    const id=++requestId.current; setLoading(true);setError("");
    void Promise.all(distinctMatches(matches).map(async(match)=>{
      const key=`${match.sura}:${match.aya}`;
      const [verse,response]=await Promise.all([getVerseByKey(key),fetch(`https://api.quran.com/api/v4/verses/by_key/${key}?fields=page_number`)]);
      if(!response.ok) throw new Error("Could not load ayah");
      const {verse:raw}=await response.json() as {verse:{page_number:number}};
      return {match,verse,page:raw.page_number};
    })).then((data)=>{if(id===requestId.current)setResults(data);}).catch(()=>{if(id===requestId.current)setError("Couldn’t load the ayah. Check your connection and try again.");}).finally(()=>{if(id===requestId.current)setLoading(false);});
  },[]);
  const voice=useVoiceSession("search",()=>undefined,receive);
  const active=voice.phase==="active";
  const start=()=>{requestId.current++;setResults(null);setError("");setLoading(false);void voice.request();};
  return <main><header className="qv-header"><Back/><h1>Find an ayah</h1><span className="w-9"/></header>
    <div className="qv-search-content"><div className="qv-search-title"><AudioLines className="qv-voice-emblem"/><h1>Find an ayah</h1><p>Recite a few words</p></div>
      {(active || voice.phase==="finishing" || loading) && <p className="qv-status" role="status">{active?`Listening · ${voice.remaining}s`:"Finding your ayah…"}</p>}
      {error && <p role="alert">{error}</p>}
      {results?.length===0 && <p className="qv-status">Couldn’t find that, try reciting a little more.</p>}
      {results?.map((result,i)=><div key={result.verse.key}>{i===1 && <h2 className="qv-also">Also similar</h2>}<article className="qv-match"><h2>{chapters.data?.find((c)=>c.id===result.match.sura)?.name_simple ?? `Surah ${result.match.sura}`} · ayah {result.match.aya}</h2><p className="qv-match-arabic" lang="ar" dir="rtl">{result.verse.text}</p><p className="qv-match-english">{result.verse.translation}</p><Button variant={i===0?"default":"outline"} onClick={()=>onOpen(result.page)}>Open in mushaf</Button></article></div>)}
    </div><footer className="qv-dock"><Button className="qv-action" disabled={voice.phase==="finishing"||loading} onClick={active?()=>void voice.stop():start}>{active?<StopCircle size={18}/>:<Mic size={18}/>} {active?"Stop recording":voice.phase==="finishing"?"Finding…":"Recite a few words"}</Button></footer>
    <VoiceConsent {...voice} begin={()=>void voice.begin()}/>
  </main>;
}