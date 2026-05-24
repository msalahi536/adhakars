import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProgressRing } from "@/components/ProgressRing";

export const Route = createFileRoute("/tasbih")({
  head: () => ({
    meta: [{ title: "Tasbih — My Adhkar" }],
  }),
  component: Tasbih,
});

const TARGETS = [33, 99, 100];
const STORAGE = "adhkar:tasbih";

function Tasbih() {
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(33);
  const [label, setLabel] = useState("SubhanAllah");
  const [pulse, setPulse] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const customRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE) || "{}");
      if (typeof s.count === "number") setCount(s.count);
      if (typeof s.target === "number") setTarget(s.target);
      if (typeof s.label === "string") setLabel(s.label);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify({ count, target, label }));
  }, [count, target, label]);

  const tap = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
    setPulse(true);
    setTimeout(() => setPulse(false), 200);
    setCount((c) => {
      const next = c + 1;
      if (next >= target) {
        setCelebrate(true);
        if (navigator.vibrate) navigator.vibrate([15, 40, 15, 40, 60]);
        setTimeout(() => {
          setCount(0);
          setCelebrate(false);
        }, 1500);
      }
      return next;
    });
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 pt-6 pb-32 min-h-[100dvh]">
      <header className="mb-4">
        <div className="text-xs uppercase tracking-[0.2em] opacity-60">Counter</div>
        <h1 className="mt-1 text-3xl font-bold">Tasbih</h1>
      </header>

      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="What are you counting?"
        className="mb-4 w-full rounded-full px-5 py-3 text-sm outline-none"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TARGETS.map((t) => (
          <button
            key={t}
            onClick={() => {
              setTarget(t);
              setCount(0);
            }}
            className="rounded-full px-4 py-1.5 text-sm font-semibold transition"
            style={
              target === t
                ? { background: "var(--accent)", color: "var(--accent-foreground)" }
                : { background: "var(--surface)", border: "1px solid var(--border)" }
            }
          >
            {t}
          </button>
        ))}
        <input
          ref={customRef}
          type="number"
          min={1}
          placeholder="custom"
          className="w-24 rounded-full px-4 py-1.5 text-sm outline-none"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          onChange={(e) => {
            const v = parseInt(e.target.value);
            if (!isNaN(v) && v > 0) {
              setTarget(v);
              setCount(0);
            }
          }}
        />
      </div>

      <button
        onClick={tap}
        className="relative flex flex-1 flex-col items-center justify-center rounded-[32px] py-12 transition active:scale-[0.99]"
        style={{
          background: "var(--card)",
          color: "var(--card-foreground)",
          touchAction: "manipulation",
          minHeight: 380,
        }}
      >
        <div className={`relative ${pulse ? "tap-pulse" : ""} ${celebrate ? "pop-in" : ""}`}>
          <ProgressRing value={count} max={target} size={240} stroke={14} complete={count >= target} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-bold leading-none tracking-tight">{count}</span>
            <span className="mt-2 text-sm opacity-70">/ {target}</span>
          </div>
        </div>
        <div className="mt-6 text-sm opacity-80">{label || "Tap to count"}</div>
        <div className="mt-1 text-xs opacity-50">Tap anywhere in this card</div>
      </button>

      <button
        onClick={() => setCount(0)}
        className="mt-4 self-center rounded-full px-5 py-2 text-xs font-semibold opacity-70"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        Reset
      </button>
    </div>
  );
}
