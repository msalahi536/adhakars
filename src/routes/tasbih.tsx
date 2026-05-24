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
        className="relative mt-6 flex flex-col items-center"
        style={{ width: 320, height: 440 }}
      >
        {/* SVG shell */}
        <svg
          viewBox="0 0 320 440"
          width={320}
          height={440}
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
          {/*
            Asymmetric worry-stone silhouette (re-scaled to 320x440).
            Right shoulder bulges higher, left hip dips lower, base offset right.
          */}
          <path
            d="
              M 178 10
              C 246 18, 304 70, 308 150
              C 310 202, 286 250, 274 302
              C 264 348, 254 396, 212 426
              C 180 446, 132 440, 102 420
              C 66 396, 42 354, 32 306
              C 20 250, 8 198, 22 144
              C 38 78, 100 2, 178 10
              Z
            "
            fill="url(#shellGrad)"
            stroke="url(#shellStroke)"
            strokeWidth={7}
            strokeLinejoin="round"
          />
          {/* Inner soft bezel — narrower stroke just inside the outer stroke */}
          <path
            d="
              M 178 18
              C 240 26, 296 74, 300 152
              C 302 202, 280 248, 268 298
              C 258 342, 248 388, 208 416
              C 178 434, 134 428, 106 410
              C 72 388, 50 348, 40 302
              C 30 250, 18 200, 30 148
              C 46 84, 104 12, 178 18
              Z
            "
            fill="none"
            stroke="rgba(0,0,0,0.35)"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {/* Asymmetric top-left highlight following the bulge */}
          <path
            d="
              M 178 10
              C 246 18, 304 70, 308 150
              C 264 88, 138 66, 64 124
              C 44 138, 30 146, 22 144
              C 38 78, 100 2, 178 10
              Z
            "
            fill="url(#shellHighlight)"
          />
        </svg>

        {/* LCD — upper area, ~60% of shell width */}
        <div
          style={{
            position: "absolute",
            top: 52,
            left: "50%",
            transform: "translateX(-50%)",
            width: 200,
            height: 84,
            borderRadius: 22,
            background: flash
              ? "linear-gradient(180deg, #E6F0CC 0%, #D8E6BC 100%)"
              : "linear-gradient(180deg, #B8C89C 0%, #C8D7AE 100%)",
            boxShadow:
              "inset 0 4px 10px rgba(0,0,0,0.32), inset 0 -1px 2px rgba(255,255,255,0.4), 0 1px 0 rgba(255,255,255,0.06)",
            transition: "background 0.18s ease",
            overflow: "hidden",
          }}
        >
          {/* Ghost segments — full width inside, right aligned */}
          <span
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingRight: 18,
              fontFamily: "'Share Tech Mono', ui-monospace, monospace",
              fontVariantNumeric: "tabular-nums",
              fontSize: 52,
              lineHeight: 1,
              letterSpacing: "0.06em",
              color: "#1A1F1C",
              opacity: 0.09,
              fontWeight: 400,
              pointerEvents: "none",
            }}
          >
            8888
          </span>
          {/* Live number — same font/size/position, right aligned */}
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingRight: 18,
              fontFamily: "'Share Tech Mono', ui-monospace, monospace",
              fontVariantNumeric: "tabular-nums",
              fontSize: 52,
              lineHeight: 1,
              letterSpacing: "0.06em",
              color: "#1A1F1C",
              fontWeight: 400,
              zIndex: 1,
            }}
          >
            {total}
          </span>
        </div>

        {/* Cycle text — just below LCD, inside shell */}
        <div
          style={{
            position: "absolute",
            top: 146,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 11,
            color: "#9BAEB5",
            letterSpacing: "0.12em",
            fontWeight: 600,
          }}
        >
          {hasMilestone ? `cycle ${cycleNum} · ${cycleCount}/${milestone}` : "∞ continuous"}
        </div>

        {/* Undo / Reset row — middle band, inset from shell edges */}
        <button
          onClick={undo}
          className="transition-transform active:scale-90"
          style={{
            position: "absolute",
            top: 178,
            left: 76,
            width: 52,
            height: 52,
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
            position: "absolute",
            top: 178,
            right: 76,
            width: 52,
            height: 52,
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

        {/* Main tap button — lower 50%, centered */}
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
            position: "absolute",
            bottom: 48,
            left: "50%",
            width: 180,
            height: 180,
            transform: pressed ? "translateX(-50%) scale(0.96)" : "translateX(-50%) scale(1)",
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 32% 28%, #D4DEE3 0%, #B5C0C5 48%, #9FAEB4 100%)",
            border: "7px solid #6B7880",
            boxShadow: pressed
              ? "0 3px 8px rgba(0,0,0,0.4), inset 0 3px 8px rgba(0,0,0,0.28)"
              : "0 14px 28px rgba(0,0,0,0.4), inset 0 3px 0 rgba(255,255,255,0.45), inset 0 -4px 8px rgba(0,0,0,0.18)",
            transition: "transform 90ms ease, box-shadow 90ms ease",
            touchAction: "manipulation",
            cursor: "pointer",
            outline: "none",
          }}
          aria-label="tap to count"
        />
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
