import { useState } from "react";
import { ArrowLeft, ArrowRight, Plus, Trash2 } from "lucide-react";
import { EMPTY_INPUT, metalValue, type MetalItem, type MetalType, type Receivable, type ZakatInput } from "@/lib/zakat/calculate";
import { getRules } from "@/lib/zakat/rules";
import { currentPrices, money, nisabGrams, uid, type ZakatState } from "@/lib/zakat/store";
import { EvidenceList } from "./evidence";
import { Card, Choice, Collapsible, GhostButton, Label, MoneyField, Muted, NumberField, Pill, PrimaryButton, Toggle, YesNo } from "./ui";

type Update = (fn: (s: ZakatState) => ZakatState) => void;

export function quickInput(i: ZakatInput): ZakatInput {
  return {
    ...EMPTY_INPUT,
    cashHome: i.cashHome,
    hasMetals: true,
    metals: i.metals.filter((m) => m.id.startsWith("quick-")),
    hasInvestments: true,
    tradingStocks: i.tradingStocks,
    debtsDueNow: i.debtsDueNow,
    confirmPayDueDebts: true,
  };
}

const PURITY_GOLD = [
  { value: 1, label: "24k" }, { value: 22 / 24, label: "22k" }, { value: 21 / 24, label: "21k" },
  { value: 18 / 24, label: "18k" }, { value: 14 / 24, label: "14k" }, { value: 10 / 24, label: "10k" },
];
const PURITY_SILVER = [{ value: 0.999, label: ".999" }, { value: 0.925, label: ".925" }];
const UNITS = { g: 1, tola: 11.6638, ozt: 31.1035 } as const;
const TYPES: Array<{ value: MetalType; label: string }> = [
  { value: "coins", label: "Coins, bars, bullion" },
  { value: "worn", label: "Jewelry worn or kept for personal wear (women)" },
  { value: "investment", label: "Jewelry kept as savings or investment, for future needs, or as a future dowry" },
  { value: "rental", label: "Jewelry kept for rent or lending for a fee" },
  { value: "broken", label: "Broken jewelry not intended to be repaired" },
  { value: "mens_gold", label: "Men's gold item" },
  { value: "mens_silver_ring", label: "Men's silver ring" },
  { value: "utensils", label: "Gold or silver utensils or decorative items" },
];

export function QuickMode({ s, update }: { s: ZakatState; update: Update }) {
  const i = s.input;
  const set = (patch: Partial<ZakatInput>) => update((x) => ({ ...x, input: { ...x.input, ...patch } }));
  const metal = (metal: "gold" | "silver") => i.metals.find((m) => m.id === `quick-${metal}`)?.valueCents ?? 0;
  const setMetal = (metal: "gold" | "silver", v: number) => {
    const rest = i.metals.filter((m) => m.id !== `quick-${metal}`);
    const item: MetalItem = { id: `quick-${metal}`, name: metal === "gold" ? "Gold (quick entry)" : "Silver (quick entry)", metal, mode: "value", grams: 0, purity: 1, valueCents: v, type: "coins", notMine: false };
    set({ metals: v ? [...rest, item] : rest });
  };
  return (
    <Card className="space-y-3">
      <Muted>For people who already know their numbers. Uses the rules of {getRules(s.madhab, s.custom).name}.</Muted>
      <MoneyField label="Cash and savings" currency={s.currency} value={i.cashHome} onChange={(v) => set({ cashHome: v })} />
      <MoneyField label="Zakatable gold value" currency={s.currency} value={metal("gold")} onChange={(v) => setMetal("gold", v)} />
      <MoneyField label="Zakatable silver value" currency={s.currency} value={metal("silver")} onChange={(v) => setMetal("silver", v)} />
      <MoneyField label="Investments" currency={s.currency} value={i.tradingStocks} onChange={(v) => set({ tradingStocks: v })} />
      <MoneyField label="Debts due now" currency={s.currency} value={i.debtsDueNow} onChange={(v) => set({ debtsDueNow: v })} />
    </Card>
  );
}

