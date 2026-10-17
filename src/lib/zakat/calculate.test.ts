import { describe, expect, test } from "bun:test";
import { calculateZakat, catchUp, EMPTY_INPUT, type MetalItem, type Settings, type ZakatInput } from "./calculate";
import { getRules, type MadhabId } from "./rules";

const prices = { goldPerGram: 10000, silverPerGram: 100 };
const silver: Settings = { nisabBasis: "silver", goldNisabGrams: 85, silverNisabGrams: 595, calendar: "hijri" };
const gold: Settings = { ...silver, nisabBasis: "gold" };
const $ = (d: number) => Math.round(d * 100);

const item = (p: Partial<MetalItem>): MetalItem => ({
  id: Math.random().toString(36),
  name: "item",
  metal: "gold",
  mode: "weight",
  grams: 0,
  purity: 1,
  valueCents: 0,
  type: "coins",
  notMine: false,
  ...p,
});
const run = (id: MadhabId, input: Partial<ZakatInput>, s: Settings = silver, extra: Partial<Settings> = {}) =>
  calculateZakat({ ...EMPTY_INPUT, ...input }, getRules(id), prices, { ...s, ...extra });

const s1: Partial<ZakatInput> = {
  cashHome: $(5000),
  debtsDueNow: $(2000),
  hasMetals: true,
  metals: [item({ grams: 30, type: "worn" })],
};

describe("scenario 1: cash, debt, worn jewelry", () => {
  test("Hanafi $150", () => expect(run("hanafi", s1).zakatCents).toBe($(150)));
  test("Shafi'i $125", () => expect(run("shafii", s1).zakatCents).toBe($(125)));
  test("Hanbali $75", () => expect(run("hanbali", s1).zakatCents).toBe($(75)));
  test("Maliki no spare assets $75", () => expect(run("maliki", s1).zakatCents).toBe($(75)));
  test("Maliki spare assets $2,000 offset debt, $125", () =>
    expect(run("maliki", { ...s1, malikiSpareAssets: $(2000) }).zakatCents).toBe($(125)));
});

describe("scenario 2: gold basis", () => {
  for (const id of ["hanafi", "shafii", "hanbali", "maliki"] as const)
    test(`${id} below nisab`, () => {
      const r = run(id, s1, gold);
      expect(r.zakatCents).toBe(0);
      expect(r.status).toBe("below_nisab");
    });
});

const s3: Partial<ZakatInput> = {
  hasMetals: true,
  metals: [item({ grams: 50 }), item({ metal: "silver", grams: 300 })],
};
describe("scenario 3: gold coins plus silver", () => {
  test("Hanafi $132.50", () => expect(run("hanafi", s3).zakatCents).toBe(13250));
  test("Maliki $132.50", () => expect(run("maliki", s3).zakatCents).toBe(13250));
  test("Hanbali $132.50", () => expect(run("hanbali", s3).zakatCents).toBe(13250));
  test("Shafi'i $0", () => expect(run("shafii", s3).zakatCents).toBe(0));
});

test("scenario 4: men's gold ring counts in every school, $50", () => {
  for (const id of ["hanafi", "maliki", "shafii", "hanbali", "ibnbaz", "ibnuthaymeen"] as const)
    expect(run(id, { cashHome: $(1000), hasMetals: true, metals: [item({ grams: 10, type: "mens_gold" })] }).zakatCents).toBe($(50));
});

const loan = (debtor: "solvent" | "denies"): Partial<ZakatInput> => ({
  hasReceivables: true,
  receivables: [{ id: "a", amountCents: $(1000), kind: "loan", debtor, receivedThisYear: true, yearsOutstanding: 3 }],
});
describe("scenario 5: solvent loan, 3 years, collected", () => {
  test("Hanafi 3 years", () => expect(run("hanafi", loan("solvent")).zakatCents).toBe($(75)));
  test("Hanbali 3 years", () => expect(run("hanbali", loan("solvent")).zakatCents).toBe($(75)));
  test("Shafi'i 3 years", () => expect(run("shafii", loan("solvent")).zakatCents).toBe($(75)));
  test("Maliki 1 year $25", () => expect(run("maliki", loan("solvent")).zakatCents).toBe($(25)));
});

test("scenario 6: child's savings", () => {
  expect(run("hanafi", { forWhom: "child", cashHome: $(2000) }).status).toBe("not_due_child");
  for (const id of ["maliki", "shafii", "hanbali", "ibnbaz", "ibnuthaymeen"] as const)
    expect(run(id, { forWhom: "child", cashHome: $(2000) }).zakatCents).toBe($(50));
});

