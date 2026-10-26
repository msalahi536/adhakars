// Pure daily-session rules: today's queue (Manzil → Sabqi → Sabaq), backlog guard, transition drills,
// Salah logging and the first-week forecast. No I/O; everything is expressed as log events.
import { countLines, goalAyahs, linesOfAyah, pageOfAyah, remainingGoal, surahLength, type Goal } from "./layout";
import { addDays, capGrade, daysBetween, type Grade } from "./scheduler";
import { derive, type Derived, type HifzEvent } from "./store";

export type EventInput = Omit<HifzEvent, "id" | "at" | "day">;
export type SabqiGroup = { page: number; keys: string[] };
export type Queue = {
  manzil: number[];
  sabqi: SabqiGroup[];
  sabaq: string[]; // today's new ayahs (empty when paused by the backlog guard)
  backlog: { paused: boolean; due: number; limit: number; days: number }; // days = ~days to catch up at the cap
  minutes: number;
};

export const BACKLOG_FACTOR = 2;
export const MIN_NORMAL_LOAD = 2;
/** The guard never trips below this many overdue items. */
export const BACKLOG_FLOOR = 10;

const ayahOrder = (a: string, b: string) => {
  const [x, y] = a.split(":").map(Number), [u, v] = b.split(":").map(Number);
  return x - u || y - v;
};

/** Due ayahs (not graduated) grouped by page, consecutive ayahs together. */
export function sabqiGroups(d: Derived, today: string): SabqiGroup[] {
  const due = Object.values(d.ayahs).filter((a) => !a.graduated && a.due <= today).map((a) => a.key).sort(ayahOrder);
  const groups: SabqiGroup[] = [];
  for (const k of due) {
    const g = groups[groups.length - 1];
    const [c, a] = k.split(":").map(Number);
    const prev = g?.keys[g.keys.length - 1].split(":").map(Number);
    if (g && g.page === pageOfAyah(k) && prev && prev[0] === c && prev[1] === a - 1) g.keys.push(k);
    else groups.push({ page: pageOfAyah(k), keys: [k] });
  }
  return groups;
}

/** Normal daily review load: what an average day costs at current intervals (each page/group once per interval). */
export function normalLoad(d: Derived): number {
  const pages = Object.values(d.pages).filter((p) => p.inManzil).reduce((s, p) => s + 1 / Math.max(1, p.interval), 0);
  const ayahPages = new Map<number, number>();
  for (const a of Object.values(d.ayahs)) if (!a.graduated) ayahPages.set(a.page, Math.min(ayahPages.get(a.page) ?? 99, a.interval));
  const sabqi = [...ayahPages.values()].reduce((s, i) => s + 1 / Math.max(1, i), 0);
  return Math.max(MIN_NORMAL_LOAD, pages + sabqi);
}

/** The plan's next new ayahs at today's pace (lines per day; 0 = one full page). */
export function nextSabaq(goal: Goal | undefined, d: Derived, paceLines: number): string[] {
  if (!goal) return [];
  const left = remainingGoal(goalAyahs(goal), new Set(Object.keys(d.ayahs)));
  return dayChunk(left, paceLines);
}

export function buildQueue(d: Derived, today: string, goal: Goal | undefined, paceLines: number): Queue {
  const allManzil = Object.values(d.pages).filter((p) => p.inManzil && p.due <= today);
  const allSabqi = sabqiGroups(d, today);
  const due = allManzil.length + allSabqi.length;
  // Backlog = missed reviews only (due before today). On-schedule reviews due today never count.
  const overdue = allManzil.filter((p) => p.due < today).length + allSabqi.filter((g) => g.keys.some((k) => d.ayahs[k].due < today)).length;
  const limit = Math.max(BACKLOG_FLOOR, Math.ceil(BACKLOG_FACTOR * normalLoad(d)));
  const paused = overdue > limit;
  let manzil = allManzil.sort((a, b) => a.due.localeCompare(b.due) || a.page - b.page).map((p) => p.page);
  let sabqi = allSabqi;
  if (paused) {
    // Catch-up cap: only `limit` reviews today, most overdue first, then weakest. The rest rolls to the next days.
    const units = [
      ...allManzil.map((p) => ({ m: p.page as number | null, g: null as SabqiGroup | null, over: daysBetween(p.due, today), str: p.interval })),
      ...allSabqi.map((g) => {
        const its = g.keys.map((k) => d.ayahs[k]);
        return { m: null, g, over: Math.max(...its.map((a) => daysBetween(a.due, today))), str: Math.min(...its.map((a) => a.interval)) };
      }),
    ].sort((a, b) => b.over - a.over || a.str - b.str).slice(0, limit);
    const keepM = new Set(units.map((u) => u.m)), keepG = new Set(units.map((u) => u.g));
    manzil = manzil.filter((p) => keepM.has(p));
    sabqi = allSabqi.filter((g) => keepG.has(g));
  }
  const sabaq = paused ? [] : nextSabaq(goal, d, paceLines);
  const minutes = Math.round(manzil.length * 3 + sabqi.reduce((s, g) => s + g.keys.length, 0) * 1 + countLines(sabaq) * 1.5 + 2);
  return { manzil, sabqi, sabaq, backlog: { paused, due, limit, days: paused ? Math.ceil(due / limit) : 0 }, minutes };
}

