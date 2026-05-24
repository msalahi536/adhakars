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

  const arabicSize = display.arabicLarge ? 40 : 34;

  return (
    <div
      className="card-grad relative flex h-full w-full flex-col overflow-hidden rounded-[28px] shadow-2xl shadow-black/10"
      style={{ color: "var(--card-foreground)" }}
    >
      {/* Top row: index + special label */}
      <div className="flex items-start justify-between px-6 pt-6">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
          style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
        >
          {index}
        </span>
        <div className="text-right text-xs opacity-70">{index} / {total}</div>
      </div>

      {isSpecial && specialLabel && (
        <div className="mx-6 mt-3 rounded-full px-3 py-1.5 text-center text-[11px] font-semibold tracking-wide" style={{ background: "color-mix(in oklab, var(--accent) 25%, transparent)" }}>
          {specialLabel}
        </div>
      )}

      <div className="mt-2 px-5 text-center">
        <h3 className="text-base font-semibold opacity-90">{dhikr.title}</h3>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 pb-2 pt-3" style={{ scrollbarWidth: "none" }}>
        {dhikr.arabicMulti ? (
          <div className="space-y-5">
            {dhikr.arabicMulti.map((part) => (
              <div key={part.label} className="fade-in">
                <div className="label-caps mb-2 text-center">{part.label}</div>
                <p className="arabic" style={{ fontSize: arabicSize }}>{part.arabic}</p>
                {display.showTransliteration && (
                  <p
                    className="mt-3 text-center italic"
                    style={{ fontSize: 14, color: "var(--translit)", lineHeight: 1.55 }}
                  >
                    {part.transliteration}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <>
            <p className="arabic" style={{ fontSize: arabicSize }}>{dhikr.arabic}</p>
            {display.showTransliteration && dhikr.transliteration && (
              <p
                className="mt-4 text-center italic"
                style={{
                  fontSize: 14,
                  color: "var(--translit)",
                  lineHeight: 1.55,
                  maxHeight: expanded ? "none" : "3.2em",
                  overflow: "hidden",
                  WebkitMaskImage: expanded
                    ? "none"
                    : "linear-gradient(to bottom, #000 70%, transparent 100%)",
                }}
              >
                {dhikr.transliteration}
              </p>
            )}
          </>
        )}

        {(dhikr.translation || dhikr.commentary || dhikr.arabicMulti) && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mx-auto mt-4 block rounded-full px-4 py-1.5 text-xs font-semibold"
            style={{ background: "color-mix(in oklab, var(--accent) 22%, transparent)" }}
          >
            {expanded ? "Read less" : "Read more"}
          </button>
        )}

        <div
          className="grid transition-all duration-300 ease-in-out"
          style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div
              className="mt-4 space-y-3 rounded-2xl border p-4 text-sm"
              style={{ borderColor: "color-mix(in oklab, var(--accent) 30%, transparent)", background: "color-mix(in oklab, var(--card-foreground) 5%, transparent)" }}
            >
              {dhikr.arabicMulti ? (
                dhikr.arabicMulti.map((p) => (
                  <div key={p.label}>
                    <div className="label-caps mb-1">{p.label} — Translation</div>
                    <p className="opacity-90">{p.translation}</p>
                  </div>
                ))
              ) : (
                <div>
                  <div className="label-caps mb-1">Translation</div>
                  <p className="opacity-90">{dhikr.translation}</p>
                </div>
              )}
              {dhikr.commentary && (
                <div>
                  <div className="label-caps mb-1">Commentary</div>
                  <p className="opacity-90">{dhikr.commentary}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: source + counter */}
      <div className="px-5 pb-6 pt-3">
        <div className="mb-4 flex justify-start">
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-semibold opacity-80"
            style={{ background: "color-mix(in oklab, var(--card-foreground) 10%, transparent)" }}
          >
            {dhikr.source}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="text-xs opacity-70">
            <div className="label-caps">Target</div>
            <div className="mt-0.5 text-sm font-semibold">{dhikr.target}×</div>
          </div>

          <button
            onClick={handleTap}
            disabled={complete}
            className={`relative flex h-[112px] w-[112px] items-center justify-center rounded-full ${tapped ? "tap-pulse" : ""}`}
            style={{ touchAction: "manipulation" }}
            aria-label="increment counter"
          >
            <ProgressRing value={count} max={dhikr.target} size={104} stroke={9} complete={complete} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {complete ? (
                <span className="text-3xl" style={{ color: "var(--accent)" }}>✓</span>
              ) : (
                <>
                  <span className="text-3xl font-bold leading-none">{count}</span>
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

          <div className="w-12" />
        </div>
      </div>

      {complete && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          style={{ background: "color-mix(in oklab, var(--card) 0%, transparent)" }}
        >
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
