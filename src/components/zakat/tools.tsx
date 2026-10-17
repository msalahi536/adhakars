import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarClock, ChevronRight, Trash2 } from "lucide-react";
import { catchUp } from "@/lib/zakat/calculate";
import { getRules } from "@/lib/zakat/rules";
import { HIJRI_MONTHS, currentPrices, daysUntil, hijriOf, loadZakat, money, nextDueDate, nisabGrams, type ZakatState } from "@/lib/zakat/store";
import { useResult } from "./results";
import { Card, Choice, GhostButton, Label, MoneyField, Muted, NumberField } from "./ui";

type Update = (fn: (s: ZakatState) => ZakatState) => void;

export function dueText(s: ZakatState): string | null {
  if (!s.zakatDate) return null;
  const due = nextDueDate(s.zakatDate);
  if (!due) return null;
  const h = hijriOf(due);
  const n = daysUntil(due);
  const label = `${s.zakatDate.day} ${HIJRI_MONTHS[s.zakatDate.month - 1]} ${h.year}`;
  return n === 0 ? `Your zakat is due today, ${label}` : `Your zakat is due in ${n} day${n === 1 ? "" : "s"}, ${label}`;
}

/** Small countdown card for the More page. Reads device storage after mount only. */
export function ZakatDueCard() {
  const [text] = useState(() => (typeof window === "undefined" ? null : dueText(loadZakat())));
  if (!text) return null;
  return (
    <Link to="/app/more/zakat" className="more-consistency-entry" aria-label="Open Zakat Calculator">
      <span className="more-consistency-icon" aria-hidden="true"><CalendarClock size={20} strokeWidth={1.8} /></span>
      <span className="min-w-0 flex-1 text-left">
        <span className="label-caps block">Zakat</span>
        <span className="mt-0.5 block text-sm font-semibold">{text}</span>
      </span>
      <ChevronRight size={17} className="shrink-0 opacity-60" aria-hidden="true" />
    </Link>
  );
}

export function Tools({ s, update, onUseHistory }: { s: ZakatState; update: Update; onUseHistory: () => void }) {
  const c = s.currency;
  const { result } = useResult(s);
  const year = hijriOf(new Date()).year;
  const paid = s.payments.filter((p) => p.hijriYear === year).reduce((a, p) => a + p.amountCents, 0);
  const p = currentPrices(s);
  const due = dueText(s);

  return (
    <div className="space-y-3">
      {due && <Card><Label>Zakat date</Label><div className="mt-1 text-sm font-semibold">{due}</div></Card>}

      <Card className="space-y-2">
        <Label>Live prices</Label>
        {s.prices && !s.manualPrices && p.goldPerGram > 0 ? (
          <Muted>Live prices: gold {money(p.goldPerGram, c)}/g, silver {money(p.silverPerGram, c)}/g, updated {new Date(s.prices.updatedAt).toLocaleString()}</Muted>
        ) : s.manualPrices ? (
          <Muted>Using your own prices.</Muted>
        ) : (
          <Muted>Live prices are not available yet.</Muted>
        )}
        <details>
          <summary className="min-h-[36px] cursor-pointer py-1.5 text-[13px] font-semibold">Enter my own price</summary>
          <div className="grid grid-cols-2 gap-2">
            <NumberField label={`Gold per g (${c})`} value={s.manualPrices?.gold ?? +(p.goldPerGram / 100).toFixed(2)} onChange={(n) => update((x) => ({ ...x, manualPrices: { gold: n, silver: x.manualPrices?.silver ?? currentPrices(x).silverPerGram / 100 } }))} />
            <NumberField label={`Silver per g (${c})`} value={s.manualPrices?.silver ?? +(p.silverPerGram / 100).toFixed(2)} onChange={(n) => update((x) => ({ ...x, manualPrices: { silver: n, gold: x.manualPrices?.gold ?? currentPrices(x).goldPerGram / 100 } }))} />
          </div>
          {s.manualPrices && <GhostButton className="mt-2" onClick={() => update((x) => ({ ...x, manualPrices: null }))}>Use live prices</GhostButton>}
        </details>
      </Card>

      <Card className="space-y-2">
        <Label>Payment log, {year} AH</Label>
        <Muted>Paid {money(paid, c)} of {money(result.zakatCents, c)}. Remaining {money(Math.max(0, result.zakatCents - paid), c)}.</Muted>
        {s.payments.map((pm) => (
          <div key={pm.id} className="flex min-h-[44px] items-center justify-between gap-2 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
            <span className="text-[13px]">{pm.date}{pm.note ? `, ${pm.note}` : ""}</span>
            <span className="flex items-center gap-2 text-[13px] font-semibold">
              {money(pm.amountCents, c)}
              <button type="button" aria-label="Delete payment" className="flex h-9 w-9 items-center justify-center" onClick={() => update((x) => ({ ...x, payments: x.payments.filter((y) => y.id !== pm.id) }))}><Trash2 size={14} /></button>
            </span>
          </div>
        ))}
        {!s.payments.length && <Muted>Record payments from the results screen.</Muted>}
      </Card>

      <Card className="space-y-2">
        <Label>Saved calculations</Label>
        {s.history.map((h) => (
          <div key={h.id} className="flex min-h-[44px] items-center justify-between gap-2 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
            <span className="text-[13px]">{h.hijriYear} AH · {getRules(h.madhab).name}<br /><span className="text-[11px] opacity-70">{new Date(h.date).toLocaleDateString()} · {money(h.zakatCents, h.currency)}</span></span>
            <span className="flex gap-1">
              <GhostButton onClick={() => { update((x) => ({ ...x, input: h.input, mode: "guided" })); onUseHistory(); }}>Start from this</GhostButton>
              <button type="button" aria-label="Delete calculation" className="flex h-11 w-9 items-center justify-center" onClick={() => update((x) => ({ ...x, history: x.history.filter((y) => y.id !== h.id) }))}><Trash2 size={14} /></button>
            </span>
          </div>
        ))}
        {!s.history.length && <Muted>Nothing saved yet.</Muted>}
      </Card>

      <CatchUp s={s} />
      <JewelryHelper s={s} />
      <Fitr s={s} update={update} />
    </div>
  );
}