test("scenario 7: Maliki muhtakir inventory excluded with reminder", () => {
  const r = run("maliki", { hasInvestments: true, inventory: $(10000), malikiTrader: "muhtakir" });
  expect(r.zakatCents).toBe(0);
  expect(r.muhtakirReminder).toBe(true);
});

describe("scenario 7b: rental jewelry", () => {
  const input = { cashHome: $(1000), hasMetals: true, metals: [item({ grams: 30, type: "rental" as const })] };
  for (const id of ["hanafi", "hanbali", "ibnbaz", "ibnuthaymeen"] as const)
    test(`${id} includes, $100`, () => expect(run(id, input).zakatCents).toBe($(100)));
  for (const id of ["maliki", "shafii"] as const) test(`${id} excludes, $25`, () => expect(run(id, input).zakatCents).toBe($(25)));
});

test("scenario 8: dip below nisab", () => {
  const input = { cashHome: $(5000), dippedBelow: "yes" as const };
  expect(run("hanafi", input).status).toBe("due");
  for (const id of ["maliki", "shafii", "hanbali", "ibnbaz", "ibnuthaymeen"] as const) expect(run(id, input).status).toBe("hawl_restarted");
});

describe("scenario 9: presets on scenario 1", () => {
  test("Ibn Baz $200", () => expect(run("ibnbaz", s1).zakatCents).toBe($(200)));
  test("Ibn Uthaymeen confirmed due debt $150", () => expect(run("ibnuthaymeen", { ...s1, confirmPayDueDebts: true }).zakatCents).toBe($(150)));
  test("Ibn Uthaymeen debt not yet due $200", () => expect(run("ibnuthaymeen", s1).zakatCents).toBe($(200)));
});

test("scenario 10: presets on scenario 3", () => {
  expect(run("ibnbaz", s3).zakatCents).toBe(13250);
  expect(run("ibnuthaymeen", s3).zakatCents).toBe(0);
});

describe("scenario 11: mortgage", () => {
  const input = { cashHome: $(20000), longTermBalance: $(150000), longTermNext12: $(12000) };
  test("Hanbali full balance $0", () => expect(run("hanbali", input).zakatCents).toBe(0));
  test("Hanbali 12 months $200", () => expect(run("hanbali", input, silver, { longTermDebt: "next_12_months" }).zakatCents).toBe($(200)));
  test("Shafi'i $500", () => expect(run("shafii", input).zakatCents).toBe($(500)));
  test("Ibn Baz $500", () => expect(run("ibnbaz", input).zakatCents).toBe($(500)));
});

test("scenario 12: kaffarah", () => {
  const input = { cashHome: $(1000), kaffarah: $(500) };
  expect(run("hanbali", input).zakatCents).toBe(0);
  expect(run("hanafi", input).zakatCents).toBe($(25));
});

test("scenario 13: Hanbali new salary", () => {
  const input = { cashHome: $(1000), newMoney: $(300) };
  expect(run("hanbali", input).zakatCents).toBe($(25));
  const adv = run("hanbali", { ...input, payAllOnDate: true });
  expect(adv.zakatCents).toBe(3250);
  expect(adv.advancedCents).toBe($(300));
});

describe("scenario 14: insolvent loan, 3 years, collected", () => {
  test("Hanbali 3 years", () => expect(run("hanbali", loan("denies")).zakatCents).toBe($(75)));
  test("Shafi'i 3 years", () => expect(run("shafii", loan("denies")).zakatCents).toBe($(75)));
  test("Maliki 1 year", () => expect(run("maliki", loan("denies")).zakatCents).toBe($(25)));
  test("Ibn Uthaymeen 1 year", () => expect(run("ibnuthaymeen", loan("denies")).zakatCents).toBe($(25)));
  test("Ibn Baz $0", () => expect(run("ibnbaz", loan("denies")).zakatCents).toBe(0));
  test("Hanafi $0", () => expect(run("hanafi", loan("denies")).zakatCents).toBe(0));
});

test("gregorian fallback uses 2.577% rounded up", () => {
  expect(run("hanafi", { cashHome: $(1000) }, { ...silver, calendar: "gregorian" }).zakatCents).toBe(2577);
});

test("catch up reduces later years by unpaid zakat", () => {
  const rows = catchUp([$(1000), $(1000)], $(595));
  expect(rows[0].zakat).toBe($(25));
  expect(rows[1].zakat).toBe(Math.ceil(($(975) * 25) / 1000));
});
