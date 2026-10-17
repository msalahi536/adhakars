import { useState } from "react";
import { CUSTOM_FIELDS, RULES, SCHOLAR_IDS, SCHOOL_IDS, type MadhabId } from "@/lib/zakat/rules";
import { HIJRI_MONTHS, clearZakat, currentPrices, hijriOf, money, nextDueDate, nisabGrams, type ZakatState } from "@/lib/zakat/store";
import { rescheduleZakatReminders } from "@/lib/zakat/reminders";
import { Card, Choice, Collapsible, GhostButton, Label, Muted, NumberField, PrimaryButton, Sheet, Toggle } from "./ui";

type Update = (fn: (s: ZakatState) => ZakatState) => void;

export function SchoolPicker({ s, update }: { s: ZakatState; update: Update }) {
  const pick = (id: MadhabId) => update((x) => ({ ...x, madhab: id, measurement: id === "ibnbaz" ? "ibnbaz" : x.measurement === "ibnbaz" ? "85" : x.measurement }));
  const card = (id: MadhabId, name: string, summary: string) => (
    <Choice key={id} value={s.madhab} onChange={pick} options={[{ value: id, label: name, sub: summary }]} />
  );
  return (
    <div className="space-y-2">
      {SCHOOL_IDS.map((id) => card(id, RULES[id].name, RULES[id].summary))}
      <Collapsible title="I don't follow a specific school">
        <Muted>
          People often follow the school of their local scholars or community. You can pick one of the schools above, follow a scholar's preferred view below, or choose Custom and set each ruling yourself.
        </Muted>
      </Collapsible>
      <div className="pt-2">
        <Label>Follow a scholar's preferred view (tarjih)</Label>
        <Muted className="mt-1 mb-2">
          These scholars weighed the evidence across the schools and chose specific positions. Their rulings are drawn from their published fatwa collections.
        </Muted>
        <div className="space-y-2">{SCHOLAR_IDS.map((id) => card(id, RULES[id].name, RULES[id].summary))}</div>
      </div>
      <div className="pt-2">{card("custom", "Custom", "Choose every ruling yourself.")}</div>
      {s.madhab === "custom" && <CustomRules s={s} update={update} />}
    </div>
  );
}

function CustomRules({ s, update }: { s: ZakatState; update: Update }) {
  const base = RULES.hanbali as unknown as Record<string, unknown>;
  return (
    <div className="space-y-3 pt-2">
      {CUSTOM_FIELDS.map((f) => {
        const current = (s.custom as Record<string, unknown>)[f.key] ?? base[f.key];
        return (
          <div key={f.key}>
            <div className="mb-1 text-[13px] font-semibold">{f.label}</div>
            <Choice
              value={current as string}
              onChange={(v) => update((x) => ({ ...x, custom: { ...x.custom, [f.key]: v } }))}
              options={f.options.map((o) => ({ value: o.value as string, label: o.label, sub: `Held by: ${o.heldBy}` }))}
            />
          </div>
        );
      })}
    </div>
  );
}

