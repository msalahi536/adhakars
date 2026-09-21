import { BookOpen } from "lucide-react";
import { ProgressRing } from "./ProgressRing";

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
  return <p className="arabic adhkar-arabic" style={{ fontSize: size }}>{children}</p>;
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
    <span className="adhkar-source-badge">
      <BookOpen size={13} strokeWidth={1.8} />
      {source}
    </span>
  );
}

type RepeatCounterProps = {
  count: number;
  target: number;
  complete: boolean;
  tapped: boolean;
  bursts: number[];
  onClick: () => void;
};

export function RepeatCounter({ count, target, complete, tapped, bursts, onClick }: RepeatCounterProps) {
  return (
    <button
      onClick={onClick}
      disabled={complete}
      className={`adhkar-repeat-counter relative flex shrink-0 items-center justify-center rounded-full ${tapped ? "tap-pulse" : ""}`}
      aria-label="increment counter"
    >
      <ProgressRing value={count} max={target} size={88} stroke={7} complete={complete} />
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        {complete ? (
          <span className="text-3xl" style={{ color: "var(--accent)" }}>✓</span>
        ) : (
          <>
            <span className="text-[32px] font-semibold leading-none">{count}</span>
            <span className="mt-1 text-[11px] opacity-65">/ {target}</span>
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
}: {
  total: number;
  active: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="adhkar-pagination">
      {Array.from({ length: total }, (_, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
          className={index === active ? "is-active" : ""}
          aria-label={`go to ${index + 1}`}
        />
      ))}
      <IslamicOrnament size={19} />
    </div>
  );
}