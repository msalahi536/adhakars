import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";

type Props = {
  dhikrId: string;
  size?: number;
};

export function ListenButton({ size = 32 }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const t = window.setTimeout(() => document.addEventListener("click", onDoc), 0);
    const auto = window.setTimeout(() => setOpen(false), 2400);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(auto);
      document.removeEventListener("click", onDoc);
    };
  }, [open]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen((v) => !v);
  };

  const iconSize = Math.round(size * 0.5);

  return (
    <div ref={wrapRef} className="relative shrink-0" data-no-swipe>
      <button
        type="button"
        onClick={handleClick}
        aria-label="play recitation"
        className="flex items-center justify-center rounded-full transition-transform active:scale-95"
        style={{
          width: size,
          height: size,
          background: "var(--index-badge-bg, var(--accent))",
          color: "var(--index-badge-fg, var(--accent-foreground))",
        }}
      >
        <Volume2 size={iconSize} strokeWidth={2.4} />
      </button>

      {open && (
        <div
          role="status"
          className="absolute left-[calc(100%+8px)] top-1/2 z-20 -translate-y-1/2 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-medium shadow-md"
          style={{
            background: "var(--popover, var(--card))",
            color: "var(--popover-foreground, var(--card-foreground))",
            border: "1px solid var(--border)",
            animation: "listen-pop 160ms ease-out",
          }}
        >
          <span
            aria-hidden
            className="absolute right-full top-1/2 -translate-y-1/2"
            style={{
              width: 0,
              height: 0,
              borderTop: "5px solid transparent",
              borderBottom: "5px solid transparent",
              borderRight: "6px solid var(--border)",
            }}
          />
          Audio recitations coming soon
        </div>
      )}

      <style>{`@keyframes listen-pop { from { opacity: 0; transform: translate(-4px, -50%);} to { opacity: 1; transform: translate(0, -50%);} }`}</style>
    </div>
  );
}