function MetalEditor({ item, onChange, onRemove, s }: { item: MetalItem; onChange: (m: MetalItem) => void; onRemove: () => void; s: ZakatState }) {
  const [unit, setUnit] = useState<keyof typeof UNITS>("g");
  const p = currentPrices(s);
  const { grams, value } = metalValue(item, p);
  const purities = item.metal === "gold" ? PURITY_GOLD : PURITY_SILVER;
  return (
    <div className="space-y-2 rounded-2xl p-3" style={{ border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2">
        <input className="min-h-[44px] flex-1 rounded-xl bg-transparent px-2 text-sm font-semibold" style={{ border: "1px solid var(--border)" }} placeholder="Name, e.g. Wedding bangles" value={item.name} onChange={(e) => onChange({ ...item, name: e.target.value })} aria-label="Item name" />
        <button type="button" onClick={onRemove} aria-label="Remove item" className="flex h-11 w-11 items-center justify-center rounded-full" style={{ border: "1px solid var(--border)" }}><Trash2 size={16} /></button>
      </div>
      <Choice columns={2} value={item.metal} onChange={(v) => onChange({ ...item, metal: v, purity: v === "gold" ? 1 : 0.999 })} options={[{ value: "gold", label: "Gold" }, { value: "silver", label: "Silver" }]} />
      <Choice columns={2} value={item.mode} onChange={(v) => onChange({ ...item, mode: v })} options={[{ value: "weight", label: "By weight" }, { value: "value", label: "By value" }]} />
      {item.mode === "weight" ? (
        <>
          <div className="grid grid-cols-[1fr_auto] items-end gap-2">
            <NumberField label="Weight" value={+(item.grams / UNITS[unit]).toFixed(4)} onChange={(n) => onChange({ ...item, grams: n * UNITS[unit] })} />
            <select aria-label="Unit" className="min-h-[48px] rounded-2xl bg-transparent px-2" style={{ border: "1px solid var(--border)" }} value={unit} onChange={(e) => setUnit(e.target.value as keyof typeof UNITS)}>
              <option value="g">grams</option><option value="tola">tola</option><option value="ozt">troy oz</option>
            </select>
          </div>
          <div className="text-[13px] font-semibold">Purity</div>
          <div className="flex flex-wrap gap-1.5">
            {purities.map((o) => (
              <button key={o.label} type="button" onClick={() => onChange({ ...item, purity: o.value })} className="min-h-[36px] rounded-full px-3 text-xs font-semibold" style={{ border: `1.5px solid ${Math.abs(item.purity - o.value) < 1e-6 ? "var(--accent)" : "var(--border)"}` }}>{o.label}</button>
            ))}
          </div>
          <NumberField label="Custom purity" suffix="%" value={+(item.purity * 100).toFixed(2)} onChange={(n) => onChange({ ...item, purity: Math.min(100, n) / 100 })} />
          <Muted>{grams.toFixed(2)} g pure, about {money(value, s.currency)}</Muted>
        </>
      ) : (
        <MoneyField label="Value" currency={s.currency} value={item.valueCents} onChange={(v) => onChange({ ...item, valueCents: v })} />
      )}
      <label className="block">
        <span className="text-[13px] font-semibold">Type</span>
        <select className="mt-1 min-h-[48px] w-full rounded-2xl bg-transparent px-3 text-sm" style={{ border: "1px solid var(--border)" }} value={item.type} onChange={(e) => onChange({ ...item, type: e.target.value as MetalType })}>
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </label>
      <Choice columns={2} value={item.notMine} onChange={(v) => onChange({ ...item, notMine: v })} options={[{ value: false, label: "Mine" }, { value: true, label: "Someone else's" }]} />
      {item.notMine && <Muted>This is excluded. Zakat on it is owed by its owner.</Muted>}
    </div>
  );
}

export const GUIDED_STEPS = ["who", "cash", "metals", "investments", "receivables", "debts", "timing", "review"] as const;
export type GuidedStep = (typeof GUIDED_STEPS)[number];
export const STEP_TITLES: Record<GuidedStep, string> = {
  who: "Who is this for", cash: "Cash and savings", metals: "Gold and silver", investments: "Investments and business",
  receivables: "Money owed to you", debts: "Debts and liabilities", timing: "Timing and new income (hawl)", review: "Review",
};

export function GuidedStepView({ step, s, update, goto }: { step: GuidedStep; s: ZakatState; update: Update; goto: (st: GuidedStep) => void }) {
  const i = s.input;
  const r = getRules(s.madhab, s.custom);
  const set = (patch: Partial<ZakatInput>) => update((x) => ({ ...x, input: { ...x.input, ...patch } }));
  const c = s.currency;
  const p = currentPrices(s);

  if (step === "who") {
    return (
      <div className="space-y-3">
        <Choice value={i.forWhom} onChange={(v) => set({ forWhom: v })} options={[{ value: "self", label: "Myself" }, { value: "child", label: "My child" }, { value: "care", label: "Someone in my care" }]} />
        {i.forWhom === "child" && (
          <Muted>
            {r.childWealthZakatable
              ? "Zakat is due on a child's wealth in this view. The guardian pays it from the child's money."
              : "In the Hanafi school, zakat is not due on a child's wealth. You do not need to pay zakat on it."}
          </Muted>
        )}
      </div>
    );
  }

  if (step === "cash") {
    return (
      <div className="space-y-3">
        <MoneyField label="Cash at home" currency={c} value={i.cashHome} onChange={(v) => set({ cashHome: v })} />
        <Label>Checking and savings accounts</Label>
        {i.accounts.map((a, idx) => (
          <div key={a.id} className="space-y-2 rounded-2xl p-3" style={{ border: "1px solid var(--border)" }}>
            <div className="flex gap-2">
              <input className="min-h-[44px] flex-1 rounded-xl bg-transparent px-2 text-sm" style={{ border: "1px solid var(--border)" }} placeholder="Nickname" aria-label="Account nickname" value={a.label} onChange={(e) => set({ accounts: i.accounts.map((x, j) => (j === idx ? { ...x, label: e.target.value } : x)) })} />
              <input className="min-h-[44px] w-20 rounded-xl bg-transparent px-2 text-sm uppercase" style={{ border: "1px solid var(--border)" }} aria-label="Currency" maxLength={3} value={a.currency} onChange={(e) => set({ accounts: i.accounts.map((x, j) => (j === idx ? { ...x, currency: e.target.value.toUpperCase() } : x)) })} />
              <button type="button" aria-label="Remove account" className="flex h-11 w-11 items-center justify-center rounded-full" style={{ border: "1px solid var(--border)" }} onClick={() => set({ accounts: i.accounts.filter((_, j) => j !== idx) })}><Trash2 size={16} /></button>
            </div>
            <MoneyField label="Balance" currency={a.currency || c} value={a.amount} onChange={(v) => set({ accounts: i.accounts.map((x, j) => (j === idx ? { ...x, amount: v } : x)) })} />
            {a.currency !== c && !p.fx[a.currency] && <Muted>No exchange rate yet for {a.currency}. It is counted as {c}.</Muted>}
          </div>
        ))}
        <GhostButton onClick={() => set({ accounts: [...i.accounts, { id: uid(), label: "", amount: 0, currency: c }] })}><Plus size={14} className="mr-1 inline" /> Add account</GhostButton>
        <MoneyField label="Digital wallets" helper="PayPal, Venmo, Cash App and similar" currency={c} value={i.wallets} onChange={(v) => set({ wallets: v })} />
        <MoneyField label="Money set aside for a purpose" helper="Saving for a purpose does not exempt money from zakat once it has reached nisab and a year has passed." currency={c} value={i.purposeSavings} onChange={(v) => set({ purposeSavings: v })} />
        <MoneyField label="Foreign currency held (converted)" currency={c} value={i.foreignCash} onChange={(v) => set({ foreignCash: v })} />
        <Muted>Include only money you have owned for a full lunar year, plus new money according to your school's rule on new income (see Timing).</Muted>
      </div>
    );
  }

  if (step === "metals") {
    return (
      <div className="space-y-3">
        <YesNo question="Do you own any gold or silver?" value={i.hasMetals} onChange={(v) => set({ hasMetals: v })} />
        {i.hasMetals && (
          <>
            {p.goldPerGram > 0 && <Muted>Live: gold {money(p.goldPerGram, c)}/g, silver {money(p.silverPerGram, c)}/g</Muted>}
            {i.metals.map((m, idx) => (
              <MetalEditor key={m.id} s={s} item={m} onChange={(nm) => set({ metals: i.metals.map((x, j) => (j === idx ? nm : x)) })} onRemove={() => set({ metals: i.metals.filter((_, j) => j !== idx) })} />
            ))}
            <GhostButton onClick={() => set({ metals: [...i.metals, { id: uid(), name: "", metal: "gold", mode: "weight", grams: 0, purity: 1, valueCents: 0, type: "worn", notMine: false }] })}><Plus size={14} className="mr-1 inline" /> Add item</GhostButton>
            <Muted>Gemstones and diamonds are not zakatable unless held for trade. Only enter the gold or silver weight.</Muted>
            <Muted>Zakat on jewelry can be paid from its value in money; you do not have to give the jewelry itself. Zakat is owed by the owner. A husband or relative may pay it on her behalf with her permission. (Ibn Baz)</Muted>
            {r.excessiveJewelryNote && <Muted>Jewelry beyond customary amounts is zakatable in this school.</Muted>}
          </>
        )}
      </div>
    );
  }

  if (step === "investments") {
    const method = (k: "longTermMethod" | "fundsMethod") => (
      <Choice value={i[k]} onChange={(v) => set({ [k]: v } as Partial<ZakatInput>)} options={[
        { value: "full", label: "Full market value", sub: "Simplest, most cautious" },
        { value: "per_share", label: "Zakatable assets per share", sub: "Cash + receivables + inventory per share, times shares owned" },
        { value: "company_pays", label: "Company already pays zakat", sub: "Excluded" },
      ]} />
    );
    return (
      <div className="space-y-3">
        <YesNo question="Do you have investments or a business?" value={i.hasInvestments} onChange={(v) => set({ hasInvestments: v })} />
        {i.hasInvestments && (
          <>
            <MoneyField label="Stocks and ETFs held to sell for profit" currency={c} value={i.tradingStocks} onChange={(v) => set({ tradingStocks: v })} />
            <Collapsible title="Stocks and ETFs held long term for dividends">
              <div className="space-y-2">
                {method("longTermMethod")}
                {i.longTermMethod === "per_share"
                  ? <MoneyField label="Total zakatable assets for your shares" currency={c} value={i.longTermPerShare} onChange={(v) => set({ longTermPerShare: v })} />
                  : <MoneyField label="Market value" currency={c} value={i.longTermMarket} onChange={(v) => set({ longTermMarket: v })} />}
                <Muted>Based on International Islamic Fiqh Academy Resolution 28 (3/4).</Muted>
              </div>
            </Collapsible>
            <Collapsible title="Mutual funds and index funds">
              <div className="space-y-2">
                {method("fundsMethod")}
                {i.fundsMethod === "per_share"
                  ? <MoneyField label="Total zakatable assets for your units" currency={c} value={i.fundsPerShare} onChange={(v) => set({ fundsPerShare: v })} />
                  : <MoneyField label="Market value" currency={c} value={i.fundsMarket} onChange={(v) => set({ fundsMarket: v })} />}
              </div>
            </Collapsible>
            <Collapsible title="Retirement accounts (401k, IRA, pension)">
              <div className="space-y-2">
                <Pill>Contemporary issue</Pill>
                <MoneyField label="Value you could withdraw today after penalties and taxes" currency={c} value={i.retirementWithdrawable} onChange={(v) => set({ retirementWithdrawable: v })} />
                <MoneyField label="Full vested balance" currency={c} value={i.retirementVested} onChange={(v) => set({ retirementVested: v })} />
                <div className="text-[13px] font-semibold">Choose a method</div>
                <Choice value={i.retirementMethod} onChange={(v) => set({ retirementMethod: v })} options={[
                  { value: "withdrawable", label: "Value I could withdraw today" },
                  { value: "vested", label: "Full vested balance" },
                  { value: "on_access", label: "Pay when the money becomes accessible" },
                ]} />
              </div>
            </Collapsible>
            <MoneyField label="Cryptocurrency" helper="Contemporary issue. Held as currency or for trading: market value. Classical schools did not address it." currency={c} value={i.crypto} onChange={(v) => set({ crypto: v })} />
            <MoneyField label="Business inventory (sale value)" currency={c} value={i.inventory} onChange={(v) => set({ inventory: v })} />
            {r.malikiMuhtakirRule && i.inventory > 0 && (
              <div>
                <div className="mb-2 text-[13px] font-semibold">Do you trade continuously (buying and selling all year), or are you holding goods to sell when prices rise?</div>
                <Choice value={i.malikiTrader} onChange={(v) => set({ malikiTrader: v })} options={[
                  { value: "mudir", label: "Continuous trader", sub: "Value all inventory every year" },
                  { value: "muhtakir", label: "Holding for a price rise", sub: "Zakat for one year is paid when sold" },
                ]} />
              </div>
            )}
            {r.tradeGoodsValuationNote && <Muted>{r.tradeGoodsValuationNote}</Muted>}
            <MoneyField label="Business cash and receivables" currency={c} value={i.businessCash} onChange={(v) => set({ businessCash: v })} />
            <MoneyField label="Property bought to resell" currency={c} value={i.flipProperty} onChange={(v) => set({ flipProperty: v })} />
            <Muted>Rental property: the building is not zakatable. Only saved rental income counts, which should already be in your cash.</Muted>
            <Muted>Agricultural produce and livestock are explained in Learn, not calculated here.</Muted>
          </>
        )}
      </div>
    );
  }

  if (step === "receivables") {
    const upd = (idx: number, patch: Partial<Receivable>) => set({ receivables: i.receivables.map((x, j) => (j === idx ? { ...x, ...patch } : x)) });
    const sayFor = (rv: Receivable) => {
      if (rv.debtor === "solvent") {
        return { yearly: "Zakat is due on it every year, even before you collect it.", yearly_pay_on_receipt: "Zakat accrues every year and you pay it when you collect it, for all past years.", one_year_on_receipt: "When you collect it, you pay zakat for one year only." }[r.receivableSolvent];
      }
      return { all_years_on_receipt: "When you collect it, you pay zakat for all the years it was outstanding.", one_year_on_receipt: "When you collect it, you pay zakat for one year.", none: "No zakat on it. When you collect it, a new year starts.", new_hawl_on_receipt: "No zakat on it now. When you collect it, a new year starts. Paying one year on receipt is a precaution." }[r.receivableDoubtful];
    };
    return (
      <div className="space-y-3">
        <YesNo question="Does anyone owe you money?" value={i.hasReceivables} onChange={(v) => set({ hasReceivables: v })} />
        {i.hasReceivables && (
          <>
            {i.receivables.map((rv, idx) => (
              <div key={rv.id} className="space-y-2 rounded-2xl p-3" style={{ border: "1px solid var(--border)" }}>
                <div className="flex justify-end"><button type="button" aria-label="Remove" className="flex h-11 w-11 items-center justify-center rounded-full" style={{ border: "1px solid var(--border)" }} onClick={() => set({ receivables: i.receivables.filter((_, j) => j !== idx) })}><Trash2 size={16} /></button></div>
                <MoneyField label="Amount" currency={c} value={rv.amountCents} onChange={(v) => upd(idx, { amountCents: v })} />
                <select aria-label="Type" className="min-h-[48px] w-full rounded-2xl bg-transparent px-3 text-sm" style={{ border: "1px solid var(--border)" }} value={rv.kind} onChange={(e) => upd(idx, { kind: e.target.value as Receivable["kind"] })}>
                  <option value="loan">Loan to someone</option><option value="sale">Price of goods you sold</option><option value="wages">Salary or wages owed</option><option value="mahr">Dowry (mahr) owed to you</option><option value="deposit">Deposit</option>
                </select>
                <div className="text-[13px] font-semibold">Is the debtor able and willing to pay?</div>
                <Choice value={rv.debtor} onChange={(v) => upd(idx, { debtor: v })} options={[{ value: "solvent", label: "Solvent and acknowledges" }, { value: "struggling", label: "Struggling or delaying" }, { value: "denies", label: "Denies or unlikely" }]} />
                <Toggle label="I received it this year" checked={rv.receivedThisYear} onChange={(v) => upd(idx, { receivedThisYear: v })} />
                <NumberField label="Years it was outstanding" step="1" value={rv.yearsOutstanding} onChange={(n) => upd(idx, { yearsOutstanding: Math.floor(n) })} />
                <Muted>{r.name}: {sayFor(rv)}</Muted>
                {rv.debtor === "denies" && <EvidenceList ids={["ali-doubtful-debt"]} />}
              </div>
            ))}
            <GhostButton onClick={() => set({ receivables: [...i.receivables, { id: uid(), amountCents: 0, kind: "loan", debtor: "solvent", receivedThisYear: false, yearsOutstanding: 1 }] })}><Plus size={14} className="mr-1 inline" /> Add money owed to you</GhostButton>
          </>
        )}
        <Muted>You cannot cancel a debt someone owes you and count it as your zakat. (Ibn Baz; the majority of scholars)</Muted>
      </div>
    );
  }

  if (step === "debts") {
    const intro: Record<string, string> = {
      shafii: "In the Shafi'i school, debts do not reduce zakat. You can skip this step.",
      ibnbaz: "Shaykh Ibn Baz held that debts do not reduce zakat, based on the general texts. Paying your debts before your zakat date is still encouraged.",
      ibnuthaymeen: "Shaykh Ibn Uthaymeen held that debts do not reduce zakat, except a debt that became due before your zakat date: pay it first, then pay zakat on what remains.",
      hanbali: "In the Hanbali school, every debt you owe reduces your zakatable wealth by its amount, whether it is due now or later, and debts owed to Allah (unpaid expiations and vows) count the same way. If what remains is below nisab, no zakat is due.",
      hanafi: "In the Hanafi school, debts owed to people are deducted from your zakatable wealth.",
      maliki: "In the Maliki school, debt is first covered by your spare assets, then the remainder is deducted from cash, gold, silver and trade goods.",
      custom: "Your custom rules decide how debts are handled.",
    };
    const uth = r.debtDeduction === "due_before_zakat_date_only";
    return (
      <div className="space-y-3">
        <Muted>{intro[s.madhab]}</Muted>
        <MoneyField label="Debts due now" helper="Credit card balance, money borrowed, overdue bills" currency={c} value={i.debtsDueNow} onChange={(v) => set({ debtsDueNow: v })} />
        {uth && <Toggle label="I will pay this before or on my zakat date" checked={i.confirmPayDueDebts} onChange={(v) => set({ confirmPayDueDebts: v })} />}
        <MoneyField label="Bills currently owed" helper="Rent, utilities, taxes due" currency={c} value={i.billsOwed} onChange={(v) => set({ billsOwed: v })} />
        <MoneyField label="Long term debts: full remaining balance" helper="Mortgage, student loans, car loans" currency={c} value={i.longTermBalance} onChange={(v) => set({ longTermBalance: v })} />
        <MoneyField label="Long term debts: next 12 months of payments" currency={c} value={i.longTermNext12} onChange={(v) => set({ longTermNext12: v })} />
        {(i.longTermBalance > 0 || i.longTermNext12 > 0) && r.debtDeduction !== "none" && !uth && (
          <Muted>Full balance deducts {money(i.longTermBalance, c)}. The contemporary view deducts {money(i.longTermNext12, c)}. Change this in settings.</Muted>
        )}
        <MoneyField label="Unpaid zakat from previous years" currency={c} value={i.pastZakat} onChange={(v) => set({ pastZakat: v })} />
        {r.debtsToAllahCount && <MoneyField label="Unpaid expiations (kaffarah) and vows (nadhr)" currency={c} value={i.kaffarah} onChange={(v) => set({ kaffarah: v })} />}
        {r.debtDeduction === "cash_gold_trade_after_offset" && (
          <MoneyField label="Things you own beyond your basic needs that are not zakatable" helper="An extra car, land or a house you don't live in that isn't for sale, valuable items. In the Maliki school, debt is first covered by these spare assets, and only the remainder is deducted from your cash, gold and silver." currency={c} value={i.malikiSpareAssets} onChange={(v) => set({ malikiSpareAssets: v })} />
        )}
      </div>
    );
  }

  if (step === "timing") {
    const newText = {
      yes: "New money of the same kind is added to your existing wealth and paid on the same zakat date.",
      own_hawl_joins_nisab: "New money of the same kind from an outside source (salary, gift, inheritance) counts toward nisab with your existing wealth, but has its own year starting the day you received it. Small amounts still count because they join the nisab.",
      profits_only: "Outside gifts and inheritance of cash start their own year and are not joined to the earlier year.",
    }[r.newIncomeJoinsHawl];
    return (
      <div className="space-y-3">
        <div className="text-sm font-semibold">Did your zakatable wealth fall below nisab at any point this lunar year?</div>
        <Choice columns={3} value={i.dippedBelow} onChange={(v) => set({ dippedBelow: v })} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "unsure", label: "Not sure" }]} />
        <Muted>{r.dipBelowNisabResetsHawl ? "If it fell below, the year restarts from when it went back above nisab." : "Only the start and end of the year matter, unless wealth hit zero."}</Muted>
        {i.dippedBelow === "yes" && r.dipBelowNisabResetsHawl && (
          <label className="block">
            <span className="text-[13px] font-semibold">Date it went back above nisab</span>
            <input type="date" className="mt-1 min-h-[48px] w-full rounded-2xl bg-transparent px-3" style={{ border: "1px solid var(--border)" }} value={i.backAboveDate} onChange={(e) => set({ backAboveDate: e.target.value })} />
            {i.backAboveDate && <Muted className="mt-1">Your new zakat date is one Hijri year after this date.</Muted>}
          </label>
        )}
        <MoneyField label="Large new money received this year" helper="Gift, inheritance, sale of a personal asset, salary saved. Do not include it in Cash as well." currency={c} value={i.newMoney} onChange={(v) => set({ newMoney: v })} />
        <Muted>Profit from trade goods follows the original year (Ibn Qudamah: no known disagreement). New money of a different kind starts its own year and needs its own nisab.</Muted>
        <Muted>{r.name}: {newText}</Muted>
        <Toggle label="Pay on everything on my zakat date" checked={i.payAllOnDate} onChange={(v) => set({ payAllOnDate: v })} sub="Paying zakat on money whose year has not finished is advancing your zakat (ta'jil), which the majority permit, up to two years ahead according to the Hanbali school and the Permanent Committee. This keeps one date and is easier to track." />
        {r.advancePaymentAllowed === "restricted" && <Muted>The Maliki school restricts advancing zakat to a short time before the due date.</Muted>}
        <EvidenceList ids={["abbas-advance"]} />
      </div>
    );
  }

  // review
  const g = nisabGrams(s);
  const rows: Array<{ step: GuidedStep; label: string; value: string }> = [
    { step: "who", label: "For", value: { self: "Myself", child: "My child", care: "Someone in my care" }[i.forWhom] },
    { step: "cash", label: "Cash and savings", value: money(i.cashHome + i.accounts.reduce((a, b) => a + b.amount, 0) + i.wallets + i.purposeSavings + i.foreignCash, c) },
    { step: "metals", label: "Gold and silver", value: i.hasMetals ? `${i.metals.length} items` : "Skipped" },
    { step: "investments", label: "Investments and business", value: i.hasInvestments ? "Entered" : "Skipped" },
    { step: "receivables", label: "Money owed to you", value: i.hasReceivables ? `${i.receivables.length} entries` : "Skipped" },
    { step: "debts", label: "Debts", value: money(i.debtsDueNow + i.billsOwed + i.longTermBalance + i.pastZakat + i.kaffarah, c) },
    { step: "timing", label: "Timing", value: i.newMoney ? `New money ${money(i.newMoney, c)}` : "No new money" },
  ];
  return (
    <div className="space-y-2">
      <Muted>{r.name} · Nisab: {s.nisabBasis === "lower" ? "lower of the two" : s.nisabBasis} · {g.label}</Muted>
      {rows.map((row) => (
        <button key={row.step} type="button" onClick={() => goto(row.step)} className="flex min-h-[44px] w-full items-center justify-between rounded-2xl px-3 text-left" style={{ border: "1px solid var(--border)" }}>
          <span className="text-[13px] font-semibold">{row.label}</span>
          <span className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>{row.value}</span>
        </button>
      ))}
    </div>
  );
}

