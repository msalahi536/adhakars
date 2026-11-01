import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronRight, Play, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { loadState, saveState, weakSpotList, recordReview, performanceFromAI, todayISO, type HifzState } from "@/lib/hifz";
import type { WeakSpotView } from "@/lib/hifz/insights";
import { getVerseDetail, getAyahAudio, type VerseDetail } from "@/lib/tafsir";
import { diffAyat } from "@/lib/hifz-ai";
import { analyzeAttempt, type Attempt } from "@/components/recite/ai-performance";
import { useAiRecitation } from "@/components/recite/use-ai-recitation";
import { AiResultSheet } from "@/components/recite/AiResultSheet";
import { reciteChaptersOptions } from "@/lib/recite/data";
import { play as feedback } from "@/lib/hifzHaptics";
import { quranPlayer } from "@/lib/quran-player";
import { recitationPlayer } from "@/lib/recitation-player";
import "./practice.css";
import "./enhancements.css";
export function WeakSpots() {
  const navigate = useNavigate(); const chapters = useSuspenseQuery(reciteChaptersOptions).data;
  const [state, setState] = useState<HifzState | null>(null);
  const [queue, setQueue] = useState<WeakSpotView[]>([]); const [position, setPosition] = useState(0); const [part, setPart] = useState(0);
  const [texts, setTexts] = useState<Record<string, VerseDetail>>({}); const [error, setError] = useState("");
  const [attempt, setAttempt] = useState<Attempt | null>(null); const [comparing, setComparing] = useState(true);
  const processed = useRef<unknown>(null); const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => { setState(loadState()); return () => audio.current?.pause(); }, []);
  const spots = state ? weakSpotList(state, todayISO()) : [];
  const spot = queue[position];
  const keyFor = (s: WeakSpotView) => s.word?.split(":").slice(0, 2).join(":") ?? s.ayah ?? s.mixUp?.from ?? "";
  const verse = spot?.mixUp && part === 1 ? spot.mixUp.to : spot ? keyFor(spot) : "";
  const [sura, aya] = verse.split(":").map(Number);
  const ranges = verse ? [{ sura, first: aya, last: aya }] : [];
  const ai = useAiRecitation(position * 2 + part, true, texts[verse]?.words.map((_, i) => `${verse}:${i + 1}`) ?? []);
  const stateRef = useRef(state); stateRef.current = state;
  const references = [...new Set([...spots, ...queue].flatMap((s) => { const key = keyFor(s); const [surah, ayah] = key.split(":").map(Number); return [key, s.mixUp?.to, s.kind === "transition" && ayah > 1 ? `${surah}:${ayah - 1}` : null]; }).filter((v): v is string => !!v))].join(",");
  useEffect(() => { let canceled = false; if (!references) return; void Promise.all(references.split(",").map(getVerseDetail)).then((v) => { if (!canceled) setTexts(Object.fromEntries(v.map((a) => [a.key, a]))); }).catch(() => { if (!canceled) setError("The ayat couldn’t load. Please retry."); }); return () => { canceled = true; }; }, [references]);
  useEffect(() => {
    if (ai.phase !== "finished" || !ai.result || processed.current === ai.result || !spot) return;
    processed.current = ai.result; const result = ai.result;
    let canceled = false;
    void analyzeAttempt(result, ranges, result.words.map((w) => w.key)).then((value) => {
      if (canceled) return; setAttempt(value);
      const current = stateRef.current; if (!current) return;
      const next = structuredClone(current); const perf = performanceFromAI(value.result, value.hes, value.drifts);
      if (value.clean) {
        feedback("pageComplete");
        if (!spot.mixUp || part === 1) perf.passedKeys = [...new Set([...(perf.passedKeys ?? []), spot.key])];
        else perf.passedKeys = perf.passedKeys?.filter((k) => k !== spot.key);
      }
      recordReview(next, spot.page, perf, todayISO(), "drill"); saveState(next); setState(next);
    }); return () => { canceled = true; };
  }, [ai.phase, ai.result]);
  async function playAyah(key: string) { if (ai.phase === "listening") return; audio.current?.pause(); try { const url = await getAyahAudio(key); if (url) { audio.current = new Audio(url); await audio.current.play(); } } catch { setError("Audio couldn’t play. Please retry."); } }
  async function playWord(key: string) {
    if (ai.phase === "listening") return; audio.current?.pause();
    try { const [s,a,w] = key.split(":"); const r = await fetch(`https://api.quran.com/api/v4/verses/by_key/${s}:${a}?words=true&word_fields=audio_url`); if (!r.ok) throw new Error("audio"); const data = await r.json() as {verse:{words:{position:number;audio_url?:string}[]}}; const url = data.verse.words.find((word) => word.position === Number(w))?.audio_url; if (url) { audio.current = new Audio(`https://audio.qurancdn.com/${url}`); await audio.current.play(); } } catch { setError("Word audio couldn’t play. Please retry."); }
  }
  const next = () => { ai.reset(); setAttempt(null); if (spot?.mixUp && part === 0) { setPart(1); return; } setPart(0); setPosition((n) => n + 1); setComparing(true); };
  const compareA = spot?.mixUp ? texts[spot.mixUp.from] : null; const compareB = spot?.mixUp ? texts[spot.mixUp.to] : null;
  const diff = compareA && compareB ? diffAyat(compareA.words.map((w) => w.ar), compareB.words.map((w) => w.ar)) : null;
  return <main className="hp-page"><header className="hz-home-header"><HeaderBackButton onBack={() => { ai.cancel(); void navigate({ to: "/app/hifz" }); }} /></header><div className="hp-content hx-panel"><h1 className="app-page-title">My weak spots</h1>
    {!spot ? <><p className="hp-note">{queue.length ? "Practice complete. Your progress is saved." : "A little focused practice, at your pace."}</p><Button disabled={!spots.length} onClick={() => { setQueue(spots); setPosition(0); }}><Target size={16} />Drill all</Button>{!spots.length && <p>No weak spots recorded yet.</p>}{(["word", "transition", "mutashabih"] as const).map((kind) => <section key={kind}><h2>{kind === "word" ? "Words" : kind === "transition" ? "Ayah starts" : "Similar ayat"}</h2>{spots.filter((s) => s.kind === kind).map((s) => <Button variant="ghost" className="hx-spot-row" key={s.key} onClick={() => { setQueue([s]); setPosition(0); setPart(0); setComparing(true); }}><span><strong dir="rtl">{s.word ? texts[keyFor(s)]?.words[Number(s.word.split(":")[2]) - 1]?.ar ?? texts[keyFor(s)]?.arabic : texts[keyFor(s)]?.arabic ?? "Loading ayah…"}</strong><small>{chapters.find((c) => c.id === Number(keyFor(s).split(":")[0]))?.name_simple} · {keyFor(s).split(":")[1]} · page {s.page}{s.mixUp && ` → ${s.mixUp.to}`}</small><progress className="hx-strength" max={1} value={s.strength} aria-label={`Strength ${Math.round(s.strength * 100)}%`} /></span><ChevronRight size={17} /></Button>)}</section>)}</> : <><p className="hp-note">Practice {position + 1} of {queue.length} · page {spot.page}</p>{spot.mixUp && comparing ? <><h2>Spot the difference</h2>{diff ? [compareA, compareB].map((v, i) => v && <section key={v.key} className="hx-ayah-block"><Button variant="ghost" onClick={() => void playAyah(v.key)}><Play size={15} />{v.key}</Button><p dir="rtl" className="hx-arabic">{(i === 0 ? diff.a : diff.b).map((w, n) => <span key={n} className={w.same ? "" : "bg-accent/20"}>{w.text} </span>)}</p><p>{v.translation}</p></section>) : <p>Loading ayat…</p>}<Button onClick={() => setComparing(false)}>Recite each ayah</Button></> : <><h2>{chapters.find((c) => c.id === sura)?.name_simple} · ayah {aya}</h2>{spot.kind === "transition" && aya > 1 && <p className="hx-echo-text" dir="rtl">{texts[`${sura}:${aya - 1}`]?.words.slice(-3).map((w) => w.ar).join(" ")}</p>}{spot.kind === "transition" && aya === 1 && <p>Begin the surah from memory.</p>}{spot.kind !== "transition" && <p className="hx-echo-text" dir="rtl">{texts[verse]?.arabic}</p>}<Button onClick={() => void (ai.phase === "listening" ? ai.stop() : ai.request(ranges))} disabled={ai.phase === "loading" || ai.phase === "stopping"}>{ai.phase === "listening" ? "Stop recitation" : "Recite"}</Button></>}
    {ai.phase === "download" && <><p>Download checker (73 MB). Wi-Fi recommended.</p><Button onClick={() => void ai.confirm()}>Download &amp; start</Button><Button variant="ghost" onClick={ai.cancel}>Not now</Button></>}
    {(ai.phase === "loading" || ai.phase === "stopping") && <p role="status">{ai.phase === "loading" ? `Preparing · ${Math.round(ai.progress * 100)}%` : "Checking…"}</p>}
    {ai.phase === "error" && <p role="alert">{ai.error}</p>}
    {attempt && <AiResultSheet attempt={attempt} passes={0} lesson={false} chapters={chapters} recording={ai.recording} again={() => { ai.reset(); setAttempt(null); }} next={next} close={() => { ai.discardRecording(); setAttempt(null); }} wordAudio={(key) => void playAyah(key.split(":").slice(0, 2).join(":"))} ayahAudio={(key) => void playAyah(key)} />}
    </>}{error && <p role="alert">{error}</p>}</div></main>;
}