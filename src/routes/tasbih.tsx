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
  const [cycle, setCycle] = useState(1);
  const [milestone, setMilestone] = useState<Milestone>(33);
  const [flash, setFlash] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE) || "{}");
      if (typeof s.total === "number") setTotal(s.total);
      if (typeof s.cycle === "number") setCycle(s.cycle);
      if (typeof s.milestone === "number") setMilestone(s.milestone as Milestone);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify({ total, cycle, milestone }));
  }, [total, cycle, milestone]);

  const hasMilestone = milestone > 0;
  const cycleCount = hasMilestone ? total % milestone : 0;
  const cycleNum = hasMilestone ? Math.floor(total / milestone) + 1 : cycle;
  const progress = hasMilestone ? cycleCount / milestone : 0;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  };

  const tap = () => {
    if (navigator.vibrate) navigator.vibrate(15);
    setTotal((n) => {
      const next = n + 1;
      if (hasMilestone && next % milestone === 0) {
        if (navigator.vibrate) navigator.vibrate([40, 20, 40]);
        setFlash(true);
        setTimeout(() => setFlash(false), 150);
      }
      return next;
    });
  };

  const onPressStart = () => {
    longPressFired.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      if (navigator.vibrate) navigator.vibrate(40);
      setTotal(0);
      setCycle(1);
      showToast("Count reset ✓");
    }, 2000);
  };
  const onPressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (!longPressFired.current) tap();
  };
  const onPressCancel = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressFired.current = true;
  };

  // Ring math
  const r = 100;
  const c = 2 * Math.PI * r;

  return (
    <div
      className="mx-auto flex h-[100dvh] max-w-md flex-col"
      style={{ padding: "24px 24px calc(72px + env(safe-area-inset-bottom))" }}
    >
      <header className="shrink-0">
        <div className="label-caps">Counter</div>
        <h1 className="mt-1 font-bold tracking-tight" style={{ fontSize: 32 }}>Tasbih</h1>
      </header>

      {/* Milestone pills */}
      <div className="mt-5 flex shrink-0 items-center justify-center gap-2">
        {MILESTONES.map((t) => {
          const active = milestone === t;
          const label = t === 0 ? "∞" : String(t);
          return (
            <button
              key={t}
              onClick={() => setMilestone(t)}
              className="flex items-center justify-center font-bold transition-transform active:scale-95"
              style={{
                width: 48,
                height: 36,
                borderRadius: 20,
                fontSize: 14,
                background: active ? "var(--accent)" : "var(--btn-surface, var(--surface))",
                color: active ? "var(--accent-foreground)" : "var(--muted-foreground)",
                border: active ? "none" : "1px solid var(--nav-border, var(--border))",
                transition: "background 0.25s ease, color 0.25s ease",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* SVG counter */}
      <div className="mt-6 flex shrink-0 justify-center">
        <svg width={240} height={240} viewBox="0 0 240 240">
          <circle cx={120} cy={120} r={r}
            stroke="var(--ring-track, rgba(0,0,0,0.08))"
            strokeWidth={10} fill="none" />
          {hasMilestone && (
            <circle
              cx={120}
              cy={120}
              r={r}
              stroke={flash ? "#ffffff" : "var(--accent)"}
              strokeWidth={10}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - progress)}
              transform="rotate(-90 120 120)"
              style={{ transition: "stroke-dashoffset 0.2s ease, stroke 0.15s ease" }}
            />
          )}
          <text
            x={120}
            y={120}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={64}
            fontWeight={800}
            fill="currentColor"
            style={{ letterSpacing: "-0.02em" }}
          >
            {total}
          </text>
          <text
            x={120}
            y={150}
            textAnchor="middle"
            fontSize={14}
            fill="var(--muted-foreground)"
          >
            {hasMilestone ? `cycle ${cycleNum} · ${cycleCount}/${milestone}` : "total"}
          </text>
        </svg>
      </div>

      {/* Tap zone — open space */}
      <button
        onMouseDown={onPressStart}
        onMouseUp={onPressEnd}
        onMouseLeave={onPressCancel}
        onTouchStart={(e) => { e.preventDefault(); onPressStart(); }}
        onTouchEnd={(e) => { e.preventDefault(); onPressEnd(); }}
        onTouchCancel={onPressCancel}
        className="flex flex-1 flex-col items-center justify-center"
        style={{
          touchAction: "manipulation",
          color: "var(--foreground)",
          background: "transparent",
          border: "none",
          outline: "none",
        }}
        aria-label="tap to count"
      >
        <div className="label-caps" style={{ fontSize: 12 }}>Tap to count</div>
        <div className="mt-1 text-[11px] opacity-50">hold 2s to reset</div>
      </button>

      {toast && (
        <div
          className="pop-in fixed left-1/2 top-24 z-50 -translate-x-1/2 rounded-[12px] px-4 py-2 text-sm font-semibold shadow-lg"
          style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
