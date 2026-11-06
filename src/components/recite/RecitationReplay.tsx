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
  // single-word clips play from the decoded audio: exact to the sample (seeking a recorded webm and
  // stopping on timeupdate, which fires only every ~0.25 s, spilled into the next word)
  const decoded = useRef<{ blob: Blob; ctx: AudioContext; buf: AudioBuffer } | null>(null);
  const clipNode = useRef<{ src: AudioBufferSourceNode; raf: number } | null>(null);
  const timeline = useMemo(() => wordTimeline(result), [result]);
  useEffect(() => {
    if (blob) url.current = URL.createObjectURL(blob);
    return () => {
      audio.current?.pause(); stopClip(); mark.current(null);
      if (url.current) URL.revokeObjectURL(url.current); url.current = null;
      void decoded.current?.ctx.close().catch(() => undefined); decoded.current = null;
    };
  }, [blob]);
  function stopClip() {
    const c = clipNode.current; clipNode.current = null;
    if (!c) return;
    cancelAnimationFrame(c.raf); c.src.onended = null;
    try { c.src.stop(); } catch { /* already stopped */ }
  }
  const stop = () => { audio.current?.pause(); stopClip(); setPlaying(false); mark.current(null); };
  async function decode(): Promise<{ ctx: AudioContext; buf: AudioBuffer } | null> {
    if (!blob) return null;
    if (decoded.current?.blob === blob) return decoded.current;
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
      decoded.current = { blob, ctx, buf };
      return decoded.current;
    } catch { return null; }
  }
  async function playClip(clip: { from: number; to: number }): Promise<boolean> {
    const d = await decode();
    if (!d) return false;
    if (d.ctx.state === "suspended") await d.ctx.resume().catch(() => undefined);
    const from = Math.min(clip.from, d.buf.duration);
    const len = Math.max(0, Math.min(clip.to, d.buf.duration) - from);
    if (!len) return false;
    const src = d.ctx.createBufferSource();
    src.buffer = d.buf; src.connect(d.ctx.destination);
    const t0 = d.ctx.currentTime;
    src.onended = () => { if (clipNode.current?.src === src) stop(); };
    src.start(t0, from, len);
    const tick = () => {
      if (clipNode.current?.src !== src) return;
      mark.current(wordAt(timeline, from + (d.ctx.currentTime - t0)));
      clipNode.current.raf = requestAnimationFrame(tick);
    };
    clipNode.current = { src, raf: requestAnimationFrame(tick) };
    setError(""); setPlaying(true);
    return true;
  }
  async function play(key?: string) {
    stop(); if (!url.current) return;
    const clip = key ? clipFor(timeline, result, key) : null;
    if (key && !clip) { setError("This word has no recorded timing yet."); return; }
    if (clip && await playClip(clip)) return;
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