import { useEffect, useState } from "react";
import { SwipeStack } from "./SwipeStack";
import type { Dhikr } from "@/data/adhkar";
import { getCounts, setCount } from "@/lib/storage";

type Item = { dhikr: Dhikr; isSpecial?: boolean; specialLabel?: string };

type Props = {
  kind: "morning" | "evening";
  title: string;
  subtitle: string;
  emoji: string;
  list: Dhikr[];
  extras?: Item[]; // appended (e.g., Baqarah)
};

export function AdhkarPage({ kind, title, subtitle, emoji, list, extras = [] }: Props) {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    setCounts(getCounts(kind));
  }, [kind]);

  const items: Item[] = [...list.map((d) => ({ dhikr: d })), ...extras];
  const completed = items.filter((i) => (counts[i.dhikr.id] ?? 0) >= i.dhikr.target).length;

  const inc = (id: string, target: number) => {
    const next = Math.min(target, (counts[id] ?? 0) + 1);
    const updated = { ...counts, [id]: next };
    setCounts(updated);
    setCount(kind, id, next);
  };

  return (
    <div className="mx-auto flex h-[100dvh] max-w-md flex-col pb-[calc(86px+env(safe-area-inset-bottom))]">
      {/* gradient header */}
      <div
        className="px-5 pt-5 pb-4"
        style={{
          background: "var(--grad-header)",
          color: "var(--accent-foreground)",
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <div className="label-caps">{subtitle}</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl">{emoji}</span>
          <h1 className="text-2xl font-bold tracking-tight">{title} Adhkar</h1>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div
            className="h-1.5 flex-1 overflow-hidden rounded-full"
            style={{ background: "color-mix(in oklab, var(--accent-foreground) 18%, transparent)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(completed / items.length) * 100}%`,
                background: "var(--accent-foreground)",
              }}
            />
          </div>
          <div className="text-xs font-bold">
            {completed} / {items.length}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <SwipeStack items={items} counts={counts} onIncrement={inc} />
      </div>
    </div>
  );
}
