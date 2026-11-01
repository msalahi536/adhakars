import { useEffect, useRef } from "react";
import { METER_FFT_SIZE, restingLevels, shapeMeter, spectrumBands } from "@/lib/recitation-meter";

export function VoiceBars({ stream }: { stream: MediaStream | null }) {
  const root = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!stream) return;
    const Context = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) return;
    const ctx = new Context(); void ctx.resume();
    const source = ctx.createMediaStreamSource(stream);
    const analyzer = ctx.createAnalyser(); analyzer.fftSize = METER_FFT_SIZE; source.connect(analyzer);
    const spectrum = new Float32Array(analyzer.frequencyBinCount);
    let levels = restingLevels(), frame = 0, last = performance.now();
    const tick = (now: number) => {
      analyzer.getFloatFrequencyData(spectrum);
      levels = shapeMeter(spectrumBands(spectrum, ctx.sampleRate, analyzer.fftSize), levels, now - last); last = now;
      root.current?.querySelectorAll<HTMLElement>("span").forEach((bar, i) => bar.style.setProperty("--qv-level", String(levels[i])));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); source.disconnect(); void ctx.close(); };
  }, [stream]);
  return <div ref={root} className="qv-live-bars" aria-label="Live microphone level">{[0,1,2,3,4,5].map((i)=><span key={i}/>)}</div>;
}