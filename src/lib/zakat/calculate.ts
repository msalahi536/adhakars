import type { MadhabRules } from "./rules";

/** All money is integer cents in the base currency. */
export type Cents = number;

export type MetalType =
  | "coins"
  | "worn"
  | "investment"
  | "rental"
  | "broken"
  | "mens_gold"
  | "mens_silver_ring"
  | "utensils";

export interface MetalItem {
  id: string;
  name: string;
  metal: "gold" | "silver";
  mode: "weight" | "value";
  grams: number;
  purity: number; // 0..1
  valueCents: Cents;
  type: MetalType;
  notMine: boolean;
}

export interface Receivable {
  id: string;
  amountCents: Cents;
  kind: "loan" | "sale" | "wages" | "mahr" | "deposit";
  debtor: "solvent" | "struggling" | "denies";
  receivedThisYear: boolean;
  yearsOutstanding: number;
}

export interface Account {
  id: string;
  label: string;
  amount: Cents; // in its own currency
  currency: string;
}

export type ShareMethod = "full" | "per_share" | "company_pays";

export interface ZakatInput {
  forWhom: "self" | "child" | "care";
  cashHome: Cents;
  accounts: Account[];
  wallets: Cents;
  purposeSavings: Cents;
  foreignCash: Cents;
  hasMetals: boolean;
  metals: MetalItem[];
  hasInvestments: boolean;
  tradingStocks: Cents;
  longTermMethod: ShareMethod;
  longTermMarket: Cents;
  longTermPerShare: Cents;
  fundsMethod: ShareMethod;
  fundsMarket: Cents;
  fundsPerShare: Cents;
  retirementMethod: "" | "withdrawable" | "vested" | "on_access";
  retirementWithdrawable: Cents;
  retirementVested: Cents;
  crypto: Cents;
  inventory: Cents;
  malikiTrader: "mudir" | "muhtakir";
  businessCash: Cents;
  flipProperty: Cents;
  hasReceivables: boolean;
  receivables: Receivable[];
  debtsDueNow: Cents;
  billsOwed: Cents;
  longTermBalance: Cents;
  longTermNext12: Cents;
  pastZakat: Cents;
  kaffarah: Cents;
  malikiSpareAssets: Cents;
  confirmPayDueDebts: boolean;
  dippedBelow: "yes" | "no" | "unsure";
  backAboveDate: string;
  newMoney: Cents;
  payAllOnDate: boolean;
}

export interface Prices {
  goldPerGram: Cents; // 24k
  silverPerGram: Cents; // pure
}

export interface Settings {
  nisabBasis: "lower" | "gold" | "silver";
  goldNisabGrams: number;
  silverNisabGrams: number;
  calendar: "hijri" | "gregorian";
  longTermDebt?: "full_balance" | "next_12_months";
  /** FX: units of base currency per 1 unit of each currency. */
  fx?: Record<string, number>;
  baseCurrency?: string;
}

export interface Line {
  key: string;
  label: string;
  included: Cents;
  excluded?: Cents;
  whyKey?: string;
  note?: string;
}

export interface Result {
  status: "due" | "below_nisab" | "not_due_child" | "hawl_restarted";
  zakatCents: Cents;
  zakatableCents: Cents;
  grossCents: Cents;
  debtDeductedCents: Cents;
  nisabCents: Cents;
  nisabBasisUsed: "gold" | "silver";
  shortfallCents: Cents;
  goldGrams: number;
  silverGrams: number;
  payInGoldGrams: number;
  advancedCents: Cents;
  deferredReceivablesCents: Cents;
  lines: Line[];
  notes: string[];
  muhtakirReminder: boolean;
}

