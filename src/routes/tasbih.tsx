import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw, Undo2 } from "lucide-react";

export const Route = createFileRoute("/tasbih")({
  head: () => ({
    meta: [
      { title: "Tasbih — My Adhkar" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap",
      },
    ],
  }),
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

  // Pad number to 4 digits, right aligned
  const display = String(total).padStart(4, " ");

  return (
    <div
      className="mx-auto flex max-w-md flex-col items-center"
      style={{
        minHeight: "100dvh",
        background: "#4F5F66",
        color: "#E8EDF0",
        paddingTop: "calc(env(safe-area-inset-top) + 20px)",
        paddingBottom: "calc(80px + env(safe-area-inset-bottom))",
        paddingLeft: 20,
        paddingRight: 20,
      }}
    >
      <h1
        className="text-center font-bold tracking-tight"
        style={{ fontSize: 20, color: "#E8EDF0" }}
      >
        Tasbih
      </h1>

      {/* Cycle pills */}
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
                background: active ? "#D4A547" : "#3A4A52",
                color: active ? "#2A1F00" : "#8A9CA3",
                border: "none",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Cycle indicator above device */}
      <div
        className="mt-6 text-center"
        style={{ fontSize: 12, color: "#8A9CA3", letterSpacing: "0.1em" }}
      >
        {hasMilestone ? `cycle ${cycleNum} · ${cycleCount}/${milestone}` : "∞ continuous"}
      </div>

      {/* Device shell — organic worry-stone shape */}
      <div className="relative mt-4 flex flex-col items-center" style={{ width: 300, height: 420 }}>
        {/* SVG shell */}
        <svg
          viewBox="0 0 300 420"
          width={300}
          height={420}
          style={{ position: "absolute", inset: 0, filter: "drop-shadow(0 18px 32px rgba(0,0,0,0.35))" }}
          aria-hidden
        >
          <defs>
            <linearGradient id="shellGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#465861" />
              <stop offset="100%" stopColor="#33424A" />
            </linearGradient>
            <linearGradient id="shellHighlight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
              <stop offset="40%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          {/*
            Asymmetric worry-stone silhouette: right shoulder bulges higher and wider,
            left side dips with a softer hip, bottom is offset slightly right.
            Each Bezier handle is hand-placed — no mirror, no symmetry.
          */}
          <path
            d="
              M 168 6
              C 232 14, 286 62, 290 138
              C 292 188, 268 232, 256 282
              C 246 326, 238 372, 198 402
              C 168 422, 124 416, 96 396
              C 62 372, 40 332, 30 286
              C 18 232, 6 184, 18 132
              C 32 70, 92 -2, 168 6
              Z
            "
            fill="url(#shellGrad)"
            stroke="#8A9CA3"
            strokeWidth={3}
            strokeLinejoin="round"
          />
          {/* Asymmetric top-left highlight following the bulge */}
          <path
            d="
              M 168 6
              C 232 14, 286 62, 290 138
              C 250 78, 130 60, 60 112
              C 40 124, 26 134, 18 132
              C 32 70, 92 -2, 168 6
              Z
            "
            fill="url(#shellHighlight)"
          />
        </svg>

        {/* Inner content positioned over SVG */}
        <div
          className="relative z-10 flex w-full flex-col items-center"
          style={{ padding: "40px 36px 30px" }}
        >
          {/* LCD row: undo + screen + reset */}
          <div className="flex w-full items-center justify-between gap-3">
            <button
              onClick={undo}
              className="flex shrink-0 items-center justify-center transition-transform active:scale-90"
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "#5C6D74",
                border: "1px solid rgba(0,0,0,0.2)",
                color: "#B8C5CB",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.2)",
              }}
              aria-label="undo"
            >
              <Undo2 size={18} />
            </button>

            {/* LCD pill */}
            <div
              className="flex flex-1 items-center justify-end"
              style={{
                height: 70,
                borderRadius: 18,
                background: "linear-gradient(180deg, #B8C89C 0%, #C8D7AE 100%)",
                boxShadow:
                  "inset 0 3px 8px rgba(0,0,0,0.28), inset 0 -1px 2px rgba(255,255,255,0.4), 0 1px 0 rgba(255,255,255,0.05)",
                padding: "0 14px",
                position: "relative",
                overflow: "hidden",
                transition: "background 0.18s ease",
                ...(flash
                  ? { background: "linear-gradient(180deg, #E6F0CC 0%, #D8E6BC 100%)" }
                  : {}),
              }}
            >
              {/* Ghost segments */}
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  right: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontFamily: "'Share Tech Mono', ui-monospace, monospace",
                  fontSize: 44,
                  lineHeight: 1,
                  letterSpacing: "0.08em",
                  color: "#2C3530",
                  opacity: 0.12,
                  fontWeight: 400,
                  pointerEvents: "none",
                }}
              >
                8888
              </span>
              {/* Live number */}
              <span
                style={{
                  fontFamily: "'Share Tech Mono', ui-monospace, monospace",
                  fontSize: 44,
                  lineHeight: 1,
                  letterSpacing: "0.08em",
                  color: "#1A1F1C",
                  fontWeight: 400,
                  position: "relative",
                  zIndex: 1,
                  whiteSpace: "pre",
                }}
              >
                {display}
              </span>
            </div>

            <button
              onMouseDown={onResetStart}
              onMouseUp={onResetEnd}
              onMouseLeave={onResetEnd}
              onTouchStart={onResetStart}
              onTouchEnd={onResetEnd}
              className="flex shrink-0 items-center justify-center"
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "#5C6D74",
                border: "1px solid rgba(0,0,0,0.2)",
                color: "#B8C5CB",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.2)",
              }}
              aria-label="hold to reset"
            >
              <RotateCcw size={18} />
            </button>
          </div>

          {/* Main tap button */}
          <div className="mt-12 flex flex-1 items-center justify-center">
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                setPressed(true);
                tap();
              }}
              onPointerUp={() => setPressed(false)}
              onPointerLeave={() => setPressed(false)}
              onPointerCancel={() => setPressed(false)}
              style={{
                width: 150,
                height: 150,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle at 32% 28%, #C8D2D7 0%, #B5C0C5 45%, #9FAEB4 100%)",
                border: "6px solid #6B7880",
                boxShadow: pressed
                  ? "0 2px 6px rgba(0,0,0,0.35), inset 0 2px 6px rgba(0,0,0,0.25)"
                  : "0 10px 22px rgba(0,0,0,0.35), inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -3px 6px rgba(0,0,0,0.15)",
                transform: pressed ? "scale(0.96)" : "scale(1)",
                transition: "transform 90ms ease, box-shadow 90ms ease",
                touchAction: "manipulation",
                cursor: "pointer",
                outline: "none",
              }}
              aria-label="tap to count"
            />
          </div>
        </div>
      </div>

      {/* Helper text */}
      <div className="mt-6 text-center">
        <div
          style={{
            fontSize: 11,
            color: "#8A9CA3",
            letterSpacing: "0.15em",
            fontWeight: 600,
          }}
        >
          TAP BUTTON TO COUNT
        </div>
        <div style={{ fontSize: 10, color: "#8A9CA3", opacity: 0.7, marginTop: 4 }}>
          Hold reset 1.5s to clear
        </div>
      </div>

      {toast && (
        <div
          className="pop-in fixed left-1/2 top-24 z-50 -translate-x-1/2 rounded-[12px] px-4 py-2 text-sm font-semibold shadow-lg"
          style={{ background: "#D4A547", color: "#2A1F00" }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
