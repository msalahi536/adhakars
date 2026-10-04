import { BookOpen, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ProgressRing } from "./ProgressRing";
import { triggerHaptic } from "@/lib/theme";

export function IslamicOrnament({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 32 32" width={size} height={size} className={className} fill="none">
      <path d="M16 2.5l3.2 4.7 5.6-.4-.4 5.6 4.7 3.2-4.7 3.2.4 5.6-5.6-.4-3.2 4.7-3.2-4.7-5.6.4.4-5.6-4.7-3.2 4.7-3.2-.4-5.6 5.6.4L16 2.5Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16 11.5l1.4 2.8 3.1.5-2.2 2.2.5 3.1-2.8-1.5-2.8 1.5.5-3.1-2.2-2.2 3.1-.5 1.4-2.8Z" fill="currentColor" />
    </svg>
  );
}

export function ProgressBar({ value, total }: { value: number; total: number }) {
  return (
    <div className="adhkar-progress-row">
      <div className="adhkar-progress-track">
        <div className="adhkar-progress-value" style={{ width: `${total ? (value / total) * 100 : 0}%` }} />
      </div>
    </div>
  );
}

export function ArabicText({ children, size, large = false }: { children: React.ReactNode; size: number; large?: boolean }) {
  return <p className={`arabic adhkar-arabic ${large ? "is-large" : ""}`} lang="ar" dir="rtl" style={{ fontSize: size }}>{children}</p>;
}

export function Transliteration({ children }: { children: React.ReactNode }) {
  return <p className="adhkar-transliteration">{children}</p>;
}

export function OrnamentalDivider() {
  return (
    <div className="adhkar-divider" aria-hidden>
      <span /><i /><span />
    </div>
  );
}

export function SourceBadge({ source, onClick }: { source: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      className="adhkar-source-badge"
      title={source}
      aria-label={`${source}. Open full details`}
      onClick={() => {
        void triggerHaptic("light");
        onClick?.();
      }}
      data-no-swipe
    >
      <BookOpen size={13} strokeWidth={1.5} />
      <span>{source}</span>
    </button>
  );
}

type RepeatCounterProps = {
  count: number;
  target: number;
  complete: boolean;
  tapped: boolean;
  bursts: number[];
  justCompleted?: boolean;
  onClick: () => void;
  size?: number;
};

export function RepeatCounter({ count, target, complete, tapped, bursts, justCompleted = false, onClick, size = 88 }: RepeatCounterProps) {
  return (
    <button
      onClick={onClick}
      disabled={complete}
      className={`adhkar-repeat-counter relative flex shrink-0 items-center justify-center rounded-full ${tapped ? "tap-pulse" : ""} ${justCompleted ? "is-completing" : ""}`}
      aria-label="increment counter"
    >
      <ProgressRing value={count} max={target} size={size} stroke={4} complete={complete} />
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        {complete ? (
          <Check className="adhkar-complete-check" size={30} strokeWidth={1.8} />
        ) : (
          <>
            <span className="adhkar-counter-value">{count}</span>
            <span className="adhkar-counter-target">of {target}</span>
          </>
        )}
      </span>
      {bursts.map((burst) => (
        <span key={burst} className="radial-pulse pointer-events-none absolute inset-0 rounded-full" style={{ background: "color-mix(in oklab, var(--accent) 50%, transparent)" }} />
      ))}
    </button>
  );
}

const HINT_KEY = "adhkar:hint-pagination-v2";

export function Pagination({
  total,
  active,
  onSelect,
  onPrevious,
  onNext,
  onScrub,
  hideSelector = false,
}: {
  total: number;
  active: number;
  onSelect: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onScrub: (index: number) => void;
  hideSelector?: boolean;
}) {
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const activeRef = useRef(active);
  activeRef.current = active;
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopHold = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  useEffect(() => stopHold, []);
  useEffect(() => {
    import("@capacitor/core")
      .then(({ Capacitor }) => setIsAndroid(Capacitor.getPlatform() === "android" || /Android/i.test(navigator.userAgent)))
      .catch(() => setIsAndroid(/Android/i.test(navigator.userAgent)));
  }, []);

  const startHold = (dir: 1 | -1) => {
    stopHold();
    dismissHint();
    const step = (delay: number) => {
      holdTimerRef.current = setTimeout(() => {
        const next = activeRef.current + dir;
        if (next < 0 || next > total - 1) {
          stopHold();
          return;
        }
        onScrub(next);
        void triggerHaptic("light");
        // Accelerate: 340ms → 240ms → 150ms → 100ms floor
        step(Math.max(100, Math.round(delay * 0.7)));
      }, delay);
    };
    step(380);
  };

  const finishScrubbing = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsScrubbing(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    try { if (localStorage.getItem(HINT_KEY) !== "1") setShowHint(true); } catch { /* ignore */ }
  }, []);
  const dismissHint = () => {
    if (!showHint) return;
    setShowHint(false);
    try { localStorage.setItem(HINT_KEY, "1"); } catch { /* ignore */ }
  };

  return (
    <div className="adhkar-pagination-row">
      {showHint && !hideSelector && (
        <div className="adhkar-pagination-hint" role="status">
          Hold me down to quickly move through cards or go back to the beginning
        </div>
      )}
      <button
        type="button"
        className="adhkar-pagination-arrow"
        data-no-swipe
        onClick={() => {
          onPrevious();
          void triggerHaptic("light");
        }}
        onPointerDown={() => startHold(-1)}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
        onContextMenu={(event) => event.preventDefault()}
        aria-label="previous"
      >
        <ChevronLeft size={14} strokeWidth={1.8} />
      </button>
      {!hideSelector && (
        <div
          className={`adhkar-pagination ${isAndroid ? "is-android" : ""} ${isScrubbing ? "is-scrubbing" : ""} ${showHint && !isScrubbing ? "is-hinting" : ""}`}
          data-no-swipe
          onContextMenu={(event) => event.preventDefault()}
          onPointerDown={(event) => {
            dismissHint();
            setIsScrubbing(true);
            event.currentTarget.setPointerCapture(event.pointerId);
            const rect = event.currentTarget.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
            onScrub(Math.round(ratio * Math.max(0, total - 1)));
            void triggerHaptic("light");
          }}
          onPointerMove={(event) => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
            const rect = event.currentTarget.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
            onScrub(Math.round(ratio * Math.max(0, total - 1)));
          }}
          onPointerUp={finishScrubbing}
          onPointerCancel={finishScrubbing}
          onLostPointerCapture={() => setIsScrubbing(false)}
        >
          <div className="adhkar-pagination-dots" aria-hidden="true">
            {Array.from({ length: total }, (_, index) => (
              <span key={index} className={index === active ? "is-active" : ""} />
            ))}
          </div>
          <input
            className="adhkar-pagination-slider"
            type="range"
            min={0}
            max={Math.max(0, total - 1)}
            step={1}
            value={active}
            aria-label={`Adhkar ${active + 1} of ${total}`}
            onChange={(event) => onSelect(Number(event.currentTarget.value))}
          />
        </div>
      )}
      <button
        type="button"
        className="adhkar-pagination-arrow"
        data-no-swipe
        onClick={() => {
          onNext();
          void triggerHaptic("light");
        }}
        onPointerDown={() => startHold(1)}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
        onContextMenu={(event) => event.preventDefault()}
        aria-label="next"
      >
        <ChevronRight size={14} strokeWidth={1.8} />
      </button>
    </div>
  );
}