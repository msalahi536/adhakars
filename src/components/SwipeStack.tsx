import { useEffect, useRef, useState } from "react";
import type { Dhikr } from "@/data/adhkar";
import { DhikrCard } from "./DhikrCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Item = { dhikr: Dhikr; isSpecial?: boolean; specialLabel?: string };

type Props = {
  items: Item[];
  counts: Record<string, number>;
  onIncrement: (id: string, target: number) => void;
};

export function SwipeStack({ items, counts, onIncrement }: Props) {
  const [idx, setIdx] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const axisLocked = useRef<null | "x" | "y">(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setIdx(0); }, [items.length]);

  const clamp = (i: number) => Math.max(0, Math.min(items.length - 1, i));
  const goTo = (i: number) => setIdx(clamp(i));
  const goNext = () => goTo(idx + 1);
  const goPrev = () => goTo(idx - 1);

  const current = items[idx];

  const handleIncrement = () => {
    if (!current) return;
    const prev = counts[current.dhikr.id] ?? 0;
    const willComplete = prev + 1 >= current.dhikr.target;
    onIncrement(current.dhikr.id, current.dhikr.target);
    if (willComplete && idx < items.length - 1) {
      setTimeout(() => goNext(), 900);
    }
  };

  // Non-passive touchmove via native listener so preventDefault works
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
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
      setDragOffset((dx) => {
        if (dx < -50) goNext();
        else if (dx > 50) goPrev();
        return 0;
      });
      axisLocked.current = null;
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

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="mb-2 flex items-center justify-center px-4">
        <span
          className="rounded-[12px] px-3 py-1 text-xs font-semibold"
          style={{ background: "var(--surface)" }}
        >
          {idx + 1} / {items.length}
        </span>
      </div>

      <div
        ref={wrapperRef}
        className="relative min-h-0 flex-1 overflow-hidden"
        style={{ touchAction: "pan-y", padding: "12px 16px" }}
      >
        {current && (
          <div
            className="h-full w-full"
            style={{
              transform: `translateX(${dragOffset}px)`,
              transition: dragOffset === 0 ? "transform 0.3s ease" : "none",
            }}
          >
            <DhikrCard
              key={current.dhikr.id}
              dhikr={current.dhikr}
              count={counts[current.dhikr.id] ?? 0}
              onIncrement={handleIncrement}
              index={idx + 1}
              total={items.length}
              isSpecial={current.isSpecial}
              specialLabel={current.specialLabel}
            />
          </div>
        )}
      </div>

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
          {items.map((_, i) => (
            <button
              key={i}
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
