import { useEffect, useState } from "react";
import { SwipeStack } from "./SwipeStack";
import { AdhkarHeader } from "./AdhkarHeader";
import type { Dhikr } from "@/data/adhkar";
import type { SalahItem } from "@/data/salah";
import { isItemComplete } from "@/data/salah";
import { getCounts, setCount, clearCounts, bumpLifetime, type LifetimeCategory } from "@/lib/storage";

type Props = {
  storageKey: string; // e.g. "morning", "evening", "salah_fajr"
  lifetimeCategory: LifetimeCategory;
  title: string;
  subtitle: string;
  list?: Dhikr[];
  items?: SalahItem[];
  extras?: SalahItem[];
  headerStyle?: React.CSSProperties;
  headerPattern?: React.ReactNode;
  headerAction?: React.ReactNode;
  emptyState?: React.ReactNode;
  onAddItem?: () => void;
  onEditItem?: (id: string) => void;
  onDeleteItem?: (id: string) => void;
  dailyLayout?: boolean;
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
  headerPattern,
  headerAction,
  emptyState,
  onAddItem,
  onEditItem,
  onDeleteItem,
  dailyLayout: dailyLayoutProp,
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

  const dailyLayout = dailyLayoutProp ?? ["morning", "evening", "sleep", "wake"].includes(storageKey);

  return (
    <>
      <AdhkarHeader
        title={title}
        subtitle={subtitle}
        completed={completed}
        total={items.length}
        action={headerAction}
        style={headerStyle}
        pattern={headerPattern}
      />

      <main className={`scroll-area flex flex-col ${dailyLayout ? "daily-adhkar-page" : ""}`}>
        <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col">
          {items.length === 0 && emptyState ? (
            emptyState
          ) : (
            <SwipeStack
              items={items}
              counts={counts}
              onIncrement={inc}
              onReset={() => {
                clearCounts(storageKey);
                setCounts({});
              }}
              persistKey={storageKey}
              onAddItem={onAddItem}
              onEditItem={onEditItem}
              onDeleteItem={onDeleteItem}
              dailyLayout={dailyLayout}
            />
          )}
        </div>
      </main>
    </>
  );
}
