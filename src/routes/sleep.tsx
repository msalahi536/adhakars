import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SwipeStack } from "@/components/SwipeStack";
import { sleepItems, wakeItems, type SleepMode } from "@/data/sleep";
import { isItemComplete } from "@/data/salah";
import { getCounts, setCount, bumpLifetime } from "@/lib/storage";

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
    // Track under evening bucket for sleep, morning bucket for wake
    bumpLifetime(mode === "sleep" ? "evening" : "morning", next - prev);
  };

  const isSleep = mode === "sleep";
  const gradient = isSleep
    ? "linear-gradient(135deg, #1a1f3a 0%, #0d1425 100%)"
    : "linear-gradient(135deg, #f5b26e 0%, #e58a3a 100%)";
  const accent = "#c9a84c";

  return (
    <>
      <header
        className="page-header"
        style={{ background: gradient, color: "#ffffff" }}
      >
        <div className="mx-auto max-w-md px-5 pb-4 pt-5">
          <div className="label-caps" style={{ color: "rgba(255,255,255,0.85)", opacity: 1 }}>
            {isSleep ? "Before Sleep" : "Upon Waking"}
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            {isSleep ? "Sleep Adhkar" : "Wake Adhkar"}
          </h1>

          <div className="mt-3 flex items-center gap-3">
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full"
              style={{ background: "rgba(255,255,255,0.25)" }}
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

          {/* Sleep / Wake toggle */}
          <div
            className="mt-4 flex rounded-full p-1"
            style={{ background: "rgba(255,255,255,0.15)" }}
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
                    color: active ? "#1a1f3a" : "#ffffff",
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
        style={{ background: isSleep ? "#0d1425" : "#faf3e8" }}
      >
        <div
          className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col pt-3"
          style={
            isSleep
              ? ({
                  ["--card" as string]: "#1e2445",
                  ["--card-foreground" as string]: "#f0f2fa",
                  ["--translit" as string]: "#9aa3d4",
                  ["--accent" as string]: "#c9a84c",
                  ["--accent-foreground" as string]: "#1a1f3a",
                  ["--border" as string]: "rgba(255,255,255,0.08)",
                  ["--source-bg" as string]: "rgba(0,0,0,0.3)",
                  ["--source-fg" as string]: "#9aa3d4",
                  ["--index-badge-bg" as string]: "#c9a84c",
                  ["--index-badge-fg" as string]: "#1a1f3a",
                  ["--count-fg" as string]: "#f0f2fa",
                } as React.CSSProperties)
              : ({
                  ["--card" as string]: "#fffcf4",
                  ["--card-foreground" as string]: "#3a2410",
                  ["--translit" as string]: "#a5731a",
                  ["--accent" as string]: "#e58a3a",
                  ["--accent-foreground" as string]: "#ffffff",
                  ["--border" as string]: "rgba(58, 36, 16, 0.12)",
                  ["--source-bg" as string]: "rgba(229, 138, 58, 0.12)",
                  ["--source-fg" as string]: "#a5731a",
                  ["--index-badge-bg" as string]: "#e58a3a",
                  ["--index-badge-fg" as string]: "#ffffff",
                  ["--count-fg" as string]: "#3a2410",
                } as React.CSSProperties)
          }
        >
          <SwipeStack
            items={items}
            counts={counts}
            onIncrement={inc}
            persistKey={storageKey}
            finishCta={
              isSleep
                ? { label: "Go to Wake Adhkar", to: "/sleep" }
                : { label: "Go to Morning Adhkar", to: "/" }
            }
            onFinishNav={
              isSleep
                ? () => setMode("wake")
                : undefined
            }
          />
        </div>
      </main>
    </>
  );
}
