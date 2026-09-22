import { useEffect, useRef, useState } from "react";
import { subscribeOrientation } from "@/lib/compass";

type Props = {
  onDone: () => void;
  onSkip: () => void;
};

// Field the marker moves in (px)
const W = 286;
const H = 190;

// Lemniscate (figure 8) checkpoints. x = sin(t), y = sin(t)cos(t)
const NODES = Array.from({ length: 10 }, (_, i) => {
  const t = (i / 10) * Math.PI * 2;
  return {
    x: W / 2 + Math.sin(t) * (W / 2 - 26),
    y: H / 2 + Math.sin(t) * Math.cos(t) * (H / 2 - 18) * 2,
  };
});

const HIT = 42; // intentionally forgiving on a moving handheld device
const TILT_RANGE = 24; // a small wrist tilt reaches the edge

function pathD() {
  const pts = Array.from({ length: 80 }, (_, i) => {
    const t = (i / 79) * Math.PI * 2;
    return [
      W / 2 + Math.sin(t) * (W / 2 - 26),
      H / 2 + Math.sin(t) * Math.cos(t) * (H / 2 - 18) * 2,
    ];
  });
  return pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ") + " Z";
}
const D = pathD();

/**
 * Trace the figure 8. A dot follows how the phone is tilted, and the user
 * steers it over the glowing checkpoints. Tilting is far easier and far more
 * responsive than spinning in place, so this finishes in a few seconds.
 */
export function CompassCalibrationCard({ onDone, onSkip }: Props) {
  const [hit, setHit] = useState<boolean[]>(() => NODES.map(() => false));
  const [pos, setPos] = useState({ x: W / 2, y: H / 2 });
  const [complete, setComplete] = useState(false);
  const [mode, setMode] = useState<"waiting" | "live" | "nosensor">("waiting");

  const hitRef = useRef<boolean[]>(NODES.map(() => false));
  const gotRef = useRef(false);
  const doneRef = useRef(false);
  const baseRef = useRef<{ beta: number; gamma: number } | null>(null);

  useEffect(() => {
    const unsub = subscribeOrientation((r) => {
      if (doneRef.current) return;
      if (r.beta === null || r.gamma === null) return;
      gotRef.current = true;
      setMode("live");

      if (!baseRef.current) baseRef.current = { beta: r.beta, gamma: r.gamma };
      const base = baseRef.current;

      const dx = Math.max(-1, Math.min(1, (r.gamma - base.gamma) / TILT_RANGE));
      const dy = Math.max(-1, Math.min(1, (r.beta - base.beta) / TILT_RANGE));
      const x = W / 2 + dx * (W / 2 - 14);
      const y = H / 2 + dy * (H / 2 - 12);
      setPos({ x, y });

      let changed = false;
      NODES.forEach((n, i) => {
        if (hitRef.current[i]) return;
        if (Math.hypot(n.x - x, n.y - y) < HIT) {
          hitRef.current[i] = true;
          changed = true;
        }
      });
      if (changed) {
        setHit([...hitRef.current]);
        if (hitRef.current.every(Boolean)) {
          doneRef.current = true;
          setComplete(true);
        }
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

  const done = hit.filter(Boolean).length;
  const pct = Math.round((done / NODES.length) * 100);
  const nextNode = NODES.find((_, index) => !hit[index]);

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
        className="w-full max-w-sm rounded-[24px] p-5"
        style={{
          background: "var(--card)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
          color: "var(--foreground)",
        }}
      >
        <div className="label-caps" style={{ color: "var(--muted-foreground)" }}>
          Compass
        </div>
        <h2 className="mt-1 text-xl font-semibold">{complete ? "All set" : "Move in a figure 8"}</h2>

        {mode === "nosensor" ? (
          <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
            This device is not sending motion readings. Open the app on a phone, and make sure
            motion access is allowed.
          </p>
        ) : complete ? (
          <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
            Your compass is calibrated. You can find the Qibla now.
          </p>
        ) : (
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            Hold your phone flat. Gently tilt it to guide the large dot along the glowing path.
          </p>
        )}

        {mode !== "nosensor" && (
          <div className="mt-5 flex flex-col items-center">
            <div
              className="relative overflow-hidden rounded-[20px]"
              style={{
                width: W,
                height: H,
                background: "color-mix(in oklab, var(--accent) 9%, var(--card))",
                border: "1px solid color-mix(in oklab, var(--accent) 24%, transparent)",
              }}
            >
              <svg width={W} height={H} className="absolute inset-0">
                <path
                  d={D}
                  fill="none"
                  stroke="color-mix(in oklab, var(--accent) 52%, transparent)"
                  strokeWidth={7}
                  strokeLinecap="round"
                />
                {NODES.map((n, i) => (
                  <circle
                    key={i}
                    cx={n.x}
                    cy={n.y}
                    r={hit[i] ? 7 : nextNode === n ? 9 : 5}
                    fill={
                      hit[i]
                        ? complete
                          ? "#3d8f5c"
                          : "var(--accent)"
                        : nextNode === n
                          ? "var(--accent)"
                          : "color-mix(in oklab, var(--foreground) 20%, transparent)"
                    }
                    style={{
                      filter: hit[i] || nextNode === n
                        ? "drop-shadow(0 0 7px color-mix(in oklab, var(--accent) 70%, transparent))"
                        : "none",
                      transition: "r 200ms ease, fill 240ms ease",
                    }}
                  />
                ))}
              </svg>

              {/* Tilt marker */}
              <div
                className="absolute"
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: 26,
                  height: 26,
                  marginLeft: -13,
                  marginTop: -13,
                  borderRadius: 999,
                  background: "var(--accent)",
                  border: "3px solid var(--accent-foreground)",
                  boxShadow: "0 0 0 6px color-mix(in oklab, var(--accent) 25%, transparent), 0 5px 14px color-mix(in oklab, var(--foreground) 18%, transparent)",
                  transition: "left 90ms linear, top 90ms linear",
                }}
              />
            </div>
            <div className="mt-3 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
              {mode === "waiting"
                ? "Waiting for sensor"
                : complete
                  ? "Calibrated"
                  : `${pct}% complete · follow the glowing point`}
            </div>
          </div>
        )}

        <p className="mt-4 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
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
    </div>
  );
}