export const EMPTY_INPUT: ZakatInput = {
  forWhom: "self",
  cashHome: 0,
  accounts: [],
  wallets: 0,
  purposeSavings: 0,
  foreignCash: 0,
  hasMetals: false,
  metals: [],
  hasInvestments: false,
  tradingStocks: 0,
  longTermMethod: "full",
  longTermMarket: 0,
  longTermPerShare: 0,
  fundsMethod: "full",
  fundsMarket: 0,
  fundsPerShare: 0,
  retirementMethod: "",
  retirementWithdrawable: 0,
  retirementVested: 0,
  crypto: 0,
  inventory: 0,
  malikiTrader: "mudir",
  businessCash: 0,
  flipProperty: 0,
  hasReceivables: false,
  receivables: [],
  debtsDueNow: 0,
  billsOwed: 0,
  longTermBalance: 0,
  longTermNext12: 0,
  pastZakat: 0,
  kaffarah: 0,
  malikiSpareAssets: 0,
  confirmPayDueDebts: false,
  dippedBelow: "no",
  backAboveDate: "",
  newMoney: 0,
  payAllOnDate: false,
};

export function zakatOf(cents: Cents, calendar: "hijri" | "gregorian"): Cents {
  if (cents <= 0) return 0;
  // Round up to the cent, to the benefit of the poor.
  return calendar === "gregorian" ? Math.ceil((cents * 2577) / 100000) : Math.ceil((cents * 25) / 1000);
}

function metalIncluded(item: MetalItem, r: MadhabRules): { ok: boolean; whyKey?: string } {
  if (item.notMine) return { ok: false, whyKey: "not-yours" };
  switch (item.type) {
    case "worn":
      return r.womensWornJewelryZakatable ? { ok: true } : { ok: false, whyKey: "jewelry-worn-exempt" };
    case "rental":
      return r.rentalJewelryZakatable ? { ok: true } : { ok: false, whyKey: "jewelry-rental-exempt" };
    case "mens_silver_ring":
      return r.mensSilverRingZakatable ? { ok: true } : { ok: false, whyKey: "mens-silver-ring-exempt" };
    default:
      return { ok: true };
  }
}

export function metalValue(item: MetalItem, prices: Prices): { grams: number; value: Cents } {
  const price = item.metal === "gold" ? prices.goldPerGram : prices.silverPerGram;
  if (item.mode === "weight") {
    const grams = item.grams * item.purity;
    return { grams, value: Math.round(grams * price) };
  }
  return { grams: price > 0 ? item.valueCents / price : 0, value: item.valueCents };
}

function shareValue(method: ShareMethod, market: Cents, perShare: Cents): { value: Cents; whyKey?: string } {
  if (method === "company_pays") return { value: 0, whyKey: "company-pays" };
  if (method === "per_share") return { value: perShare };
  return { value: market };
}

function receivableAmount(rv: Receivable, r: MadhabRules): { now: Cents; deferred: Cents; whyKey?: string } {
  const years = Math.max(1, Math.floor(rv.yearsOutstanding || 1));
  const doubtful = rv.debtor !== "solvent";
  if (!doubtful) {
    switch (r.receivableSolvent) {
      case "yearly":
        return { now: rv.receivedThisYear ? rv.amountCents * years : rv.amountCents, deferred: 0 };
      case "yearly_pay_on_receipt":
        return rv.receivedThisYear
          ? { now: rv.amountCents * years, deferred: 0 }
          : { now: 0, deferred: rv.amountCents * years, whyKey: "receivable-deferred" };
      case "one_year_on_receipt":
        return rv.receivedThisYear ? { now: rv.amountCents, deferred: 0 } : { now: 0, deferred: 0, whyKey: "receivable-not-collected" };
    }
  }
  switch (r.receivableDoubtful) {
    case "all_years_on_receipt":
      return rv.receivedThisYear ? { now: rv.amountCents * years, deferred: 0 } : { now: 0, deferred: 0, whyKey: "receivable-not-collected" };
    case "one_year_on_receipt":
      return rv.receivedThisYear ? { now: rv.amountCents, deferred: 0 } : { now: 0, deferred: 0, whyKey: "receivable-not-collected" };
    default:
      return { now: 0, deferred: 0, whyKey: "receivable-doubtful-none" };
  }
}

