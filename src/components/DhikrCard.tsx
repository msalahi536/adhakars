import { useEffect, useRef, useState } from "react";
import type { Dhikr } from "@/data/adhkar";
import { ListenButton } from "./ListenButton";
import { ArabicText, IslamicOrnament, OrnamentalDivider, RepeatCounter, SourceBadge, Transliteration } from "./AdhkarPrimitives";
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
  referenceLayout?: boolean;
};

export function DhikrCard({ dhikr, count, onIncrement, isSpecial, specialLabel, isPersonalDua, referenceLayout = false }: Props) {
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
    triggerHaptic(willComplete ? "double" : "heavy");
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
  const baseArabic = display.arabicLarge ? 28 : 25;
  const arabicSize = totalArabicLen > 200 ? (display.arabicLarge ? 24 : 21) : baseArabic;

  const hasTranslation = !!(dhikr.translation || dhikr.arabicMulti);
  const hasCommentary = !!dhikr.commentary;

  return (
    <div
      className={`dhikr-card relative flex w-full flex-col overflow-hidden ${referenceLayout ? "adhkar-reference-card" : "h-full"}`}
      style={{ background: "var(--card)", color: "var(--card-foreground)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow, 0 4px 16px rgba(0,0,0,0.08))" }}
    >
      <div className="adhkar-card-heading grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4">
        <ListenButton dhikrId={dhikr.id} size={50} />
        <h3
          className="min-w-0 text-[12px] font-semibold uppercase"
          style={{ letterSpacing: "0.16em", color: "var(--accent)", opacity: 1 }}
        >
          {dhikr.title}
        </h3>
        <IslamicOrnament size={30} className="adhkar-card-ornament shrink-0" />
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
      <div className={`relative min-h-0 flex-1 ${referenceLayout ? "adhkar-reference-body" : ""}`}>
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          data-no-swipe
          className={`hide-scrollbar px-7 pb-4 pt-5 ${referenceLayout ? "adhkar-reference-content" : "h-full overflow-y-auto"}`}
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        >
          {dhikr.arabicMulti ? (
            <div className="space-y-5">
              {dhikr.arabicMulti.map((part) => (
                <div key={part.label}>
                  <div className="label-caps mb-1.5 text-center">{part.label}</div>
                    <ArabicText size={arabicSize}>{part.arabic}</ArabicText>
                  {display.showTransliteration && part.transliteration && (
                    <p
                      className="mt-4 text-center italic"
                      style={{ fontSize: 14, color: "var(--translit)", lineHeight: 1.75 }}
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
                <ArabicText size={arabicSize}>{dhikr.arabic}</ArabicText>
              )}
              {dhikr.arabic && dhikr.transliteration && <OrnamentalDivider />}
              {display.showTransliteration && dhikr.transliteration && (
                <Transliteration>{dhikr.transliteration}</Transliteration>
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

          {!referenceLayout && hasTranslation && dhikr.translation && !dhikr.arabicMulti && (
            <div className="mt-4">
              <div className="label-caps mb-1">Translation</div>
              <p className="text-[13px] opacity-90" style={{ lineHeight: 1.55 }}>
                {dhikr.translation}
              </p>
            </div>
          )}

          {!referenceLayout && hasCommentary && (
            <div className="mt-4">
              <div className="label-caps mb-1">Commentary</div>
              <p className="text-[13px] opacity-90" style={{ lineHeight: 1.55 }}>
                {dhikr.commentary}
              </p>
            </div>
          )}
        </div>

        {/* Bottom fade hint */}
        {!referenceLayout && <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 transition-opacity duration-200"
          style={{
            opacity: showBottomFade ? 1 : 0,
            background:
              "linear-gradient(to bottom, color-mix(in oklab, var(--card) 0%, transparent), var(--card))",
          }}
        />}
      </div>

      {/* Sticky footer */}
      <div className="adhkar-card-footer flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <SourceBadge source={dhikr.source} />
          <div className="text-[12px] opacity-70">
            Target: <span className="font-semibold opacity-100">{dhikr.target}x</span>
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
          <RepeatCounter count={count} target={dhikr.target} complete={complete} tapped={tapped} bursts={bursts} onClick={handleTap} />
        )}
      </div>
    </div>
  );
}
