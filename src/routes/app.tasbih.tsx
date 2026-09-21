import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw, Undo2 } from "lucide-react";
import { triggerHaptic } from "@/lib/theme";
import { bumpLifetime } from "@/lib/storage";

export const Route = createFileRoute("/app/tasbih")({
  head: () => ({ meta: [{ title: "Tasbih, Sahih Al-Adhkar" }] }),
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
  const [tapped, setTapped] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE) || "{}");
      if (typeof s.total === "number") setTotal(s.total);
      if (typeof s.milestone === "number") setMilestone(s.milestone as Milestone);
    } catch {
      // Ignore malformed saved tasbih state.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify({ total, milestone }));
  }, [total, milestone]);

  const hasMilestone = milestone > 0;
  const cycleNum = hasMilestone ? Math.floor(total / milestone) + 1 : 1;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  };

  const tap = () => {
    triggerHaptic("heavy");
    bumpLifetime("tasbih", 1);
    setTapped(true);
    setTimeout(() => setTapped(false), 200);
    setTotal((n) => {
      const next = n + 1;
      if (hasMilestone && next % milestone === 0) {
        triggerHaptic("double");
        setFlash(true);
        setTimeout(() => setFlash(false), 260);
      }
      return next;
    });
  };

  const undo = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic("heavy");
    setTotal((n) => Math.max(0, n - 1));
  };

  const onResetStart = (e: React.PointerEvent | React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    resetTimer.current = setTimeout(() => {
      triggerHaptic("heavy");
      setTotal(0);
      showToast("Count reset ✓");
    }, 2500);
  };
  const onResetEnd = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    if (resetTimer.current) clearTimeout(resetTimer.current);
  };

  return (
    <>
      <header className="tasbih-header">
        <div className="tasbih-header-inner">
          <div className="tasbih-eyebrow">
            Dhikr Counter
          </div>
          <h1 className="tasbih-title">Tasbih</h1>

          {/* Cycle target selector, centered, all four fit */}
          <div className="tasbih-targets">
            {MILESTONES.map((t) => {
              const active = milestone === t;
              const label = t === 0 ? "∞" : String(t);
              return (
                <button
                  key={t}
                  onClick={() => setMilestone(t)}
                  className={`tasbih-target ${active ? "is-active" : ""}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="tasbih-main">
        <div className="tasbih-card-wrap">
          <div
            role="button"
            tabIndex={0}
            onPointerDown={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest("[data-no-tap]")) return;
              setPressed(true);
              tap();
            }}
            onPointerUp={() => setPressed(false)}
            onPointerLeave={() => setPressed(false)}
            onPointerCancel={() => setPressed(false)}
            className={`tasbih-card ${pressed ? "is-pressed" : ""}`}
            aria-label="tap to count"
          >
            {/* Top corner controls */}
            <div
              className="tasbih-corner-control left"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                onClick={undo}
                className="tasbih-control"
                aria-label="undo"
              >
                <Undo2 size={16} />
              </button>
            </div>
            <div
              className="tasbih-corner-control right"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                onMouseDown={onResetStart}
                onMouseUp={onResetEnd}
                onMouseLeave={onResetEnd}
                onTouchStart={onResetStart}
                onTouchEnd={onResetEnd}
                className="tasbih-control"
                aria-label="hold to reset"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            {/* Big progress ring with count */}
            <div className={`tasbih-disc ${tapped ? "tasbih-disc-tapped" : ""}`}>
              <div className="tasbih-disc-content">
                <span className="tasbih-count">
                  {total}
                </span>
                {hasMilestone && <span className="tasbih-cycle">Cycle {cycleNum} of {milestone}</span>}
              </div>
              {flash && (
                <span
                    className="radial-pulse pointer-events-none absolute inset-0 rounded-full"
                  style={{ background: "color-mix(in oklab, var(--accent) 45%, transparent)" }}
                />
              )}
            </div>

            {/* Helper text */}
            <div className="tasbih-helper">
              <div className="tasbih-helper-primary">
                Tap anywhere to count
              </div>
              <div className="tasbih-helper-secondary">
                Hold to reset
              </div>
            </div>
          </div>
        </div>

        {toast && (
          <div
            className="pop-in fixed left-1/2 top-24 z-50 -translate-x-1/2 rounded-[12px] px-4 py-2 text-sm font-semibold shadow-lg"
            style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
          >
            {toast}
          </div>
        )}
      </main>
    </>
  );
}
