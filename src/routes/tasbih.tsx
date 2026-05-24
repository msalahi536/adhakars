import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProgressRing } from "@/components/ProgressRing";

export const Route = createFileRoute("/tasbih")({
  head: () => ({ meta: [{ title: "Tasbih — My Adhkar" }] }),
  component: Tasbih,
});

const TARGETS = [33, 99, 100];
const STORAGE = "adhkar:tasbih";

function Tasbih() {
  const [total, setTotal] = useState(0);
  const [milestone, setMilestone] = useState(33);
  const [label, setLabel] = useState("SubhanAllah");
  const [flash, setFlash] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressActive = useRef(false);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE) || "{}");
      if (typeof s.total === "number") setTotal(s.total);
      if (typeof s.milestone === "number") setMilestone(s.milestone);
      if (typeof s.label === "string") setLabel(s.label);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify({ total, milestone, label }));
  }, [total, milestone, label]);

  const cycleCount = total % milestone;
  const cycleNum = Math.floor(total / milestone) + 1;

  const tap = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    setPulse(true);
    setTimeout(() => setPulse(false), 220);
    setTotal((n) => {
      const next = n + 1;
      if (next % milestone === 0) {
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
        setFlash(true);
        setTimeout(() => setFlash(false), 500);
      }
      return next;
    });
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1500);
  };

  const onPressStart = () => {
    pressActive.current = true;
    longPressTimer.current = setTimeout(() => {
      if (pressActive.current) {
        if (navigator.vibrate) navigator.vibrate(40);
        setTotal(0);
        showToast("Counter reset");
        pressActive.current = false;
      }
    }, 700);
  };
  const onPressEnd = (didTap: boolean) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (pressActive.current && didTap) tap();
    pressActive.current = false;
  };

  return (
    <div className="mx-auto flex h-[100dvh] max-w-md flex-col px-4 pt-5 pb-[calc(86px+env(safe-area-inset-bottom))]">
      <header className="mb-3">
        <div className="label-caps">Counter</div>
        <h1 className="mt-1 text-3xl font-bold">Tasbih</h1>
      </header>

      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="What are you counting?"
        className="mb-3 w-full rounded-full px-5 py-3 text-sm outline-none"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {TARGETS.map((t) => (
          <button
            key={t}
            onClick={() => setMilestone(t)}
            className="rounded-full px-4 py-1.5 text-sm font-semibold transition"
            style={
              milestone === t
                ? { background: "var(--accent)", color: "var(--accent-foreground)" }
                : { background: "var(--surface)", border: "1px solid var(--border)" }
            }
          >
            {t}
          </button>
        ))}
        <input
          type="number"
          min={1}
          placeholder="custom"
          className="w-24 rounded-full px-4 py-1.5 text-sm outline-none"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          onChange={(e) => {
            const v = parseInt(e.target.value);
            if (!isNaN(v) && v > 0) setMilestone(v);
          }}
        />
      </div>

      <button
        onMouseDown={onPressStart}
        onMouseUp={() => onPressEnd(true)}
        onMouseLeave={() => onPressEnd(false)}
        onTouchStart={(e) => { e.preventDefault(); onPressStart(); }}
        onTouchEnd={(e) => { e.preventDefault(); onPressEnd(true); }}
        className="card-grad relative flex flex-1 flex-col items-center justify-center rounded-[32px] py-10 shadow-2xl shadow-black/10 active:scale-[0.99] transition"
        style={{
          color: "var(--card-foreground)",
          touchAction: "manipulation",
          minHeight: 360,
        }}
      >
        <div className={`relative ${pulse ? "tap-pulse" : ""} ${flash ? "pop-in" : ""}`}>
          <ProgressRing value={cycleCount} max={milestone} size={260} stroke={14} complete={false} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[64px] font-bold leading-none tracking-tight tabular-nums">{total}</span>
            <span className="mt-2 text-xs opacity-70">
              cycle {cycleNum} · {cycleCount}/{milestone}
            </span>
          </div>
          {flash && (
            <span
              className="radial-pulse pointer-events-none absolute inset-0 rounded-full"
              style={{ background: "color-mix(in oklab, var(--accent) 60%, transparent)" }}
            />
          )}
        </div>
        <div className="mt-7 text-sm opacity-80">{label || "Tap to count"}</div>
        <div className="mt-1 text-[11px] opacity-50">Hold to reset</div>
      </button>

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
