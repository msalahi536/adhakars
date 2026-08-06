import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SwipeStack } from "@/components/SwipeStack";
import { HeaderSettingsButton } from "@/components/HeaderSettingsButton";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { DiagonalLatticePattern } from "@/components/HeaderPatterns";
import { sleepItems, wakeItems, type SleepMode } from "@/data/sleep";
import { isItemComplete } from "@/data/salah";
import { getCounts, setCount, clearCounts, bumpLifetime } from "@/lib/storage";
import { applyThemeForRoute } from "@/lib/theme-store";

export const Route = createFileRoute("/app/sleep")({
  head: () => ({
    meta: [
      { title: "Sleep & Wake Adhkar, Sahih Al-Adhkar" },
      { name: "description", content: "Authenticated adhkar before sleep and upon waking." },
    ],
  }),
  component: Sleep,
});

const MODE_KEY = "sleepMode";

function Sleep() {
  const [mode, setModeState] = useState<SleepMode>(() => {
    if (typeof window === "undefined") return "sleep";
    const v = window.localStorage.getItem(MODE_KEY);
    return v === "wake" ? "wake" : "sleep";
  });
  const setMode = (m: SleepMode) => {
    if (typeof window !== "undefined") window.localStorage.setItem(MODE_KEY, m);
    setModeState(m);
  };

  const items = mode === "sleep" ? sleepItems : wakeItems;
  const storageKey = mode === "sleep" ? "sleep" : "wake";
  const [counts, setCounts] = useState<Record<string, number>>({});
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
    bumpLifetime(mode === "sleep" ? "evening" : "morning", next - prev);
  };

  const isSleep = mode === "sleep";

  // Sleep and Wake are their own theme sections, so both follow the chosen
  // preset / custom theme (Original still gives night blue and dawn gold).
  useEffect(() => {
    applyThemeForRoute("/app/sleep", isSleep ? "sleep" : "wake");
  }, [isSleep]);

  const headerFg = "var(--header-fg, var(--accent-foreground))";

  return (
    <>
      <header
        className="page-header relative overflow-hidden"
        style={{ background: "var(--grad-header)", color: headerFg }}
      >
        <DiagonalLatticePattern />
        <HeaderBackButton />
        <HeaderSettingsButton />
        <div className="relative mx-auto max-w-md px-5 pb-4 pt-5" style={{ paddingLeft: 60, paddingRight: 60 }}>
          <div
            className="label-caps"
            style={{ color: `var(--header-sub, ${headerFg})`, opacity: 1 }}
          >
            {isSleep ? "Before Sleep" : "Upon Waking"}
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            {isSleep ? "Sleep Adhkar" : "Wake Adhkar"}
          </h1>

          <div className="mt-3 flex items-center gap-3">
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full"
              style={{ background: `color-mix(in oklab, ${headerFg} 22%, transparent)` }}
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
            className="mt-4 flex rounded-full p-1"
            style={{ background: `color-mix(in oklab, ${headerFg} 14%, transparent)` }}
          >
            {(["sleep", "wake"] as SleepMode[]).map((m) => {
              const active = m === mode;
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="flex-1 rounded-full py-2 text-sm font-bold transition-all"
                  style={{
                    background: active ? "var(--accent)" : "transparent",
                    color: active ? "var(--accent-foreground)" : headerFg,
                  }}
                >
                  {m === "sleep" ? "🌙 Sleep" : "☀️ Wake"}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="scroll-area flex flex-col">
        <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col pt-3">

          <SwipeStack
            items={items}
            counts={counts}
            onIncrement={inc}
            onReset={() => {
              clearCounts(storageKey);
              setCounts({});
            }}
            persistKey={storageKey}
            finishCta={
              isSleep
                ? { label: "Go to Wake Adhkar", to: "/app/sleep" }
                : { label: "Go to Morning Adhkar", to: "/app" }
            }
            onFinishNav={isSleep ? () => setMode("wake") : undefined}
          />
        </div>
      </main>
    </>
  );
}
