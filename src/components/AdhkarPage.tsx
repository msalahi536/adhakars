import { useEffect, useState } from "react";
import { SwipeStack } from "./SwipeStack";
import type { Dhikr } from "@/data/adhkar";
import type { SalahItem } from "@/data/salah";
import { isItemComplete } from "@/data/salah";
import { getCounts, setCount, bumpLifetime, type LifetimeCategory } from "@/lib/storage";

type Props = {
  storageKey: string; // e.g. "morning", "evening", "salah_fajr"
  lifetimeCategory: LifetimeCategory;
  title: string;
  subtitle: string;
  list?: Dhikr[];
  items?: SalahItem[];
  extras?: SalahItem[];
  headerStyle?: React.CSSProperties;
};

export function AdhkarPage({
  storageKey,
  lifetimeCategory,
  title,
  subtitle,
  list,
  items: itemsProp,
  extras = [],
  headerStyle,
}: Props) {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    setCounts(getCounts(storageKey));
  }, [storageKey]);

  const baseItems: SalahItem[] = itemsProp ?? (list ?? []).map((d) => ({ dhikr: d }));
  const items: SalahItem[] = [...baseItems, ...extras];
  const completed = items.filter((i) => isItemComplete(i, counts)).length;

  const inc = (id: string, target: number) => {
    const prev = counts[id] ?? 0;
    const next = Math.min(target, prev + 1);
    if (next === prev) return;
    const updated = { ...counts, [id]: next };
    setCounts(updated);
    setCount(storageKey, id, next);
    bumpLifetime(lifetimeCategory, next - prev);
  };

  const defaultHeader: React.CSSProperties = {
    background: "var(--grad-header)",
    color: "var(--header-fg, var(--accent-foreground))",
  };

  return (
    <>
      <header className="page-header" style={{ ...defaultHeader, ...headerStyle }}>
        <div className="mx-auto max-w-md px-5 pb-4 pt-5">
          <div
            className="label-caps"
            style={{
              color: "var(--header-sub, var(--header-fg, var(--accent-foreground)))",
              opacity: 1,
            }}
          >
            {subtitle}
          </div>

          <h1 className="mt-1 text-2xl font-bold tracking-tight">{title}</h1>
          <div className="mt-3 flex items-center gap-3">
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full"
              style={{
                background:
                  "color-mix(in oklab, var(--header-fg, var(--accent-foreground)) 22%, transparent)",
              }}
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
        </div>
      </header>

      <main className="scroll-area flex flex-col">
        <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col pt-3">
          <SwipeStack items={items} counts={counts} onIncrement={inc} persistKey={storageKey} />
        </div>
      </main>
    </>
  );
}
