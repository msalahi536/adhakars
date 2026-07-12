import { morningAdhkar, eveningAdhkar } from "@/data/adhkar";
import { getSalahItems, isItemComplete, SALAH_PRAYERS } from "@/data/salah";
import { sleepItems, wakeItems } from "@/data/sleep";

export const todayKey = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const dateKeyOffset = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

type CountMap = Record<string, number>;

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
  onProgressChanged();
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

// ============ Section completion ============

export type CommitmentSection = "morning" | "evening" | "salah" | "sleep" | "wake" | "custom";

const isMorningComplete = (date: string) => {
  const c = getCounts("morning", date);
  return morningAdhkar.every((d) => (c[d.id] ?? 0) >= d.target);
};

const isEveningComplete = (date: string) => {
  const c = getCounts("evening", date);
  return eveningAdhkar.every((d) => (c[d.id] ?? 0) >= d.target);
};

const isSalahComplete = (date: string): boolean => {
  // After Salah counts as complete when every prayer's items are complete.
  for (const p of SALAH_PRAYERS) {
    const counts = getCounts(`salah_${p.id}`, date);
    const items = getSalahItems(p.id);
    if (!items.every((it) => isItemComplete(it, counts))) return false;
  }
  return true;
};

const isSleepComplete = (date: string): boolean => {
  const counts = getCounts("sleep", date);
  return sleepItems.every((it) => isItemComplete(it, counts));
};

const isWakeComplete = (date: string): boolean => {
  const counts = getCounts("wake", date);
  return wakeItems.every((it) => isItemComplete(it, counts));
};

type CustomRow = { id: string; target_count: number };

export const getCustomAdhkarRows = (): CustomRow[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("custom_adhkar");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as CustomRow[];
  } catch {
    return [];
  }
};

const isCustomComplete = (date: string): boolean => {
  const rows = getCustomAdhkarRows();
  if (rows.length === 0) return false;
  const counts = getCounts("custom_adhkar", date);
  return rows.every((r) => (counts[r.id] ?? 0) >= (r.target_count ?? 0));
};

export const isSectionComplete = (section: CommitmentSection, date = todayKey()): boolean => {
  switch (section) {
    case "morning": return isMorningComplete(date);
    case "evening": return isEveningComplete(date);
    case "salah": return isSalahComplete(date);
    case "sleep": return isSleepComplete(date);
    case "wake": return isWakeComplete(date);
    case "custom": return isCustomComplete(date);
  }
};

// ============ Daily Commitment ============

const COMMITMENT_KEY = "adhkar:commitment";
const DEFAULT_COMMITMENT: Record<CommitmentSection, boolean> = {
  morning: true,
  evening: true,
  salah: false,
  sleep: false,
  wake: false,
  custom: false,
};

export const getCommitment = (): Record<CommitmentSection, boolean> => {
  if (typeof window === "undefined") return { ...DEFAULT_COMMITMENT };
  try {
    const raw = localStorage.getItem(COMMITMENT_KEY);
    if (!raw) return { ...DEFAULT_COMMITMENT };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_COMMITMENT, ...parsed };
  } catch {
    return { ...DEFAULT_COMMITMENT };
  }
};

export const setCommitment = (c: Record<CommitmentSection, boolean>) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(COMMITMENT_KEY, JSON.stringify(c));
  window.dispatchEvent(new Event("adhkar:commitment-update"));
  window.dispatchEvent(new Event("adhkar:streak-update"));
};

export const isDayComplete = (date = todayKey()): boolean => {
  const c = getCommitment();
  const enabled = (Object.keys(c) as CommitmentSection[]).filter((k) => c[k]);
  if (enabled.length === 0) return false;
  return enabled.every((s) => isSectionComplete(s, date));
};

// ============ Consistency (streak w/ grace) ============

export type DayStatus = "complete" | "grace" | "miss" | "future";
export type ConsistencyDay = { date: string; status: DayStatus };
export type Consistency = {
  days: ConsistencyDay[]; // oldest -> newest, length 30, ending today
  current: number;
  longest: number;
  completedCount: number; // completes in last 30
  graceUsedRecently: boolean; // grace day within last 7 days
};

// Legacy shape kept for BottomNav badge.
export const getStreak = (): { current: number; longest: number; lastCompleted: string | null } => {
  const c = getConsistency();
  const lastCompleted = [...c.days].reverse().find((d) => d.status === "complete")?.date ?? null;
  return { current: c.current, longest: c.longest, lastCompleted };
};

// Longest streak: scan an unbounded history (up to 365d) using the same grace rule.
const LONGEST_KEY = "adhkar:longest";
const getStoredLongest = (): number => {
  if (typeof window === "undefined") return 0;
  const v = parseInt(localStorage.getItem(LONGEST_KEY) || "0", 10);
  return Number.isFinite(v) ? v : 0;
};
const setStoredLongest = (n: number) => localStorage.setItem(LONGEST_KEY, String(n));

