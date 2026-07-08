import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { DhikrCard } from "./DhikrCard";
import { TasbeehComboCard } from "./TasbeehComboCard";
import { ChevronLeft, ChevronRight, RotateCcw, ArrowRight } from "lucide-react";
import type { SalahItem } from "@/data/salah";
import { isItemComplete, itemId } from "@/data/salah";

type Props = {
  items: SalahItem[];
  counts: Record<string, number>;
  onIncrement: (id: string, target: number) => void;
  persistKey?: string;
  finishCta?: { label: string; to: string };
  onFinishNav?: () => void;
};

type Phase = "idle" | "out-left" | "out-right" | "in-left" | "in-right";

const OUT_MS = 280;
const IN_MS = 320;

const readPersistedIdx = (key?: string): number => {
  if (!key || typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(`cardIdx_${key}`);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

export function SwipeStack({ items, counts, onIncrement, persistKey, finishCta, onFinishNav }: Props) {
  const navigate = useNavigate();
  const [idx, setIdxState] = useState(() => {
    const restored = Math.min(readPersistedIdx(persistKey), Math.max(0, items.length - 1));
    // If the user left on the last card AND all items are complete, restart at 0.
    if (typeof window !== "undefined" && restored === items.length - 1 && items.length > 0) {
      const allDone = items.every((it) => isItemComplete(it, {}));
      if (allDone) return 0;
    }
    return restored;
  });
  const setIdx = (updater: number | ((i: number) => number)) => {
    setIdxState((prev) => {
      const next = typeof updater === "function" ? (updater as (i: number) => number)(prev) : updater;
      if (persistKey && typeof window !== "undefined") {
        window.localStorage.setItem(`cardIdx_${persistKey}`, String(next));
      }
      return next;
    });
  };
  const [phase, setPhase] = useState<Phase>("idle");
  const [enter, setEnter] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const animating = useRef(false);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const axisLocked = useRef<null | "x" | "y">(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const prevCompleteRef = useRef(false);

  // Reset ONLY when persistKey changes (e.g. switching prayer). Do NOT reset on items identity changes.
  useEffect(() => {
    let restored = Math.min(readPersistedIdx(persistKey), Math.max(0, items.length - 1));
    // Auto-reset to start if user left on the final card after completing everything.
    if (restored === items.length - 1 && items.length > 0 && items.every((it) => isItemComplete(it, {}))) {
      restored = 0;
      if (persistKey && typeof window !== "undefined") {
        window.localStorage.setItem(`cardIdx_${persistKey}`, "0");
      }
    }
    setIdxState(restored);
    setPhase("idle");
    prevCompleteRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistKey]);

  // Clamp if items list shrinks
  useEffect(() => {
    if (idx > items.length - 1) setIdxState(Math.max(0, items.length - 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const animateTo = (dir: "next" | "prev") => {
    if (animating.current) return;
    if (dir === "next" && idx >= items.length - 1) return;
    if (dir === "prev" && idx <= 0) return;
    animating.current = true;
    setPhase(dir === "next" ? "out-left" : "out-right");
    setDragOffset(0);

    setTimeout(() => {
      setIdx((i) => i + (dir === "next" ? 1 : -1));
      setPhase(dir === "next" ? "in-right" : "in-left");
      setEnter(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setEnter(true));
      });
      setTimeout(() => {
        setPhase("idle");
        setEnter(false);
        animating.current = false;
        prevCompleteRef.current = false;
      }, IN_MS + 20);
    }, OUT_MS);
  };

  const goNext = () => animateTo("next");
  const goPrev = () => animateTo("prev");
  const goTo = (i: number) => {
    if (animating.current || i === idx) return;
    animateTo(i > idx ? "next" : "prev");
  };

  const current = items[idx];

  // Auto-advance when current item becomes complete
  useEffect(() => {
    if (!current) return;
    const nowComplete = isItemComplete(current, counts);
    if (nowComplete && !prevCompleteRef.current && idx < items.length - 1) {
      const t = setTimeout(() => goNext(), 900);
      prevCompleteRef.current = true;
      return () => clearTimeout(t);
    }
    prevCompleteRef.current = nowComplete;
  }, [counts, current, idx, items.length]);

  // Touch handling
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (animating.current) return;
      // ignore swipes that start inside a scrollable card body
      const target = e.target as HTMLElement | null;
      if (target && target.closest("[data-no-swipe]")) return;
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      isDragging.current = true;
      axisLocked.current = null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;
      if (axisLocked.current == null && Math.abs(dx) + Math.abs(dy) > 6) {
        axisLocked.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }
      if (axisLocked.current === "x") {
        e.preventDefault();
        setDragOffset(dx);
      }
    };
    const onTouchEnd = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      const dx = dragOffsetRef.current;
      axisLocked.current = null;
      if (dx < -50) {
        goNext();
      } else if (dx > 50) {
        goPrev();
      } else {
        setDragOffset(0);
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [idx, items.length]);

  const dragOffsetRef = useRef(0);
  useEffect(() => { dragOffsetRef.current = dragOffset; }, [dragOffset]);

  let transform = `translateX(${dragOffset}px)`;
  let opacity = 1;
  let transition = "none";

  if (phase === "out-left") {
    transform = "translateX(-110%)";
    opacity = 0;
    transition = `transform ${OUT_MS}ms cubic-bezier(0.4,0,0.2,1), opacity ${OUT_MS}ms ease`;
  } else if (phase === "out-right") {
    transform = "translateX(110%)";
    opacity = 0;
    transition = `transform ${OUT_MS}ms cubic-bezier(0.4,0,0.2,1), opacity ${OUT_MS}ms ease`;
  } else if (phase === "in-right") {
    if (!enter) {
      transform = "translateX(110%)"; opacity = 0; transition = "none";
    } else {
      transform = "translateX(0)"; opacity = 1;
      transition = `transform ${IN_MS}ms cubic-bezier(0.4,0,0.2,1), opacity ${IN_MS}ms ease`;
    }
  } else if (phase === "in-left") {
    if (!enter) {
      transform = "translateX(-110%)"; opacity = 0; transition = "none";
    } else {
      transform = "translateX(0)"; opacity = 1;
      transition = `transform ${IN_MS}ms cubic-bezier(0.4,0,0.2,1), opacity ${IN_MS}ms ease`;
    }
  } else {
    transition = isDragging.current ? "none" : `transform 0.25s ease`;
  }

  const isLast = idx === items.length - 1;
  const restart = () => {
    if (animating.current) return;
    setIdx(0);
    setPhase("idle");
    prevCompleteRef.current = false;
  };
  const handleFinishNav = () => {
    // Reset progress index so user starts fresh next time they open this set.
    setIdx(0);
    if (onFinishNav) onFinishNav();
    if (finishCta) navigate({ to: finishCta.to });
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="mb-2 flex items-center justify-center gap-2 px-4">
        <span
          className="rounded-[12px] px-3 py-1 text-xs font-semibold"
          style={{ background: "var(--surface)" }}
        >
          {idx + 1} / {items.length}
        </span>
        {idx > 0 && (
          <button
            onClick={restart}
            className="flex items-center gap-1 rounded-[12px] px-2.5 py-1 text-[11px] font-semibold transition active:scale-95"
            style={{ background: "var(--surface)", color: "var(--foreground)" }}
            aria-label="restart"
          >
            <RotateCcw size={12} /> Restart
          </button>
        )}
      </div>


      <div
        ref={wrapperRef}
        className="relative min-h-0 flex-1 overflow-hidden"
        style={{ touchAction: "pan-y", padding: "12px 16px" }}
      >
        {current && (
          <div
            className="h-full w-full"
            style={{ transform, opacity, transition, willChange: "transform, opacity" }}
          >
            {current.dhikr ? (
              <DhikrCard
                key={current.dhikr.id}
                dhikr={current.dhikr}
                count={counts[current.dhikr.id] ?? 0}
                onIncrement={() => onIncrement(current.dhikr!.id, current.dhikr!.target)}
                index={idx + 1}
                total={items.length}
                isSpecial={current.isSpecial}
                specialLabel={current.specialLabel}
                isPersonalDua={current.isPersonalDua}
              />
            ) : (
              <TasbeehComboCard
                key={current.combo!.id}
                combo={current.combo!}
                counts={counts}
                onIncrement={onIncrement}
                index={idx + 1}
                total={items.length}
              />
            )}
          </div>
        )}
      </div>

      {isLast && (finishCta || true) && (
        <div className="mt-2 flex flex-col gap-2 px-4">
          {finishCta && (
            <button
              onClick={handleFinishNav}
              className="flex items-center justify-center gap-2 rounded-full py-3 text-sm font-bold transition active:scale-[0.98]"
              style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
            >
              {finishCta.label} <ArrowRight size={16} />
            </button>
          )}
          <button
            onClick={restart}
            className="flex items-center justify-center gap-2 rounded-full py-2.5 text-xs font-semibold transition active:scale-[0.98]"
            style={{ background: "var(--surface)", color: "var(--foreground)", border: "1px solid var(--border)" }}
          >
            <RotateCcw size={14} /> Start Over
          </button>
        </div>
      )}



      <div className="mt-3 flex items-center justify-between px-6">
        <button
          onClick={goPrev}
          disabled={idx === 0}
          className="flex h-11 w-11 items-center justify-center rounded-full transition-transform active:scale-95 disabled:opacity-30"
          style={{
            background: "var(--arrow-bg, var(--surface))",
            color: "var(--arrow-fg, var(--foreground))",
            border: "1px solid var(--nav-border, transparent)",
          }}
          aria-label="previous"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {items.map((it, i) => (
            <button
              key={itemId(it) + i}
              onClick={() => goTo(i)}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === idx ? 20 : 6,
                background: i === idx
                  ? "var(--dot-active, var(--accent))"
                  : "var(--dot-inactive, color-mix(in oklab, var(--foreground) 22%, transparent))",
              }}
              aria-label={`go to ${i + 1}`}
            />
          ))}
        </div>
        <button
          onClick={goNext}
          disabled={idx === items.length - 1}
          className="flex h-11 w-11 items-center justify-center rounded-full transition-transform active:scale-95 disabled:opacity-30"
          style={{
            background: "var(--arrow-bg, var(--surface))",
            color: "var(--arrow-fg, var(--foreground))",
            border: "1px solid var(--nav-border, transparent)",
          }}
          aria-label="next"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
