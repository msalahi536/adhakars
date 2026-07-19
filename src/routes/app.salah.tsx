import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SwipeStack } from "@/components/SwipeStack";
import { HeaderSettingsButton } from "@/components/HeaderSettingsButton";
import { ConcentricCirclesPattern } from "@/components/HeaderPatterns";
import { SALAH_PRAYERS, getSalahItems, isItemComplete, type SalahPrayer } from "@/data/salah";
import { getCounts, setCount, clearCounts, bumpLifetime } from "@/lib/storage";

export const Route = createFileRoute("/app/salah")({
  head: () => ({ meta: [{ title: "Salah Adhkar, Sahih Al-Adhkar" }] }),
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
        className="page-header relative overflow-hidden"
        style={{
          background: "var(--grad-header)",
          color: "var(--header-fg)",
        }}
      >
        <ConcentricCirclesPattern />
        <HeaderSettingsButton />
        <div className="relative mx-auto max-w-md px-5 pb-4 pt-5">
          <div className="label-caps" style={{ color: "var(--header-sub)", opacity: 1 }}>
            After {selectedLabel}
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">After Salah</h1>
          <div className="mt-3 flex items-center gap-3">
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full"
              style={{ background: "color-mix(in oklab, var(--header-fg) 25%, transparent)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${items.length ? (completed / items.length) * 100 : 0}%`,
                  background: "var(--accent)",
                }}
              />
            </div>
            <div className="text-xs font-bold">
              {completed} / {items.length}
            </div>
          </div>

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
                    background: active
                      ? "var(--accent)"
                      : "color-mix(in oklab, var(--header-fg) 15%, transparent)",
                    color: active ? "var(--accent-foreground)" : "var(--header-fg)",
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

      <main className="scroll-area flex flex-col" style={{ background: "var(--background)" }}>
        <div
          className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col pt-3"
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
      </main>
    </>
  );
}
