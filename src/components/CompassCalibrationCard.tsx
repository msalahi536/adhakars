import { useEffect, useRef, useState } from "react";
import { subscribeOrientation } from "@/lib/compass";

type Props = {
  onDone: () => void;
  onSkip: () => void;
};

const BINS = 12; // 30 degree buckets around the circle

/**
 * Real, interactive calibration. It listens to live orientation events and
 * fills a progress ring as the phone sweeps through headings and tilts.
 * If no sensor events arrive it degrades to a static instruction card.
 */
export function CompassCalibrationCard({ onDone, onSkip }: Props) {
  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);
  const [mode, setMode] = useState<"waiting" | "live" | "nosensor">("waiting");
  const binsRef = useRef<boolean[]>(Array.from({ length: BINS }, () => false));
  const tiltRef = useRef({ min: Infinity, max: -Infinity });
  const gotRef = useRef(false);

  useEffect(() => {
    const unsub = subscribeOrientation((r) => {
      gotRef.current = true;
      setMode((m) => (m === "live" ? m : "live"));

      if (r.heading !== null) {
        const idx = Math.floor((r.heading / 360) * BINS) % BINS;
        if (!binsRef.current[idx]) binsRef.current[idx] = true;
      }
      if (r.beta !== null) {
        tiltRef.current.min = Math.min(tiltRef.current.min, r.beta);
        tiltRef.current.max = Math.max(tiltRef.current.max, r.beta);
      }

      const visited = binsRef.current.filter(Boolean).length / BINS;
      const tiltSpread = Math.max(0, tiltRef.current.max - tiltRef.current.min);
      const tilt = Math.min(1, tiltSpread / 60);
      const p = Math.min(1, visited * 0.75 + tilt * 0.25);
      setProgress(p);
      if (p >= 0.995) setComplete(true);
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
  const R = 52;
  const C = 2 * Math.PI * R;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{ background: "color-mix(in oklab, #000 45%, transparent)", backdropFilter: "blur(6px)" }}
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
          {complete ? "Calibration complete" : "Calibrate your compass"}
        </h2>
        <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
          {mode === "nosensor"
            ? "This device is not sending compass readings. Open the app on a phone, and make sure motion access is allowed."
            : complete
              ? "Your compass has swept a full circle. You are ready to find the Qibla."
              : "Slowly turn all the way around while tilting your phone in a figure 8. The ring fills as the sensor sees each direction."}
        </p>

        {mode !== "nosensor" && (
          <div className="mt-5 flex flex-col items-center">
            <div className="relative" style={{ width: 128, height: 128 }}>
              <svg width={128} height={128} viewBox="0 0 128 128">
                <circle
                  cx={64}
                  cy={64}
                  r={R}
                  fill="none"
                  strokeWidth={8}
                  stroke="color-mix(in oklab, var(--foreground) 10%, transparent)"
                />
                <circle
                  cx={64}
                  cy={64}
                  r={R}
                  fill="none"
                  strokeWidth={8}
                  strokeLinecap="round"
                  stroke={complete ? "#3d8f5c" : "var(--accent)"}
                  strokeDasharray={C}
                  strokeDashoffset={C * (1 - progress)}
                  transform="rotate(-90 64 64)"
                  style={{ transition: "stroke-dashoffset 200ms linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-xl font-bold">{pct}%</div>
                <div className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                  {mode === "waiting" ? "Waiting for sensor" : complete ? "Done" : "Keep moving"}
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="mt-4 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
          Keep away from magnets, metal, and magnetic phone cases, as these affect accuracy.
        </p>

        <div className="mt-5 flex justify-end gap-2">
          {mode === "nosensor" || complete ? (
            <button
              onClick={complete ? onDone : onSkip}
              className="rounded-full px-5 py-2 text-sm font-bold"
              style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
            >
              {complete ? "Done" : "Got it"}
            </button>
          ) : (
            <button
              onClick={onSkip}
              className="rounded-full px-5 py-2 text-sm font-bold"
              style={{
                background: "var(--btn-surface)",
                color: "var(--btn-fg)",
                border: "1px solid color-mix(in oklab, var(--foreground) 12%, transparent)",
              }}
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
