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
  const [anim, setAnim] = useState<{ from: number; dir: 1 | -1 } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const update = () => setWidth(containerRef.current?.offsetWidth ?? 0);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => { setIdx(0); }, [items.length]);

  const clamp = (i: number) => Math.max(0, Math.min(items.length - 1, i));

  const goTo = (i: number) => {
    const n = clamp(i);
    if (n === idx || anim) return;
    const dir: 1 | -1 = n > idx ? 1 : -1;
    setAnim({ from: idx, dir });
    setIdx(n);
    setTimeout(() => setAnim(null), 340);
  };
  const go = (n: number) => goTo(idx + n);

  const current = items[idx];
  const previous = anim ? items[anim.from] : null;

  const handleIncrement = () => {
    if (!current) return;
    const prev = counts[current.dhikr.id] ?? 0;
    const willComplete = prev + 1 >= current.dhikr.target;
    onIncrement(current.dhikr.id, current.dhikr.target);
    if (willComplete && idx < items.length - 1) {
      setTimeout(() => goTo(idx + 1), 900);
    }
  };

  // Touch swipe
  const startX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current == null) return;
    const diff = startX.current - e.changedTouches[0].clientX;
    if (diff > 50) go(1);
    else if (diff < -50) go(-1);
    startX.current = null;
  };

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
        ref={containerRef}
        className="relative min-h-0 flex-1 overflow-hidden px-3"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: "pan-y" }}
      >
        {/* Outgoing card */}
        {previous && (
          <div
            className="card-slide absolute inset-0 px-3"
            style={{
              transform: `translateX(${anim!.dir === 1 ? -width : width}px)`,
              opacity: 0,
            }}
          >
            <DhikrCard
              key={`prev-${previous.dhikr.id}`}
              dhikr={previous.dhikr}
              count={counts[previous.dhikr.id] ?? 0}
              onIncrement={() => {}}
              index={anim!.from + 1}
              total={items.length}
              isSpecial={previous.isSpecial}
              specialLabel={previous.specialLabel}
            />
          </div>
        )}

        {/* Incoming / current card */}
        {current && (
          <div
            className="card-slide absolute inset-0 px-3"
            style={
              anim
                ? {
                    // start position depends on direction; we set initial via key+inline starting transform using animation frame
                    transform: "translateX(0)",
                    opacity: 1,
                  }
                : { transform: "translateX(0)", opacity: 1 }
            }
          >
            <IncomingCard
              animKey={`${idx}-${anim?.from ?? "static"}`}
              dir={anim?.dir ?? null}
              width={width}
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
            </IncomingCard>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between px-6">
        <button
          onClick={() => go(-1)}
          disabled={idx === 0}
          className="flex h-11 w-11 items-center justify-center rounded-full transition-transform active:scale-95 disabled:opacity-30"
          style={{ background: "var(--surface)", border: "1px solid var(--nav-border, var(--border))" }}
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
          className="flex h-11 w-11 items-center justify-center rounded-full transition-transform active:scale-95 disabled:opacity-30"
          style={{ background: "var(--surface)", border: "1px solid var(--nav-border, var(--border))" }}
          aria-label="next"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

// Animates a child sliding in from left/right
function IncomingCard({
  animKey,
  dir,
  width,
  children,
}: {
  animKey: string;
  dir: 1 | -1 | null;
  width: number;
  children: React.ReactNode;
}) {
  const [transform, setTransform] = useState<string>(
    dir ? `translateX(${dir === 1 ? width : -width}px)` : "translateX(0)"
  );

  useEffect(() => {
    if (dir == null) {
      setTransform("translateX(0)");
      return;
    }
    // start off-screen then animate to 0
    setTransform(`translateX(${dir === 1 ? width : -width}px)`);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setTransform("translateX(0)"));
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animKey]);

  return (
    <div
      className="card-slide h-full w-full"
      style={{ transform }}
    >
      {children}
    </div>
  );
}
