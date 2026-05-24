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
  const [dx, setDx] = useState(0);
  const startX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);

  useEffect(() => {
    const update = () => setW(containerRef.current?.offsetWidth ?? window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const clamp = (i: number) => Math.max(0, Math.min(items.length - 1, i));
  const go = (n: number) => setIdx((i) => clamp(i + n));

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startX.current == null) return;
    setDx(e.touches[0].clientX - startX.current);
  };
  const onTouchEnd = () => {
    if (Math.abs(dx) > 70) {
      go(dx < 0 ? 1 : -1);
    }
    setDx(0);
    startX.current = null;
  };

  // mouse drag for desktop preview
  const mouseDown = useRef<number | null>(null);
  const onMouseDown = (e: React.MouseEvent) => {
    mouseDown.current = e.clientX;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (mouseDown.current == null) return;
    setDx(e.clientX - mouseDown.current);
  };
  const onMouseUp = () => {
    if (mouseDown.current == null) return;
    if (Math.abs(dx) > 70) go(dx < 0 ? 1 : -1);
    setDx(0);
    mouseDown.current = null;
  };

  const handleIncrement = (item: Item) => {
    const prev = counts[item.dhikr.id] ?? 0;
    const willComplete = prev + 1 >= item.dhikr.target;
    onIncrement(item.dhikr.id, item.dhikr.target);
    if (willComplete && idx < items.length - 1) {
      setTimeout(() => setIdx((i) => clamp(i + 1)), 1000);
    }
  };

  // peek of next card by ~20px
  const peek = 20;
  const cardW = Math.max(0, w - peek);

  return (
    <div className="flex flex-1 flex-col">
      {/* dots */}
      <div className="mb-3 flex items-center justify-center gap-3 px-4">
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{ background: "var(--surface)" }}
        >
          {idx + 1} / {items.length}
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{ touchAction: "pan-y" }}
      >
        <div
          className="absolute inset-y-0 left-0 flex"
          style={{
            transform: `translateX(${-idx * cardW + dx}px)`,
            transition: dx === 0 ? "transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1)" : "none",
          }}
        >
          {items.map((item, i) => (
            <div
              key={item.dhikr.id + i}
              className="px-3 py-1"
              style={{ width: cardW, flex: `0 0 ${cardW}px` }}
            >
              <DhikrCard
                dhikr={item.dhikr}
                count={counts[item.dhikr.id] ?? 0}
                onIncrement={() => handleIncrement(item)}
                index={i + 1}
                total={items.length}
                isSpecial={item.isSpecial}
                specialLabel={item.specialLabel}
              />
            </div>
          ))}
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
              onClick={() => setIdx(i)}
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
