/**
 * Zakat rules engine: one typed config per school or scholar preset.
 * Components and the calculator read rulings only from here.
 */

export type MadhabId = "hanafi" | "maliki" | "shafii" | "hanbali" | "ibnbaz" | "ibnuthaymeen" | "custom";

export type DebtDeduction = "all_zakatable" | "cash_gold_trade_after_offset" | "none" | "due_before_zakat_date_only";
export type ReceivableSolvent = "yearly_pay_on_receipt" | "yearly" | "one_year_on_receipt";
export type ReceivableDoubtful = "none" | "all_years_on_receipt" | "one_year_on_receipt" | "new_hawl_on_receipt";
export type CombineGoldSilver = "value" | "parts" | "none";

export interface MadhabRules {
  id: MadhabId;
  name: string;
  summary: string;
  womensWornJewelryZakatable: boolean;
  investmentJewelryZakatable: true;
  rentalJewelryZakatable: boolean;
  rentalJewelryScholarDiffers: boolean;
  brokenJewelryNotForRepairZakatable: true;
  mensGoldZakatable: true;
  mensSilverRingZakatable: boolean;
  utensilsZakatable: true;
  excessiveJewelryNote: boolean;
  combineGoldSilver: CombineGoldSilver;
  combineScholarDiffers: boolean;
  combineCashAndTradeGoods: true;
  cashNisabBasis: "lower" | "gold" | "silver";
  debtDeduction: DebtDeduction;
  longTermDebtDefault: "full_balance" | "next_12_months";
  debtsToAllahCount: boolean;
  pastUnpaidZakatIsDebt: boolean;
  receivableSolvent: ReceivableSolvent;
  receivableDoubtful: ReceivableDoubtful;
  dipBelowNisabResetsHawl: boolean;
  newIncomeJoinsHawl: "yes" | "own_hawl_joins_nisab" | "profits_only";
  advancePaymentAllowed: "up_to_two_years" | "yes" | "one_year" | "restricted";
  childWealthZakatable: boolean;
  malikiMuhtakirRule: boolean;
  tradeGoodsValuationNote: string;
  sources: string[];
  evidenceIds: Record<string, string[]>;
}

const HANBALI: MadhabRules = {
  id: "hanbali",
  name: "Hanbali",
  summary: "Personal jewelry is exempt. All debts you owe, short or long term, are deducted from your zakatable wealth.",
  womensWornJewelryZakatable: false,
  investmentJewelryZakatable: true,
  rentalJewelryZakatable: true,
  rentalJewelryScholarDiffers: false,
  brokenJewelryNotForRepairZakatable: true,
  mensGoldZakatable: true,
  mensSilverRingZakatable: false,
  utensilsZakatable: true,
  excessiveJewelryNote: true,
  combineGoldSilver: "parts",
  combineScholarDiffers: true,
  combineCashAndTradeGoods: true,
  cashNisabBasis: "lower",
  debtDeduction: "all_zakatable",
  longTermDebtDefault: "full_balance",
  debtsToAllahCount: true,
  pastUnpaidZakatIsDebt: true,
  receivableSolvent: "yearly_pay_on_receipt",
  receivableDoubtful: "all_years_on_receipt",
  dipBelowNisabResetsHawl: true,
  newIncomeJoinsHawl: "own_hawl_joins_nisab",
  advancePaymentAllowed: "up_to_two_years",
  childWealthZakatable: true,
  malikiMuhtakirRule: false,
  tradeGoodsValuationNote: "",
  sources: [
    "al-Hajjawi, Zad al-Mustaqni'",
    "Ibn Qudamah, al-Mughni and al-Kafi",
    "al-Buhuti, al-Rawd al-Murbi' and Kashshaf al-Qina'",
    "al-Mardawi, al-Insaf",
    "al-Samiri, al-Mustaw'ib",
  ],
  evidenceIds: {
    jewelry: ["jewelry-companions-muwatta"],
    debts: ["uthman-zakat-month"],
    advance: ["abbas-advance"],
  },
};

