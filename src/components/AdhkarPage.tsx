import { useEffect, useState } from "react";
import { DhikrCard } from "./DhikrCard";
import type { Dhikr } from "@/data/adhkar";
import { getCounts, setCount } from "@/lib/storage";

type Props = {
  kind: "morning" | "evening";
  title: string;
  subtitle: string;
  list: Dhikr[];
  extra?: React.ReactNode;
};

export function AdhkarPage({ kind, title, subtitle, list, extra }: Props) {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    setCounts(getCounts(kind));
  }, [kind]);

  const completed = list.filter((d) => (counts[d.id] ?? 0) >= d.target).length;

  const inc = (d: Dhikr) => {
    const next = Math.min(d.target, (counts[d.id] ?? 0) + 1);
    const updated = { ...counts, [d.id]: next };
    setCounts(updated);
    setCount(kind, d.id, next);
  };

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-32">
      <header className="mb-5">
        <div className="text-xs uppercase tracking-[0.2em] opacity-60">{subtitle}</div>
        <h1 className="mt-1 text-3xl font-bold">{title}</h1>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--muted)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(completed / list.length) * 100}%`,
                background: "var(--accent)",
              }}
            />
          </div>
          <div className="text-xs font-semibold opacity-80">
            {completed} / {list.length}
          </div>
        </div>
      </header>

      <div className="space-y-4">
        {list.map((d, i) => (
          <DhikrCard
            key={d.id}
            dhikr={d}
            count={counts[d.id] ?? 0}
            onIncrement={() => inc(d)}
            index={i + 1}
          />
        ))}
      </div>

      {extra}
    </div>
  );
}
