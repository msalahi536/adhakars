// AdhanPlayer.tsx
// Full-screen adhan player shown while the native side plays the adhan.
// Minimizes to a floating pill on the right edge. Polls native progress.

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Pause, Play, RotateCcw, RotateCw, Square } from "lucide-react";
import {
  getAdhanProgress,
  pauseAdhan,
  reciterNameFor,
  resumeAdhan,
  seekAdhan,
  stopAdhan,
  type AdhanProgress,
} from "@/lib/adhan-bridge";

interface Props {
  visible: boolean;
  prayer: string;
  reciterId: string;
  onClose: () => void;
}

const labelFor = (prayer: string) => {
  const k = prayer.trim().toLowerCase() || "fajr";
  return `${k.charAt(0).toUpperCase()}${k.slice(1)}`;
};

const fmt = (s: number) => {
  const t = Math.max(0, Math.floor(s));
  return `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, "0")}`;
};

function MosqueIcon() {
  return (
    <svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true">
      <path d="M32 8c-1 4-6 6-10 11-3 4-4 8-4 11h28c0-3-1-7-4-11-4-5-9-7-10-11z" className="ap-mosque-accent" />
      <rect x="16" y="30" width="32" height="22" rx="2" className="ap-mosque-building" />
      <path d="M28 52V42a4 4 0 0 1 8 0v10z" className="ap-mosque-door" />
      <rect x="6" y="20" width="5" height="32" rx="1.5" className="ap-mosque-building" />
      <rect x="53" y="20" width="5" height="32" rx="1.5" className="ap-mosque-building" />
      <circle cx="8.5" cy="17" r="2.5" className="ap-mosque-accent" />
      <circle cx="55.5" cy="17" r="2.5" className="ap-mosque-accent" />
      <rect x="4" y="52" width="56" height="3" rx="1.5" className="ap-mosque-accent" />
    </svg>
  );
}

export function AdhanPlayer({ visible, prayer, reciterId, onClose }: Props) {
  const [minimized, setMinimized] = useState(false);
  const [p, setP] = useState<AdhanProgress | null>(null);
  const [scrub, setScrub] = useState<number | null>(null);
  const openedAt = useRef(0);

  useEffect(() => {
    if (!visible) return;
    openedAt.current = Date.now();
    setMinimized(false);
    setP(null);
    const tick = () => {
      void getAdhanProgress().then((next) => {
        if (next) setP(next);
        // Grace period while the native session starts.
        if (Date.now() - openedAt.current > 4000 && next && !next.hasSession) onClose();
      });
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [visible, onClose]);

  if (!visible) return null;

  const duration = p?.duration ?? 0;
  const progress = scrub ?? p?.progress ?? 0;
  const current = duration * progress;
  const playing = p?.isPlaying ?? true;
  const name = labelFor(p?.prayer || prayer);
  const reciter = reciterNameFor(p?.reciterId || reciterId);

  const togglePlay = () => {
    setP((prev) => (prev ? { ...prev, isPlaying: !playing } : prev));
    void (playing ? pauseAdhan() : resumeAdhan());
  };
  const skip = (delta: number) => {
    if (!duration) return;
    void seekAdhan((current + delta) / duration);
  };
  const stop = () => {
    void stopAdhan();
    onClose();
  };

  if (minimized) {
    return (
      <button type="button" className="ap-pill" onClick={() => setMinimized(false)} aria-label={`Open ${name} adhan player`}>
        <span className="ap-pill-wave" aria-hidden="true">
          <span /><span /><span />
        </span>
        <span className="ap-pill-text">{name}</span>
      </button>
    );
  }

  return (
    <div className="ap-modal" role="dialog" aria-modal="true" aria-label={`${name} adhan`}>
      <button type="button" className="ap-icon-btn ap-min" onClick={() => setMinimized(true)} aria-label="Minimize player">
        <ChevronDown size={26} />
      </button>

      <div className="ap-body">
        <div className="ap-mosque"><MosqueIcon /></div>
        <p className="ap-kicker">Adhan</p>
        <h2 className="ap-title">{name}</h2>
        <p className="ap-reciter">{reciter}</p>

        <div className="ap-scrub">
          <input
            type="range"
            min={0}
            max={1000}
            value={Math.round(progress * 1000)}
            disabled={!duration}
            aria-label="Seek"
            style={{ "--ap-pct": `${progress * 100}%` } as React.CSSProperties}
            onChange={(e) => setScrub(Number(e.target.value) / 1000)}
            onPointerUp={() => {
              if (scrub !== null) void seekAdhan(scrub);
              setScrub(null);
            }}
            onKeyUp={() => {
              if (scrub !== null) void seekAdhan(scrub);
              setScrub(null);
            }}
          />
          <div className="ap-times">
            <span>{fmt(current)}</span>
            <span>{duration ? fmt(duration) : "--:--"}</span>
          </div>
        </div>

        <div className="ap-controls">
          <button type="button" className="ap-icon-btn" onClick={() => skip(-10)} aria-label="Rewind 10 seconds">
            <RotateCcw size={24} /><span className="ap-skip-n">10</span>
          </button>
          <button type="button" className="ap-play" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
            {playing ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" />}
          </button>
          <button type="button" className="ap-icon-btn" onClick={() => skip(10)} aria-label="Forward 10 seconds">
            <RotateCw size={24} /><span className="ap-skip-n">10</span>
          </button>
        </div>
      </div>

      <button type="button" className="ap-stop" onClick={stop}>
        <Square size={14} fill="currentColor" /> Stop Adhan
      </button>
    </div>
  );
}
