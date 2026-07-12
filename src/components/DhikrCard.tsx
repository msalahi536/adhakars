import { useEffect, useRef, useState } from "react";
import type { Dhikr } from "@/data/adhkar";
import { ProgressRing } from "./ProgressRing";
import { getDisplay, triggerHaptic } from "@/lib/theme";

type Props = {
  dhikr: Dhikr;
  count: number;
  onIncrement: () => void;
  index: number;
  total: number;
  isSpecial?: boolean;
  specialLabel?: string;
  isPersonalDua?: boolean;
};

export function DhikrCard({ dhikr, count, onIncrement, index, total, isSpecial, specialLabel, isPersonalDua }: Props) {
  const [tapped, setTapped] = useState(false);
  const [bursts, setBursts] = useState<number[]>([]);
  const [display, setDisplay] = useState(getDisplay());
  const [showBottomFade, setShowBottomFade] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const complete = count >= dhikr.target;

  useEffect(() => {
    const f = () => setDisplay(getDisplay());
    window.addEventListener("adhkar:display-update", f);
    return () => window.removeEventListener("adhkar:display-update", f);
  }, []);

  // Reset scroll on dhikr change
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setShowBottomFade(true);
  }, [dhikr.id]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
    setShowBottomFade(!atBottom);
  };

  const handleTap = () => {
    if (complete) return;
    const willComplete = count + 1 >= dhikr.target;
    triggerHaptic(willComplete ? "medium" : "light");
    setTapped(true);
    setTimeout(() => setTapped(false), 260);
    if (willComplete) {
      const id = Date.now();
      setBursts((b) => [...b, id]);
      setTimeout(() => setBursts((b) => b.filter((x) => x !== id)), 900);
    }
    onIncrement();
  };

  const totalArabicLen = dhikr.arabicMulti
    ? dhikr.arabicMulti.reduce((s, p) => s + p.arabic.length, 0)
    : dhikr.arabic.length;
  const baseArabic = display.arabicLarge ? 34 : 30;
  const arabicSize = totalArabicLen > 200 ? (display.arabicLarge ? 26 : 22) : baseArabic;

  const hasTranslation = !!(dhikr.translation || dhikr.arabicMulti);
  const hasCommentary = !!dhikr.commentary;

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden rounded-[24px]"
      style={{ background: "var(--card)", color: "var(--card-foreground)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow, 0 4px 16px rgba(0,0,0,0.08))" }}
    >
      <div className="flex items-center gap-3 px-5 pt-5">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
          style={{ background: "var(--index-badge-bg, var(--accent))", color: "var(--index-badge-fg, var(--accent-foreground))" }}
        >
          {index}
        </span>
        <h3
          className="flex-1 text-[12px] font-semibold uppercase"
          style={{ letterSpacing: "0.12em", color: "var(--card-foreground)", opacity: 0.85 }}
        >
          {dhikr.title}
        </h3>
        <span className="text-[11px] opacity-60">{index}/{total}</span>
      </div>

      {isSpecial && specialLabel && (
        <div
          className="mx-5 mt-3 rounded-full px-3 py-1.5 text-center text-[11px] font-semibold tracking-wide"
          style={{ background: "color-mix(in oklab, var(--accent) 25%, transparent)" }}
        >
          {specialLabel}
        </div>
      )}

      {/* Scrollable content area */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          data-no-swipe
          className="hide-scrollbar h-full overflow-y-auto px-5 pb-4 pt-3"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        >
          {dhikr.arabicMulti ? (
            <div className="space-y-5">
              {dhikr.arabicMulti.map((part) => (
                <div key={part.label}>
                  <div className="label-caps mb-1.5 text-center">{part.label}</div>
                  <p
                    className="arabic font-bold"
                    style={{ fontSize: arabicSize, lineHeight: 1.75, color: "var(--card-foreground)" }}
                  >
                    {part.arabic}
                  </p>
                  {display.showTransliteration && part.transliteration && (
                    <p
                      className="mt-2 text-center italic"
                      style={{ fontSize: 13, color: "var(--translit)", lineHeight: 1.55 }}
                    >
                      {part.transliteration}
                    </p>
                  )}
                  {part.translation && (
                    <p className="mt-2 text-[13px] opacity-90" style={{ lineHeight: 1.55 }}>
                      {part.translation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <>
              {dhikr.arabic && (
                <p
                  className="arabic font-bold"
                  style={{ fontSize: arabicSize, lineHeight: 1.8, color: "var(--card-foreground)" }}
                >
                  {dhikr.arabic}
                </p>
              )}
              {display.showTransliteration && dhikr.transliteration && (
                <p
                  className="mt-3 text-center italic"
                  style={{ fontSize: 13, color: "var(--translit)", lineHeight: 1.55 }}
                >
                  {dhikr.transliteration}
                </p>
              )}
            </>
          )}

          {dhikr.steps && dhikr.steps.length > 0 && (
            <div className="mt-4">
              <div className="label-caps mb-2">Physical Sunnan</div>
              <ul className="list-disc space-y-2 pl-5 text-[13px] opacity-90" style={{ lineHeight: 1.55 }}>
                {dhikr.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </div>
          )}

          {hasTranslation && dhikr.translation && !dhikr.arabicMulti && (
            <div className="mt-4">
              <div className="label-caps mb-1">Translation</div>
              <p className="text-[13px] opacity-90" style={{ lineHeight: 1.55 }}>
                {dhikr.translation}
              </p>
            </div>
          )}

          {hasCommentary && (
            <div className="mt-4">
              <div className="label-caps mb-1">Commentary</div>
              <p className="text-[13px] opacity-90" style={{ lineHeight: 1.55 }}>
                {dhikr.commentary}
              </p>
            </div>
          )}
        </div>

        {/* Bottom fade hint */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 transition-opacity duration-200"
          style={{
            opacity: showBottomFade ? 1 : 0,
            background:
              "linear-gradient(to bottom, color-mix(in oklab, var(--card) 0%, transparent), var(--card))",
          }}
        />
      </div>

      {/* Sticky footer */}
      <div className="flex items-end justify-between gap-3 px-5 pb-5 pt-2">
        <div className="flex flex-col gap-1.5">
          <span
            className="self-start rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{
              background: "var(--source-bg, color-mix(in oklab, var(--card-foreground) 12%, transparent))",
              color: "var(--source-fg, var(--card-foreground))",
            }}
          >
            {dhikr.source}
          </span>
          <div className="text-[12px] opacity-70">
            Target · <span className="font-semibold opacity-100">{dhikr.target}×</span>
          </div>
        </div>

        {isPersonalDua ? (
          <button
            onClick={handleTap}
            disabled={complete}
            className="shrink-0 rounded-full px-6 py-3 text-sm font-bold transition-transform active:scale-95 disabled:opacity-60"
            style={{
              background: "var(--accent)",
              color: "var(--accent-foreground)",
              minWidth: 104,
            }}
            aria-label="mark done"
          >
            {complete ? "✓ Done" : "Done"}
          </button>
        ) : (
          <button
            onClick={handleTap}
            disabled={complete}
            className={`relative flex h-[104px] w-[104px] shrink-0 items-center justify-center rounded-full ${tapped ? "tap-pulse" : ""}`}
            style={{ touchAction: "manipulation" }}
            aria-label="increment counter"
          >
            <ProgressRing value={count} max={dhikr.target} size={104} stroke={9} complete={complete} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {complete ? (
                <span className="text-3xl" style={{ color: "var(--accent)" }}>✓</span>
              ) : (
                <>
                  <span className="text-3xl font-bold leading-none" style={{ color: "var(--count-fg, var(--card-foreground))" }}>{count}</span>
                  <span className="mt-1 text-[10px] opacity-70">/ {dhikr.target}</span>
                </>
              )}
            </div>
            {bursts.map((b) => (
              <span
                key={b}
                className="radial-pulse pointer-events-none absolute inset-0 rounded-full"
                style={{ background: "color-mix(in oklab, var(--accent) 50%, transparent)" }}
              />
            ))}
          </button>
        )}
      </div>
    </div>
  );
}
