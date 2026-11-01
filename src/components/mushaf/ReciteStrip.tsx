import { useEffect, useRef } from "react";


export type StripState = "idle" | "listening" | "paused";

const BAR_COUNT = 56;

/**
 * Floating recite strip: theme gradient, glass sheen, waveform.
 * - idle / paused: calm static waveform
 * - listening: bars follow the REAL microphone level (pass the MediaStream from getUserMedia)
 */
export function ReciteStrip({
  state,
  label,
  time,
  stream,
  onTap,
  onLongPress,
}: {
  state: StripState;
  label: string;
  time?: string;
  stream?: MediaStream | null;
  onTap?: () => void;
  onLongPress?: () => void;
}) {
  const barsRef = useRef<HTMLDivElement>(null);
  const pressTimer = useRef<number | null>(null);
  const longPressed = useRef(false);

  // Static "resting" shape: tallest in the middle, fading to the edges.
  const restHeight = (k: number, flat: boolean) => {
    const x = (k - BAR_COUNT / 2) / (BAR_COUNT / 2);
    if (flat) return 3;
    return 5 + 20 * Math.exp(-x * x * 6) * (0.55 + 0.45 * Math.abs(Math.sin(k * 1.7)));
  };

  // Live mic levels -> bar heights (Web Audio analyser, ~60fps, no re-renders).
  useEffect(() => {
    const bars = barsRef.current?.children;
    if (!bars) return;
    if (state !== "listening" || !stream) {
      for (let k = 0; k < bars.length; k++)
        (bars[k] as HTMLElement).style.height = `${restHeight(k, state === "paused").toFixed(1)}px`;
      return;
    }
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx: AudioContext = new Ctx();
    void ctx.resume().catch(() => undefined);
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.75;
    src.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    let raf = 0;
    const tick = () => {
      analyser.getByteFrequencyData(data);
      // Voice lives in the low/mid bins; mirror them so the waveform is symmetric around the center.
      const half = BAR_COUNT / 2;
      for (let k = 0; k < BAR_COUNT; k++) {
        const d = Math.abs(k - half + 0.5) / half; // 0 center .. 1 edge
        const bin = Math.min(data.length - 1, Math.floor(2 + d * 40));
        const level = data[bin] / 255;
        const h = 3 + level * 34 * (1 - d * 0.55);
        (bars[k] as HTMLElement).style.height = `${h.toFixed(1)}px`;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      src.disconnect();
      ctx.close();
    };
  }, [state, stream]);

  const down = () => {
    longPressed.current = false;
    pressTimer.current = window.setTimeout(() => {
      longPressed.current = true;
      onLongPress?.();
    }, 450);
  };
  const up = () => {
    if (pressTimer.current) window.clearTimeout(pressTimer.current);
    if (!longPressed.current) onTap?.();
  };

  return (
    <button
      type="button"
      onPointerDown={down}
      onPointerUp={up}
      onPointerLeave={() => pressTimer.current && window.clearTimeout(pressTimer.current)}
      className="relative w-full overflow-hidden text-left select-none active:scale-[0.99] transition-transform"
      style={{
        height: 92,
        borderRadius: 26,
        background: "linear-gradient(160deg, var(--m-strip-a), var(--m-strip-b))",
        boxShadow:
          "0 10px 30px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.35), inset 0 -1px 0 rgba(0,0,0,.12)",
        color: "var(--m-strip-text)",
        WebkitTapHighlightColor: "transparent",
      }}
      aria-label={label}
    >
      {/* glass sheen */}
      <span
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,0) 55%)" }}
      />
      <div ref={barsRef} className="absolute flex items-center justify-center" style={{ left: 22, right: 22, top: 18, height: 38, gap: 3 }}>
        {Array.from({ length: BAR_COUNT }, (_, k) => {
          const x = (k - BAR_COUNT / 2) / (BAR_COUNT / 2);
          return (
            <i
              key={k}
              style={{
                width: 2.5,
                borderRadius: 2,
                background: "currentColor",
                opacity: 0.45 + 0.5 * Math.exp(-x * x * 3),
                height: restHeight(k, state === "paused"),
                transition: state === "listening" ? "none" : "height .3s ease",
              }}
            />
          );
        })}
      </div>
      <div className="absolute flex justify-between" style={{ left: 22, right: 22, bottom: 14, fontSize: 15, fontWeight: 500 }}>
        <span>{label}</span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{time ?? ""}</span>
      </div>
    </button>
  );
}
