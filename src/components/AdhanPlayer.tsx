// AdhanPlayer.tsx
// Compact adhan player shown while the native side plays the adhan.
// Closing minimizes to a floating pill so playback remains easy to reopen.

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, RotateCw, Volume1, Volume2, VolumeX, X } from "lucide-react";
import { Portal } from "@/components/Portal";
import {
  getAdhanProgress,
  getAdhanVolume,
  pauseAdhan,
  reciterNameFor,
  resumeAdhan,
  seekAdhan,
  setAdhanVolume,
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
  const [volume, setVolume] = useState(() => getAdhanVolume());
  const [lastAudible, setLastAudible] = useState(() => getAdhanVolume() || 1);
  const volDragging = useRef(false);
  const lastNativeVol = useRef<number | null>(null);
  const openedAt = useRef(0);

  useEffect(() => {
    if (!visible) return;
    openedAt.current = Date.now();
    setMinimized(false);
    setP(null);
    // Make the native session match the saved volume as soon as it appears.
    void setAdhanVolume(getAdhanVolume());
    const tick = () => {
      void getAdhanProgress().then((next) => {
        if (next) {
          setP(next);
          // Only follow the native side when its own volume changed (e.g. the
          // user used the hardware buttons) — never undo the in-app slider.
          if (
            typeof next.volume === "number" &&
            !volDragging.current &&
            (lastNativeVol.current === null || Math.abs(next.volume - lastNativeVol.current) > 0.001)
          ) {
            lastNativeVol.current = next.volume;
            setVolume(next.volume);
            if (next.volume > 0) setLastAudible(next.volume);
          }
        }
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
  const reciter = reciterNameFor(p?.reciterId || reciterId);

  const togglePlay = () => {
    setP((prev) => (prev ? { ...prev, isPlaying: !playing } : prev));
    void (playing ? pauseAdhan() : resumeAdhan());
  };
  const skip = (delta: number) => {
    if (!duration) return;
    void seekAdhan((current + delta) / duration);
  };
  const changeVolume = (v: number) => {
    const next = Math.min(1, Math.max(0, v));
    if (next > 0) setLastAudible(next);
    setVolume(next);
    setAdhanVolume(next);
  };
  const toggleMute = () => {
    if (volume > 0) changeVolume(0);
    else changeVolume(lastAudible || 1);
  };
  const VolIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

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
          <button type="button" className="ap-close" onClick={() => setMinimized(true)} aria-label="Close and minimize player">
            <X size={19} />
          </button>
        </div>

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

        <div className="ap-volume">
          <button type="button" className={`ap-mute${volume === 0 ? " ap-mute-off" : ""}`} onClick={toggleMute} aria-label={volume === 0 ? "Unmute adhan" : "Mute adhan"}>
            <VolIcon size={17} />
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            aria-label="Adhan volume"
            style={{ "--ap-vol": `${volume * 100}%` } as React.CSSProperties}
            onChange={(e) => changeVolume(Number(e.target.value) / 100)}
            onPointerDown={() => { volDragging.current = true; }}
            onPointerUp={() => { volDragging.current = false; }}
          />
          <div className="ap-volume-bars" aria-hidden="true">
            {Array.from({ length: 9 }, (_, i) => {
              const level = (i + 1) / 9;
              return <span key={i} className={volume >= level ? "on" : ""} />;
            })}
          </div>
        </div>

      </div>
    </Portal>
  );
}
