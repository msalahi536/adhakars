import { useEffect, useRef, useState } from "react";
import type { ComboDhikr } from "@/data/salah";
import { vibrateIfEnabled } from "@/lib/theme";

type Props = {
  combo: ComboDhikr;
  counts: Record<string, number>;
  onIncrement: (id: string, target: number) => void;
  index: number;
  total: number;
};

export function TasbeehComboCard({ combo, counts, onIncrement, index, total }: Props) {
  const [showBottomFade, setShowBottomFade] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setShowBottomFade(true);
  }, [combo.id]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
    setShowBottomFade(!atBottom);
  };

  const doneCount = combo.parts.filter((p) => (counts[p.id] ?? 0) >= p.target).length;

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden rounded-[24px]"
      style={{
        background: "var(--combo-card, var(--card))",
        color: "var(--card-foreground)",
        border: "1px solid var(--border)",
        boxShadow: "var(--card-shadow, 0 4px 16px rgba(0,0,0,0.08))",
      }}
    >
      <div className="flex items-center gap-3 px-5 pt-5">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
          style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
        >
          {index}
        </span>
        <h3
          className="flex-1 text-[12px] font-semibold uppercase"
          style={{ letterSpacing: "0.12em", opacity: 0.85 }}
        >
          Tasbeeh · {doneCount}/{combo.parts.length}
        </h3>
        <span className="text-[11px] opacity-60">{index}/{total}</span>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          data-no-swipe
          className="hide-scrollbar h-full overflow-y-auto px-4 pb-4 pt-3"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        >
          {combo.parts.map((part, i) => {
            const c = counts[part.id] ?? 0;
            const pct = Math.min(1, c / part.target);
            const done = c >= part.target;
            return (
              <div key={part.id}>
                {i > 0 && (
                  <div
                    className="my-3 h-px w-full"
                    style={{ background: "color-mix(in oklab, var(--card-foreground) 12%, transparent)" }}
                  />
                )}
                <div className="px-1">
                  <p
                    className="arabic font-bold"
                    style={{ fontSize: 24, lineHeight: 1.7, color: "var(--card-foreground)" }}
                  >
                    {part.arabic}
                  </p>
                  <p
                    className="mt-1 text-center italic"
                    style={{ fontSize: 12, color: "var(--translit)" }}
                  >
                    {part.transliteration}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <div
                      className="h-2 flex-1 overflow-hidden rounded-full"
                      style={{
                        background: "color-mix(in oklab, var(--card-foreground) 12%, transparent)",
                      }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${pct * 100}%`,
                          background: "var(--accent)",
                        }}
                      />
                    </div>
                    <span
                      className="shrink-0 text-[11px] font-bold tabular-nums opacity-80"
                      style={{ minWidth: 38, textAlign: "right" }}
                    >
                      {c}/{part.target}
                    </span>
                    <button
                      onClick={() => {
                        if (done) return;
                        vibrateIfEnabled(15);
                        onIncrement(part.id, part.target);
                      }}
                      disabled={done}
                      aria-label={`increment ${part.transliteration}`}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-bold transition-transform active:scale-90 disabled:opacity-50"
                      style={{
                        background: done ? "color-mix(in oklab, var(--accent) 40%, transparent)" : "var(--accent)",
                        color: "var(--accent-foreground)",
                        fontSize: 20,
                      }}
                    >
                      {done ? "✓" : "+"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 transition-opacity duration-200"
          style={{
            opacity: showBottomFade ? 1 : 0,
            background:
              "linear-gradient(to bottom, color-mix(in oklab, var(--combo-card, var(--card)) 0%, transparent), var(--combo-card, var(--card)))",
          }}
        />
      </div>

      <div className="px-5 pb-4 pt-2">
        <span
          className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{
            background: "var(--source-bg, color-mix(in oklab, var(--card-foreground) 12%, transparent))",
            color: "var(--source-fg, var(--card-foreground))",
          }}
        >
          {combo.source}
        </span>
      </div>
    </div>
  );
}
