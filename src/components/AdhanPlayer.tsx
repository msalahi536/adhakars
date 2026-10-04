// AdhanPlayer.tsx
// Compact adhan player shown while the native side plays the adhan.
// Closing minimizes to a floating pill so playback remains easy to reopen.

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, RotateCw, X } from "lucide-react";
import {
  androidGetAdhanProgress,
  androidPauseAdhan,
  androidResumeAdhan,
  androidSeekAdhan,
  androidStopAdhan,
  fromNativeReciterId,
  isAndroidPlatform,
} from "@/lib/android-adhan";
import { Portal } from "@/components/Portal";
import {
  getAdhanProgress,
  getReciterForPrayer,
  pauseAdhan,
  reciterNameFor,
  resumeAdhan,
  seekAdhan,
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
  const trackRef = useRef<HTMLDivElement>(null);
  const pendingSeek = useRef<{ frac: number; until: number } | null>(null);

  const wasVisible = useRef(false);
  useEffect(() => {
    if (!visible) {
      wasVisible.current = false;
      return;
    }
    // Only reset to the full popup when the player NEWLY opens. If it was
    // already visible (e.g. page navigation re-rendered the parent), keep
    // the minimized pill exactly as the user left it.
    const freshlyOpened = !wasVisible.current;
    wasVisible.current = true;
    if (freshlyOpened) {
      openedAt.current = Date.now();
      setMinimized(false);
      setP(null);
    }
    const tick = () => {
      void (isAndroidPlatform() ? androidGetAdhanProgress() : getAdhanProgress()).then((next) => {
        const ps = pendingSeek.current;
        if (next && ps) {
          if (Date.now() < ps.until && Math.abs(next.progress - ps.frac) > 0.02) {
            next = { ...next, progress: ps.frac };
          } else pendingSeek.current = null;
        }
        if (next) setP(next);
        // Grace period while the native session starts.
        if (Date.now() - openedAt.current > 4000 && next && !next.hasSession) onClose();
      });
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [visible, onClose]);

  useEffect(() => {
    if (!visible || minimized) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMinimized(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible, minimized]);

  if (!visible) return null;

  const duration = p?.duration ?? 0;
  const progress = scrub ?? p?.progress ?? 0;
  const current = duration * progress;
  const playing = p?.isPlaying ?? true;
  const name = labelFor(p?.prayer || prayer);
  const reciter = reciterNameFor(fromNativeReciterId(p?.reciterId || reciterId) || getReciterForPrayer(name));
  const android = isAndroidPlatform();

  const togglePlay = () => {
    setP((prev) => (prev ? { ...prev, isPlaying: !playing } : prev));
    void (android ? (playing ? androidPauseAdhan() : androidResumeAdhan()) : playing ? pauseAdhan() : resumeAdhan());
  };
  const commitSeek = (frac: number) => {
    const f = Math.min(1, Math.max(0, frac));
    setScrub(null);
    // Hold the new position until native reports it, so the thumb doesn't snap back.
    pendingSeek.current = { frac: f, until: Date.now() + 1500 };
    setP((prev) => (prev ? { ...prev, progress: f, currentTime: f * (prev.duration || 0) } : prev));
    void (android ? androidSeekAdhan(f * duration) : seekAdhan(f));
  };
  const fracAt = (clientX: number) => {
    const r = trackRef.current?.getBoundingClientRect();
    if (!r || !r.width) return progress;
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  };
  const skip = (delta: number) => {
    if (!duration) return;
    commitSeek((current + delta) / duration);
  };
  const close = () => {
    if (!android) {
      setMinimized(true);
      return;
    }
    void androidStopAdhan();
    onClose();
  };

  if (minimized) {
    return (
      <Portal>
        <button type="button" className="ap-pill" onClick={() => setMinimized(false)} aria-label={`Open ${name} adhan player`}>
          <span className="ap-pill-wave" aria-hidden="true">
            <span /><span /><span />
          </span>
          <span className="ap-pill-text">{name} Adhan</span>
        </button>
      </Portal>
    );
  }

  return (
    <Portal>
      <div className="ap-modal" role="dialog" aria-label={`${name} adhan player`}>
        <div className="ap-head">
          <div className="ap-mosque"><MosqueIcon /></div>
          <div className="ap-heading">
            <p className="ap-kicker">Now playing</p>
            <h2 className="ap-title">{name} Adhan</h2>
            <p className="ap-reciter">{reciter}</p>
          </div>
          <button type="button" className="ap-close" onClick={close} aria-label={android ? "Stop and close player" : "Close and minimize player"}>
            <X size={19} />
          </button>
        </div>

        <div className="ap-scrub">
          <div
            ref={trackRef}
            className="ap-track"
            role="slider"
            tabIndex={0}
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            style={{ "--ap-pct": `${progress * 100}%` } as React.CSSProperties}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              setScrub(fracAt(e.clientX));
            }}
            onPointerMove={(e) => {
              if (scrub !== null) setScrub(fracAt(e.clientX));
            }}
            onPointerUp={(e) => commitSeek(fracAt(e.clientX))}
            onPointerCancel={() => scrub !== null && commitSeek(scrub)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") skip(5);
              if (e.key === "ArrowLeft") skip(-5);
            }}
          >
            <span className="ap-track-bar"><span className="ap-track-fill" /></span>
            <span className="ap-track-thumb" />
          </div>
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
    </Portal>
  );
}
