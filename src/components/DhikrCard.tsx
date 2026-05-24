import { useEffect, useState } from "react";
import type { Dhikr } from "@/data/adhkar";
import { ProgressRing } from "./ProgressRing";
import { getDisplay } from "@/lib/theme";

type Props = {
  dhikr: Dhikr;
  count: number;
  onIncrement: () => void;
  index: number;
  total: number;
  isSpecial?: boolean;
  specialLabel?: string;
};

export function DhikrCard({ dhikr, count, onIncrement, index, total, isSpecial, specialLabel }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [tapped, setTapped] = useState(false);
  const [bursts, setBursts] = useState<number[]>([]);
  const [display, setDisplay] = useState(getDisplay());
  const complete = count >= dhikr.target;

  useEffect(() => {
    const f = () => setDisplay(getDisplay());
    window.addEventListener("adhkar:display-update", f);
    return () => window.removeEventListener("adhkar:display-update", f);
  }, []);

  // Reset expanded when dhikr changes
  useEffect(() => { setExpanded(false); }, [dhikr.id]);

  const handleTap = () => {
    if (complete) return;
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(15);
    setTapped(true);
    setTimeout(() => setTapped(false), 260);
    const willComplete = count + 1 >= dhikr.target;
    if (willComplete) {
      const id = Date.now();
      setBursts((b) => [...b, id]);
      setTimeout(() => setBursts((b) => b.filter((x) => x !== id)), 900);
    }
    onIncrement();
  };

  // Detect long text → shrink Arabic
  const totalArabicLen = dhikr.arabicMulti
    ? dhikr.arabicMulti.reduce((s, p) => s + p.arabic.length, 0)
    : dhikr.arabic.length;
  const baseArabic = display.arabicLarge ? 34 : 30;
  const arabicSize = totalArabicLen > 200 ? (display.arabicLarge ? 26 : 22) : baseArabic;

  return (
    <div
      className="card-grad relative flex h-full w-full flex-col overflow-hidden rounded-[28px] shadow-2xl shadow-black/20"
      style={{ color: "var(--card-foreground)", border: "1px solid var(--border)" }}
    >
      {/* Header strip: badge + title + index */}
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

      {/* Main content area — scrolls internally if needed */}
      <div className="relative flex min-h-0 flex-1 flex-col px-5 pt-3">
        {!expanded && (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto pr-1" style={{ scrollbarWidth: "none" }}>
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
                      {display.showTransliteration && (
                        <p
                          className="mt-2 text-center italic"
                          style={{ fontSize: 13, color: "var(--translit)", lineHeight: 1.55 }}
                        >
                          {part.transliteration}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <p
                    className="arabic font-bold"
                    style={{ fontSize: arabicSize, lineHeight: 1.8, color: "var(--card-foreground)" }}
                  >
                    {dhikr.arabic}
                  </p>
                  {display.showTransliteration && dhikr.transliteration && (
                    <p
                      className="mt-4 text-center italic"
                      style={{ fontSize: 13, color: "var(--translit)", lineHeight: 1.55 }}
                    >
                      {dhikr.transliteration}
                    </p>
                  )}
                </>
              )}
            </div>

            {(dhikr.translation || dhikr.commentary || dhikr.arabicMulti) && (
              <button
                onClick={() => setExpanded(true)}
                className="mx-auto mt-3 mb-1 block rounded-full px-4 py-1.5 text-xs font-semibold"
                style={{
                  border: "1px solid color-mix(in oklab, var(--card-foreground) 40%, transparent)",
                  color: "var(--card-foreground)",
                  background: "transparent",
                }}
              >
                Read more
              </button>
            )}
          </div>
        )}

        {expanded && (
          <div
            className="fade-in absolute inset-0 flex flex-col px-5 pt-3"
            style={{ background: "var(--card)" }}
          >
            <div className="flex items-center justify-between pb-2">
              <span className="label-caps">Details</span>
              <button
                onClick={() => setExpanded(false)}
                className="rounded-full px-3 py-1 text-[11px] font-semibold"
                style={{
                  border: "1px solid color-mix(in oklab, var(--card-foreground) 40%, transparent)",
                  color: "var(--card-foreground)",
                }}
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pb-3" style={{ scrollbarWidth: "none" }}>
              {dhikr.arabicMulti ? (
                <div className="space-y-4 text-sm">
                  {dhikr.arabicMulti.map((p) => (
                    <div key={p.label}>
                      <div className="label-caps mb-1">{p.label} — Translation</div>
                      <p className="opacity-90" style={{ lineHeight: 1.55 }}>{p.translation}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm">
                  <div className="label-caps mb-1">Translation</div>
                  <p className="opacity-90" style={{ lineHeight: 1.55 }}>{dhikr.translation}</p>
                </div>
              )}
              {dhikr.commentary && (
                <div className="mt-3 text-sm">
                  <div className="label-caps mb-1">Commentary</div>
                  <p className="opacity-90" style={{ lineHeight: 1.55 }}>{dhikr.commentary}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer: badge + target + counter */}
      <div className="flex items-end justify-between gap-3 px-5 pb-5 pt-2">
        <div className="flex flex-col gap-1.5">
          <span
            className="self-start rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{
              background: "color-mix(in oklab, var(--card-foreground) 12%, transparent)",
              color: "color-mix(in oklab, var(--card-foreground) 85%, transparent)",
            }}
          >
            {dhikr.source}
          </span>
          <div className="text-[12px] opacity-70">
            Target · <span className="font-semibold opacity-100">{dhikr.target}×</span>
          </div>
        </div>

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
                <span className="text-3xl font-bold leading-none" style={{ color: "#ffffff" }}>{count}</span>
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
      </div>
    </div>
  );
}