export function Guided({ s, update, onDone }: { s: ZakatState; update: Update; onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const step = GUIDED_STEPS[idx];
  const r = getRules(s.madhab, s.custom);
  const stopChild = step === "who" && s.input.forWhom === "child" && !r.childWealthZakatable;
  return (
    <div className="space-y-3">
      <Card className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Label>Step {idx + 1} of {GUIDED_STEPS.length}</Label>
            <h2 className="app-page-title mt-1" style={{ fontSize: 25, lineHeight: 1.15 }}>{STEP_TITLES[step]}</h2>
          </div>
          <span className="shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold" style={{ background: "color-mix(in oklab, var(--accent) 14%, var(--card))", color: "var(--accent)" }}>
            {Math.round(((idx + 1) / GUIDED_STEPS.length) * 100)}%
          </span>
        </div>
        <div className="flex gap-1" aria-hidden="true">
          {GUIDED_STEPS.map((st, n) => (
            <button key={st} type="button" tabIndex={-1} onClick={() => setIdx(n)} className="h-1.5 flex-1 rounded-full motion-safe:transition-all" style={{ background: n <= idx ? "var(--accent)" : "color-mix(in oklab, var(--foreground) 12%, transparent)" }} />
          ))}
        </div>
        <div className="h-px" style={{ background: "color-mix(in oklab, var(--foreground) 8%, transparent)" }} />
        <GuidedStepView step={step} s={s} update={update} goto={(st) => setIdx(GUIDED_STEPS.indexOf(st))} />
        <div className="flex gap-2 pt-2">
          {idx > 0 && (
            <button type="button" onClick={() => setIdx(idx - 1)} aria-label="Back" className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full" style={{ background: "color-mix(in oklab, var(--foreground) 5%, var(--card))", border: "1px solid color-mix(in oklab, var(--foreground) 8%, transparent)" }}>
              <ArrowLeft size={19} />
            </button>
          )}
          {!stopChild && (
            <PrimaryButton className="flex-1" onClick={() => { (step === "review" ? onDone() : setIdx(idx + 1)); window.scrollTo?.({ top: 0 }); document.querySelector(".scroll-area")?.scrollTo({ top: 0, behavior: "smooth" }); }}>
              {step === "review" ? "See my zakat" : "Continue"} <ArrowRight size={18} />
            </PrimaryButton>
          )}
        </div>
      </Card>
    </div>
  );
}