/** Sabaq is done only when every new ayah has been graded at L4 (graded ayahs are the only ones in the schedule). */
export function sabaqProgress(keys: string[], d: Derived) {
  const learned = keys.filter((k) => d.ayahs[k]);
  return { lines: countLines(learned), total: countLines(keys), done: keys.length > 0 && learned.length === keys.length, remaining: keys.filter((k) => !d.ayahs[k]) };
}

// ---- transition drills ----
export type Drill = { prev: string; next: string };

/** 3–5 drills from memorized consecutive ayahs; pairs whose boundary words were tapped as errors come first. */
export function pickDrills(d: Derived, rand: () => number = Math.random, n = 3 + Math.floor(rand() * 3)): Drill[] {
  const known = new Set(Object.keys(d.ayahs));
  const pairs: Drill[] = [];
  for (const k of [...known].sort(ayahOrder)) {
    const [c, a] = k.split(":").map(Number);
    const next = a < surahLength(c) ? `${c}:${a + 1}` : `${c + 1}:1`;
    if (known.has(next)) pairs.push({ prev: k, next });
  }
  const errs = Object.keys(d.wordErrors);
  const hot = (p: Drill) =>
    errs.some((w) => w.startsWith(p.next + ":") && Number(w.split(":")[2]) <= 2) ? 2 : errs.some((w) => w.startsWith(p.prev + ":")) ? 1 : 0;
  const scored = pairs.map((p) => ({ p, s: hot(p), r: rand() })).sort((a, b) => b.s - a.s || a.r - b.r);
  return scored.slice(0, Math.min(5, Math.max(3, n), pairs.length)).map((x) => x.p);
}

/** A drill is a review of the NEXT ayah: reciting into it is what's being tested. */
export function drillEvent(drill: Drill, grade: Grade, errorWords: string[] = []): EventInput {
  return { kind: "ayah", session: "drill", key: drill.next, page: pageOfAyah(drill.next), grade: capGrade(grade, false, errorWords.length), errorWords };
}

// ---- salah ----
export const SALAH_OUTCOMES = { smooth: "perfect", stumbled: "hesitation", forgot: "mistake" } as const;
export type SalahOutcome = keyof typeof SALAH_OUTCOMES;

/** Only already-memorized ayahs can be logged; a mixed range is refused but offers the memorized subset. */
export function salahEvents(d: Derived, keys: string[], outcome: SalahOutcome, prayer: string): { ok: true; events: EventInput[] } | { ok: false; error: string; memorized?: string[] } {
  if (!keys.length) return { ok: false, error: "Pick at least one ayah." };
  const missing = keys.filter((k) => !d.ayahs[k]);
  if (missing.length) return { ok: false, error: `Only memorized ayahs can be logged. Not yet memorized: ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? "…" : ""}`, memorized: keys.filter((k) => d.ayahs[k]) };
  return { ok: true, events: keys.map((k) => ({ kind: "ayah", session: "salah", prayer, key: k, page: pageOfAyah(k), grade: SALAH_OUTCOMES[outcome] })) };
}

// ---- forecast ----
export type DayLoad = { day: string; manzil: number; sabqi: number; hesitationSeed: number; total: number; newLines: number };

/** Simulate the next days assuming Perfect grades: each day's due reviews are done, then the day's new lines learned. */
export function forecast(events: HifzEvent[], today: string, goal: Goal | undefined, paceLines: number, days = 7): DayLoad[] {
  const sim = [...events];
  const hesSeed = new Set(events.filter((e) => e.kind === "seed" && e.grade === "hesitation").map((e) => e.page));
  const out: DayLoad[] = [];
  let n = 0;
  const push = (day: string, e: EventInput) => sim.push({ ...e, id: `sim-${n}`, at: `${day}T23:00:00.${String(n++ % 1000).padStart(3, "0")}Z`, day });
  for (let i = 0; i < days; i++) {
    const day = addDays(today, i + 1);
    // Same queue (including the catch-up cap) Today will build that day.
    const q = buildQueue(derive(sim), day, goal, paceLines);
    const manzil = q.manzil;
    const groups = q.sabqi;
    const sabqiPages = new Set(groups.map((g) => g.page).filter((p) => !manzil.includes(p)));
    const h = manzil.filter((p) => hesSeed.has(p)).length;
    for (const p of manzil) { push(day, { kind: "page", session: "session", key: String(p), page: p, grade: "perfect" }); hesSeed.delete(p); }
    for (const g of groups) for (const k of g.keys) push(day, { kind: "ayah", session: "session", key: k, page: g.page, grade: "perfect" });
    const fresh = q.sabaq;
    for (const k of fresh) push(day, { kind: "learn", key: k, page: pageOfAyah(k) });
    out.push({ day, manzil: manzil.length - h, sabqi: sabqiPages.size, hesitationSeed: h, total: manzil.length + sabqiPages.size, newLines: new Set(fresh.flatMap(linesOfAyah)).size });
  }
  return out;
}
