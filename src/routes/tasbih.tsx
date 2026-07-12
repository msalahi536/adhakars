import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw, Undo2 } from "lucide-react";
import { ProgressRing } from "@/components/ProgressRing";
import { triggerHaptic } from "@/lib/theme";
import { bumpLifetime } from "@/lib/storage";

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
  const cycleCount = hasMilestone ? total % milestone : 0;
  const cycleNum = hasMilestone ? Math.floor(total / milestone) + 1 : 1;
  const ringMax = hasMilestone ? milestone : 100;
  const ringValue = hasMilestone ? cycleCount : total % 100;
  const complete = hasMilestone && cycleCount === 0 && total > 0;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  };

  const tap = () => {
    triggerHaptic("light");
    bumpLifetime("tasbih", 1);
    setTapped(true);
    setTimeout(() => setTapped(false), 200);
    setTotal((n) => {
      const next = n + 1;
      if (hasMilestone && next % milestone === 0) {
        triggerHaptic("medium");
        setFlash(true);
        setTimeout(() => setFlash(false), 260);
      }
      return next;
    });
  };

  const undo = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic("light");
    setTotal((n) => Math.max(0, n - 1));
  };

  const onResetStart = (e: React.PointerEvent | React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    resetTimer.current = setTimeout(() => {
      triggerHaptic("heavy");
      setTotal(0);
      showToast("Count reset ✓");
    }, 1500);
  };
  const onResetEnd = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    if (resetTimer.current) clearTimeout(resetTimer.current);
  };

  return (
    <>
      <header
        className="page-header"
        style={{ background: "var(--grad-header)", color: "var(--header-fg)" }}
      >
        <div className="mx-auto max-w-md px-5 pb-4 pt-5">
          <div className="label-caps" style={{ color: "var(--header-sub)", opacity: 1 }}>
            Dhikr Counter
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Tasbih</h1>

          {/* Cycle target selector — matches Salah pills */}
          <div
            className="hide-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1"
            style={{ scrollbarWidth: "none" }}
          >
            {MILESTONES.map((t) => {
              const active = milestone === t;
              const label = t === 0 ? "∞" : String(t);
              return (
                <button
                  key={t}
                  onClick={() => setMilestone(t)}
                  className="flex shrink-0 items-center justify-center font-bold transition-all active:scale-95"
                  style={{
                    minWidth: 70,
                    height: 36,
                    borderRadius: 18,
                    padding: "0 16px",
                    fontSize: 13,
                    background: active ? "var(--accent)" : "color-mix(in oklab, var(--header-fg) 15%, transparent)",
                    color: active ? "var(--accent-foreground)" : "var(--header-fg)",
                    border: "none",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="scroll-area flex flex-col">
        <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col px-4 pt-4">
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
            className="relative flex w-full flex-1 flex-col items-center justify-center overflow-hidden rounded-[24px] outline-none"
            style={{
              background: "var(--card)",
              color: "var(--card-foreground)",
              border: "1px solid var(--border)",
              boxShadow: "var(--card-shadow, 0 4px 16px rgba(0,0,0,0.08))",
              transform: pressed ? "scale(0.985)" : "scale(1)",
              transition: "transform 120ms ease",
              padding: "32px 20px",
              touchAction: "manipulation",
              minHeight: 380,
              cursor: "pointer",
              userSelect: "none",
            }}
            aria-label="tap to count"
          >
            {/* Top corner controls */}
            <div
              className="absolute left-3 top-3 z-10"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                onClick={undo}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-transform active:scale-90"
                style={{
                  background: "var(--btn-surface)",
                  color: "var(--btn-fg)",
                }}
                aria-label="undo"
              >
                <Undo2 size={16} />
              </button>
            </div>
            <div
              className="absolute right-3 top-3 z-10"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                onMouseDown={onResetStart}
                onMouseUp={onResetEnd}
                onMouseLeave={onResetEnd}
                onTouchStart={onResetStart}
                onTouchEnd={onResetEnd}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-transform active:scale-90"
                style={{
                  background: "var(--btn-surface)",
                  color: "var(--btn-fg)",
                }}
                aria-label="hold to reset"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            {/* Big progress ring with count */}
            <div className={`relative flex items-center justify-center ${tapped ? "tap-pulse" : ""}`}>
              <ProgressRing
                value={ringValue}
                max={ringMax}
                size={240}
                stroke={14}
                complete={complete}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="font-bold leading-none"
                  style={{
                    fontSize: 64,
                    color: "var(--count-fg, var(--card-foreground))",
                    fontVariantNumeric: "tabular-nums",
                    transition: "color 200ms",
                  }}
                >
                  {total}
                </span>
                <span
                  className="mt-2 text-[12px]"
                  style={{ color: "var(--muted-foreground)", letterSpacing: "0.05em" }}
                >
                  {hasMilestone
                    ? `cycle ${cycleNum} · ${cycleCount}/${milestone}`
                    : "∞ continuous"}
                </span>
              </div>
              {flash && (
                <span
                  className="radial-pulse pointer-events-none absolute inset-0 rounded-full"
                  style={{ background: "color-mix(in oklab, var(--accent) 45%, transparent)" }}
                />
              )}
            </div>

            {/* Helper text */}
            <div className="mt-8 text-center">
              <div
                className="label-caps"
                style={{ color: "var(--muted-foreground)", opacity: 0.85 }}
              >
                Tap anywhere to count
              </div>
              <div
                className="mt-1 text-[11px]"
                style={{ color: "var(--muted-foreground)", opacity: 0.7 }}
              >
                Hold reset 1.5s to clear
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
