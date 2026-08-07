// Bottom sheet for choosing which prayer's after salah adhkar to open.

import { Portal } from "@/components/Portal";
import { Check } from "lucide-react";
import { SALAH_PRAYERS, type SalahPrayer } from "@/data/salah";

type Props = {
  open: boolean;
  selected: SalahPrayer;
  progress: Record<string, { done: number; total: number }>;
  onPick: (p: SalahPrayer) => void;
  onClose: () => void;
};

export function PrayerPicker({ open, selected, progress, onPick, onClose }: Props) {
  if (!open) return null;

  return (
    <Portal>
    <div
      className="fixed inset-0 flex items-end"
      style={{ zIndex: 200 }}
      role="dialog"
      aria-label="Choose a prayer"
    >
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
      />
      <div
        className="relative w-full rounded-t-[28px] px-5 pt-3"
        style={{
          background: "var(--surface-card)",
          color: "var(--foreground)",
          paddingBottom: "calc(var(--bottom-nav-row) + env(safe-area-inset-bottom) + 20px)",
          boxShadow: "0 -20px 50px -20px rgba(0,0,0,0.4)",
          animation: "sheet-up 260ms cubic-bezier(0.22,1,0.36,1)",
          maxHeight: "82vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          className="mx-auto mb-3 rounded-full"
          style={{
            width: 40,
            height: 4,
            background: "color-mix(in oklab, var(--foreground) 18%, transparent)",
          }}
        />
        <div className="label-caps mb-2" style={{ color: "var(--muted-foreground)" }}>
          After Salah Adhkar
        </div>

        <div className="flex flex-col overflow-y-auto overscroll-contain">

          {SALAH_PRAYERS.map((p) => {
            const pr = progress[p.id] ?? { done: 0, total: 0 };
            const pct = pr.total ? Math.round((pr.done / pr.total) * 100) : 0;
            const active = p.id === selected;
            const complete = pr.total > 0 && pr.done === pr.total;
            return (
              <button
                key={p.id}
                onClick={() => onPick(p.id)}
                className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left active:scale-[0.99]"
                style={{
                  background: active
                    ? "color-mix(in oklab, var(--accent) 14%, transparent)"
                    : "transparent",
                }}
              >
                <span
                  className="flex shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{
                    width: 36,
                    height: 36,
                    background: complete
                      ? "var(--accent)"
                      : "color-mix(in oklab, var(--foreground) 8%, transparent)",
                    color: complete ? "var(--accent-foreground)" : "var(--foreground)",
                  }}
                >
                  {complete ? <Check size={16} /> : `${pct}%`}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-bold">After {p.label}</span>
                  <span className="block text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {pr.done} of {pr.total} complete
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  </Portal>
  );
}