export const getConsistency = (): Consistency => {
  // Build last 30 days oldest -> newest.
  const days: ConsistencyDay[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = dateKeyOffset(-i);
    const complete = isDayComplete(date);
    days.push({ date, status: complete ? "complete" : "miss" });
  }

  // Walk over a longer history (up to 365 days) to compute current streak with grace.
  // Rule: one missed day per rolling 7 day window is forgiven (grace). A second miss
  // within the same 7 day window resets streak to 0. Grace days do not count as
  // completions but do not break the run.
  const HISTORY = 365;
  const history: { date: string; complete: boolean }[] = [];
  for (let i = HISTORY - 1; i >= 0; i--) {
    const date = dateKeyOffset(-i);
    history.push({ date, complete: isDayComplete(date) });
  }

  // Compute current streak walking backwards from today.
  // Track positions of misses to enforce "one miss per rolling 7-day window".
  let current = 0;
  const missPositions: number[] = []; // indices (0 = today) where miss/grace happened
  const graceDates = new Set<string>();
  const todayIdx = history.length - 1;

  // Today special: if not complete yet, don't count today, but don't break either.
  // Start walking from yesterday's position for break logic; today only adds +1 if complete.
  const todayComplete = history[todayIdx]?.complete ?? false;
  if (todayComplete) current += 1;

  for (let step = 1; step < history.length; step++) {
    const idx = todayIdx - step;
    if (idx < 0) break;
    const day = history[idx];
    if (day.complete) {
      current += 1;
      continue;
    }
    // Missed day. Any other miss/grace in the previous 6 days from this one?
    const conflict = missPositions.some((p) => Math.abs(p - step) < 7);
    if (conflict) break;
    // Grace
    missPositions.push(step);
    graceDates.add(day.date);
  }

  // Compute longest streak (scan full history using same rule, best run).
  let longest = getStoredLongest();
  {
    let run = 0;
    let runMisses: number[] = []; // step positions within this run
    let stepPos = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      const d = history[i];
      if (d.complete) {
        run += 1;
        stepPos += 1;
      } else {
        const conflict = runMisses.some((p) => Math.abs(p - stepPos) < 7);
        if (conflict) {
          if (run > longest) longest = run;
          run = 0;
          runMisses = [];
          stepPos = 0;
        } else {
          runMisses.push(stepPos);
          stepPos += 1;
        }
      }
    }
    if (run > longest) longest = run;
  }
  if (longest !== getStoredLongest()) setStoredLongest(longest);

  // Apply grace marks to the 30-day window.
  for (const d of days) {
    if (d.status === "miss" && graceDates.has(d.date)) {
      d.status = "grace";
    }
  }
  const completedCount = days.filter((d) => d.status === "complete").length;
  const last7 = days.slice(-7);
  const graceUsedRecently = last7.some((d) => d.status === "grace");

  return { days, current, longest, completedCount, graceUsedRecently };
};

const onProgressChanged = () => {
  if (typeof window === "undefined") return;
  // Notify listeners; consumers recompute via getConsistency.
  window.dispatchEvent(new Event("adhkar:streak-update"));
  // Cancel today's nudge if day is now complete (best-effort).
  if (isDayComplete()) {
    window.dispatchEvent(new Event("adhkar:day-complete"));
  }
};

// Legacy no-ops kept for existing callers.
export const maybeUpdateStreak = () => { onProgressChanged(); };
export const reconcileStreak = () => { /* handled by getConsistency */ };
export const isSetComplete = (kind: "morning" | "evening", date = todayKey()): boolean => {
  return kind === "morning" ? isMorningComplete(date) : isEveningComplete(date);
};
export const isAnySalahComplete = (date = todayKey()): boolean => {
  for (const p of SALAH_PRAYERS) {
    const counts = getCounts(`salah_${p.id}`, date);
    const items = getSalahItems(p.id);
    if (items.every((it) => isItemComplete(it, counts))) return true;
  }
  return false;
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

// Days of remembrance: count distinct days with any dhikr recorded.
// Approximation: count days in the last 365 where any tracked kind's counts file exists with sum > 0.
export const getDaysOfRemembrance = (): number => {
  if (typeof window === "undefined") return 0;
  const seen = new Set<string>();
  const kinds = ["morning", "evening", "sleep", "wake", "custom_adhkar", ...SALAH_PRAYERS.map((p) => `salah_${p.id}`)];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith("adhkar:")) continue;
    // key format: adhkar:<kind>:<yyyy-mm-dd>
    const parts = key.split(":");
    if (parts.length < 3) continue;
    const kind = parts.slice(1, parts.length - 1).join(":");
    const date = parts[parts.length - 1];
    if (!kinds.includes(kind)) continue;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const obj = JSON.parse(raw);
      const sum = Object.values(obj as Record<string, number>).reduce((a, b) => a + (Number(b) || 0), 0);
      if (sum > 0) seen.add(date);
    } catch {
      // ignore
    }
  }
  return seen.size;
};