export function calculateZakat(input: ZakatInput, rules: MadhabRules, prices: Prices, settings: Settings): Result {
  const lines: Line[] = [];
  const notes: string[] = [];
  const fx = settings.fx ?? {};
  const base = settings.baseCurrency ?? "USD";
  const toBase = (a: Account) =>
    a.currency === base || !fx[a.currency] ? a.amount : Math.round(a.amount * fx[a.currency]);

  // 1. Cash
  const cash =
    input.cashHome + input.accounts.reduce((s, a) => s + toBase(a), 0) + input.wallets + input.purposeSavings + input.foreignCash;
  lines.push({ key: "cash", label: "Cash and savings", included: cash });

  // 2. Gold and silver
  let goldGrams = 0;
  let silverGrams = 0;
  let goldVal = 0;
  let silverVal = 0;
  if (input.hasMetals) {
    for (const item of input.metals) {
      const { grams, value } = metalValue(item, prices);
      const inc = metalIncluded(item, rules);
      if (inc.ok) {
        if (item.metal === "gold") {
          goldGrams += grams;
          goldVal += value;
        } else {
          silverGrams += grams;
          silverVal += value;
        }
        lines.push({ key: `metal-${item.id}`, label: item.name || "Gold or silver item", included: value });
      } else {
        lines.push({ key: `metal-${item.id}`, label: item.name || "Gold or silver item", included: 0, excluded: value, whyKey: inc.whyKey });
      }
    }
  }

  // 3. Investments and trade goods
  let invest = 0;
  let muhtakirReminder = false;
  if (input.hasInvestments) {
    const lt = shareValue(input.longTermMethod, input.longTermMarket, input.longTermPerShare);
    const fd = shareValue(input.fundsMethod, input.fundsMarket, input.fundsPerShare);
    let retirement = 0;
    let retWhy: string | undefined;
    if (input.retirementMethod === "withdrawable") retirement = input.retirementWithdrawable;
    else if (input.retirementMethod === "vested") retirement = input.retirementVested;
    else if (input.retirementMethod === "on_access") retWhy = "retirement-on-access";
    else if (input.retirementVested || input.retirementWithdrawable) retWhy = "retirement-unchosen";
    let inventory = input.inventory;
    let invWhy: string | undefined;
    if (rules.malikiMuhtakirRule && input.malikiTrader === "muhtakir" && inventory > 0) {
      invWhy = "muhtakir";
      muhtakirReminder = true;
      inventory = 0;
    }
    invest = input.tradingStocks + lt.value + fd.value + retirement + input.crypto + inventory + input.businessCash + input.flipProperty;
    if (input.tradingStocks) lines.push({ key: "trading", label: "Stocks held for trading", included: input.tradingStocks });
    if (input.longTermMarket || input.longTermPerShare)
      lines.push({ key: "longterm", label: "Long term shares", included: lt.value, excluded: lt.value ? 0 : input.longTermMarket, whyKey: lt.whyKey });
    if (input.fundsMarket || input.fundsPerShare)
      lines.push({ key: "funds", label: "Funds", included: fd.value, excluded: fd.value ? 0 : input.fundsMarket, whyKey: fd.whyKey });
    if (input.retirementVested || input.retirementWithdrawable)
      lines.push({ key: "retirement", label: "Retirement accounts", included: retirement, excluded: retirement ? 0 : Math.max(input.retirementVested, input.retirementWithdrawable), whyKey: retWhy });
    if (input.crypto) lines.push({ key: "crypto", label: "Cryptocurrency", included: input.crypto });
    if (input.inventory)
      lines.push({ key: "inventory", label: "Business inventory", included: inventory, excluded: inventory ? 0 : input.inventory, whyKey: invWhy });
    if (input.businessCash) lines.push({ key: "bizcash", label: "Business cash and receivables", included: input.businessCash });
    if (input.flipProperty) lines.push({ key: "flip", label: "Property to resell", included: input.flipProperty });
  }

  // 4. Receivables
  let recv = 0;
  let deferredRecv = 0;
  if (input.hasReceivables) {
    input.receivables.forEach((rv, i) => {
      const a = receivableAmount(rv, rules);
      recv += a.now;
      deferredRecv += a.deferred;
      lines.push({ key: `recv-${rv.id}`, label: `Money owed to you ${i + 1}`, included: a.now, excluded: a.now ? 0 : rv.amountCents, whyKey: a.whyKey });
    });
  }

  // 6a. New income (hawl)
  let newMoneyNow = 0;
  let newMoneyNisabOnly = 0;
  let advanced = 0;
  if (input.newMoney > 0) {
    if (rules.newIncomeJoinsHawl === "yes") newMoneyNow = input.newMoney;
    else if (input.payAllOnDate) {
      newMoneyNow = input.newMoney;
      advanced = input.newMoney;
    } else if (rules.newIncomeJoinsHawl === "own_hawl_joins_nisab") newMoneyNisabOnly = input.newMoney;
    lines.push({
      key: "newmoney",
      label: "New money this year",
      included: newMoneyNow,
      excluded: newMoneyNow ? 0 : input.newMoney,
      whyKey: advanced ? "advanced" : newMoneyNow ? undefined : rules.newIncomeJoinsHawl === "profits_only" ? "new-income-separate" : "new-income-own-year",
    });
  }

  let other = cash + invest + recv + newMoneyNow;
  const gross = other + goldVal + silverVal;

  // 5. Debts
  const longTerm = (settings.longTermDebt ?? rules.longTermDebtDefault) === "next_12_months" ? input.longTermNext12 : input.longTermBalance;
  let debts = 0;
  let debtWhy = "debts-none";
  switch (rules.debtDeduction) {
    case "none":
      debts = 0;
      break;
    case "due_before_zakat_date_only":
      debts = input.confirmPayDueDebts ? input.debtsDueNow + input.billsOwed : 0;
      debtWhy = "debts-due-only";
      break;
    case "all_zakatable":
      debts =
        input.debtsDueNow + input.billsOwed + longTerm + (rules.pastUnpaidZakatIsDebt ? input.pastZakat : 0) + (rules.debtsToAllahCount ? input.kaffarah : 0);
      debtWhy = "debts-deducted";
      break;
    case "cash_gold_trade_after_offset": {
      const all = input.debtsDueNow + input.billsOwed + longTerm + (rules.pastUnpaidZakatIsDebt ? input.pastZakat : 0);
      debts = Math.max(0, all - input.malikiSpareAssets);
      debtWhy = "debts-maliki";
      break;
    }
  }
  // Apply debt to other wealth first, then silver, then gold. Never below zero.
  let remainingDebt = debts;
  const take = (v: number) => {
    const t = Math.min(v, remainingDebt);
    remainingDebt -= t;
    return v - t;
  };
  other = take(other);
  const silverAfter = take(silverVal);
  const goldAfter = take(goldVal);
  const debtDeducted = debts - remainingDebt;
  if (debts > 0 || input.debtsDueNow + input.billsOwed + input.longTermBalance > 0)
    lines.push({ key: "debts", label: "Debts deducted", included: -debtDeducted, whyKey: debtWhy });

  // 6. Nisab
  const gN = Math.round(settings.goldNisabGrams * prices.goldPerGram);
  const sN = Math.round(settings.silverNisabGrams * prices.silverPerGram);
  const basis: "gold" | "silver" = settings.nisabBasis === "lower" ? (gN <= sN ? "gold" : "silver") : settings.nisabBasis;
  const chosen = basis === "gold" ? gN : sN;
  const otherForNisab = other + newMoneyNisabOnly;
  const gG = prices.goldPerGram > 0 ? goldAfter / prices.goldPerGram : 0;
  const sG = prices.silverPerGram > 0 ? silverAfter / prices.silverPerGram : 0;

  let zakatable = 0;
  let met = false;
  if (rules.combineGoldSilver === "value") {
    met = otherForNisab + goldAfter + silverAfter >= chosen && otherForNisab + goldAfter + silverAfter > 0;
    zakatable = met ? other + goldAfter + silverAfter : 0;
  } else if (rules.combineGoldSilver === "parts") {
    const parts = gG / settings.goldNisabGrams + sG / settings.silverNisabGrams + (chosen > 0 ? otherForNisab / chosen : 0);
    met = parts >= 1 - 1e-9 && otherForNisab + goldAfter + silverAfter > 0;
    zakatable = met ? other + goldAfter + silverAfter : 0;
  } else {
    const gIn = goldAfter > 0 && goldAfter >= gN;
    const sIn = silverAfter > 0 && silverAfter >= sN;
    const oIn = otherForNisab > 0 && otherForNisab >= chosen;
    const candidates = [(gIn ? goldAfter : 0) + (sIn ? silverAfter : 0) + (oIn ? other : 0)];
    if (otherForNisab > 0 && goldAfter > 0 && !gIn && otherForNisab + goldAfter >= Math.min(gN, chosen))
      candidates.push(other + goldAfter + (sIn ? silverAfter : 0));
    if (otherForNisab > 0 && silverAfter > 0 && !sIn && otherForNisab + silverAfter >= Math.min(sN, chosen))
      candidates.push(other + silverAfter + (gIn ? goldAfter : 0));
    zakatable = Math.max(...candidates);
    met = zakatable > 0;
  }

  let status: Result["status"] = met ? "due" : "below_nisab";
  if (input.forWhom === "child" && !rules.childWealthZakatable) {
    status = "not_due_child";
    zakatable = 0;
  } else if (met && rules.dipBelowNisabResetsHawl && input.dippedBelow === "yes") {
    status = "hawl_restarted";
    zakatable = 0;
    notes.push("Your year restarted from the date your wealth went back above nisab.");
  }
  if (newMoneyNisabOnly) notes.push("New money counts toward nisab now, and its zakat is due when its own year ends.");
  if (deferredRecv) notes.push("Some money owed to you accrues zakat that you pay when you collect it.");
  if (muhtakirReminder) notes.push("Goods held for a price rise: pay zakat for one year when you sell them.");
  if (advanced && rules.advancePaymentAllowed === "restricted") notes.push("The Maliki school restricts advancing zakat to a short time before the due date.");

  const zakatCents = status === "due" ? zakatOf(zakatable, settings.calendar) : 0;
  const total = otherForNisab + goldAfter + silverAfter;
  return {
    status,
    zakatCents,
    zakatableCents: status === "due" ? zakatable : 0,
    grossCents: gross,
    debtDeductedCents: debtDeducted,
    nisabCents: chosen,
    nisabBasisUsed: basis,
    shortfallCents: status === "below_nisab" ? Math.max(0, chosen - total) : 0,
    goldGrams,
    silverGrams,
    payInGoldGrams: prices.goldPerGram > 0 ? zakatCents / prices.goldPerGram : 0,
    advancedCents: status === "due" ? advanced : 0,
    deferredReceivablesCents: deferredRecv,
    lines,
    notes,
    muhtakirReminder,
  };
}

/** Past years catch up: each later year is reduced by the zakat still owed from earlier years. */
export function catchUp(
  yearEndBalances: Cents[],
  nisabCents: Cents,
  calendar: "hijri" | "gregorian" = "hijri",
): Array<{ balance: Cents; owed: Cents; zakat: Cents }> {
  let owed = 0;
  return yearEndBalances.map((balance) => {
    const net = Math.max(0, balance - owed);
    const zakat = net >= nisabCents && net > 0 ? zakatOf(net, calendar) : 0;
    const row = { balance, owed, zakat };
    owed += zakat;
    return row;
  });
}