export const RULES: Record<Exclude<MadhabId, "custom">, MadhabRules> = {
  hanafi: {
    ...HANBALI,
    id: "hanafi",
    name: "Hanafi",
    summary: "All gold and silver jewelry counts. Debts owed to people are deducted.",
    womensWornJewelryZakatable: true,
    rentalJewelryZakatable: true,
    mensSilverRingZakatable: true,
    excessiveJewelryNote: false,
    combineGoldSilver: "value",
    combineScholarDiffers: false,
    debtDeduction: "all_zakatable",
    debtsToAllahCount: false,
    receivableSolvent: "yearly_pay_on_receipt",
    receivableDoubtful: "none",
    dipBelowNisabResetsHawl: false,
    newIncomeJoinsHawl: "yes",
    advancePaymentAllowed: "yes",
    childWealthZakatable: false,
    tradeGoodsValuationNote: "Trade goods are valued by whichever metal benefits the poor more.",
    sources: ["al-Marghinani, al-Hidayah", "al-Kasani, Bada'i' al-Sana'i'", "Ibn 'Abidin, Radd al-Muhtar"],
    evidenceIds: { jewelry: ["jewelry-bracelets", "jewelry-umm-salamah", "jewelry-aisha-rings"], debts: ["uthman-zakat-month"] },
  },
  maliki: {
    ...HANBALI,
    id: "maliki",
    name: "Maliki",
    summary:
      "Personal jewelry is exempt. Debts are deducted from cash and gold only if you have no spare assets to cover them.",
    rentalJewelryZakatable: false,
    excessiveJewelryNote: false,
    combineGoldSilver: "parts",
    combineScholarDiffers: false,
    debtDeduction: "cash_gold_trade_after_offset",
    debtsToAllahCount: false,
    receivableSolvent: "one_year_on_receipt",
    receivableDoubtful: "one_year_on_receipt",
    newIncomeJoinsHawl: "profits_only",
    advancePaymentAllowed: "restricted",
    malikiMuhtakirRule: true,
    sources: ["Khalil, al-Mukhtasar", "al-Dardir, al-Sharh al-Kabir with al-Dasuqi's Hashiyah", "Malik, al-Muwatta"],
  },
  shafii: {
    ...HANBALI,
    id: "shafii",
    name: "Shafi'i",
    summary: "Personal jewelry is exempt. Debts do not reduce zakat.",
    rentalJewelryZakatable: false,
    rentalJewelryScholarDiffers: true,
    combineGoldSilver: "none",
    combineScholarDiffers: false,
    debtDeduction: "none",
    debtsToAllahCount: false,
    pastUnpaidZakatIsDebt: false,
    receivableSolvent: "yearly",
    receivableDoubtful: "all_years_on_receipt",
    advancePaymentAllowed: "one_year",
    sources: [
      "al-Nawawi, Minhaj al-Talibin and al-Majmu'",
      "Ibn Hajar al-Haytami, Tuhfat al-Muhtaj",
      "al-Shirbini, Mughni al-Muhtaj",
    ],
  },
  hanbali: HANBALI,
  ibnbaz: {
    ...HANBALI,
    id: "ibnbaz",
    name: "Shaykh Ibn Baz",
    summary: "Jewelry worn or not is zakatable. Debts do not reduce zakat. Gold and silver are combined.",
    womensWornJewelryZakatable: true,
    rentalJewelryZakatable: true,
    combineGoldSilver: "parts",
    combineScholarDiffers: false,
    debtDeduction: "none",
    receivableSolvent: "yearly",
    receivableDoubtful: "new_hawl_on_receipt",
    sources: ["Majmu' Fatawa wa Maqalat Ibn Baz, vol. 14 (Zakat)", "binbaz.org.sa"],
    evidenceIds: { jewelry: ["jewelry-bracelets", "jewelry-umm-salamah", "jewelry-aisha-rings"], advance: ["abbas-advance"] },
  },
  ibnuthaymeen: {
    ...HANBALI,
    id: "ibnuthaymeen",
    name: "Shaykh Ibn Uthaymeen",
    summary:
      "Jewelry worn or not is zakatable. Debts do not reduce zakat, except a debt already due before your zakat date, which you pay first. Gold and silver are not combined.",
    womensWornJewelryZakatable: true,
    rentalJewelryZakatable: true,
    combineGoldSilver: "none",
    combineScholarDiffers: false,
    debtDeduction: "due_before_zakat_date_only",
    receivableSolvent: "yearly_pay_on_receipt",
    receivableDoubtful: "one_year_on_receipt",
    sources: ["al-Sharh al-Mumti' 'ala Zad al-Mustaqni', vol. 6", "Majmu' Fatawa wa Rasa'il Ibn Uthaymeen, vol. 18", "binothaimeen.net"],
    evidenceIds: {
      jewelry: ["jewelry-bracelets", "jewelry-umm-salamah", "jewelry-aisha-rings"],
      debts: ["uthman-zakat-month"],
      advance: ["abbas-advance"],
    },
  },
};

