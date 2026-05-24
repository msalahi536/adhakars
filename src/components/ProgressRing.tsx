type Props = {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  complete?: boolean;
};

export function ProgressRing({ value, max, size = 88, stroke = 7, complete }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / max);
  const offset = c * (1 - pct);
  return (
    <svg width={size} height={size} className="block">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="color-mix(in oklab, var(--foreground) 12%, transparent)"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={complete ? "var(--accent)" : "var(--accent)"}
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 350ms cubic-bezier(0.34,1.56,0.64,1)" }}
      />
    </svg>
  );
}
