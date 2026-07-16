import { useEffect, useRef, useState } from "react";

type Props = {
  onDismiss: () => void;
};

type DeviceOrientationEventStatic = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

type DeviceMotionEventStatic = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

// Track orientation spread across alpha/beta/gamma. When the accumulated
// spread crosses the threshold we consider calibration complete. This is
// intentionally forgiving, not a real figure-8 shape detector.
const TARGET_SPREAD = 360; // total degrees of variety across the three axes

export function CompassCalibrationCard({ onDismiss }: Props) {
  const [progress, setProgress] = useState(0); // 0..1
  const [complete, setComplete] = useState(false);
  const [sensorMode, setSensorMode] = useState<"pending" | "live" | "fallback">("pending");
  const rangesRef = useRef({
    aMin: Infinity, aMax: -Infinity,
    bMin: Infinity, bMax: -Infinity,
    gMin: Infinity, gMax: -Infinity,
  });
  const gotEventRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let handler: ((e: DeviceOrientationEvent) => void) | null = null;

    const attach = () => {
      handler = (e: DeviceOrientationEvent) => {
        if (cancelled) return;
        gotEventRef.current = true;
        if (sensorMode !== "live") setSensorMode("live");
        const r = rangesRef.current;
        if (typeof e.alpha === "number") {
          r.aMin = Math.min(r.aMin, e.alpha);
          r.aMax = Math.max(r.aMax, e.alpha);
        }
        if (typeof e.beta === "number") {
          r.bMin = Math.min(r.bMin, e.beta);
          r.bMax = Math.max(r.bMax, e.beta);
        }
        if (typeof e.gamma === "number") {
          r.gMin = Math.min(r.gMin, e.gamma);
          r.gMax = Math.max(r.gMax, e.gamma);
        }
        const spread =
          Math.max(0, r.aMax - r.aMin) +
          Math.max(0, r.bMax - r.bMin) +
          Math.max(0, r.gMax - r.gMin);
        const p = Math.min(1, spread / TARGET_SPREAD);
        setProgress(p);
        if (p >= 1) setComplete(true);
      };
      window.addEventListener("deviceorientation", handler as EventListener, true);
      window.addEventListener("deviceorientationabsolute", handler as EventListener, true);
    };

    const init = async () => {
      const DOE = DeviceOrientationEvent as DeviceOrientationEventStatic | undefined;
      const DME = DeviceMotionEvent as DeviceMotionEventStatic | undefined;
      // On iOS motion permission may already have been granted this session.
      // We do NOT force a fresh requestPermission here (that requires a user
      // gesture); if events do not arrive within ~1.5s we fall back to the
      // static guide.
      if (typeof window === "undefined" || !DOE) {
        setSensorMode("fallback");
        return;
      }
      try {
        attach();
      } catch {
        setSensorMode("fallback");
        return;
      }
      // Fallback if no events after 1500ms
      setTimeout(() => {
        if (!cancelled && !gotEventRef.current) setSensorMode("fallback");
      }, 1500);
      // Reference DME to keep TS from tree-shaking (some browsers gate motion
      // permission through DeviceMotionEvent instead).
      void DME;
    };

    void init();

    return () => {
      cancelled = true;
      if (handler) {
        window.removeEventListener("deviceorientation", handler as EventListener, true);
        window.removeEventListener("deviceorientationabsolute", handler as EventListener, true);
      }
    };
  }, [sensorMode]);

  const showProgress = sensorMode === "live";
  const showFallback = sensorMode === "fallback";

  return (
    <div
      className="w-full rounded-2xl p-5"
      style={{
        background: "linear-gradient(180deg, rgba(45,90,61,0.55) 0%, rgba(26,46,34,0.65) 100%)",
        border: "1px solid rgba(201,168,76,0.35)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
      }}
    >
      <h2 className="text-base font-bold" style={{ color: "#ffffff" }}>
        Calibrate your compass
      </h2>
      <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.9)" }}>
        Move your phone in a figure 8 motion. Tilt and rotate it as you go.
      </p>

      <div className="mt-4 flex items-center justify-center">
        <Figure8Animation />
      </div>

      {showProgress && (
        <div className="mt-4">
          <div
            className="h-2 w-full overflow-hidden rounded-full"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            <div
              style={{
                width: `${Math.round(progress * 100)}%`,
                height: "100%",
                background: complete ? "#4ade80" : "#c9a84c",
                transition: "width 200ms linear, background 200ms linear",
              }}
            />
          </div>
          <div
            className="mt-1 text-center text-[11px]"
            style={{ color: complete ? "#4ade80" : "rgba(255,255,255,0.8)" }}
          >
            {complete ? "Calibrated" : "Calibrating"}
          </div>
        </div>
      )}

      <p className="mt-4 text-[11px]" style={{ color: "rgba(255,255,255,0.6)" }}>
        Keep away from magnets, metal, and magnetic phone cases, as these affect accuracy.
      </p>

      <div className="mt-4 flex justify-end gap-2">
        {showFallback ? (
          <button
            onClick={onDismiss}
            className="rounded-full px-5 py-2 text-sm font-bold"
            style={{ background: "#c9a84c", color: "#1f3d2b" }}
          >
            Got it
          </button>
        ) : (
          <>
            <button
              onClick={onDismiss}
              className="rounded-full px-5 py-2 text-sm font-bold"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              Skip
            </button>
            {complete && (
              <button
                onClick={onDismiss}
                className="rounded-full px-5 py-2 text-sm font-bold"
                style={{ background: "#c9a84c", color: "#1f3d2b" }}
              >
                Done
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Figure8Animation() {
  // SVG figure-8 (lemniscate-like) path with a dot moving along it.
  return (
    <svg width={140} height={70} viewBox="0 0 140 70" fill="none" aria-hidden>
      <path
        id="fig8-path"
        d="M20,35 C20,10 55,10 70,35 C85,60 120,60 120,35 C120,10 85,10 70,35 C55,60 20,60 20,35 Z"
        stroke="rgba(201,168,76,0.45)"
        strokeWidth={2}
        fill="none"
      />
      <circle r={5} fill="#c9a84c">
        <animateMotion dur="2.2s" repeatCount="indefinite">
          <mpath href="#fig8-path" />
        </animateMotion>
      </circle>
    </svg>
  );
}
