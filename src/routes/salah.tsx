import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SwipeStack } from "@/components/SwipeStack";
import { SALAH_PRAYERS, getSalahItems, isItemComplete, type SalahPrayer } from "@/data/salah";
import { getCounts, setCount, bumpLifetime } from "@/lib/storage";

export const Route = createFileRoute("/salah")({
  head: () => ({ meta: [{ title: "Salah Adhkar — My Adhkar" }] }),
  component: Salah,
});

function Salah() {
  const [prayer, setPrayer] = useState<SalahPrayer>("fajr");
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
          background: "linear-gradient(135deg, #d4956a 0%, #b8743a 100%)",
          color: "#fff5e8",
        }}
      >
        <div className="mx-auto max-w-md px-5 pb-4 pt-5">
          <div className="label-caps" style={{ color: "rgba(255,245,232,0.85)", opacity: 1 }}>
            After {selectedLabel}
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">After Salah</h1>
          <div className="mt-3 flex items-center gap-3">
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full"
              style={{ background: "rgba(255,245,232,0.25)" }}
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
        </div>
      </header>

      <main className="scroll-area flex flex-col">
        <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col">
          {/* Prayer selector */}
          <div
            className="hide-scrollbar flex gap-2 overflow-x-auto px-4 pb-2 pt-3"
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
                    minWidth: 72,
                    height: 38,
                    borderRadius: 20,
                    padding: "0 16px",
                    fontSize: 13,
                    background: active ? "#c9a84c" : "var(--surface)",
                    color: active ? "#ffffff" : "var(--muted-foreground)",
                    border: active ? "none" : "1px solid var(--border)",
                    transition: "background 0.25s ease, color 0.25s ease",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <SwipeStack
            key={prayer}
            items={items}
            counts={counts}
            onIncrement={inc}
          />
        </div>
      </main>
    </>
  );
}
