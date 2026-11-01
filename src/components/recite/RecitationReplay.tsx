import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { wordTimeline, wordAt, clipFor, type CheckResult } from "@/lib/hifz-ai";

export function useRecitationReplay(blob: Blob | null, result: CheckResult, highlight: (key: string | null) => void) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const url = useRef<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");
  const mark = useRef(highlight); mark.current = highlight;
  const timeline = useMemo(() => wordTimeline(result), [result]);
  useEffect(() => {
    if (blob) url.current = URL.createObjectURL(blob);
    return () => { audio.current?.pause(); mark.current(null); if (url.current) URL.revokeObjectURL(url.current); url.current = null; };
  }, [blob]);
  const stop = () => { audio.current?.pause(); setPlaying(false); mark.current(null); };
  async function play(key?: string) {
    stop(); if (!url.current) return;
    const clip = key ? clipFor(timeline, result, key) : null;
    if (key && !clip) { setError("This word has no recorded timing yet."); return; }
    const a = new Audio(url.current); audio.current = a;
    a.onloadedmetadata = () => { if (clip) a.currentTime = clip.from; };
    a.ontimeupdate = () => { mark.current(wordAt(timeline, a.currentTime)); if (clip && a.currentTime >= clip.to) stop(); };
    a.onended = stop; a.onerror = () => { stop(); setError("Your recording couldn’t play. Please retry."); };
    try { await a.play(); setError(""); setPlaying(true); } catch { setError("Tap again to play your recording."); }
  }
  return { play, stop, playing, error };
}
export function ReplayButton({ available, playing, play, stop }: { available: boolean; playing: boolean; play: () => void; stop: () => void }) {
  return <Button variant="outline" disabled={!available} onClick={playing ? stop : play}>{playing ? <Square size={15} /> : <Play size={15} />}{playing ? "Stop replay" : "Replay"}</Button>;
}