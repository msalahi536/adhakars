import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/tasbih")({
  head: () => ({ meta: [{ title: "Tasbih — My Adhkar" }] }),
  component: Tasbih,
});

type Milestone = 33 | 99 | 100 | 0; // 0 = infinity
const MILESTONES: Milestone[] = [33, 99, 100, 0];
const STORAGE = "adhkar:tasbih";

function Tasbih() {
  const [total, setTotal] = useState(0);
  const [milestone, setMilestone] = useState<Milestone>(33);
  const [pulse, setPulse] = useState(false);
  const [flash, setFlash] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE) || "{}");
      if (typeof s.total === "number") setTotal(s.total);
      if (typeof s.milestone === "number") setMilestone(s.milestone as Milestone);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify({ total, milestone }));
  }, [total, milestone]);

  const hasMilestone = milestone > 0;
  const cycleCount = hasMilestone ? total % milestone : 0;
  const cycleNum = hasMilestone ? Math.floor(total / milestone) + 1 : 1;

  const tap = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    setPulse(true);
    setTimeout(() => setPulse(false), 220);
    setTotal((n) => {
      const next = n + 1;
      if (hasMilestone && next % milestone === 0) {
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
        setFlash(true);
        setTimeout(() => setFlash(false), 600);
      }
      return next;
    });
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1500);
  };

  const onPressStart = () => {
    longPressFired.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      if (navigator.vibrate) navigator.vibrate(40);
      setTotal(0);
      showToast("Counter reset");
    }, 2000);
  };
  const onPressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (!longPressFired.current) tap();
  };
  const onPressCancel = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressFired.current = true; // suppress tap
  };

  // Arc progress
  const arcSize = 200;
  const stroke = 6;
  const r = (arcSize - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = hasMilestone ? Math.min(1, cycleCount / milestone) : 0;

  return (
    <div
      className="mx-auto flex h-[100dvh] max-w-md flex-col px-5 pt-6"
      style={{ paddingBottom: "calc(64px + env(safe-area-inset-bottom))" }}
    >
      {/* Header */}
      <header className="shrink-0">
        <div className="label-caps">Counter</div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Tasbih</h1>
      </header>

      {/* Milestone selector */}
      <div className="mt-5 flex shrink-0 items-center gap-2">
        {MILESTONES.map((t) => {
          const active = milestone === t;
          const label = t === 0 ? "∞" : String(t);
          return (
            <button
              key={t}
              onClick={() => setMilestone(t)}
              className="rounded-full px-4 py-2 text-sm font-semibold transition"
              style={
                active
                  ? { background: "var(--accent)", color: "var(--accent-foreground)" }
                  : {
                      background: "var(--btn-surface, var(--surface))",
                      color: "var(--btn-fg, var(--foreground))",
                      border: "1px solid var(--border)",
                    }
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="my-5 h-px shrink-0" style={{ background: "var(--border)" }} />

      {/* Giant number + arc */}
      <div className="flex shrink-0 flex-col items-center">
        <div className="relative" style={{ width: arcSize, height: arcSize }}>
          {hasMilestone && (
            <svg width={arcSize} height={arcSize} className="absolute inset-0">
              <circle
                cx={arcSize / 2}
                cy={arcSize / 2}
                r={r}
                stroke="var(--ring-track, rgba(255,255,255,0.18))"
                strokeWidth={stroke}
                fill="none"
              />
              <circle
                cx={arcSize / 2}
                cy={arcSize / 2}
                r={r}
                stroke="var(--accent)"
                strokeWidth={stroke}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={c}
                strokeDashoffset={c * (1 - pct)}
                transform={`rotate(-90 ${arcSize / 2} ${arcSize / 2})`}
                style={{ transition: "stroke-dashoffset 350ms cubic-bezier(0.34,1.56,0.64,1)" }}
              />
            </svg>
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`tabular-nums leading-none ${pulse ? "tap-pulse" : ""} ${flash ? "pop-in" : ""}`}
              style={{
                fontSize: 96,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: flash ? "var(--accent)" : "var(--foreground)",
                transition: "color 200ms",
              }}
            >
              {total}
            </span>
          </div>
        </div>
        <div className="mt-3 text-sm opacity-70">
          {hasMilestone ? <>cycle {cycleNum} · {cycleCount}/{milestone}</> : <>continuous</>}
        </div>
      </div>

      <div className="my-5 h-px shrink-0" style={{ background: "var(--border)" }} />

      {/* Giant tap area */}
      <button
        onMouseDown={onPressStart}
        onMouseUp={onPressEnd}
        onMouseLeave={onPressCancel}
        onTouchStart={(e) => { e.preventDefault(); onPressStart(); }}
        onTouchEnd={(e) => { e.preventDefault(); onPressEnd(); }}
        onTouchCancel={onPressCancel}
        className="flex flex-1 flex-col items-center justify-center rounded-3xl active:scale-[0.99]"
        style={{
          background: "color-mix(in oklab, var(--foreground) 4%, transparent)",
          border: "1px dashed color-mix(in oklab, var(--foreground) 15%, transparent)",
          touchAction: "manipulation",
          color: "var(--foreground)",
        }}
        aria-label="tap to count"
      >
        <span className="label-caps">Tap to count</span>
        <span className="mt-1 text-[11px] opacity-50">Hold 2s to reset</span>
      </button>

      <div className="flex shrink-0 justify-center pt-3">
        <button
          onClick={() => { setTotal(0); showToast("Counter reset"); }}
          className="rounded-full px-5 py-1.5 text-xs font-semibold"
          style={{
            background: "var(--btn-surface, var(--surface))",
            color: "var(--btn-fg, var(--foreground))",
            border: "1px solid var(--border)",
          }}
        >
          Reset
        </button>
      </div>

      {toast && (
        <div
          className="pop-in fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg"
          style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
