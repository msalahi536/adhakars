import { morningAdhkar, eveningAdhkar } from "@/data/adhkar";
import { getSalahItems, isItemComplete, SALAH_PRAYERS } from "@/data/salah";

export const todayKey = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

type CountMap = Record<string, number>;

// kind can be: "morning", "evening", "salah_fajr", "salah_dhuhr", etc.
const countsKey = (date: string, kind: string) => `adhkar:${kind}:${date}`;

export const getCounts = (kind: string, date = todayKey()): CountMap => {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(countsKey(date, kind)) || "{}");
  } catch {
    return {};
  }
};

export const setCount = (kind: string, id: string, value: number) => {
  const c = getCounts(kind);
  c[id] = value;
  localStorage.setItem(countsKey(todayKey(), kind), JSON.stringify(c));
  maybeUpdateStreak();
};

export const clearCounts = (kind: string, date = todayKey()) => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(countsKey(date, kind));
};

export const resetToday = () => {
  localStorage.removeItem(countsKey(todayKey(), "morning"));
  localStorage.removeItem(countsKey(todayKey(), "evening"));
  for (const p of SALAH_PRAYERS) {
    localStorage.removeItem(countsKey(todayKey(), `salah_${p.id}`));
  }
};

/** Wipes ALL counts (every day), streaks, and lifetime totals. Destructive. */
export const resetAllProgress = () => {
  if (typeof window === "undefined") return;
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key.startsWith("adhkar:") || key === LIFETIME_KEY) {
      toRemove.push(key);
    }
  }
  for (const k of toRemove) localStorage.removeItem(k);
  window.dispatchEvent(new Event("adhkar:streak-update"));
  window.dispatchEvent(new Event("adhkar:lifetime-update"));
};


export const isSetComplete = (kind: "morning" | "evening", date = todayKey()): boolean => {
  const c = getCounts(kind, date);
  const list = kind === "morning" ? morningAdhkar : eveningAdhkar;
  return list.every((d) => (c[d.id] ?? 0) >= d.target);
};

export const isAnySalahComplete = (date = todayKey()): boolean => {
  for (const p of SALAH_PRAYERS) {
    const counts = getCounts(`salah_${p.id}`, date);
    const items = getSalahItems(p.id);
    if (items.every((it) => isItemComplete(it, counts))) return true;
  }
  return false;
};

// Streak
type StreakData = {
  current: number;
  longest: number;
  lastCompleted: string | null;
};
const STREAK_KEY = "adhkar:streak";

export const getStreak = (): StreakData => {
  if (typeof window === "undefined") return { current: 0, longest: 0, lastCompleted: null };
  try {
    return (
      JSON.parse(localStorage.getItem(STREAK_KEY) || "null") || {
        current: 0,
        longest: 0,
        lastCompleted: null,
      }
    );
  } catch {
    return { current: 0, longest: 0, lastCompleted: null };
  }
};

const saveStreak = (s: StreakData) => localStorage.setItem(STREAK_KEY, JSON.stringify(s));

const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const maybeUpdateStreak = () => {
  const today = todayKey();
  if (!isSetComplete("morning", today) || !isSetComplete("evening", today)) return;
  if (!isAnySalahComplete(today)) return;
  const s = getStreak();
  if (s.lastCompleted === today) return;
  if (s.lastCompleted === yesterday()) {
    s.current += 1;
  } else {
    s.current = 1;
  }
  s.lastCompleted = today;
  if (s.current > s.longest) s.longest = s.current;
  saveStreak(s);
  window.dispatchEvent(new Event("adhkar:streak-update"));
};

export const reconcileStreak = () => {
  const s = getStreak();
  if (!s.lastCompleted) return;
  if (s.lastCompleted === todayKey() || s.lastCompleted === yesterday()) return;
  s.current = 0;
  saveStreak(s);
};

// ============ Lifetime dhikr counter ============
export type LifetimeCategory = "morning" | "evening" | "salah" | "tasbih" | "custom";
export type LifetimeCounts = {
  total: number;
  morning: number;
  evening: number;
  salah: number;
  tasbih: number;
  custom: number;
};

const LIFETIME_KEY = "lifetimeDhikr";
const defaultLifetime: LifetimeCounts = {
  total: 0,
  morning: 0,
  evening: 0,
  salah: 0,
  tasbih: 0,
  custom: 0,
};

export const getLifetime = (): LifetimeCounts => {
  if (typeof window === "undefined") return defaultLifetime;
  try {
    return { ...defaultLifetime, ...JSON.parse(localStorage.getItem(LIFETIME_KEY) || "{}") };
  } catch {
    return defaultLifetime;
  }
};

export const bumpLifetime = (category: LifetimeCategory, n = 1) => {
  if (typeof window === "undefined" || n <= 0) return;
  const cur = getLifetime();
  cur[category] += n;
  cur.total += n;
  localStorage.setItem(LIFETIME_KEY, JSON.stringify(cur));
  window.dispatchEvent(new Event("adhkar:lifetime-update"));
};
