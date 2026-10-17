import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { Portal } from "@/components/Portal";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-[28px] p-5 ${className}`}
      style={{ background: "var(--surface, var(--card))", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)", color: "var(--foreground)" }}
    >
      {children}
    </section>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <div className="label-caps" style={{ color: "var(--muted-foreground)", opacity: 1 }}>{children}</div>;
}

export function Muted({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-xs leading-relaxed ${className}`} style={{ color: "var(--muted-foreground)" }}>{children}</p>;
}

const fmt = (raw: string) => {
  const clean = raw.replace(/[^\d.]/g, "");
  const [i, ...rest] = clean.split(".");
  const dec = rest.length ? "." + rest.join("").slice(0, 2) : "";
  const int = i ? Number(i).toLocaleString("en-US") : "";
  return int + dec;
};
const toCents = (s: string) => {
  const n = parseFloat(s.replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
};
const symbolFor = (currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, currencyDisplay: "narrowSymbol" }).formatToParts(0).find((p) => p.type === "currency")?.value ?? currency;
  } catch {
    return currency;
  }
};

export function MoneyField({
  label, value, onChange, currency, helper, warnAbove,
}: { label: string; value: number; onChange: (c: number) => void; currency: string; helper?: string; warnAbove?: number }) {
  const [text, setText] = useState(value ? fmt((value / 100).toString()) : "");
  useEffect(() => {
    if (toCents(text) !== value) setText(value ? fmt((value / 100).toString()) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  const id = `f-${label.replace(/\W+/g, "-")}`;
  return (
    <label htmlFor={id} className="block">
      <span className="text-[14px] font-semibold">{label}</span>
      <div className="mt-1.5 flex min-h-[56px] items-center rounded-[18px] px-4 focus-within:ring-2 focus-within:ring-[color:var(--accent)]" style={{ background: "color-mix(in oklab, var(--foreground) 3.5%, var(--card))", border: "1px solid color-mix(in oklab, var(--foreground) 7%, transparent)" }}>
        <span className="mr-2 text-sm" style={{ color: "var(--muted-foreground)" }}>{symbolFor(currency)}</span>
        <input
          id={id}
          inputMode="decimal"
          className="w-full bg-transparent py-2 text-[20px] font-semibold tabular-nums outline-none"
          placeholder="0"
          value={text}
          onChange={(e) => {
            const f = fmt(e.target.value);
            setText(f);
            onChange(toCents(f));
          }}
        />
      </div>
      {warnAbove != null && value > warnAbove * 10 && warnAbove > 0 && (
        <span className="mt-1 block text-[11px] text-destructive">This is much higher than before. Please check for a typo.</span>
      )}
      {helper && <span className="mt-1 block text-[11px] leading-snug" style={{ color: "var(--muted-foreground)" }}>{helper}</span>}
    </label>
  );
}

export function NumberField({ label, value, onChange, suffix, step = "any" }: { label: string; value: number; onChange: (n: number) => void; suffix?: string; step?: string }) {
  return (
    <label className="block">
      <span className="text-[14px] font-semibold">{label}</span>
      <div className="mt-1.5 flex min-h-[56px] items-center rounded-[18px] px-4 focus-within:ring-2 focus-within:ring-[color:var(--accent)]" style={{ background: "color-mix(in oklab, var(--foreground) 3.5%, var(--card))", border: "1px solid color-mix(in oklab, var(--foreground) 7%, transparent)" }}>
        <input
          type="number"
          min={0}
          step={step}
          inputMode="decimal"
          className="w-full bg-transparent py-2 text-[20px] font-semibold tabular-nums outline-none"
          value={value || ""}
          placeholder="0"
          onChange={(e) => onChange(Math.max(0, parseFloat(e.target.value) || 0))}
        />
        {suffix && <span className="ml-2 text-sm" style={{ color: "var(--muted-foreground)" }}>{suffix}</span>}
      </div>
    </label>
  );
}

export function Choice<T extends string | number | boolean>({
  options, value, onChange, columns = 1,
}: { options: Array<{ value: T; label: string; sub?: string }>; value: T; onChange: (v: T) => void; columns?: number }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }} role="radiogroup">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className="flex min-h-[48px] items-center gap-3 rounded-[20px] px-4 py-3.5 text-left transition-all active:scale-[0.98]"
            style={{
              background: active ? "color-mix(in oklab, var(--accent) 16%, var(--card))" : "color-mix(in oklab, var(--foreground) 3.5%, var(--card))",
              border: `1px solid ${active ? "color-mix(in oklab, var(--accent) 70%, transparent)" : "color-mix(in oklab, var(--foreground) 6%, transparent)"}`,
              boxShadow: active ? "0 6px 18px color-mix(in oklab, var(--accent) 14%, transparent)" : "none",
              color: "var(--foreground)",
            }}
          >
            <span aria-hidden="true" className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full" style={{ border: `1.5px solid ${active ? "var(--accent)" : "color-mix(in oklab, var(--foreground) 35%, transparent)"}` }}>
              {active && <span className="h-3 w-3 rounded-full" style={{ background: "var(--accent)" }} />}
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold leading-snug">{o.label}</span>
              {o.sub && <span className="mt-0.5 block text-[12px] leading-snug" style={{ color: "var(--muted-foreground)" }}>{o.sub}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function YesNo({ question, value, onChange }: { question: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div>
      <div className="mb-2 text-sm font-semibold">{question}</div>
      <Choice columns={2} value={value} onChange={onChange} options={[{ value: true, label: "Yes" }, { value: false, label: "No" }]} />
    </div>
  );
}

export function Toggle({ label, checked, onChange, sub }: { label: string; checked: boolean; onChange: (v: boolean) => void; sub?: string }) {
  return (
    <label className="flex min-h-[44px] cursor-pointer items-start gap-3 py-1">
      <input type="checkbox" className="mt-1 h-5 w-5 shrink-0" style={{ accentColor: "var(--accent)" }} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="block text-[13px] font-semibold">{label}</span>
        {sub && <span className="block text-[11px] leading-snug" style={{ color: "var(--muted-foreground)" }}>{sub}</span>}
      </span>
    </label>
  );
}

export function PrimaryButton({ children, onClick, disabled, className = "" }: { children: ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full px-6 text-[16px] font-semibold shadow-[var(--card-shadow)] transition-transform active:scale-[0.98] disabled:opacity-50 ${className}`}
      style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, className = "" }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition-transform active:scale-[0.98] ${className}`}
      style={{ border: "1px solid color-mix(in oklab, var(--foreground) 8%, transparent)", color: "var(--foreground)", background: "color-mix(in oklab, var(--foreground) 4%, var(--card))" }}
    >
      {children}
    </button>
  );
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <Portal>
      <div className="fixed inset-0 z-[80] flex items-end justify-center" style={{ background: "color-mix(in oklab, black 45%, transparent)" }} onClick={onClose}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] p-5 pb-10"
          style={{ background: "var(--background)", color: "var(--foreground)", borderTop: "1px solid var(--border)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full" style={{ border: "1px solid var(--border)" }}>
              <X size={18} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </Portal>
  );
}

export function Collapsible({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="rounded-[20px] px-4 py-2" style={{ background: "color-mix(in oklab, var(--foreground) 3.5%, var(--card))", border: "1px solid color-mix(in oklab, var(--foreground) 6%, transparent)" }}>
      <summary className="min-h-[40px] cursor-pointer py-2 text-[14px] font-semibold">{title}</summary>
      <div className="pb-2 pt-1">{children}</div>
    </details>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "color-mix(in oklab, var(--accent) 14%, transparent)", color: "var(--accent)" }}>
      {children}
    </span>
  );
}

export function Segmented<T extends string>({ options, value, onChange, size = "lg" }: { options: Array<{ value: T; label: string; icon?: ReactNode }>; value: T; onChange: (v: T) => void; size?: "lg" | "sm" }) {
  return (
    <div role="tablist" className="grid gap-1 rounded-full p-1.5" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`, background: "var(--surface, var(--card))", border: "1px solid color-mix(in oklab, var(--foreground) 7%, transparent)", boxShadow: "var(--card-shadow)" }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} type="button" role="tab" aria-selected={active} onClick={() => onChange(o.value)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-full font-semibold motion-safe:transition-all ${size === "lg" ? "min-h-[44px] text-[14px]" : "min-h-[38px] text-[13px]"}`}
            style={{ background: active ? "var(--accent)" : "transparent", color: active ? "var(--accent-foreground)" : "var(--foreground)", boxShadow: active ? "0 6px 16px color-mix(in oklab, var(--accent) 28%, transparent)" : "none" }}>
            {o.icon}{o.label}
          </button>
        );
      })}
    </div>
  );
}
