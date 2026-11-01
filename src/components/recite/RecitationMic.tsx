import { useEffect, useRef } from "react";
import { Eye, Headphones, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RecitationMic({ stream, busy, playing, start, listen, peek, onSilence }: {
  stream: MediaStream | null; busy: boolean; playing: boolean; start: () => void;
  listen: () => void; peek: () => void; onSilence: (lastVoice: number) => void;
}) {
  const mic = useRef<HTMLButtonElement | null>(null);
  const silence = useRef(onSilence); silence.current = onSilence;
  useEffect(() => {
    if (!stream) { mic.current?.style.setProperty("--rc-voice-scale", "1"); return; }
    const Context = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) return;
    const ctx = new Context(); void ctx.resume();
    const source = ctx.createMediaStreamSource(stream); const analyzer = ctx.createAnalyser();
    analyzer.fftSize = 256; source.connect(analyzer);
    const samples = new Float32Array(analyzer.fftSize); let frame = 0; let lastVoice = Date.now();
    const tick = () => {
      analyzer.getFloatTimeDomainData(samples);
      const rms = Math.sqrt(samples.reduce((sum, v) => sum + v * v, 0) / samples.length);
      if (rms > 0.012) lastVoice = Date.now();
      mic.current?.style.setProperty("--rc-voice-scale", String(1 + Math.min(.22, rms * 2)));
      silence.current(lastVoice); frame = requestAnimationFrame(tick);
    }; tick();
    return () => { cancelAnimationFrame(frame); source.disconnect(); void ctx.close(); };
  }, [stream]);
  return <div className="rc-mic-controls">
    <Button variant="ghost" size="icon" aria-label={playing ? "Stop qari" : "Listen to lesson"} title="Listen to lesson" onClick={listen} disabled={busy || !!stream}><Headphones /></Button>
    <Button ref={mic} className={`rc-round-mic ${stream ? "is-listening" : ""}`} aria-label={stream ? "Stop recitation" : "Start recitation"} disabled={busy} onClick={start}>{stream ? <Square /> : <Mic />}</Button>
    <Button variant="ghost" size="icon" aria-label="Peek at words" title="Peek at words" onClick={peek} disabled={busy}><Eye /></Button>
    <small className="rc-mic-caption">{stream ? "Listening…" : busy ? "Checking…" : ""}</small>
  </div>;
}