export const SCHOOL_IDS = ["hanafi", "maliki", "shafii", "hanbali"] as const;
export const SCHOLAR_IDS = ["ibnbaz", "ibnuthaymeen"] as const;
export const COMPARE_IDS = [...SCHOOL_IDS, ...SCHOLAR_IDS] as const;

export type CustomOverrides = Partial<Omit<MadhabRules, "id" | "name" | "summary" | "sources" | "evidenceIds">>;

export function getRules(id: MadhabId, custom?: CustomOverrides): MadhabRules {
  if (id === "custom") {
    return { ...HANBALI, ...(custom ?? {}), id: "custom", name: "Custom", summary: "Your own selection of rulings.", sources: [] };
  }
  return RULES[id];
}

/** Toggles exposed in Custom mode, with plain explanations and who holds each option. */
export const CUSTOM_FIELDS: Array<{
  key: keyof CustomOverrides;
  label: string;
  options: Array<{ value: string | boolean; label: string; heldBy: string }>;
}> = [
  {
    key: "womensWornJewelryZakatable",
    label: "Jewelry worn for personal use",
    options: [
      { value: true, label: "Zakatable", heldBy: "Hanafi, Ibn Baz, Ibn Uthaymeen" },
      { value: false, label: "Exempt", heldBy: "Maliki, Shafi'i, Hanbali" },
    ],
  },
  {
    key: "rentalJewelryZakatable",
    label: "Jewelry kept for rent",
    options: [
      { value: true, label: "Zakatable", heldBy: "Hanafi, Hanbali, Ibn Baz, Ibn Uthaymeen" },
      { value: false, label: "Exempt", heldBy: "Maliki, Shafi'i" },
    ],
  },
  {
    key: "mensSilverRingZakatable",
    label: "A man's silver ring",
    options: [
      { value: true, label: "Zakatable", heldBy: "Hanafi" },
      { value: false, label: "Exempt", heldBy: "Maliki, Shafi'i, Hanbali" },
    ],
  },
  {
    key: "combineGoldSilver",
    label: "Combining gold and silver toward nisab",
    options: [
      { value: "value", label: "By value", heldBy: "Hanafi" },
      { value: "parts", label: "By parts of each nisab", heldBy: "Maliki, Hanbali, Ibn Baz" },
      { value: "none", label: "Not combined", heldBy: "Shafi'i, Ibn Uthaymeen" },
    ],
  },
  {
    key: "debtDeduction",
    label: "Debts you owe",
    options: [
      { value: "all_zakatable", label: "Deducted from all zakatable wealth", heldBy: "Hanafi, Hanbali" },
      { value: "cash_gold_trade_after_offset", label: "Deducted after spare assets", heldBy: "Maliki" },
      { value: "none", label: "Not deducted", heldBy: "Shafi'i, Ibn Baz" },
      { value: "due_before_zakat_date_only", label: "Only debts already due", heldBy: "Ibn Uthaymeen" },
    ],
  },
  {
    key: "longTermDebtDefault",
    label: "Long term debts",
    options: [
      { value: "full_balance", label: "Full remaining balance", heldBy: "Classical Hanafi, Maliki, Hanbali" },
      { value: "next_12_months", label: "Only the next 12 months", heldBy: "Contemporary view" },
    ],
  },
  {
    key: "debtsToAllahCount",
    label: "Unpaid expiations and vows",
    options: [
      { value: true, label: "Count as debt", heldBy: "Hanbali" },
      { value: false, label: "Do not count", heldBy: "Hanafi, Maliki" },
    ],
  },
  {
    key: "receivableSolvent",
    label: "Money owed to you by someone able to pay",
    options: [
      { value: "yearly_pay_on_receipt", label: "Every year, paid when collected", heldBy: "Hanafi, Hanbali, Ibn Uthaymeen" },
      { value: "yearly", label: "Every year, even before collecting", heldBy: "Shafi'i, Ibn Baz" },
      { value: "one_year_on_receipt", label: "One year when collected", heldBy: "Maliki" },
    ],
  },
  {
    key: "receivableDoubtful",
    label: "Money owed to you that is doubtful",
    options: [
      { value: "all_years_on_receipt", label: "All past years when collected", heldBy: "Shafi'i, Hanbali" },
      { value: "one_year_on_receipt", label: "One year when collected", heldBy: "Maliki, Ibn Uthaymeen" },
      { value: "new_hawl_on_receipt", label: "A new year starts when collected", heldBy: "Hanafi, Ibn Baz" },
    ],
  },
  {
    key: "dipBelowNisabResetsHawl",
    label: "Wealth falling below nisab during the year",
    options: [
      { value: true, label: "Restarts the year", heldBy: "Maliki, Shafi'i, Hanbali" },
      { value: false, label: "Only start and end matter", heldBy: "Hanafi" },
    ],
  },
  {
    key: "childWealthZakatable",
    label: "A child's wealth",
    options: [
      { value: true, label: "Zakatable, the guardian pays", heldBy: "Maliki, Shafi'i, Hanbali" },
      { value: false, label: "Not zakatable", heldBy: "Hanafi" },
    ],
  },
];

