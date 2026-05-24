import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw, Undo2 } from "lucide-react";

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
  const [flash, setFlash] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [pressed, setPressed] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  };

  const tap = () => {
    if (navigator.vibrate) navigator.vibrate(12);
    setTotal((n) => {
      const next = n + 1;
      if (hasMilestone && next % milestone === 0) {
        if (navigator.vibrate) navigator.vibrate([40, 20, 40]);
        setFlash(true);
        setTimeout(() => setFlash(false), 220);
      }
      return next;
    });
  };

  const undo = () => {
    if (navigator.vibrate) navigator.vibrate(8);
    setTotal((n) => Math.max(0, n - 1));
  };

  const onResetStart = () => {
    resetTimer.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(40);
      setTotal(0);
      showToast("Count reset ✓");
    }, 1500);
  };
  const onResetEnd = () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  };

  return (
    <div
      className="mx-auto flex max-w-md flex-col items-center"
      style={{
        minHeight: "100dvh",
        background: "#1a1a2e",
        color: "#ffffff",
        paddingTop: "calc(env(safe-area-inset-top) + 20px)",
        paddingBottom: "calc(80px + env(safe-area-inset-bottom))",
        paddingLeft: 20,
        paddingRight: 20,
      }}
    >
      <h1 className="text-center font-bold tracking-tight" style={{ fontSize: 20, color: "#fff" }}>
        Tasbih
      </h1>

      {/* Milestone pills */}
      <div className="mt-5 flex items-center justify-center gap-2">
        {MILESTONES.map((t) => {
          const active = milestone === t;
          const label = t === 0 ? "∞" : String(t);
          return (
            <button
              key={t}
              onClick={() => setMilestone(t)}
              className="flex items-center justify-center font-bold transition-all active:scale-95"
              style={{
                width: 56,
                height: 36,
                borderRadius: 18,
                fontSize: 14,
                background: active ? "#c9a84c" : "rgba(255,255,255,0.12)",
                color: active ? "#ffffff" : "rgba(255,255,255,0.5)",
                border: "none",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Counter device */}
      <div
        className="mt-8 flex flex-col items-center"
        style={{
          width: 280,
          minHeight: 340,
          borderRadius: 40,
          background: "#0d0d1a",
          border: "2px solid rgba(255,255,255,0.08)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
          padding: 20,
        }}
      >
        {/* LCD display */}
        <div
          className="flex w-full flex-col items-center justify-center"
          style={{
            background: "#1a2a1a",
            borderRadius: 12,
            boxShadow: "inset 0 2px 8px rgba(0,0,0,0.6)",
            padding: "16px 12px",
            minHeight: 110,
          }}
        >
          <div
            className="num-pulse-key"
            key={total}
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 64,
              fontWeight: 700,
              color: flash ? "#ffffff" : "#00ff88",
              lineHeight: 1,
              letterSpacing: "-0.02em",
              transition: "color 0.18s ease",
              textShadow: "0 0 12px rgba(0,255,136,0.35)",
            }}
          >
            {total}
          </div>
          <div
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 12,
              color: "#00cc66",
              marginTop: 6,
              opacity: 0.85,
            }}
          >
            {hasMilestone ? `cycle ${cycleNum} · ${cycleCount}/${milestone}` : "∞ continuous"}
          </div>
        </div>

        {/* Big tap button */}
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            setPressed(true);
            tap();
          }}
          onPointerUp={() => setPressed(false)}
          onPointerLeave={() => setPressed(false)}
          onPointerCancel={() => setPressed(false)}
          className="mt-5 flex items-center justify-center"
          style={{
            width: 130,
            height: 130,
            borderRadius: "50%",
            background: "radial-gradient(circle at 30% 30%, #3a3a5c, #1a1a2e)",
            border: "3px solid rgba(255,255,255,0.15)",
            boxShadow: pressed
              ? "0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)"
              : "0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
            transform: pressed ? "scale(0.92)" : "scale(1)",
            transition: "transform 80ms ease, box-shadow 80ms ease",
            touchAction: "manipulation",
            cursor: "pointer",
          }}
          aria-label="tap to count"
        >
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em", fontWeight: 600 }}>
            TAP
          </span>
        </button>

        {/* Undo + reset */}
        <div className="mt-5 flex items-center gap-4">
          <button
            onClick={undo}
            className="flex items-center justify-center transition-transform active:scale-90"
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.6)",
            }}
            aria-label="undo"
          >
            <Undo2 size={16} />
          </button>
          <button
            onMouseDown={onResetStart}
            onMouseUp={onResetEnd}
            onMouseLeave={onResetEnd}
            onTouchStart={onResetStart}
            onTouchEnd={onResetEnd}
            className="flex items-center justify-center"
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.6)",
            }}
            aria-label="hold to reset"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div className="mt-6 text-center">
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>
          TAP BUTTON TO COUNT
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>
          Hold reset 1.5s to clear
        </div>
      </div>

      {toast && (
        <div
          className="pop-in fixed left-1/2 top-24 z-50 -translate-x-1/2 rounded-[12px] px-4 py-2 text-sm font-semibold shadow-lg"
          style={{ background: "#c9a84c", color: "#ffffff" }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
