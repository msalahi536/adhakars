import { useEffect, useState } from "react";
import { EMPTY_INPUT, type ZakatInput, type Settings } from "./calculate";
import type { CustomOverrides, MadhabId } from "./rules";

export const ZAKAT_KEY = "zakat_v1";
const EVENT = "zakat:update";

export type Measurement = "85" | "87" | "ibnbaz" | "custom";
export interface Payment { id: string; amountCents: number; date: string; note: string; hijriYear: number }
export interface SavedCalc { id: string; date: string; hijriYear: number; madhab: MadhabId; zakatCents: number; currency: string; input: ZakatInput }

export interface ZakatState {
  setupDone: boolean;
  madhab: MadhabId;
  custom: CustomOverrides;
  nisabBasis: "lower" | "gold" | "silver";
  measurement: Measurement;
  customGold: number;
  customSilver: number;
  zakatDate: { month: number; day: number } | null;
  calendar: "hijri" | "gregorian";
  currency: string;
  mode: "guided" | "quick";
  longTermDebt: "default" | "full_balance" | "next_12_months";
  input: ZakatInput;
  prices: { goldUsd: number; silverUsd: number; fx: Record<string, number>; updatedAt: string } | null;
  manualPrices: { gold: number; silver: number } | null; // base currency per gram, major units
  reminders: { d30: boolean; d7: boolean; d0: boolean };
  payments: Payment[];
  history: SavedCalc[];
  fitr: { people: number; kgPerSaa: number; pricePerKg: number };
}

const defaultCurrency = () => {
  try {
    const region = new Intl.Locale(navigator.language).maximize().region ?? "US";
    const map: Record<string, string> = { US: "USD", GB: "GBP", CA: "CAD", AU: "AUD", MY: "MYR", SA: "SAR", AE: "AED", PK: "PKR", IN: "INR", ID: "IDR", TR: "TRY", EG: "EGP", NG: "NGN", ZA: "ZAR", BD: "BDT", SG: "SGD", NZ: "NZD", QA: "QAR", KW: "KWD" };
    if (map[region]) return map[region];
    if (["DE", "FR", "NL", "BE", "IT", "ES", "IE", "AT", "FI", "PT"].includes(region)) return "EUR";
  } catch {
    // ignore
  }
  return "USD";
};

export const DEFAULT_STATE = (): ZakatState => ({
  setupDone: false,
  madhab: "hanbali",
  custom: {},
  nisabBasis: "lower",
  measurement: "85",
  customGold: 85,
  customSilver: 595,
  zakatDate: null,
  calendar: "hijri",
  currency: typeof navigator === "undefined" ? "USD" : defaultCurrency(),
  mode: "guided",
  longTermDebt: "default",
  input: EMPTY_INPUT,
  prices: null,
  manualPrices: null,
  reminders: { d30: true, d7: true, d0: true },
  payments: [],
  history: [],
  fitr: { people: 1, kgPerSaa: 2.5, pricePerKg: 0 },
});

export function loadZakat(): ZakatState {
  try {
    const raw = window.localStorage.getItem(ZAKAT_KEY);
    if (!raw) return DEFAULT_STATE();
    const parsed = JSON.parse(raw) as Partial<ZakatState>;
    const d = DEFAULT_STATE();
    return { ...d, ...parsed, input: { ...EMPTY_INPUT, ...(parsed.input ?? {}) }, fitr: { ...d.fitr, ...(parsed.fitr ?? {}) } };
  } catch {
    return DEFAULT_STATE();
  }
}

export function saveZakat(s: ZakatState) {
  try {
    window.localStorage.setItem(ZAKAT_KEY, JSON.stringify(s));
  } catch {
    // storage blocked, keep working in memory
  }
  window.dispatchEvent(new Event(EVENT));
}

