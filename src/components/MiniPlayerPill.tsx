import { useEffect, useRef, useState } from "react";
import { Loader2, Pause, Play, X } from "lucide-react";
import { restingLevels, shapeMeter, type MeterLevels } from "@/lib/recitation-meter";

const BARS = 12;

/** Calm sound meter: uses real levels when given, otherwise a soft voice-like motion while playing. */
function useMeter(playing: boolean, levels?: MeterLevels) {
  const [lv, setLv] = useState<MeterLevels>(restingLevels());
  const prev = useRef(lv);
  useEffect(() => {
    if (levels || !playing) { prev.current = restingLevels(); setLv(prev.current); return; }
    let raf = 0; let last = performance.now();
    const tick = (now: number) => {
      const t = now / 1000;
      const bands = Array.from({ length: 6 }, (_, i) => {
        const v = 0.45 + 0.3 * Math.sin(t * (3.1 + i * 0.7) + i) * Math.sin(t * 1.3 + i * 2) + 0.25 * Math.sin(t * 7.3 + i * 1.7);
        return Math.max(0, Math.min(1, v));
      }) as MeterLevels;
      prev.current = shapeMeter(bands, prev.current, Math.min(64, now - last));
      last = now; setLv(prev.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, !!levels]);
  const src = levels ?? lv;
  // Mirror six bands into a symmetric 12-bar wave, tallest in the middle.
  return Array.from({ length: BARS }, (_, i) => {
    const b = src[[5, 4, 3, 2, 1, 0, 0, 1, 2, 3, 4, 5][i]];
    const shape = 0.55 + 0.45 * Math.sin((Math.PI * (i + 0.5)) / BARS);
    return playing ? Math.max(0.12, b * shape) : 0.12 + 0.1 * shape;
  });
}

type Props = {
  label: string; title: string; subtitle: string; photo?: string | null; initial?: string;
  playing: boolean; loading?: boolean; levels?: MeterLevels; className?: string;
  onOpen: () => void; onToggle: () => void; onClose: () => void;
};

export function MiniPlayerPill(p: Props) {
  const bars = useMeter(p.playing, p.playing ? p.levels : undefined);
  return (
    <div className={`mini-pill ${p.className ?? ""}`} role="group" aria-label={p.label}>
      <span className="mini-pill-art" aria-hidden />
      <button className="mini-pill-main" onClick={p.onOpen} aria-label={`Open player, ${p.title}`}>
        <span className="mini-pill-photo">{p.photo ? <img src={p.photo} alt="" /> : p.initial}</span>
        <span className="min-w-0 text-left">
          <span className="mini-pill-title">{p.title}</span>
          <span className="mini-pill-sub">{p.subtitle}</span>
        </span>
        <span className="mini-pill-eq" aria-hidden>
          {bars.map((h, i) => <i key={i} style={{ height: `${Math.round(h * 100)}%` }} />)}
        </span>
      </button>
      <button className="mini-pill-play" aria-label={p.playing ? "Pause" : "Play"} onClick={p.onToggle}>
        {p.loading && !p.playing ? <Loader2 size={18} className="animate-spin" /> : p.playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" style={{ marginLeft: 2 }} />}
      </button>
      <span className="mini-pill-div" aria-hidden />
      <button className="mini-pill-x" aria-label="Stop and close" onClick={p.onClose}><X size={18} /></button>
    </div>
  );
}
