/** Shared pieces for the Arabic Companion screens: audio, mic button, makhraj diagram, tracing. */
import { useEffect, useRef, useState } from "react";
import { Mic, Square, Volume2 } from "lucide-react";
import type { Makhraj } from "@/lib/arabic";

const ar = { fontFamily: "var(--font-arabic)" };

/** One shared audio element per screen. */
export function useAudio() {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const play = (url?: string) => {
    if (!url) return;
    ref.current?.pause();
    const a = new Audio(url);
    ref.current = a;
    a.onended = () => setPlaying(null);
    a.onerror = () => setPlaying(null);
    setPlaying(url);
    void a.play().catch(() => setPlaying(null));
  };
  useEffect(() => () => ref.current?.pause(), []);
  return { play, playing };
}

export function ListenButton({ url, label, onMissing }: { url?: string; label: string; onMissing?: () => void }) {
  const { play, playing } = useAudio();
  if (!url) return <button onClick={onMissing} className="ab-link-btn" type="button">Audio coming</button>;
  return (
    <button type="button" onClick={() => play(url)} className="ab-primary" style={{ width: "auto", padding: ".7rem 1.4rem", display: "inline-flex", alignItems: "center", gap: ".5rem" }}>
      <Volume2 size={17} className={playing === url ? "animate-pulse" : ""} /> {label}
    </button>
  );
}

/** The big round mic button (RecitationMic look), animated by the voice level. */
export function MicButton({ listening, busy, level, onTap, label }: { listening: boolean; busy?: boolean; level: number; onTap: () => void; label?: string }) {
  const ref = useRef<HTMLButtonElement | null>(null);
  useEffect(() => { ref.current?.style.setProperty("--ab-voice-scale", String(1 + Math.min(.22, level * .5))); }, [level]);
  return (
    <div className="ab-mic-wrap">
      <button ref={ref} type="button" className={`ab-mic ${listening ? "ab-listening" : ""}`} aria-label={listening ? "Stop" : "Start the microphone"} disabled={busy} onClick={onTap}>
        {listening ? <Square size={22} /> : <Mic size={26} />}
      </button>
      <small className="ab-mic-caption">{label ?? (listening ? "Listening…" : busy ? "Checking…" : "Tap the mic and say it")}</small>
    </div>
  );
}

/**
 * Simple side-profile mouth/throat diagram with the letter's makhraj area highlighted.
 * Schematic only — a teaching aid, not an anatomical drawing.
 */
const MAKHRAJ_SPOT: Record<Makhraj, { x: number; y: number; r: number }> = {
  throat: { x: 88, y: 96, r: 12 },
  "back-tongue": { x: 74, y: 78, r: 11 },
  "mid-tongue": { x: 58, y: 72, r: 11 },
  "side-tongue": { x: 62, y: 84, r: 10 },
  "tongue-tip": { x: 38, y: 78, r: 9 },
  "tip-gum": { x: 34, y: 72, r: 9 },
  "tip-teeth": { x: 30, y: 66, r: 9 },
  "between-teeth": { x: 27, y: 62, r: 9 },
  lips: { x: 22, y: 58, r: 10 },
  "lip-teeth": { x: 24, y: 62, r: 9 },
  nose: { x: 30, y: 40, r: 10 },
};
export function MakhrajDiagram({ makhraj }: { makhraj: Makhraj }) {
  const s = MAKHRAJ_SPOT[makhraj];
  return (
    <svg viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="Where the sound is made" className="ab-makhraj">
      {/* head profile, mouth open to the left */}
      <path d="M70 12 C40 12 24 34 24 52 L20 58 L26 60 C24 66 26 70 32 72 C30 80 36 86 44 86 L52 86 L52 108 L96 108 L96 60 C96 32 88 12 70 12 Z"
        fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinejoin="round" opacity=".7" />
      {/* tongue */}
      <path d="M34 76 C44 70 58 68 72 74 C64 82 46 84 34 80 Z" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.6" opacity=".55" />
      <circle cx={s.x} cy={s.y} r={s.r} fill="color-mix(in oklab, var(--primary) 30%, transparent)" stroke="var(--primary)" strokeWidth="2" />
    </svg>
  );
}

/**
 * Finger tracing: the letter is drawn faintly; the learner traces over it. Passes when the stroke
 * covers enough of the letter's pixels and stays mostly inside them. Never a failure.
 */
export function TraceCanvas({ text, onPass }: { text: string; onPass: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskRef = useRef<Uint8Array | null>(null);
  const drawing = useRef(false);
  const stats = useRef({ total: 0, inside: 0, covered: new Set<number>() });
  const [tries, setTries] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = canvas.clientWidth * (window.devicePixelRatio || 1);
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    // letter mask on an offscreen canvas
    const off = document.createElement("canvas");
    off.width = size; off.height = size;
    const octx = off.getContext("2d")!;
    octx.fillStyle = "#000";
    octx.font = `${size * 0.52}px Amiri, serif`;
    octx.textAlign = "center"; octx.textBaseline = "middle";
    octx.direction = "rtl";
    octx.fillText(text, size / 2, size / 2 + size * 0.04);
    maskRef.current = octx.getImageData(0, 0, size, size).data.filter((_, i) => i % 4 === 3).values().toArray?.() as unknown as Uint8Array
      ?? Uint8Array.from(octx.getImageData(0, 0, size, size).data.filter((_, i) => i % 4 === 3));
    // faint guide
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "color-mix(in oklab, var(--foreground) 14%, transparent)";
    ctx.font = octx.font; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.direction = "rtl";
    ctx.fillText(text, size / 2, size / 2 + size * 0.04);
    stats.current = { total: 0, inside: 0, covered: new Set() };
  }, [text, tries]);

  const judge = () => {
    const { inside, covered } = stats.current;
    const mask = maskRef.current;
    if (!mask) return;
    let letterPixels = 0;
    for (let i = 0; i < mask.length; i++) if (mask[i] > 40) letterPixels++;
    const coverage = letterPixels ? covered.size / letterPixels : 0;
    const insideRatio = stats.current.total ? inside / stats.current.total : 0;
    if (coverage >= 0.3 && insideRatio >= 0.6) onPass();
    else setTries((t) => t + 1); // "Try once more": the guide redraws, never a failure
  };

  const point = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    const mask = maskRef.current;
    if (!canvas || !mask || !drawing.current) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const x = Math.round((e.clientX - rect.left) * dpr);
    const y = Math.round((e.clientY - rect.top) * dpr);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "var(--primary)";
    ctx.beginPath(); ctx.arc(x, y, 8 * dpr, 0, Math.PI * 2); ctx.fill();
    // sample a small disc around the point
    for (let dy = -8; dy <= 8; dy += 4) for (let dx = -8; dx <= 8; dx += 4) {
      const px = x + dx * dpr, py = y + dy * dpr;
      if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height) continue;
      const idx = py * canvas.width + px;
      stats.current.total++;
      if (mask[idx] > 40) { stats.current.inside++; stats.current.covered.add(idx); }
    }
  };

  return (
    <div className="ab-trace">
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => { drawing.current = true; (e.target as HTMLElement).setPointerCapture(e.pointerId); point(e); }}
        onPointerMove={point}
        onPointerUp={() => { drawing.current = false; judge(); }}
        onPointerCancel={() => { drawing.current = false; }}
      />
      <span className="sr-only" style={ar}>{text}</span>
    </div>
  );
}
