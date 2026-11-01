import { useEffect, useRef } from "react";
import { Eye, EyeOff, Headphones, LoaderCircle, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RecitationMic({ stream, listening, busy, self, playing, peek, disabled, onTap, onListen, onPeek, onSilence }: {
  stream: MediaStream | null; listening: boolean; busy: boolean; self: boolean; playing: boolean; peek: boolean; disabled: boolean;
  onTap: () => void; onListen: () => void; onPeek: () => void; onSilence: (silence: number, voiced: boolean) => void;
}) {
  const mic = useRef<HTMLButtonElement>(null);
  const silence = useRef(onSilence); silence.current = onSilence;
  useEffect(() => {
    if (!stream || !listening) { mic.current?.style.setProperty("--rc-voice-scale", "1"); return; }
    const AudioCtx = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const context = new AudioCtx();
    void context.resume();
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser(); analyser.fftSize = 1024; source.connect(analyser);
    const samples = new Float32Array(analyser.fftSize);
    let frame = 0, lastVoice = performance.now(), voiced = false, level = 0;
    const tick = () => {
      analyser.getFloatTimeDomainData(samples);
      const rms = Math.sqrt(samples.reduce((n, v) => n + v * v, 0) / samples.length);
      if (rms > .012) { lastVoice = performance.now(); voiced = true; }
      level = level * .65 + Math.min(1, rms * 8) * .35;
      mic.current?.style.setProperty("--rc-voice-scale", String(1 + level * .24));
      silence.current(performance.now() - lastVoice, voiced);
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(frame); source.disconnect(); void context.close(); };
  }, [stream, listening]);
  return <div className="rc-mic-tools">
    {listening && <span className="rc-listening-label" role="status">Listening…</span>}
    <Button variant="ghost" size="icon" className="rc-mic-side" aria-label={playing ? "Stop qari" : "Listen to lesson"} title={playing ? "Stop qari" : "Listen to lesson"} disabled={busy || listening || disabled} onClick={onListen}>{playing ? <Square /> : <Headphones />}</Button>
    <Button ref={mic} className={`rc-round-mic ${listening ? "is-listening" : ""}`} aria-label={self ? "Reveal next word" : listening ? "Stop recitation" : busy ? "Preparing recitation" : "Start recitation"} title={self ? "Reveal next word" : listening ? "Stop recitation" : "Start recitation"} disabled={busy || disabled} onClick={onTap}>{busy ? <LoaderCircle className="rc-mic-loading" /> : listening ? <Square /> : self ? <Eye /> : <Mic />}</Button>
    <Button variant="ghost" size="icon" className="rc-mic-side" aria-label={peek ? "Hide lesson" : "Peek at lesson"} title={peek ? "Hide lesson" : "Peek at lesson"} aria-pressed={peek} disabled={busy || disabled} onClick={onPeek}>{peek ? <EyeOff /> : <Eye />}</Button>
  </div>;
}