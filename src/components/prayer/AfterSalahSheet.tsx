// Full screen sheet holding the after salah adhkar for one prayer.

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { SwipeStack } from "@/components/SwipeStack";
import { SALAH_PRAYERS, getSalahItems, isItemComplete, type SalahPrayer } from "@/data/salah";
import { getCounts, setCount, clearCounts, bumpLifetime } from "@/lib/storage";

type Props = {
  open: boolean;
  prayer: SalahPrayer;
  onPrayer: (p: SalahPrayer) => void;
  onClose: () => void;
};

export function AfterSalahSheet({ open, prayer, onPrayer, onClose }: Props) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [dragY, setDragY] = useState(0);
  const [startY, setStartY] = useState<number | null>(null);
  const storageKey = `salah_${prayer}`;
  const items = getSalahItems(prayer);
  const completed = items.filter((i) => isItemComplete(i, counts)).length;

  useEffect(() => {
    setCounts(getCounts(storageKey));
  }, [storageKey, open]);

  useEffect(() => {
    if (!open) setDragY(0);
  }, [open]);

  if (!open) return null;

  const inc = (id: string, target: number) => {
    const prev = counts[id] ?? 0;
    const nextCount = Math.min(target, prev + 1);
    if (nextCount === prev) return;
    const updated = { ...counts, [id]: nextCount };
    setCounts(updated);
    setCount(storageKey, id, nextCount);
    bumpLifetime("salah", nextCount - prev);
  };

  const label = SALAH_PRAYERS.find((p) => p.id === prayer)?.label ?? "";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col rounded-t-[28px] pt-3"
        style={{
          background: "var(--background)",
          color: "var(--foreground)",
          height: "92vh",
          transform: `translateY(${dragY}px)`,
          transition: startY === null ? "transform 220ms ease" : "none",
        }}
      >
        <div
          onTouchStart={(e) => setStartY(e.touches[0].clientY)}
          onTouchMove={(e) => {
            if (startY === null) return;
            setDragY(Math.max(0, e.touches[0].clientY - startY));
          }}
          onTouchEnd={() => {
            if (dragY > 90) onClose();
            setDragY(0);
            setStartY(null);
          }}
          className="shrink-0 px-5 pb-2"
        >
          <div
            className="mx-auto mb-3 rounded-full"
            style={{
              width: 40,
              height: 4,
              background: "color-mix(in oklab, var(--foreground) 22%, transparent)",
            }}
          />
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="label-caps" style={{ color: "var(--muted-foreground)" }}>
                After Salah Adhkar
              </div>
              <h2 className="text-xl font-bold">After {label}</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>
                {completed} / {items.length}
              </span>
              <button
                onClick={onClose}
                aria-label="Close"
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 34,
                  height: 34,
                  background: "color-mix(in oklab, var(--foreground) 8%, transparent)",
                  color: "var(--foreground)",
                }}
              >
                <X size={17} />
              </button>
            </div>
          </div>

          <div
            className="hide-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1"
            style={{ scrollbarWidth: "none" }}
          >
            {SALAH_PRAYERS.map((p) => {
              const active = p.id === prayer;
              return (
                <button
                  key={p.id}
                  onClick={() => onPrayer(p.id)}
                  className="flex shrink-0 items-center justify-center font-bold active:scale-95"
                  style={{
                    minWidth: 70,
                    height: 36,
                    borderRadius: 18,
                    padding: "0 16px",
                    fontSize: 13,
                    background: active
                      ? "var(--accent)"
                      : "color-mix(in oklab, var(--foreground) 10%, transparent)",
                    color: active ? "var(--accent-foreground)" : "var(--foreground)",
                    transition: "background 0.25s ease, color 0.25s ease",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="flex min-h-0 flex-1 flex-col pb-4"
          style={
            {
              ["--card" as string]: "var(--surface-deep)",
              ["--card-foreground" as string]: "var(--surface-deep-fg)",
              ["--translit" as string]: "var(--surface-deep-muted)",
              ["--border" as string]: "var(--surface-deep-border)",
              ["--source-bg" as string]: "rgba(0,0,0,0.28)",
              ["--source-fg" as string]: "var(--surface-deep-muted)",
              ["--combo-card" as string]: "color-mix(in oklab, var(--surface-deep) 82%, #000)",
              ["--count-fg" as string]: "var(--surface-deep-fg)",
            } as React.CSSProperties
          }
        >
          <SwipeStack
            items={items}
            counts={counts}
            onIncrement={inc}
            onReset={() => {
              clearCounts(storageKey);
              setCounts({});
            }}
            persistKey={storageKey}
          />
        </div>
      </div>
    </div>
  );
}