export function NisabPicker({ s, update }: { s: ZakatState; update: Update }) {
  const g = nisabGrams(s);
  const p = currentPrices(s);
  const gv = Math.round(g.gold * p.goldPerGram);
  const sv = Math.round(g.silver * p.silverPerGram);
  const has = p.goldPerGram > 0;
  const lower = gv <= sv ? "gold" : "silver";
  return (
    <div className="space-y-3">
      <Choice
        value={s.nisabBasis}
        onChange={(v) => update((x) => ({ ...x, nisabBasis: v }))}
        options={[
          {
            value: "lower",
            label: `Lower of the two (currently ${lower})${has ? `: ${money(Math.min(gv, sv), s.currency)}` : ""}`,
            sub: "Resolution of the Council of Senior Scholars (Saudi Arabia, no. 10, 1393 AH), the Fiqh Council of the Muslim World League, the Permanent Committee, Ibn Baz and Ibn Uthaymeen: paper money is assessed by the lower of the two nisabs because it is better for the poor.",
          },
          { value: "gold", label: `Gold nisab${has ? `: ${money(gv, s.currency)}` : ""}`, sub: `${g.gold} g of gold` },
          { value: "silver", label: `Silver nisab${has ? `: ${money(sv, s.currency)}` : ""}`, sub: `${g.silver} g of silver` },
        ]}
      />
      <Muted>Paper money did not exist in the classical books. Most contemporary scholars assess it by the lower nisab so that more reaches the poor. Some assess it by gold.</Muted>
      <Collapsible title={`Measurement standard: ${g.label}`}>
        <Choice
          value={s.measurement}
          onChange={(v) => update((x) => ({ ...x, measurement: v }))}
          options={[
            { value: "85", label: "85 g gold, 595 g silver", sub: "20 mithqal at 4.25 g, 200 dirham at 2.975 g" },
            { value: "87", label: "87.48 g gold, 612.36 g silver", sub: "Common South Asian measurement" },
            { value: "ibnbaz", label: "About 92 g gold, 644 g silver", sub: "Ibn Baz: 20 mithqal equated to 11.5 Saudi pounds; silver 140 mithqal (Permanent Committee figure)" },
            { value: "custom", label: "Custom grams" },
          ]}
        />
        {s.measurement === "custom" && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <NumberField label="Gold" suffix="g" value={s.customGold} onChange={(n) => update((x) => ({ ...x, customGold: n }))} />
            <NumberField label="Silver" suffix="g" value={s.customSilver} onChange={(n) => update((x) => ({ ...x, customSilver: n }))} />
          </div>
        )}
      </Collapsible>
    </div>
  );
}

