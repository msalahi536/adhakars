import { useEffect, useState } from "react";
import { SwipeStack } from "./SwipeStack";
import { morningAdhkar, eveningAdhkar, type Dhikr } from "@/data/adhkar";
import { getCounts, setCount } from "@/lib/storage";

if (typeof window !== "undefined") {
  console.log("Morning adhkar loaded:", morningAdhkar.length);
  console.log("Evening adhkar loaded:", eveningAdhkar.length);
}

type Item = { dhikr: Dhikr; isSpecial?: boolean; specialLabel?: string };

type Props = {
  kind: "morning" | "evening";
  title: string;
  subtitle: string;
  list: Dhikr[];
  extras?: Item[];
};

export function AdhkarPage({ kind, title, subtitle, list, extras = [] }: Props) {
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
    <>
      <header
        className="page-header"
        style={{
          background: "var(--grad-header)",
          color: "var(--header-fg, var(--accent-foreground))",
        }}
      >
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

          <h1 className="mt-1 text-2xl font-bold tracking-tight">{title} Adhkar</h1>
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
                  width: `${(completed / items.length) * 100}%`,
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
          <SwipeStack items={items} counts={counts} onIncrement={inc} />
        </div>
      </main>
    </>
  );
}
