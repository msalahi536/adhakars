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
      {/* Header strip: title only (small, muted) */}
      <div className="flex items-center justify-between px-5 pt-5">
        <h3
          className="text-[13px] font-semibold uppercase opacity-70"
          style={{ letterSpacing: "0.12em" }}
        >
          {dhikr.title}
        </h3>
        <span className="text-[11px] opacity-60">{index} / {total}</span>
      </div>

      {isSpecial && specialLabel && (
        <div
          className="mx-5 mt-3 rounded-full px-3 py-1.5 text-center text-[11px] font-semibold tracking-wide"
          style={{ background: "color-mix(in oklab, var(--accent) 25%, transparent)" }}
        >
          {specialLabel}
        </div>
      )}

      {/* Main content area — fixed, with overlay expansion */}
      <div className="relative flex-1 overflow-hidden px-5 pt-3">
        {/* Default (non-expanded) view */}
        {!expanded && (
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-hidden" style={{ scrollbarWidth: "none" }}>
              {dhikr.arabicMulti ? (
                <div className="space-y-4">
                  {dhikr.arabicMulti.map((part) => (
                    <div key={part.label}>
                      <div className="label-caps mb-1.5 text-center">{part.label}</div>
                      <p
                        className="arabic font-bold"
                        style={{ fontSize: arabicSize, lineHeight: 1.7 }}
                      >
                        {part.arabic}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p
                  className="arabic font-bold"
                  style={{ fontSize: arabicSize, lineHeight: 1.75 }}
                >
                  {dhikr.arabic}
                </p>
              )}

              {display.showTransliteration && !dhikr.arabicMulti && dhikr.transliteration && (
                <div
                  className="relative mt-4"
                  style={{
                    maxHeight: "2.8em",
                    overflow: "hidden",
                    WebkitMaskImage: "linear-gradient(to bottom, #000 55%, transparent 100%)",
                    maskImage: "linear-gradient(to bottom, #000 55%, transparent 100%)",
                  }}
                >
                  <p
                    className="text-center italic"
                    style={{ fontSize: 13, color: "var(--translit)", lineHeight: 1.45 }}
                  >
                    {dhikr.transliteration}
                  </p>
                </div>
              )}
            </div>

            {(dhikr.translation || dhikr.commentary || dhikr.arabicMulti) && (
              <button
                onClick={() => setExpanded(true)}
                className="mx-auto mt-2 mb-1 block rounded-full px-4 py-1.5 text-xs font-semibold"
                style={{ background: "color-mix(in oklab, var(--accent) 22%, transparent)" }}
              >
                Read more
              </button>
            )}
          </div>
        )}

        {/* Expanded overlay — scrolls inside the card */}
        {expanded && (
          <div
            className="fade-in absolute inset-0 flex flex-col rounded-b-[24px] px-5 pt-3"
            style={{ background: "var(--card)" }}
          >
            <div className="flex items-center justify-between pb-2">
              <span className="label-caps">Details</span>
              <button
                onClick={() => setExpanded(false)}
                className="rounded-full px-3 py-1 text-[11px] font-semibold"
                style={{ background: "color-mix(in oklab, var(--accent) 22%, transparent)" }}
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pb-3" style={{ scrollbarWidth: "none" }}>
              {dhikr.arabicMulti ? (
                <div className="space-y-4 text-sm">
                  {dhikr.arabicMulti.map((p) => (
                    <div key={p.label}>
                      <div className="label-caps mb-1">{p.label}</div>
                      <p className="arabic font-bold" style={{ fontSize: arabicSize, lineHeight: 1.7 }}>{p.arabic}</p>
                      <p className="mt-2 italic" style={{ color: "var(--translit)", fontSize: 12.5, lineHeight: 1.5 }}>{p.transliteration}</p>
                      <p className="mt-2 opacity-90" style={{ fontSize: 13 }}>{p.translation}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  {dhikr.transliteration && (
                    <div>
                      <div className="label-caps mb-1">Transliteration</div>
                      <p className="italic" style={{ color: "var(--translit)", fontSize: 13, lineHeight: 1.55 }}>{dhikr.transliteration}</p>
                    </div>
                  )}
                  <div>
                    <div className="label-caps mb-1">Translation</div>
                    <p className="opacity-90" style={{ lineHeight: 1.55 }}>{dhikr.translation}</p>
                  </div>
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

      {complete && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span
            className="pop-in text-[180px] font-black"
            style={{ color: "color-mix(in oklab, var(--accent) 18%, transparent)" }}
          >
            ✓
          </span>
        </div>
      )}
    </div>
  );
}
