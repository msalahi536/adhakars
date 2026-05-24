import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdhkarPage } from "@/components/AdhkarPage";
import { DhikrCard } from "@/components/DhikrCard";
import { eveningAdhkar, baqarahLastTwo } from "@/data/adhkar";
import { getCounts, setCount } from "@/lib/storage";

export const Route = createFileRoute("/evening")({
  head: () => ({
    meta: [
      { title: "Evening Adhkar — My Adhkar" },
      { name: "description", content: "Recite your evening adhkar with counters and streaks." },
    ],
  }),
  component: Evening,
});

function Evening() {
  const [count, setLocalCount] = useState(0);

  useEffect(() => {
    const c = getCounts("evening");
    setLocalCount(c[baqarahLastTwo.id] ?? 0);
  }, []);

  const inc = () => {
    const next = Math.min(baqarahLastTwo.target, count + 1);
    setLocalCount(next);
    setCount("evening", baqarahLastTwo.id, next);
  };

  const extra = (
    <div className="mt-8">
      <div className="mb-3 flex items-center gap-2 px-1">
        <div
          className="h-px flex-1"
          style={{ background: "color-mix(in oklab, var(--foreground) 15%, transparent)" }}
        />
        <span className="text-xs uppercase tracking-[0.2em] opacity-60">After Sunset</span>
        <div
          className="h-px flex-1"
          style={{ background: "color-mix(in oklab, var(--foreground) 15%, transparent)" }}
        />
      </div>
      <p className="mb-3 px-1 text-xs opacity-70">Recite after the sun has set.</p>
      <DhikrCard dhikr={baqarahLastTwo} count={count} onIncrement={inc} index={15} />
    </div>
  );

  return (
    <AdhkarPage
      kind="evening"
      title="Evening"
      subtitle="Between 'Asr & Maghrib"
      list={eveningAdhkar}
      extra={extra}
    />
  );
}
