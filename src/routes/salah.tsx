import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SwipeStack } from "@/components/SwipeStack";
import { SALAH_PRAYERS, getSalahItems, isItemComplete, type SalahPrayer } from "@/data/salah";
import { getCounts, setCount, clearCounts, bumpLifetime } from "@/lib/storage";

export const Route = createFileRoute("/salah")({
  head: () => ({ meta: [{ title: "Salah Adhkar — My Adhkar" }] }),
  component: Salah,
});

const PRAYER_KEY = "selectedPrayer";
const validPrayer = (v: string | null): SalahPrayer => {
  const ids = SALAH_PRAYERS.map((p) => p.id) as string[];
  return (v && ids.includes(v) ? v : "fajr") as SalahPrayer;
};

function Salah() {
  const [prayer, setPrayerState] = useState<SalahPrayer>(() => {
    if (typeof window === "undefined") return "fajr";
    return validPrayer(window.localStorage.getItem(PRAYER_KEY));
  });
  const setPrayer = (p: SalahPrayer) => {
    if (typeof window !== "undefined") window.localStorage.setItem(PRAYER_KEY, p);
    setPrayerState(p);
  };

  const [counts, setCounts] = useState<Record<string, number>>({});
  const storageKey = `salah_${prayer}`;
  const items = getSalahItems(prayer);
  const completed = items.filter((i) => isItemComplete(i, counts)).length;

  useEffect(() => {
    setCounts(getCounts(storageKey));
  }, [storageKey]);

  const inc = (id: string, target: number) => {
    const prev = counts[id] ?? 0;
    const next = Math.min(target, prev + 1);
    if (next === prev) return;
    const updated = { ...counts, [id]: next };
    setCounts(updated);
    setCount(storageKey, id, next);
    bumpLifetime("salah", next - prev);
  };

  const selectedLabel = SALAH_PRAYERS.find((p) => p.id === prayer)?.label ?? "";

  return (
    <>
      <header
        className="page-header"
        style={{
          background: "linear-gradient(135deg, #2e7d5e 0%, #1a5c42 100%)",
          color: "#ffffff",
        }}
      >
        <div className="mx-auto max-w-md px-5 pb-4 pt-5">
          <div className="label-caps" style={{ color: "rgba(255,255,255,0.85)", opacity: 1 }}>
            After {selectedLabel}
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">After Salah</h1>
          <div className="mt-3 flex items-center gap-3">
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full"
              style={{ background: "rgba(255,255,255,0.25)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${items.length ? (completed / items.length) * 100 : 0}%`,
                  background: "#c9a84c",
                }}
              />
            </div>
            <div className="text-xs font-bold">
              {completed} / {items.length}
            </div>
          </div>

          {/* Prayer selector — inside the header */}
          <div
            className="hide-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1"
            style={{ scrollbarWidth: "none" }}
          >
            {SALAH_PRAYERS.map((p) => {
              const active = p.id === prayer;
              return (
                <button
                  key={p.id}
                  onClick={() => setPrayer(p.id)}
                  className="flex shrink-0 items-center justify-center font-bold transition-all active:scale-95"
                  style={{
                    minWidth: 70,
                    height: 36,
                    borderRadius: 18,
                    padding: "0 16px",
                    fontSize: 13,
                    background: active ? "#c9a84c" : "rgba(255,255,255,0.15)",
                    color: active ? "#1a3d2b" : "#ffffff",
                    border: "none",
                    transition: "background 0.25s ease, color 0.25s ease",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="scroll-area flex flex-col" style={{ background: "#f0f7f4" }}>
        <div
          className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col pt-3"
          style={
            {
              // Salah card theme overrides (scoped to this page)
              ["--card" as string]: "#1a4a35",
              ["--card-foreground" as string]: "#f0f7f2",
              ["--translit" as string]: "#8fc4a8",
              ["--accent" as string]: "#c9a84c",
              ["--accent-foreground" as string]: "#1a3d2b",
              ["--border" as string]: "rgba(255,255,255,0.08)",
              ["--source-bg" as string]: "rgba(0,0,0,0.3)",
              ["--source-fg" as string]: "#8fc4a8",
              ["--combo-card" as string]: "#0f2e1e",
              ["--index-badge-bg" as string]: "#c9a84c",
              ["--index-badge-fg" as string]: "#1a3d2b",
              ["--count-fg" as string]: "#f0f7f2",
            } as React.CSSProperties
          }
        >
          <SwipeStack
            items={items}
            counts={counts}
            onIncrement={inc}
            persistKey={storageKey}
          />
        </div>
      </main>
    </>
  );
}
