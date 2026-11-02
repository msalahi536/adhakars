import { useEffect, useRef, useState } from "react";
import { Check, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getChapterAudio, getVerseByKey } from "@/lib/quran";
import { quranPlayer } from "@/lib/quran-player";
import { recitationPlayer } from "@/lib/recitation-player";
import { useAiRecitation } from "@/components/recite/use-ai-recitation";
import { cleanRecitation } from "@/components/recite/ai-performance";
import { ECHO_DEFAULTS, echoSequence } from "./enhancement-rules";
import "./enhancements.css";

export function EchoMode({ keys, reciter, close, highlight, modern = false }: { keys: string[]; reciter: number; close: () => void; highlight?: (keys: string[], hidden: boolean) => void; modern?: boolean }) {
  const [settings, setSettings] = useState(ECHO_DEFAULTS);
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState<"listen" | "repeat" | "idle">("idle");
  const [caption, setCaption] = useState("");
  const [current, setCurrent] = useState<string[]>([]);
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [correct, setCorrect] = useState(false);
  const token = useRef(0);
  const audio = useRef<HTMLAudioElement | null>(null);
  const release = useRef<(() => void) | null>(null);
  const ai = useAiRecitation(0, true, []);
  const aiRef = useRef(ai); aiRef.current = ai;
  const mark = useRef(highlight); mark.current = highlight;
  const keyString = keys.join(",");
  useEffect(() => { let canceled = false; void Promise.all(keys.map(getVerseByKey)).then((v) => { if (!canceled) setTexts(Object.fromEntries(v.map((a) => [a.key, a.text]))); }).catch(() => { if (!canceled) setError("The ayat couldn’t load. Please retry."); }); return () => { canceled = true; }; }, [keyString]);
  function stop() { token.current++; audio.current?.pause(); release.current?.(); release.current = null; aiRef.current.cancel(); mark.current?.([], false); setRunning(false); setStage("idle"); }
  useEffect(() => () => { token.current++; audio.current?.pause(); release.current?.(); aiRef.current.cancel(); mark.current?.([], false); }, []);
  const wait = (milliseconds: number, id: number) => new Promise<void>((resolve) => { const timer = setTimeout(() => { release.current = null; resolve(); }, milliseconds); release.current = () => { clearTimeout(timer); resolve(); }; if (token.current !== id) release.current(); });
  async function playAyah(key: string, id: number) {
    const data = await getChapterAudio(reciter, Number(key.split(":")[0]));
    if (token.current !== id) return 0;
    const timing = data.timings.find((t) => t.key === key); if (!timing) throw new Error("This reciter has no ayah timestamps. Choose a timed Quran.com reciter.");
    const a = new Audio(data.url); audio.current = a; a.playbackRate = settings.speed;
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const finish = () => { if (settled) return; settled = true; a.pause(); a.ontimeupdate = null; release.current = null; resolve(); };
      release.current = finish;
      a.onloadedmetadata = () => { a.currentTime = timing.from / 1000; };
      a.ontimeupdate = () => { if (a.currentTime >= timing.to / 1000 || token.current !== id) finish(); };
      a.onended = finish; a.onerror = () => { finish(); reject(new Error("Qari audio couldn’t play. Please retry.")); };
      void a.play().catch((e) => { finish(); reject(e); });
    });
    return (timing.to - timing.from) / settings.speed;
  }
  async function run() {
    stop(); quranPlayer.pause(); recitationPlayer.pause();
    const id = token.current; setRunning(true); setError("");
    try {
      for (const part of echoSequence(keys, settings.repeats, settings.joined)) {
        if (token.current !== id) return;
        setCurrent(part.keys); setCorrect(false); setStage("listen");
        setCaption(`${part.keys.length > 1 ? "Joined range" : `Ayah ${part.keys[0]?.split(":")[1]}`} · repeat ${part.round} of ${part.total}`);
        let length = 0;
        for (const key of part.keys) { if (token.current !== id) return; mark.current?.([key], false); length += await playAyah(key, id); }
        if (token.current !== id) return;
        setStage("repeat"); mark.current?.(part.keys, settings.hide);
        const ranges = [...new Set(part.keys.map((key) => Number(key.split(":")[0])))].map((sura) => { const numbers = part.keys.filter((k) => Number(k.split(":")[0]) === sura).map((k) => Number(k.split(":")[1])); return { sura, first: Math.min(...numbers), last: Math.max(...numbers) }; });
        if (settings.check) { const started = await aiRef.current.request(ranges); if (token.current !== id) { aiRef.current.cancel(); return; } if (started === "download") { setError("Download the checker below, then start Echo again."); break; } }
        await wait(length * settings.gap, id);
        if (token.current !== id) return;
        if (settings.check) { const result = await aiRef.current.stop(); if (result) setCorrect(cleanRecitation(result, result.words.map((w) => w.key))); aiRef.current.discardRecording(); }
      }
    } catch (e) { if (token.current === id) setError(e instanceof Error ? e.message : "Echo couldn’t start. Please retry."); }
    finally { if (token.current === id) { setRunning(false); setStage("idle"); mark.current?.([], false); } }
  }
  useEffect(() => { if (ai.phase === "finished" && ai.result) setCorrect(cleanRecitation(ai.result, ai.result.words.map((w) => w.key))); }, [ai.phase, ai.result]);
  const field = (name: "repeats" | "joined", label: string, min: number, max: number) => modern ? <div className="q2-setting-row"><span>{label}</span><div className="q2-segments"><Button variant="outline" size="icon" aria-label={`Decrease ${label}`} disabled={running || settings[name] <= min} onClick={()=>setSettings(s=>({...s,[name]:s[name]-1}))}>−</Button><span className="flex items-center px-3">{settings[name]}</span><Button variant="outline" size="icon" aria-label={`Increase ${label}`} disabled={running || settings[name] >= max} onClick={()=>setSettings(s=>({...s,[name]:s[name]+1}))}>+</Button></div></div> : <label className="hx-field">{label}<input aria-label={label} type="number" min={min} max={max} disabled={running} value={settings[name]} onChange={(e) => setSettings((s) => ({ ...s, [name]: Math.max(min, Math.min(max, Number(e.target.value))) }))} /></label>;
  return <Dialog open onOpenChange={(v) => { if (!v) { stop(); close(); } }}><DialogContent className="hx-panel max-h-[85dvh] overflow-y-auto" aria-describedby={undefined}><DialogTitle>Echo mode</DialogTitle>
    {field("repeats", "Repeats per ayah", 1, 10)}{field("joined", "Joined range repeats", 0, 5)}
    {modern ? <><div className="q2-setting-row">Time to repeat<div className="q2-segments">{[1,1.5,2].map(gap=><Button key={gap} disabled={running} variant={settings.gap===gap?"default":"outline"} onClick={()=>setSettings(s=>({...s,gap}))}>{gap}×</Button>)}</div></div><div className="q2-setting-row">Speed<div className="q2-segments">{[.75,1,1.25].map(speed=><Button key={speed} disabled={running} variant={settings.speed===speed?"default":"outline"} onClick={()=>setSettings(s=>({...s,speed}))}>{speed}×</Button>)}</div></div></> : <><label className="hx-field">Time to repeat<select aria-label="Repeat silence length" disabled={running} value={settings.gap} onChange={(e) => setSettings((s) => ({ ...s, gap: Number(e.target.value) }))}>{[1, 1.25, 1.5, 1.75, 2].map((v) => <option key={v} value={v}>{v}×</option>)}</select></label><label className="hx-field">Speed<select aria-label="Echo speed" disabled={running} value={settings.speed} onChange={(e) => setSettings((s) => ({ ...s, speed: Number(e.target.value) }))}>{[.75, 1, 1.25].map((v) => <option key={v} value={v}>{v}×</option>)}</select></label></>}
    <label className="hx-field">Hide text while I repeat<Switch aria-label="Hide text while I repeat" disabled={running} checked={settings.hide} onCheckedChange={(hide) => setSettings((s) => ({ ...s, hide }))} /></label>
    <label className="hx-field">Check my repeat<Switch aria-label="Check my repeat" disabled={running} checked={settings.check} onCheckedChange={(check) => setSettings((s) => ({ ...s, check }))} /></label>
    <p className="hx-status" role="status">{caption}{stage === "repeat" ? " · Your turn" : stage === "listen" ? " · Listening" : ""}{correct && <Check size={14} className="inline text-accent" aria-label="Correct repeat" />}</p>
    <div className={`hx-echo-text ${stage === "repeat" && settings.hide ? "hx-echo-hidden" : ""}`} dir="rtl">{(current.length ? current : keys).map((key) => <span className={current.includes(key) ? "hx-echo-current" : ""} key={key}>{texts[key]} </span>)}</div>
    {error && <p role="alert">{error}</p>}
    {ai.phase === "download" && <><p>Download the checker once (73 MB). Wi-Fi recommended.</p><Button onClick={() => { void ai.confirm().then(() => ai.stop()); }}>Download checker</Button></>}
    {ai.phase === "error" && <p role="alert">{ai.error}</p>}
    <Button onClick={running ? stop : () => void run()} disabled={!keys.length}>{running ? <Square /> : <Play />}{running ? "Stop echo" : "Start echo"}</Button>
  </DialogContent></Dialog>;
}