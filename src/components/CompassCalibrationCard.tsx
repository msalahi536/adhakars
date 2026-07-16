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
        background: "var(--card)",
        border: "1px solid color-mix(in oklab, var(--accent) 35%, transparent)",
        boxShadow: "var(--card-shadow)",
        color: "var(--foreground)",
      }}
    >
      <h2 className="text-base font-bold">Calibrate your compass</h2>
      <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
        Move your phone in a figure 8 motion. Tilt and rotate it as you go.
      </p>

      <div className="mt-4 flex items-center justify-center">
        <Figure8Animation />
      </div>

      {showProgress && (
        <div className="mt-4">
          <div
            className="h-2 w-full overflow-hidden rounded-full"
            style={{
              background: "color-mix(in oklab, var(--foreground) 10%, transparent)",
            }}
          >
            <div
              style={{
                width: `${Math.round(progress * 100)}%`,
                height: "100%",
                background: complete ? "#3d8f5c" : "var(--accent)",
                transition: "width 200ms linear, background 200ms linear",
              }}
            />
          </div>
          <div
            className="mt-1 text-center text-[11px] font-semibold"
            style={{
              color: complete ? "#3d8f5c" : "var(--muted-foreground)",
            }}
          >
            {complete ? "Calibrated" : "Calibrating"}
          </div>
        </div>
      )}

      <p className="mt-4 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
        Keep away from magnets, metal, and magnetic phone cases, as these affect accuracy.
      </p>

      <div className="mt-4 flex justify-end gap-2">
        {showFallback ? (
          <button
            onClick={onDismiss}
            className="rounded-full px-5 py-2 text-sm font-bold"
            style={{
              background: "var(--accent)",
              color: "var(--accent-foreground)",
            }}
          >
            Got it
          </button>
        ) : (
          <>
            <button
              onClick={onDismiss}
              className="rounded-full px-5 py-2 text-sm font-bold"
              style={{
                background: "var(--btn-surface)",
                color: "var(--btn-fg)",
                border:
                  "1px solid color-mix(in oklab, var(--foreground) 12%, transparent)",
              }}
            >
              Skip
            </button>
            {complete && (
              <button
                onClick={onDismiss}
                className="rounded-full px-5 py-2 text-sm font-bold"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-foreground)",
                }}
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
        stroke="color-mix(in oklab, var(--accent) 55%, transparent)"
        strokeWidth={2}
        fill="none"
      />
      <circle r={5} fill="var(--accent)">
        <animateMotion dur="2.2s" repeatCount="indefinite">
          <mpath href="#fig8-path" />
        </animateMotion>
      </circle>
    </svg>
  );
}
