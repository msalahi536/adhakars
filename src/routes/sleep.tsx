import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SwipeStack } from "@/components/SwipeStack";
import { HeaderSettingsButton } from "@/components/HeaderSettingsButton";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { DiagonalLatticePattern } from "@/components/HeaderPatterns";
import { sleepItems, wakeItems, type SleepMode } from "@/data/sleep";
import { isItemComplete } from "@/data/salah";
import { getCounts, setCount, clearCounts, bumpLifetime } from "@/lib/storage";

export const Route = createFileRoute("/sleep")({
  head: () => ({
    meta: [
      { title: "Sleep & Wake Adhkar — My Adhkar" },
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
  // Evening (dusk) palette — used for both sleep and wake for a calm, consistent feel
  const gradient = "linear-gradient(135deg, #a9c0dc 0%, #7a9bc4 100%)";
  const accent = "#4a6b9a";
  const headerFg = "#1f3a5c";

  return (
    <>
      <header
        className="page-header relative overflow-hidden"
        style={{ background: gradient, color: headerFg }}
      >
        <DiagonalLatticePattern />
        <HeaderBackButton />
        <HeaderSettingsButton />
        <div className="relative mx-auto max-w-md px-5 pb-4 pt-5" style={{ paddingLeft: 60, paddingRight: 60 }}>
          <div className="label-caps" style={{ color: "rgba(31,58,92,0.75)", opacity: 1 }}>
            {isSleep ? "Before Sleep" : "Upon Waking"}
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            {isSleep ? "Sleep Adhkar" : "Wake Adhkar"}
          </h1>

          <div className="mt-3 flex items-center gap-3">
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full"
              style={{ background: "rgba(31,58,92,0.15)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${items.length ? (completed / items.length) * 100 : 0}%`,
                  background: accent,
                }}
              />
            </div>
            <div className="text-xs font-bold">
              {completed} / {items.length}
            </div>
          </div>

          <div
            className="mt-4 flex rounded-full p-1"
            style={{ background: "rgba(31,58,92,0.12)" }}
          >
            {(["sleep", "wake"] as SleepMode[]).map((m) => {
              const active = m === mode;
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="flex-1 rounded-full py-2 text-sm font-bold transition-all"
                  style={{
                    background: active ? accent : "transparent",
                    color: active ? "#ffffff" : headerFg,
                  }}
                >
                  {m === "sleep" ? "🌙 Sleep" : "☀️ Wake"}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main
        className="scroll-area flex flex-col"
        style={{ background: "#eef2f8" }}
      >
        <div
          className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col pt-3"
          style={
            {
              ["--card" as string]: "#f5f8fc",
              ["--card-foreground" as string]: "#1f3a5c",
              ["--translit" as string]: "#4a6b9a",
              ["--accent" as string]: "#4a6b9a",
              ["--accent-foreground" as string]: "#ffffff",
              ["--border" as string]: "rgba(74,107,154,0.15)",
              ["--source-bg" as string]: "rgba(74,107,154,0.12)",
              ["--source-fg" as string]: "#4a6b9a",
              ["--index-badge-bg" as string]: "#4a6b9a",
              ["--index-badge-fg" as string]: "#ffffff",
              ["--count-fg" as string]: "#1f3a5c",
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
            finishCta={
              isSleep
                ? { label: "Go to Wake Adhkar", to: "/sleep" }
                : { label: "Go to Morning Adhkar", to: "/" }
            }
            onFinishNav={isSleep ? () => setMode("wake") : undefined}
          />
        </div>
      </main>
    </>
  );
}
