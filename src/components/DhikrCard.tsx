import { useState } from "react";
import type { Dhikr } from "@/data/adhkar";
import { ProgressRing } from "./ProgressRing";

type Props = {
  dhikr: Dhikr;
  count: number;
  onIncrement: () => void;
  index: number;
};

export function DhikrCard({ dhikr, count, onIncrement, index }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [tapped, setTapped] = useState(false);
  const complete = count >= dhikr.target;

  const handleTap = () => {
    if (complete) return;
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
    setTapped(true);
    setTimeout(() => setTapped(false), 220);
    onIncrement();
  };

  return (
    <div
      className="rounded-[24px] p-5 shadow-lg shadow-black/5 transition-all"
      style={{
        background: "var(--card)",
        color: "var(--card-foreground)",
        opacity: complete ? 0.85 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
            style={{ background: "color-mix(in oklab, var(--accent) 30%, transparent)", color: "var(--accent)" }}
          >
            {index}
          </span>
          <h3 className="font-semibold text-base">{dhikr.title}</h3>
        </div>
        {complete && (
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full pop-in"
            style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
            aria-label="completed"
          >
            ✓
          </span>
        )}
      </div>

      {dhikr.arabicMulti ? (
        <div className="space-y-4">
          {dhikr.arabicMulti.map((part) => (
            <div key={part.label}>
              <div className="text-xs uppercase tracking-wider opacity-70 mb-1">{part.label}</div>
              <p className="arabic text-[26px]">{part.arabic}</p>
              <p className="italic opacity-80 text-sm mt-2">{part.transliteration}</p>
            </div>
          ))}
        </div>
      ) : (
        <>
          <p className="arabic text-[26px]">{dhikr.arabic}</p>
          <p className="italic opacity-80 text-sm mt-3">{dhikr.transliteration}</p>
        </>
      )}

      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-4 text-xs font-semibold opacity-80 underline-offset-2 hover:underline"
      >
        {expanded ? "Hide details" : "Read more"}
      </button>

      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-3 space-y-3 text-sm">
            {dhikr.arabicMulti ? (
              dhikr.arabicMulti.map((p) => (
                <div key={p.label}>
                  <div className="font-semibold opacity-80 text-xs">{p.label} — Translation</div>
                  <p className="opacity-90">{p.translation}</p>
                </div>
              ))
            ) : (
              <div>
                <div className="font-semibold opacity-80 text-xs">Translation</div>
                <p className="opacity-90">{dhikr.translation}</p>
              </div>
            )}
            <div>
              <div className="font-semibold opacity-80 text-xs">Source</div>
              <p className="opacity-90">{dhikr.source}</p>
            </div>
            {dhikr.commentary && (
              <div>
                <div className="font-semibold opacity-80 text-xs">Commentary</div>
                <p className="opacity-90">{dhikr.commentary}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="text-xs opacity-70">Target: {dhikr.target}x</div>
        <button
          onClick={handleTap}
          disabled={complete}
          className={`relative flex h-[88px] w-[88px] items-center justify-center rounded-full ${tapped ? "tap-pulse" : ""}`}
          style={{ touchAction: "manipulation" }}
          aria-label="increment counter"
        >
          <ProgressRing value={count} max={dhikr.target} complete={complete} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold leading-none">{count}</span>
            <span className="text-[10px] opacity-70 mt-0.5">/ {dhikr.target}</span>
          </div>
        </button>
      </div>
    </div>
  );
}