export function DatePicker({ s, update }: { s: ZakatState; update: Update }) {
  const [unknown, setUnknown] = useState(false);
  const today = hijriOf(new Date());
  const z = s.zakatDate ?? { month: today.month, day: today.day };
  const set = (patch: Partial<{ month: number; day: number }>) => update((x) => ({ ...x, zakatDate: { ...z, ...patch } }));
  const due = s.zakatDate ? nextDueDate(s.zakatDate) : null;
  return (
    <div className="space-y-3">
      <Choice
        value={unknown}
        onChange={setUnknown}
        options={[
          { value: false, label: "I have a fixed zakat date" },
          { value: true, label: "I don't know when I first reached nisab" },
        ]}
      />
      {unknown && (
        <Muted>Choose a memorable Hijri date, for example 1 Ramadan. From now on, keep that date every lunar year.</Muted>
      )}
      <div className="grid grid-cols-[80px_1fr] gap-2">
        <label className="block">
          <span className="text-[13px] font-semibold">Day</span>
          <select className="mt-1 min-h-[48px] w-full rounded-2xl bg-transparent px-3" style={{ border: "1px solid var(--border)" }} value={z.day} onChange={(e) => set({ day: +e.target.value })}>
            {Array.from({ length: 30 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-[13px] font-semibold">Hijri month</span>
          <select className="mt-1 min-h-[48px] w-full rounded-2xl bg-transparent px-3" style={{ border: "1px solid var(--border)" }} value={z.month} onChange={(e) => set({ month: +e.target.value })}>
            {HIJRI_MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </label>
      </div>
      {due && <Muted>Next due: {due.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</Muted>}
      <Muted>The zakat year is the Hijri (lunar) year (Permanent Committee fatwa 9410: the Gregorian year is not used).</Muted>
      <Collapsible title="Advanced">
        <Toggle
          label="I can only calculate on a Gregorian date"
          checked={s.calendar === "gregorian"}
          onChange={(v) => update((x) => ({ ...x, calendar: v ? "gregorian" : "hijri" }))}
          sub="The zakat year is the Hijri year. If you calculate on the Gregorian year, the extra 11 days must be accounted for, so the rate becomes 2.577%."
        />
      </Collapsible>
    </div>
  );
}

export function Setup({ s, update }: { s: ZakatState; update: Update }) {
  const [step, setStep] = useState(0);
  const titles = ["School of thought", "Nisab for cash", "Zakat date"];
  const finish = () => {
    update((x) => ({ ...x, setupDone: true }));
    void rescheduleZakatReminders({ ...s, setupDone: true });
  };
  return (
    <Card>
      <div className="flex items-center justify-between">
        <Label>Setup {step + 1} of 3: {titles[step]}</Label>
        <button type="button" className="min-h-[44px] px-2 text-xs font-semibold underline" onClick={finish}>Skip, use defaults</button>
      </div>
      <div className="mt-3">
        {step === 0 && <SchoolPicker s={s} update={update} />}
        {step === 1 && <NisabPicker s={s} update={update} />}
        {step === 2 && <DatePicker s={s} update={update} />}
      </div>
      <div className="mt-4 flex gap-2">
        {step > 0 && <GhostButton onClick={() => setStep(step - 1)}>Back</GhostButton>}
        <PrimaryButton className="flex-1" onClick={() => (step < 2 ? setStep(step + 1) : finish())}>{step < 2 ? "Continue" : "Start"}</PrimaryButton>
      </div>
      <Muted className="mt-3">You can change all of this later in settings.</Muted>
    </Card>
  );
}

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "NZD", "SAR", "AED", "QAR", "KWD", "BHD", "OMR", "MYR", "SGD", "IDR", "PKR", "INR", "BDT", "TRY", "EGP", "MAD", "NGN", "ZAR", "KES", "JOD", "CHF", "SEK", "NOK", "DKK", "JPY", "CNY"];

export function SettingsSheet({ open, onClose, s, update }: { open: boolean; onClose: () => void; s: ZakatState; update: Update }) {
  const [q, setQ] = useState("");
  const list = CURRENCIES.filter((c) => c.toLowerCase().includes(q.toLowerCase()));
  const setReminders = (patch: Partial<ZakatState["reminders"]>) => {
    update((x) => ({ ...x, reminders: { ...x.reminders, ...patch } }));
    setTimeout(() => void rescheduleZakatReminders({ ...s, reminders: { ...s.reminders, ...patch } }), 0);
  };
  return (
    <Sheet open={open} onClose={onClose} title="Zakat settings">
      <div className="space-y-5">
        <div><Label>School or scholar</Label><div className="mt-2"><SchoolPicker s={s} update={update} /></div></div>
        <div><Label>Nisab basis</Label><div className="mt-2"><NisabPicker s={s} update={update} /></div></div>
        <div><Label>Zakat date and calendar</Label><div className="mt-2"><DatePicker s={s} update={update} /></div></div>
        <div>
          <Label>Long term debt handling</Label>
          <div className="mt-2">
            <Choice
              value={s.longTermDebt}
              onChange={(v) => update((x) => ({ ...x, longTermDebt: v }))}
              options={[
                { value: "default", label: "Follow my school" },
                { value: "full_balance", label: "Full remaining balance", sub: "Classical default for Hanafi, Maliki and Hanbali" },
                { value: "next_12_months", label: "Contemporary view: deduct only what is due within the year", sub: "A narration from Ahmad chosen by Ibn Abi Musa; also recommended by the Second Symposium on Contemporary Zakat Issues" },
              ]}
            />
          </div>
        </div>
        <div>
          <Label>Currency: {s.currency}</Label>
          <input className="mt-2 min-h-[44px] w-full rounded-2xl bg-transparent px-3 text-sm" style={{ border: "1px solid var(--border)" }} placeholder="Search currency" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search currency" />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {list.map((c) => (
              <button key={c} type="button" onClick={() => update((x) => ({ ...x, currency: c }))} className="min-h-[36px] rounded-full px-3 text-xs font-semibold" style={{ border: `1.5px solid ${c === s.currency ? "var(--accent)" : "var(--border)"}` }}>{c}</button>
            ))}
          </div>
        </div>
        <div>
          <Label>Reminders</Label>
          <Muted className="mt-1">Reminders work in the phone app once your zakat date is set.</Muted>
          <Toggle label="30 days before" checked={s.reminders.d30} onChange={(v) => setReminders({ d30: v })} />
          <Toggle label="7 days before" checked={s.reminders.d7} onChange={(v) => setReminders({ d7: v })} />
          <Toggle label="On the day" checked={s.reminders.d0} onChange={(v) => setReminders({ d0: v })} />
        </div>
        <GhostButton
          className="w-full text-destructive"
          onClick={() => {
            if (window.confirm("Clear all your zakat data from this device?")) {
              clearZakat();
              onClose();
            }
          }}
        >
          Clear all my zakat data
        </GhostButton>
        <Muted>Everything you enter stays on this device only.</Muted>
      </div>
    </Sheet>
  );
}