export function clearZakat() {
  try {
    window.localStorage.removeItem(ZAKAT_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Device-only state, hydrated after mount to avoid SSR mismatches. */
export function useZakatState() {
  const [state, setState] = useState<ZakatState | null>(null);
  useEffect(() => {
    setState(loadZakat());
    const on = () => setState(loadZakat());
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  const update = (fn: (s: ZakatState) => ZakatState) => {
    const next = fn(loadZakat());
    setState(next);
    saveZakat(next);
  };
  return [state, update] as const;
}

export function nisabGrams(s: ZakatState): { gold: number; silver: number; label: string } {
  if (s.madhab === "ibnbaz" && s.measurement === "85") return { gold: 92, silver: 644, label: "92 g gold, 644 g silver (Ibn Baz)" };
  switch (s.measurement) {
    case "87":
      return { gold: 87.48, silver: 612.36, label: "87.48 g gold, 612.36 g silver" };
    case "ibnbaz":
      return { gold: 92, silver: 644, label: "92 g gold, 644 g silver (Ibn Baz)" };
    case "custom":
      return { gold: s.customGold, silver: s.customSilver, label: `${s.customGold} g gold, ${s.customSilver} g silver` };
    default:
      return { gold: 85, silver: 595, label: "85 g gold, 595 g silver" };
  }
}

/** Base currency per gram in cents. */
export function currentPrices(s: ZakatState): { goldPerGram: number; silverPerGram: number; fx: Record<string, number> } {
  const rate = s.prices?.fx?.[s.currency] ?? (s.currency === "USD" ? 1 : 0);
  const fxToBase: Record<string, number> = {};
  if (s.prices?.fx && rate) for (const [c, r] of Object.entries(s.prices.fx)) fxToBase[c] = rate / r;
  if (s.manualPrices) return { goldPerGram: Math.round(s.manualPrices.gold * 100), silverPerGram: Math.round(s.manualPrices.silver * 100), fx: fxToBase };
  if (!s.prices || !rate) return { goldPerGram: 0, silverPerGram: 0, fx: fxToBase };
  return { goldPerGram: Math.round(s.prices.goldUsd * rate * 100), silverPerGram: Math.round(s.prices.silverUsd * rate * 100), fx: fxToBase };
}

export function settingsFor(s: ZakatState): Settings {
  const g = nisabGrams(s);
  const p = currentPrices(s);
  return {
    nisabBasis: s.nisabBasis,
    goldNisabGrams: g.gold,
    silverNisabGrams: g.silver,
    calendar: s.calendar,
    longTermDebt: s.longTermDebt === "default" ? undefined : s.longTermDebt,
    fx: p.fx,
    baseCurrency: s.currency,
  };
}

export const money = (cents: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
};

// Hijri helpers
export const HIJRI_MONTHS = [
  "Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani", "Jumada al-Ula", "Jumada al-Akhirah",
  "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhu al-Qa'dah", "Dhu al-Hijjah",
];

export function hijriOf(d: Date): { day: number; month: number; year: number } {
  const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { day: "numeric", month: "numeric", year: "numeric" }).formatToParts(d);
  const get = (t: string) => parseInt(parts.find((p) => p.type === t)?.value ?? "0", 10);
  return { day: get("day"), month: get("month"), year: get("year") };
}

/** Next Gregorian date (today or later) that falls on the given Hijri month and day. */
export function nextDueDate(z: { month: number; day: number }, from = new Date()): Date | null {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  for (let i = 0; i < 400; i++) {
    const h = hijriOf(d);
    if (h.month === z.month && (h.day === z.day || (z.day === 30 && h.day === 29 && hijriOf(new Date(d.getTime() + 86400000)).day === 1)))
      return new Date(d);
    d.setDate(d.getDate() + 1);
  }
  return null;
}

export const daysUntil = (d: Date) => Math.round((d.getTime() - new Date(new Date().toDateString()).getTime()) / 86400000);

export const uid = () => Math.random().toString(36).slice(2, 10);
