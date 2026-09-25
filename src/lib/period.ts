// Private cycle data. Stored only on this device, under a "period:" prefix so
// "reset progress" never touches it.

export type Cycle = { start: string; end?: string; endedAt?: string };

const CYCLES = "period:cycles";
const SYMPTOMS = "period:symptoms";
const CHECKLIST = "period:checklist";
const GRATITUDE = "period:gratitude";

export const EVENT = "period:update";

export const keyOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const todayK = () => keyOf(new Date());
export const parseK = (k: string) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const addK = (k: string, n: number) => {
  const d = parseK(k);
  d.setDate(d.getDate() + n);
  return keyOf(d);
};
export const diffDays = (a: string, b: string) =>
  Math.round((parseK(b).getTime() - parseK(a).getTime()) / 86400000);

const read = <T,>(k: string, fb: T): T => {
  if (typeof window === "undefined") return fb;
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fb;
  } catch {
    return fb;
  }
};
const write = (k: string, v: unknown) => {
  localStorage.setItem(k, JSON.stringify(v));
  window.dispatchEvent(new Event(EVENT));
};

export const getCycles = (): Cycle[] =>
  read<Cycle[]>(CYCLES, []).slice().sort((a, b) => a.start.localeCompare(b.start));
const saveCycles = (c: Cycle[]) => write(CYCLES, c);

export const openCycle = (): Cycle | undefined => {
  const c = getCycles();
  const last = c[c.length - 1];
  return last && !last.end ? last : undefined;
};

export const startPeriod = (date: string) => {
  const c = getCycles().filter((x) => x.start !== date);
  // close any open cycle before this date
  for (const x of c) if (!x.end && x.start < date) x.end = addK(date, -1);
  c.push({ start: date });
  saveCycles(c);
};

export const endPeriod = (date: string) => {
  const c = getCycles();
  const target = [...c].reverse().find((x) => x.start <= date);
  if (!target) return;
  target.end = date;
  target.endedAt = date === todayK() ? new Date().toISOString() : undefined;
  saveCycles(c);
};

export type SaveCycleResult = { ok: true } | { ok: false; error: string };

export const saveCycleRange = (start: string, end?: string, originalStart?: string): SaveCycleResult => {
  const today = todayK();
  if (!start) return { ok: false, error: "Choose a start date." };
  if (start > today || (end && end > today)) return { ok: false, error: "Period dates cannot be in the future." };
  if (end && end < start) return { ok: false, error: "The end date must be on or after the start date." };
  if (end && diffDays(start, end) > 20) return { ok: false, error: "Check these dates — this period is longer than 21 days." };

  const remaining = getCycles().filter((cycle) => cycle.start !== originalStart);
  const candidateEnd = end ?? today;
  const overlaps = remaining.some((cycle) => {
    const existingEnd = cycle.end ?? today;
    return start <= existingEnd && candidateEnd >= cycle.start;
  });
  if (overlaps) return { ok: false, error: "These dates overlap another logged period." };

  remaining.push({
    start,
    end,
    endedAt: end === today ? new Date().toISOString() : undefined,
  });
  saveCycles(remaining);
  return { ok: true };
};

export const deleteCycle = (start: string) => saveCycles(getCycles().filter((x) => x.start !== start));

export type Stats = {
  avgCycle: number;
  avgPeriod: number;
  currentDay: number | null;
  nextStart: string | null;
  ovulation: string | null;
  cyclesLogged: number;
};

export const getStats = (): Stats => {
  const c = getCycles();
  const lens: number[] = [];
  for (let i = 1; i < c.length; i++) {
    const d = diffDays(c[i - 1].start, c[i].start);
    if (d >= 15 && d <= 60) lens.push(d);
  }
  const periods = c.filter((x) => x.end).map((x) => diffDays(x.start, x.end!) + 1).filter((n) => n > 0 && n <= 15);
  const avg = (a: number[], fb: number) => (a.length ? Math.round(a.reduce((s, n) => s + n, 0) / a.length) : fb);
  const avgCycle = avg(lens.slice(-6), 28);
  const avgPeriod = avg(periods.slice(-6), 5);
  const last = c[c.length - 1];
  if (!last) return { avgCycle, avgPeriod, currentDay: null, nextStart: null, ovulation: null, cyclesLogged: 0 };
  let nextStart = addK(last.start, avgCycle);
  while (nextStart < todayK()) nextStart = addK(nextStart, avgCycle);
  return {
    avgCycle,
    avgPeriod,
    currentDay: diffDays(last.start, todayK()) + 1,
    nextStart,
    ovulation: addK(nextStart, -14),
    cyclesLogged: c.length,
  };
};

export const isPeriodDay = (date: string): boolean => {
  const { avgPeriod } = getStats();
  return getCycles().some((x) => {
    if (date < x.start) return false;
    if (x.end) return date <= x.end;
    return date <= todayK() && diffDays(x.start, date) < Math.max(avgPeriod + 5, 10);
  });
};

export const isPredictedPeriodDay = (date: string): boolean => {
  const s = getStats();
  if (!s.nextStart || date <= todayK()) return false;
  const d = diffDays(s.nextStart, date);
  return d >= 0 && d < s.avgPeriod;
};

// ---- Symptoms ----
export const SYMPTOMS_LIST = ["cramps", "headache", "low-mood", "low-energy", "bloating"] as const;
export type Symptom = (typeof SYMPTOMS_LIST)[number];
export const getSymptoms = (date = todayK()): Symptom[] => read<Record<string, Symptom[]>>(SYMPTOMS, {})[date] ?? [];
export const toggleSymptom = (s: Symptom, date = todayK()) => {
  const all = read<Record<string, Symptom[]>>(SYMPTOMS, {});
  const cur = new Set(all[date] ?? []);
  if (cur.has(s)) cur.delete(s);
  else cur.add(s);
  all[date] = [...cur];
  write(SYMPTOMS, all);
};

// ---- Checklist ----
export const getChecklist = (date = todayK()): string[] => read<Record<string, string[]>>(CHECKLIST, {})[date] ?? [];
export const toggleChecklist = (id: string, date = todayK()) => {
  const all = read<Record<string, string[]>>(CHECKLIST, {});
  const cur = new Set(all[date] ?? []);
  if (cur.has(id)) cur.delete(id);
  else cur.add(id);
  all[date] = [...cur];
  write(CHECKLIST, all);
  window.dispatchEvent(new Event("adhkar:streak-update"));
};

/** A period day with any checklist item done keeps the streak going. */
export const periodDayCounts = (date: string): boolean => {
  if (typeof window === "undefined") return false;
  return getChecklist(date).length > 0 && isPeriodDay(date);
};

// ---- Gratitude ----
export const getGratitude = (date = todayK()): string[] =>
  read<Record<string, string[]>>(GRATITUDE, {})[date] ?? ["", "", ""];
export const setGratitude = (lines: string[], date = todayK()) => {
  const all = read<Record<string, string[]>>(GRATITUDE, {});
  all[date] = lines;
  localStorage.setItem(GRATITUDE, JSON.stringify(all));
};
export const gratitudeHistory = (): { date: string; lines: string[] }[] =>
  Object.entries(read<Record<string, string[]>>(GRATITUDE, {}))
    .filter(([, l]) => l.some((x) => x.trim()))
    .map(([date, lines]) => ({ date, lines }))
    .sort((a, b) => b.date.localeCompare(a.date));