/** Plain explanations used by the "Why?" sheet. */
export const WHY: Record<string, { text: string; evidenceIds: string[] }> = {
  "jewelry-worn-exempt": {
    text: "Jewelry a woman wears or keeps for personal wear is exempt in this view, based on reports from Companions such as Aisha and Ibn Umar.",
    evidenceIds: ["jewelry-companions-muwatta"],
  },
  "jewelry-worn-zakatable": {
    text: "All gold and silver jewelry is zakatable in this view, based on the hadith of the woman with two bracelets and similar reports.",
    evidenceIds: ["jewelry-bracelets", "jewelry-umm-salamah", "jewelry-aisha-rings"],
  },
  "jewelry-rental-exempt": {
    text: "Jewelry kept for rent is treated like personal jewelry in this view and is exempt.",
    evidenceIds: [],
  },
  "mens-silver-ring-exempt": {
    text: "A man's silver ring is permitted for personal use, so it is exempt in this view.",
    evidenceIds: [],
  },
  "not-yours": { text: "Wealth that belongs to someone else is zakat for its owner, not for you.", evidenceIds: [] },
  "muhtakir": {
    text: "In the Maliki school, goods held for a price rise are not zakated every year. Zakat for one year is paid when they are sold.",
    evidenceIds: [],
  },
  "company-pays": { text: "When the company already pays zakat on its assets, you do not pay again on these shares.", evidenceIds: ["iifa-28"] },
  "retirement-on-access": { text: "You chose to pay zakat on this money when it becomes accessible to you.", evidenceIds: [] },
  "retirement-unchosen": { text: "Choose a method for retirement accounts to include them.", evidenceIds: [] },
  "receivable-deferred": {
    text: "Zakat on this debt accrues each year, but you pay it when you collect it. You may pay it now if you wish.",
    evidenceIds: [],
  },
  "receivable-not-collected": { text: "In this view nothing is due on this debt until you collect it.", evidenceIds: [] },
  "receivable-doubtful-none": {
    text: "A doubtful debt is not zakatable in this view. When you collect it, a new year starts.",
    evidenceIds: ["ali-doubtful-debt"],
  },
  "new-income-own-year": {
    text: "New money from an outside source counts toward nisab with your wealth, but it has its own year starting the day you received it.",
    evidenceIds: [],
  },
  "new-income-separate": {
    text: "In the Maliki school, gifts and inheritance of cash start their own year and are not joined to the earlier year.",
    evidenceIds: [],
  },
  "advanced": {
    text: "Paying zakat on money whose year has not finished is advancing your zakat (ta'jil), which the majority permit.",
    evidenceIds: ["abbas-advance"],
  },
  "debts-none": { text: "In this view debts do not reduce zakat, based on the general texts.", evidenceIds: [] },
  "debts-deducted": { text: "In this view debts you owe reduce your zakatable wealth by their amount.", evidenceIds: ["uthman-zakat-month"] },
  "debts-due-only": {
    text: "Only a debt already due before your zakat date, which you will pay first, is deducted.",
    evidenceIds: ["uthman-zakat-month"],
  },
  "debts-maliki": {
    text: "Debt is first covered by your spare non zakatable assets. Only the remainder is deducted from cash, gold, silver and trade goods.",
    evidenceIds: [],
  },
};
