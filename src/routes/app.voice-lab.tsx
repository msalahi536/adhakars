// Hidden Voice Lab (7 taps on Version in Settings): measures on-device Quran recognition on this phone.
// Audio never leaves the device; the model is downloaded once and cached by the browser.
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { compareWords, type DiffResult } from "@/lib/voice-lab";

export const Route = createFileRoute("/app/voice-lab")({
  head: () => ({
    meta: [
      { title: "Voice Lab, Sahih Al-Adhkar" },
      { name: "description", content: "Internal on-device recitation recognition test." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Voice Lab, Sahih Al-Adhkar" },
      { property: "og:description", content: "Internal on-device recitation recognition test." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VoiceLab,
});

// Community ONNX conversion of tarteel-ai/whisper-tiny-ar-quran (Apache-2.0).
const MODEL = "omartariq612/tarteel-ai-whisper-tiny-ar-quran-onnx";
const SURAHS = [{ id: 112, name: "Al-Ikhlas" }, { id: 113, name: "Al-Falaq" }, { id: 114, name: "An-Nas" }, { id: 1, name: "Al-Fatihah" }];
const card = { background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" };
const btn = { background: "var(--accent)", color: "var(--accent-foreground)" };
const muted = { color: "var(--muted-foreground)" };

type Asr = (audio: Float32Array, opts?: object) => Promise<{ text: string } | { text: string }[]>;

async function toMono16k(blob: Blob): Promise<Float32Array> {
  const buf = await blob.arrayBuffer();
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  const decoded = await ctx.decodeAudioData(buf);
  void ctx.close();
  const off = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000);
  const src = off.createBufferSource();
  src.buffer = decoded; src.connect(off.destination); src.start();
  return (await off.startRendering()).getChannelData(0);
}

function VoiceLab() {
  const [surah, setSurah] = useState(112);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("Model not loaded");
  const [progress, setProgress] = useState<number | null>(null);
  const [loadMs, setLoadMs] = useState<number | null>(null);
  const [backend, setBackend] = useState("");
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ heard: string; ms: number; secs: number; diff: DiffResult } | null>(null);
  const asr = useRef<Asr | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const started = useRef(0);

  useEffect(() => {
    setText(""); setResult(null);
    fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${surah}`)
      .then((r) => r.json())
      .then((j: { verses: { text_uthmani: string }[] }) => setText(j.verses.map((v) => v.text_uthmani).join(" ")))
      .catch(() => setText(""));
  }, [surah]);

  const load = async () => {
    if (asr.current || busy) return;
    setBusy(true); setStatus("Downloading model (first time only)…");
    const t0 = performance.now();
    try {
      const tf = await import("@huggingface/transformers");
      const gpu = typeof navigator !== "undefined" && "gpu" in navigator;
      const files: Record<string, number> = {};
      const make = (device: "webgpu" | "wasm") => tf.pipeline("automatic-speech-recognition", MODEL, {
        device,
        dtype: "q4" as never,
        progress_callback: (p: { status: string; file?: string; loaded?: number; total?: number }) => {
          if (p.status === "progress" && p.file && p.total) {
            files[p.file] = (p.loaded ?? 0) / p.total;
            const v = Object.values(files); setProgress(v.reduce((a, b) => a + b, 0) / v.length);
          }
        },
      });
      let pipe; let dev = "wasm";
      if (gpu) { try { pipe = await make("webgpu"); dev = "webgpu"; } catch { pipe = undefined; } }
      if (!pipe) pipe = await make("wasm");
      asr.current = pipe as unknown as Asr;
      setBackend(dev); setLoadMs(Math.round(performance.now() - t0)); setProgress(null); setStatus("Ready");
    } catch (e) {
      setStatus(`Couldn't load the model: ${(e as Error).message}`);
    } finally { setBusy(false); }
  };

  const start = async () => {
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
      const r = new MediaRecorder(stream);
      chunks.current = [];
      r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      r.onstop = () => { stream.getTracks().forEach((t) => t.stop()); void recognize(new Blob(chunks.current, { type: r.mimeType })); };
      rec.current = r; started.current = Date.now(); r.start(); setRecording(true);
    } catch { setStatus("Microphone permission was denied."); }
  };
  const stop = () => { rec.current?.stop(); setRecording(false); };

  const recognize = async (blob: Blob) => {
    if (!asr.current) return;
    setBusy(true); setStatus("Recognizing on this device…");
    try {
      const audio = await toMono16k(blob);
      const t0 = performance.now();
      const out = await asr.current(audio, { language: "arabic", task: "transcribe", chunk_length_s: 30, stride_length_s: 5 });
      const ms = Math.round(performance.now() - t0);
      const heard = (Array.isArray(out) ? out.map((o) => o.text).join(" ") : out.text).trim();
      setResult({ heard, ms, secs: audio.length / 16000, diff: compareWords(text, heard) });
      setStatus("Ready");
    } catch (e) { setStatus(`Recognition failed: ${(e as Error).message}`); }
    finally { setBusy(false); }
  };

  return (
    <>
      <header className="page-header relative overflow-hidden" style={{ background: "var(--background)", color: "var(--foreground)" }}>
        <HeaderBackButton />
        <div className="relative mx-auto max-w-md pb-6 pt-9 text-center" style={{ paddingLeft: 60, paddingRight: 60 }}>
          <div className="label-caps">Internal test</div>
          <h1 className="app-page-title mt-2">Voice Lab</h1>
        </div>
      </header>
      <main className="scroll-area">
        <div className="mx-auto max-w-md space-y-4 px-4 py-4" style={{ color: "var(--foreground)" }}>
          <section className="space-y-3 rounded-2xl p-4" style={card}>
            <p className="text-xs" style={muted}>Runs entirely on this phone. Your voice is never uploaded. Results are a test, not a judgement of your recitation.</p>
            <div className="grid grid-cols-2 gap-2">
              {SURAHS.map((s) => (
                <button key={s.id} onClick={() => setSurah(s.id)} className="min-h-11 rounded-xl text-sm font-semibold" style={surah === s.id ? btn : card}>{s.name}</button>
              ))}
            </div>
            <p dir="rtl" lang="ar" className="text-right text-2xl leading-loose" style={{ fontFamily: "'Scheherazade New', serif" }}>{text || "…"}</p>
          </section>

          <section className="space-y-3 rounded-2xl p-4" style={card}>
            <div className="text-sm font-semibold">{status}</div>
            {progress !== null && (
              <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--border)" }}>
                <div className="h-full" style={{ width: `${Math.round(progress * 100)}%`, background: "var(--accent)" }} />
              </div>
            )}
            {loadMs !== null && <div className="text-xs" style={muted}>Loaded in {(loadMs / 1000).toFixed(1)}s · engine: {backend}</div>}
            {!asr.current ? (
              <button disabled={busy} onClick={load} className="min-h-12 w-full rounded-full text-sm font-semibold disabled:opacity-50" style={btn}>Load model</button>
            ) : (
              <button disabled={busy || !text} onClick={recording ? stop : start} className="min-h-12 w-full rounded-full text-sm font-semibold disabled:opacity-50" style={btn}>
                {recording ? "Stop and check" : "Start reciting"}
              </button>
            )}
          </section>

          {result && (
            <section className="space-y-3 rounded-2xl p-4" style={card}>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><div className="text-lg font-semibold">{(result.ms / 1000).toFixed(1)}s</div><div className="text-xs" style={muted}>processing</div></div>
                <div><div className="text-lg font-semibold">{result.secs.toFixed(1)}s</div><div className="text-xs" style={muted}>recording</div></div>
                <div><div className="text-lg font-semibold">{Math.round(result.diff.accuracy * 100)}%</div><div className="text-xs" style={muted}>words matched</div></div>
              </div>
              <p dir="rtl" lang="ar" className="text-right text-2xl leading-loose" style={{ fontFamily: "'Scheherazade New', serif" }}>
                {result.diff.words.map((w, i) => (
                  <span key={i} style={w.status === "missed" ? { color: "var(--destructive)", textDecoration: "underline" } : undefined}>{w.word} </span>
                ))}
              </p>
              <div className="text-xs" style={muted}>Red underlined = not heard. Heard text:</div>
              <p dir="rtl" lang="ar" className="text-right text-lg">{result.heard || "(nothing)"}</p>
              {result.diff.extra.length > 0 && <div className="text-xs" style={muted}>Extra words heard: <span dir="rtl">{result.diff.extra.join(" ")}</span></div>}
            </section>
          )}
        </div>
      </main>
    </>
  );
}
