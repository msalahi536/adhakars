// AdhanPlayer.tsx
// Floating mini player shown while the native side plays the full adhan
// (after a notification tap). Auto-dismisses when the audio ends.

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  RECITERS,
  getAdhanPrefs,
  isAdhanPlaying,
  onAdhanPlaying,
  reciterNameFor,
  stopAdhan,
} from "@/lib/adhan-bridge";

const LABELS: Record<string, string> = {
  fajr: "Fajr Adhan",
  dhuhr: "Dhuhr Adhan",
  asr: "Asr Adhan",
  maghrib: "Maghrib Adhan",
  isha: "Isha Adhan",
};

const labelFor = (prayer: string): string => {
  const key = prayer.trim().toLowerCase();
  if (LABELS[key]) return LABELS[key];
  const name = key.charAt(0).toUpperCase() + key.slice(1);
  return `${name} Adhan`;
};

const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export function AdhanPlayer() {
  const [prayer, setPrayer] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [reciter, setReciter] = useState(RECITERS[0].name);
  const startedAtRef = useRef(0);

  useEffect(() => {
    setReciter(reciterNameFor(getAdhanPrefs().reciter));
    return onAdhanPlaying((next) => {
      startedAtRef.current = Date.now();
      setElapsed(0);
      setReciter(reciterNameFor(getAdhanPrefs().reciter));
      setPrayer(next || "fajr");
    });
  }, []);

  // Elapsed time counter while visible.
  useEffect(() => {
    if (!prayer) return;
    const timer = window.setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - startedAtRef.current) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [prayer]);

  // Poll the native side so the card dismisses itself when the audio ends.
  // A short grace period keeps the card up while the native plugin settles.
  useEffect(() => {
    if (!prayer) return;
    const poll = window.setInterval(() => {
      if (Date.now() - startedAtRef.current < 5000) return;
      void isAdhanPlaying().then((playing) => {
        if (!playing) setPrayer(null);
      });
    }, 3000);
    return () => window.clearInterval(poll);
  }, [prayer]);

  const handleStop = () => {
    setPrayer(null);
    void stopAdhan();
  };

  if (!prayer) return null;

  return (
    <div className="adhan-player" role="status" aria-label="Adhan playing">
      <div className="adhan-player-card">
        <div className="adhan-wave" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="adhan-player-text">
          <span className="adhan-player-title">{labelFor(prayer)}</span>
          <span className="adhan-player-reciter">{reciter}</span>
        </div>
        <span className="adhan-player-time">{formatTime(elapsed)}</span>
        <button
          type="button"
          className="adhan-player-stop"
          aria-label="Stop adhan"
          onClick={handleStop}
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
