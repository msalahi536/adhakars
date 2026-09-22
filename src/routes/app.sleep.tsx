import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SwipeStack } from "@/components/SwipeStack";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { AdhkarHeader } from "@/components/AdhkarHeader";
import { sleepItems, wakeItems, type SleepMode } from "@/data/sleep";
import { isItemComplete } from "@/data/salah";
import { getCounts, setCount, clearCounts, bumpLifetime } from "@/lib/storage";
import { applyThemeForRoute } from "@/lib/theme-store";

export const Route = createFileRoute("/app/sleep")({
  head: () => ({
    meta: [
      { title: "Sleep & Wake Adhkar, Sahih Al-Adhkar" },
      { name: "description", content: "Authenticated adhkar before sleep and upon waking." },
      { property: "og:title", content: "Sleep & Wake Adhkar, Sahih Al-Adhkar" },
      { property: "og:description", content: "Authenticated adhkar before sleep and upon waking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
    window.dispatchEvent(new CustomEvent("adhkar:visual-phase-change", {
      detail: { phase: m === "sleep" ? "evening" : "morning" },
    }));
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

  return (
    <>
      <div className="sleep-adhkar-header">
        <HeaderBackButton />
        <AdhkarHeader
          title={isSleep ? "Sleep Adhkar" : "Wake Adhkar"}
          subtitle={isSleep ? "Before Sleep" : "Upon Waking"}
          completed={completed}
          total={items.length}
        />
        <div className="sleep-mode-switch" role="group" aria-label="Sleep or wake adhkar">
          {(["sleep", "wake"] as SleepMode[]).map((m) => {
            const active = m === mode;
            return (
              <button key={m} onClick={() => setMode(m)} className={active ? "is-active" : ""}>
                {m === "sleep" ? "Sleep" : "Wake"}
              </button>
            );
          })}
        </div>
      </div>

      <main className="scroll-area daily-adhkar-page sleep-adhkar-page flex flex-col">
        <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col">

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
            dailyLayout
          />
        </div>
      </main>
    </>
  );
}
