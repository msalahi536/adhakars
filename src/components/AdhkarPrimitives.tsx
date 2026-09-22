import { useRef } from "react";
import { BookOpen, Check, ChevronLeft, ChevronRight } from "lucide-react";
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
      <span className="adhkar-progress-count">{value} / {total}</span>
    </div>
  );
}

export function ArabicText({ children, size }: { children: React.ReactNode; size: number }) {
  return <p className="arabic adhkar-arabic" lang="ar" dir="rtl" style={{ fontSize: size }}>{children}</p>;
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

export function SourceBadge({ source }: { source: string }) {
  return (
    <button type="button" className="adhkar-source-badge" title={source} aria-label={source}>
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
            <span className="adhkar-counter-target">/ {target}</span>
          </>
        )}
      </span>
      {bursts.map((burst) => (
        <span key={burst} className="radial-pulse pointer-events-none absolute inset-0 rounded-full" style={{ background: "color-mix(in oklab, var(--accent) 50%, transparent)" }} />
      ))}
    </button>
  );
}

export function Pagination({
  total,
  active,
  onSelect,
  onPrevious,
  onNext,
  onScrub,
}: {
  total: number;
  active: number;
  onSelect: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onScrub: (index: number) => void;
}) {
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrubbing = useRef(false);
  const suppressClick = useRef(false);
  const lastIndex = useRef(active);

  const indexFromPointer = (clientX: number, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(0.999, (clientX - rect.left) / rect.width));
    return Math.min(total - 1, Math.floor(ratio * total));
  };

  const updateScrub = (clientX: number, element: HTMLElement) => {
    const next = indexFromPointer(clientX, element);
    if (next === lastIndex.current) return;
    lastIndex.current = next;
    onScrub(next);
    void triggerHaptic("light");
  };

  const stopScrub = (event: React.PointerEvent<HTMLDivElement>) => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
    if (scrubbing.current) event.currentTarget.releasePointerCapture(event.pointerId);
    scrubbing.current = false;
  };

  return (
    <div className="adhkar-pagination-row">
      <button type="button" className="adhkar-pagination-arrow" onClick={onPrevious} disabled={active === 0} aria-label="previous">
        <ChevronLeft size={12} strokeWidth={2} />
      </button>
      <div
        className="adhkar-pagination"
        onPointerDown={(event) => {
          lastIndex.current = active;
          const x = event.clientX;
          const element = event.currentTarget;
          holdTimer.current = setTimeout(() => {
            scrubbing.current = true;
            suppressClick.current = true;
            element.setPointerCapture(event.pointerId);
            updateScrub(x, element);
          }, 250);
        }}
        onPointerMove={(event) => {
          if (!scrubbing.current) return;
          event.preventDefault();
          updateScrub(event.clientX, event.currentTarget);
        }}
        onPointerUp={stopScrub}
        onPointerCancel={stopScrub}
        onPointerLeave={(event) => {
          if (!scrubbing.current && holdTimer.current) {
            clearTimeout(holdTimer.current);
            holdTimer.current = null;
          }
          if (scrubbing.current && event.buttons === 0) stopScrub(event);
        }}
      >
        {Array.from({ length: total }, (_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => {
              if (suppressClick.current) {
                suppressClick.current = false;
                return;
              }
              onSelect(index);
            }}
            className={index === active ? "is-active" : ""}
            aria-label={`go to ${index + 1}`}
          />
        ))}
      </div>
      <button type="button" className="adhkar-pagination-arrow" onClick={onNext} disabled={active === total - 1} aria-label="next">
        <ChevronRight size={12} strokeWidth={2} />
      </button>
    </div>
  );
}