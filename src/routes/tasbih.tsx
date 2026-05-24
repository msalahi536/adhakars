import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw, Undo2 } from "lucide-react";
import { vibrateIfEnabled } from "@/lib/theme";

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
    vibrateIfEnabled(12);
    setTotal((n) => {
      const next = n + 1;
      if (hasMilestone && next % milestone === 0) {
        vibrateIfEnabled([40, 20, 40]);
        setFlash(true);
        setTimeout(() => setFlash(false), 220);
      }
      return next;
    });
  };

  const undo = () => {
    vibrateIfEnabled(8);
    setTotal((n) => Math.max(0, n - 1));
  };

  const onResetStart = () => {
    resetTimer.current = setTimeout(() => {
      vibrateIfEnabled(40);
      setTotal(0);
      showToast("Count reset ✓");
    }, 1500);
  };
  const onResetEnd = () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  };

  // Pad number to 4 digits, right aligned
  

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

      {/* Device shell — organic worry-stone shape */}
      <div
        className="relative mt-6"
        style={{ width: 280, height: 400 }}
      >
        {/* SVG shell */}
        <svg
          viewBox="0 0 280 400"
          width={280}
          height={400}
          style={{
            position: "absolute",
            inset: 0,
            filter: "drop-shadow(0 24px 40px rgba(0,0,0,0.45)) drop-shadow(0 6px 12px rgba(0,0,0,0.25))",
          }}
          aria-hidden
        >
          <defs>
            <linearGradient id="shellGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#465861" />
              <stop offset="100%" stopColor="#33424A" />
            </linearGradient>
            <linearGradient id="shellStroke" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#BDCED5" />
              <stop offset="55%" stopColor="#9BAEB5" />
              <stop offset="100%" stopColor="#5E6F77" />
            </linearGradient>
            <linearGradient id="shellHighlight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
              <stop offset="45%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          <path
            d="
              M 156 10
              C 216 18, 266 64, 270 138
              C 272 186, 250 228, 240 276
              C 230 318, 222 362, 184 388
              C 156 406, 116 400, 90 382
              C 58 360, 38 322, 28 280
              C 18 228, 8 180, 20 132
              C 34 70, 86 2, 156 10
              Z
            "
            fill="url(#shellGrad)"
            stroke="url(#shellStroke)"
            strokeWidth={6}
            strokeLinejoin="round"
          />
          <path
            d="
              M 156 18
              C 212 26, 260 70, 262 140
              C 264 186, 244 226, 234 272
              C 226 314, 216 354, 180 378
              C 154 394, 118 388, 94 372
              C 64 352, 46 318, 36 278
              C 28 228, 18 184, 30 138
              C 44 78, 92 12, 156 18
              Z
            "
            fill="none"
            stroke="rgba(0,0,0,0.35)"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <path
            d="
              M 156 10
              C 216 18, 266 64, 270 138
              C 232 84, 122 64, 58 116
              C 40 130, 28 138, 20 132
              C 34 70, 86 2, 156 10
              Z
            "
            fill="url(#shellHighlight)"
          />
        </svg>

        {/* Inner content — constrained column, never overflows shell */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "70%",
            maxWidth: 200,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-evenly",
            padding: "40px 0",
            background: "transparent",
            border: "none",
          }}
        >
          {/* Section A — LCD */}
          <div
            style={{
              width: "100%",
              maxWidth: 180,
              height: 64,
              borderRadius: 10,
              background: flash ? "#D8E6BC" : "#C5D4AA",
              boxShadow: "inset 0 2px 6px rgba(0,0,0,0.25)",
              position: "relative",
              transition: "background 0.18s ease",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              paddingRight: 12,
              paddingLeft: 12,
              alignItems: "flex-end",
            }}
          >
            <span
              style={{
                fontFamily: "'Share Tech Mono', ui-monospace, monospace",
                fontVariantNumeric: "tabular-nums",
                fontSize: 36,
                lineHeight: 1,
                letterSpacing: "0.04em",
                color: "#1A1F1C",
                fontWeight: 400,
              }}
            >
              {total}
            </span>
            <span
              style={{
                fontSize: 10,
                color: "rgba(26,31,28,0.6)",
                marginTop: 2,
                letterSpacing: "0.08em",
                fontWeight: 600,
              }}
            >
              {hasMilestone ? `cycle ${cycleNum} · ${cycleCount}/${milestone}` : "∞ continuous"}
            </span>
          </div>

          {/* Section B — Undo / Reset row */}
          <div className="flex w-full items-center justify-between">
            <button
              onClick={undo}
              className="transition-transform active:scale-90"
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "#5C6D74",
                border: "1px solid rgba(0,0,0,0.25)",
                color: "#B8C5CB",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -2px 5px rgba(0,0,0,0.3), 0 3px 6px rgba(0,0,0,0.28)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="undo"
            >
              <Undo2 size={20} />
            </button>
            <button
              onMouseDown={onResetStart}
              onMouseUp={onResetEnd}
              onMouseLeave={onResetEnd}
              onTouchStart={onResetStart}
              onTouchEnd={onResetEnd}
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "#5C6D74",
                border: "1px solid rgba(0,0,0,0.25)",
                color: "#B8C5CB",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -2px 5px rgba(0,0,0,0.3), 0 3px 6px rgba(0,0,0,0.28)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="hold to reset"
            >
              <RotateCcw size={20} />
            </button>
          </div>

          {/* Section C — Tap button */}
          <div className="flex flex-1 items-center justify-center">
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
                width: 130,
                height: 130,
                transform: pressed ? "scale(0.95)" : "scale(1)",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle at 32% 28%, #C5D0D5 0%, #9FAEB4 100%)",
                border: "4px solid #6B7880",
                boxShadow: pressed
                  ? "0 2px 6px rgba(0,0,0,0.25), inset 0 3px 8px rgba(0,0,0,0.28)"
                  : "0 6px 16px rgba(0,0,0,0.25), inset 0 3px 0 rgba(255,255,255,0.4), inset 0 -3px 6px rgba(0,0,0,0.15)",
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
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.15em",
            fontWeight: 600,
          }}
        >
          TAP BUTTON TO COUNT
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
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
