import { useEffect, useRef, useState } from "react";
import { subscribeOrientation } from "@/lib/compass";

type Props = {
  onDone: () => void;
  onSkip: () => void;
};

const SEGMENTS = 8; // 45 degree sectors around the phone
const NEEDED = 5; // only 5 of 8 sectors are required, so this is quick
const SWEEP_TARGET = 320; // or this much total rotation, whichever lands first

/**
 * Light, quick calibration. The phone glyph is surrounded by eight petals that
 * light up as the magnetometer sees each sector. It also accepts plain total
 * rotation, so a couple of relaxed wrist turns is enough.
 */
export function CompassCalibrationCard({ onDone, onSkip }: Props) {
  const [lit, setLit] = useState<boolean[]>(() => Array.from({ length: SEGMENTS }, () => false));
  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);
  const [mode, setMode] = useState<"waiting" | "live" | "nosensor">("waiting");

  const binsRef = useRef<boolean[]>(Array.from({ length: SEGMENTS }, () => false));
  const sweepRef = useRef(0);
  const lastRef = useRef<number | null>(null);
  const gotRef = useRef(false);
  const doneRef = useRef(false);

  useEffect(() => {
    const unsub = subscribeOrientation((r) => {
      if (doneRef.current) return;
      gotRef.current = true;
      setMode("live");
      if (r.heading === null) return;

      const idx = Math.floor((r.heading / 360) * SEGMENTS) % SEGMENTS;
      if (!binsRef.current[idx]) {
        binsRef.current[idx] = true;
        setLit([...binsRef.current]);
      }

      const last = lastRef.current;
      if (last !== null) {
        const delta = Math.abs(((r.heading - last + 540) % 360) - 180);
        if (delta > 1.5 && delta < 90) sweepRef.current += delta;
      }
      lastRef.current = r.heading;

      const byBins = binsRef.current.filter(Boolean).length / NEEDED;
      const bySweep = sweepRef.current / SWEEP_TARGET;
      const p = Math.min(1, Math.max(byBins, bySweep));
      setProgress(p);
      if (p >= 1) {
        doneRef.current = true;
        setComplete(true);
        setLit(Array.from({ length: SEGMENTS }, () => true));
      }
    });

    const t = setTimeout(() => {
      if (!gotRef.current) setMode("nosensor");
    }, 4000);

    return () => {
      unsub();
      clearTimeout(t);
    };
  }, []);

  const pct = Math.round(progress * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{
        background: "color-mix(in oklab, #000 45%, transparent)",
        backdropFilter: "blur(8px)",
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm rounded-[28px] p-6"
        style={{
          background: "var(--card)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
          color: "var(--foreground)",
        }}
      >
        <div className="label-caps" style={{ color: "var(--muted-foreground)" }}>
          Compass
        </div>
        <h2 className="mt-1 text-lg font-bold">
          {complete ? "All set" : "Quick calibration"}
        </h2>
        <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
          {mode === "nosensor"
            ? "This device is not sending compass readings. Open the app on a phone, and make sure motion access is allowed."
            : complete
              ? "Your compass is calibrated. You can find the Qibla now."
              : "Hold your phone flat and turn your wrist side to side a couple of times. The petals light up as it tunes in."}
        </p>

        {mode !== "nosensor" && (
          <div className="mt-6 flex flex-col items-center">
            <div className="relative" style={{ width: 168, height: 168 }}>
              {/* Petals */}
              {lit.map((on, i) => (
                <div
                  key={i}
                  className="absolute left-1/2 top-1/2"
                  style={{
                    transform: `translate(-50%, -50%) rotate(${i * (360 / SEGMENTS)}deg) translateY(-64px)`,
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 26,
                      borderRadius: 999,
                      background: on
                        ? complete
                          ? "#3d8f5c"
                          : "var(--accent)"
                        : "color-mix(in oklab, var(--foreground) 10%, transparent)",
                      transform: on ? "scaleY(1.12)" : "scaleY(1)",
                      boxShadow: on
                        ? "0 0 14px color-mix(in oklab, var(--accent) 45%, transparent)"
                        : "none",
                      transition: "background 260ms ease, transform 260ms ease, box-shadow 260ms ease",
                    }}
                  />
                </div>
              ))}

              {/* Phone glyph */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="flex flex-col items-center justify-center"
                  style={{
                    width: 58,
                    height: 92,
                    borderRadius: 14,
                    border: "2px solid color-mix(in oklab, var(--foreground) 22%, transparent)",
                    background: "color-mix(in oklab, var(--accent) 8%, transparent)",
                    animation: complete ? "none" : "qibla-tilt 2.6s ease-in-out infinite",
                  }}
                >
                  <div className="text-sm font-bold">{complete ? "✓" : `${pct}%`}</div>
                </div>
              </div>
            </div>
            <div className="mt-3 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
              {mode === "waiting"
                ? "Waiting for sensor"
                : complete
                  ? "Calibrated"
                  : "Keep turning gently"}
            </div>
          </div>
        )}

        <p className="mt-5 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
          Keep away from magnets, metal, and magnetic phone cases, as these affect accuracy.
        </p>

        <div className="mt-5 flex items-center justify-between gap-2">
          <button
            onClick={onSkip}
            className="rounded-full px-4 py-2 text-xs font-bold"
            style={{ background: "transparent", color: "var(--muted-foreground)" }}
          >
            Skip for now
          </button>
          <button
            onClick={complete || mode === "nosensor" ? onDone : onSkip}
            className="rounded-full px-5 py-2 text-sm font-bold"
            style={{
              background: complete ? "var(--accent)" : "var(--btn-surface)",
              color: complete ? "var(--accent-foreground)" : "var(--btn-fg)",
              border: complete
                ? "none"
                : "1px solid color-mix(in oklab, var(--foreground) 12%, transparent)",
            }}
          >
            {complete ? "Done" : mode === "nosensor" ? "Got it" : "Use it anyway"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes qibla-tilt {
          0%, 100% { transform: rotate(-14deg); }
          50% { transform: rotate(14deg); }
        }
      `}</style>
    </div>
  );
}
