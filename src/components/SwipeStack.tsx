import { useEffect, useState } from "react";
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
  const [fading, setFading] = useState(false);

  const clamp = (i: number) => Math.max(0, Math.min(items.length - 1, i));
  const goTo = (i: number) => {
    const n = clamp(i);
    if (n === idx) return;
    setFading(true);
    setTimeout(() => {
      setIdx(n);
      setFading(false);
    }, 150);
  };
  const go = (n: number) => goTo(idx + n);

  const current = items[idx];

  const handleIncrement = () => {
    if (!current) return;
    const prev = counts[current.dhikr.id] ?? 0;
    const willComplete = prev + 1 >= current.dhikr.target;
    onIncrement(current.dhikr.id, current.dhikr.target);
    if (willComplete && idx < items.length - 1) {
      setTimeout(() => goTo(idx + 1), 900);
    }
  };

  // Touch swipe (no transform — just detect direction on release)
  const [startX, setStartX] = useState<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => setStartX(e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX == null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
    setStartX(null);
  };

  useEffect(() => {
    // Reset to first when item list identity changes
    setIdx(0);
  }, [items.length]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="mb-2 flex items-center justify-center px-4">
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{ background: "var(--surface)" }}
        >
          {idx + 1} / {items.length}
        </span>
      </div>

      <div
        className="relative min-h-0 flex-1 px-3"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: "pan-y" }}
      >
        <div
          className="h-full w-full transition-opacity duration-150"
          style={{ opacity: fading ? 0 : 1 }}
        >
          {current ? (
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
          ) : (
            <div className="p-6 text-center text-sm opacity-70">
              Error: no dhikr at index {idx}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between px-6">
        <button
          onClick={() => go(-1)}
          disabled={idx === 0}
          className="flex h-11 w-11 items-center justify-center rounded-full disabled:opacity-30"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
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
                background: i === idx ? "var(--accent)" : "color-mix(in oklab, var(--foreground) 22%, transparent)",
              }}
              aria-label={`go to ${i + 1}`}
            />
          ))}
        </div>
        <button
          onClick={() => go(1)}
          disabled={idx === items.length - 1}
          className="flex h-11 w-11 items-center justify-center rounded-full disabled:opacity-30"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          aria-label="next"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