function CatchUp({ s }: { s: ZakatState }) {
  const [years, setYears] = useState<number[]>([0]);
  const p = currentPrices(s);
  const g = nisabGrams(s);
  const nisab = Math.min(Math.round(g.gold * p.goldPerGram), Math.round(g.silver * p.silverPerGram));
  const rows = catchUp(years, nisab, s.calendar);
  const total = rows.reduce((a, r) => a + r.zakat, 0);
  return (
    <Card className="space-y-2">
      <Label>Missed zakat in previous years?</Label>
      <Muted>Enter your zakatable wealth at the end of each missed year, oldest first. Each year is reduced by the zakat still owed from earlier years. Uses today's nisab.</Muted>
      {years.map((v, i) => (
        <MoneyField key={i} label={`Year ${i + 1}`} currency={s.currency} value={v} onChange={(n) => setYears(years.map((y, j) => (j === i ? n : y)))} />
      ))}
      <div className="flex gap-2">
        <GhostButton onClick={() => setYears([...years, 0])}>Add year</GhostButton>
        {years.length > 1 && <GhostButton onClick={() => setYears(years.slice(0, -1))}>Remove</GhostButton>}
      </div>
      {rows.map((r, i) => <Muted key={i}>Year {i + 1}: {money(r.zakat, s.currency)}</Muted>)}
      <div className="text-sm font-bold">Total owed: {money(total, s.currency)}</div>
    </Card>
  );
}

function JewelryHelper({ s }: { s: ZakatState }) {
  const [grams, setGrams] = useState(0);
  const [k, setK] = useState(22);
  const p = currentPrices(s);
  const pure = (grams * k) / 24;
  return (
    <Card className="space-y-2">
      <Label>Jewelry helper</Label>
      <NumberField label="Weight" suffix="g" value={grams} onChange={setGrams} />
      <Choice columns={3} value={k} onChange={setK} options={[24, 22, 21, 18, 14, 10].map((x) => ({ value: x, label: `${x}k` }))} />
      <div className="text-sm font-semibold">{pure.toFixed(2)} g pure gold, about {money(Math.round(pure * p.goldPerGram), s.currency)}</div>
    </Card>
  );
}

function Fitr({ s, update }: { s: ZakatState; update: Update }) {
  const f = s.fitr;
  const set = (patch: Partial<ZakatState["fitr"]>) => update((x) => ({ ...x, fitr: { ...x.fitr, ...patch } }));
  const kg = f.people * f.kgPerSaa;
  const hanafi = s.madhab === "hanafi";
  const [money_, setMoney] = useState(false);
  return (
    <Card className="space-y-2">
      <Label>Zakat al-Fitr</Label>
      <NumberField label="People you are responsible for" step="1" value={f.people} onChange={(n) => set({ people: Math.floor(n) })} />
      <NumberField label="Weight of one saa' of your staple food" suffix="kg" value={f.kgPerSaa} onChange={(n) => set({ kgPerSaa: n })} />
      <Muted>Scholars estimate the saa' by volume, so its weight varies by food.</Muted>
      <div className="text-sm font-bold">Give {kg.toFixed(2)} kg of your staple food</div>
      <Muted>Paid before the Eid prayer, and may be given one or two days before Eid. The Maliki, Shafi'i and Hanbali schools, and Ibn Baz and Ibn Uthaymeen, require food; the Hanafi school permits its value in money.</Muted>
      {hanafi && (
        <>
          <GhostButton onClick={() => setMoney(!money_)}>Pay its value in money</GhostButton>
          {money_ && (
            <>
              <NumberField label={`Price per kg (${s.currency})`} value={f.pricePerKg} onChange={(n) => set({ pricePerKg: n })} />
              <div className="text-sm font-semibold">{money(Math.round(kg * f.pricePerKg * 100), s.currency)}</div>
            </>
          )}
        </>
      )}
    </Card>
  );
}
