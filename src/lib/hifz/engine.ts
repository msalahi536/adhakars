/**
 * The hifz program: daily session builder (manzil -> sabqi -> weak spots -> sabaq -> linking),
 * result recording, honest grading, stage changes, weak-spot tracking and stats.
 *
 * Principles (from the active recall research):
 *  - recall from memory first, reveal only after a real attempt
 *  - review always comes before new memorization; new material pauses when review falls behind
 *  - expanding intervals (FSRS), a failed recall shortens the interval
 *  - self-grading can't be more generous than the recorded mistakes
 *  - interleave old review across juz, drill transitions and similar verses directly
 */
import { addDays, daysBetween, review, strength, clamp } from "./fsrs";
import { MINUTES } from "./plan";
import { linesOnPage, memorizationSequence, juzOfPage } from "./quran";
import type { Grade, HifzPlan, HifzState, PageRecord, QuranIndex, ReviewLog, WeakSpot } from "./types";

// ---------- setup ----------

export function defaultPlan(today: string): HifzPlan {
  return {
    startDate: today,
    order: { kind: "juzAmmaFirst" },
    newLinesPerDay: 7,
    studyDays: [0, 1, 2, 3, 4, 5, 6],
    dailyMinutes: 45,
    consolidateEvery: 20, // after every 20 new pages (one juz) ...
    consolidateDays: 3, // ... 3 review-only days
    targetRetention: 0.93,
    alreadyMemorized: [],
  };
}

export function createState(plan: HifzPlan): HifzState {
  const pages: Record<number, PageRecord> = {};
  for (const p of plan.alreadyMemorized) {
    // Known pages start as fragile so the first reviews come quickly and calibrate them.
    pages[p] = {
      page: p,
      stage: "manzil",
      linesLearned: linesOnPage(p),
      memorizedOn: plan.startDate,
      memory: { stability: 4, difficulty: 5, lastReview: plan.startDate, due: plan.startDate, reps: 0, lapses: 0 },
      history: [],
    };
  }
  // Spread the first check of already-known pages over two weeks so day one isn't overwhelming.
  plan.alreadyMemorized.forEach((p, i) => {
    pages[p].memory!.due = addDays(plan.startDate, i % 14);
  });
  return { version: 1, plan, pages, weakSpots: {}, dayLog: {} };
}

// ---------- grading ----------

export interface Performance {
  words: number; // words in the recited portion
  wrong: number; // wrong words
  skipped: number;
  small: number; // tashkeel / tajweed marks
  hesitations: number; // peeks, hints, long pauses before a word
  blank?: boolean; // couldn't start / couldn't recall the portion at all
  selfGrade?: Grade; // the user's Easy/Okay/Hard (mapped 4/3/2), optional
  seconds?: number;
  failedKeys?: string[]; // word keys that were wrong or skipped
  failedTransitions?: string[]; // ayah keys whose START failed (the transition into them)
  passedKeys?: string[]; // weak spots that were recited correctly this time
  driftTo?: { from: string; to: string }; // recited a similar verse instead
}

/** Turn what actually happened into a grade. The user can grade harder than the evidence, never easier. */
export function gradeFrom(p: Performance): Grade {
  const errors = p.wrong + p.skipped;
  const rate = p.words > 0 ? errors / p.words : 0;
  let g: Grade;
  if (p.blank || rate > 0.15) g = 1;
  else if (errors > 0 || p.small >= 3) g = 2;
  else if (p.hesitations > 0 || p.small > 0) g = 3;
  else g = 4;
  return p.selfGrade ? (Math.min(g, p.selfGrade) as Grade) : g;
}

// ---------- recording ----------

const maxIntervalFor = (rec: PageRecord, today: string, manzilCap: number) => {
  if (rec.stage === "sabqi") {
    // recent portions: 1, 2, 3 ... days apart for the first week, then at most weekly
    const age = rec.memorizedOn ? daysBetween(rec.memorizedOn, today) : 0;
    return clamp(age + 1, 1, 7);
  }
  return manzilCap;
};

export const MANZIL_CAP_DAYS = 30; // no memorized page goes more than a month without being recited

function applyReview(s: HifzState, rec: PageRecord, grade: Grade, today: string) {
  rec.memory = review(rec.memory, grade, today, {
    retention: s.plan.targetRetention,
    maxInterval: maxIntervalFor(rec, today, MANZIL_CAP_DAYS),
  });
  // stage changes
  if (rec.stage === "sabqi" && rec.memory.stability >= 21 && rec.memorizedOn && daysBetween(rec.memorizedOn, today) >= 21)
    rec.stage = "manzil";
  if (rec.stage === "manzil" && grade === 1 && rec.memory.lapses >= 2 && rec.memory.stability < 3) rec.stage = "sabqi"; // badly slipping: back to frequent review
}

function touchWeakSpots(s: HifzState, page: number, p: Performance, today: string) {
  const bump = (key: string, kind: WeakSpot["kind"]) => {
    const w = (s.weakSpots[key] ??= { key, kind, page, fails: 0, passes: 0, lastFailed: today });
    w.fails++;
    w.lastFailed = today;
  };
  p.failedKeys?.forEach((k) => bump(k, "word"));
  p.failedTransitions?.forEach((k) => bump(`t:${k}`, "transition"));
  if (p.driftTo) bump(`m:${p.driftTo.from}>${p.driftTo.to}`, "mutashabih");
  p.passedKeys?.forEach((k) => {
    const w = s.weakSpots[k];
    if (!w) return;
    w.passes++;
    if (w.passes >= w.fails + 2) delete s.weakSpots[k]; // fixed: passed twice more than it failed
  });
}

function log(s: HifzState, today: string, newLines: number, reviews: number, seconds = 0) {
  const d = (s.dayLog[today] ??= { newLines: 0, reviews: 0, minutes: 0 });
  d.newLines += newLines;
  d.reviews += reviews;
  d.minutes += Math.round(seconds / 60);
}

/**
 * Sabaq: the student learned `lines` more lines of `page` with the encode -> hide -> recall loop
 * and recited them from memory. When the page is complete it enters review.
 */
export function recordSabaq(s: HifzState, page: number, lines: number, p: Performance, today: string) {
  const rec = (s.pages[page] ??= { page, stage: "learning", linesLearned: 0, history: [] });
  rec.linesLearned = Math.min(linesOnPage(page), rec.linesLearned + lines);
  const grade = gradeFrom(p);
  rec.history.push(entry(today, grade, "sabaq", p));
  touchWeakSpots(s, page, p, today);
  if (rec.linesLearned >= linesOnPage(page) && rec.stage === "learning") {
    rec.stage = "sabqi";
    rec.memorizedOn = today;
    applyReview(s, rec, grade, today);
  }
  log(s, today, lines, 0, p.seconds);
}

/** Review of a memorized page (sabqi or manzil), or a full-page drill. */
export function recordReview(s: HifzState, page: number, p: Performance, today: string, kind: ReviewLog["kind"] = "manzil") {
  const rec = s.pages[page];
  if (!rec || rec.stage === "learning" || rec.stage === "new") return;
  const grade = gradeFrom(p);
  rec.history.push(entry(today, grade, kind, p));
  if (rec.history.length > 60) rec.history.splice(0, rec.history.length - 60);
  applyReview(s, rec, grade, today);
  touchWeakSpots(s, page, p, today);
  log(s, today, 0, 1, p.seconds);
}

/** "I recited these pages in salah": counts as a light review when the page is close to due. */
export function recordSalah(s: HifzState, pages: number[], today: string) {
  for (const page of pages) {
    const rec = s.pages[page];
    if (!rec?.memory) continue;
    if (daysBetween(today, rec.memory.due) <= 2) {
      applyReview(s, rec, 3, today);
      rec.history.push({ date: today, grade: 3, kind: "salah", mistakes: 0, hesitations: 0 });
    }
  }
}

const entry = (date: string, grade: Grade, kind: ReviewLog["kind"], p: Performance): ReviewLog => ({
  date,
  grade,
  kind,
  mistakes: p.wrong + p.skipped,
  hesitations: p.hesitations,
  seconds: p.seconds,
});

// ---------- the daily session ----------

export type Step =
  | { type: "manzil"; pages: number[]; minutes: number } // old review, interleaved across juz
  | { type: "sabqi"; pages: number[]; minutes: number } // recent review
  | { type: "weakSpots"; spots: WeakSpot[]; minutes: number } // targeted drills
  | { type: "sabaq"; page: number; fromLine: number; lines: number; minutes: number } // new memorization
  | { type: "link"; pages: number[]; minutes: number }; // recite today's new part joined to yesterday's

export interface Session {
  date: string;
  steps: Step[];
  totalMinutes: number;
  dueCount: number;
  carriedOver: number; // due pages pushed to tomorrow because of the time budget
  newPaused?: string; // why no new lines today, if paused
}

/** Next page and line to memorize, following the plan's order. */
export function nextNew(s: HifzState, q: QuranIndex): { page: number; fromLine: number } | null {
  for (const p of memorizationSequence(q, s.plan.order)) {
    const r = s.pages[p];
    if (!r || r.stage === "new") return { page: p, fromLine: 0 };
    if (r.stage === "learning") return { page: p, fromLine: r.linesLearned };
  }
  return null;
}

function interleaveByJuz(pages: number[]): number[] {
  const buckets = new Map<number, number[]>();
  for (const p of pages) {
    const j = juzOfPage(p);
    if (!buckets.has(j)) buckets.set(j, []);
    buckets.get(j)!.push(p);
  }
  const lists = [...buckets.values()];
  const out: number[] = [];
  while (out.length < pages.length) for (const l of lists) if (l.length) out.push(l.shift()!);
  return out;
}

function inConsolidation(s: HifzState, today: string): boolean {
  const { consolidateEvery, consolidateDays } = s.plan;
  if (!consolidateEvery || !consolidateDays) return false;
  const finished = Object.values(s.pages)
    .filter((r) => r.memorizedOn && !s.plan.alreadyMemorized.includes(r.page))
    .map((r) => r.memorizedOn!)
    .sort();
  if (finished.length < consolidateEvery || finished.length % consolidateEvery !== 0) return false;
  const last = finished[finished.length - 1];
  const gap = daysBetween(last, today);
  return gap >= 1 && gap <= consolidateDays;
}

export function buildSession(s: HifzState, q: QuranIndex, today: string): Session {
  const budget = s.plan.dailyMinutes;
  const due = Object.values(s.pages).filter((r) => r.memory && r.memory.due <= today && r.stage !== "learning");
  // most at risk first
  due.sort((a, b) => strength(a.memory, today) - strength(b.memory, today));
  const sabqiDue = due.filter((r) => r.stage === "sabqi").map((r) => r.page);
  const manzilDue = due.filter((r) => r.stage === "manzil").map((r) => r.page);

  const steps: Step[] = [];
  let used = 0;
  const studyDay = s.plan.studyDays.includes(new Date(today + "T12:00:00Z").getUTCDay());
  const next = nextNew(s, q);
  const newPossible = !!next && studyDay && !inConsolidation(s, today);
  // When new memorization is on today, review gets ~60% of the time; otherwise all of it.
  const reviewBudget = newPossible ? budget * 0.6 : budget - 2;
  const pagesFor = (minutes: number) => Math.max(0, Math.floor(minutes / MINUTES.reviewPage));

  // Sabqi (recent, most fragile) is allocated first, at least 5 pages if due; manzil gets the rest.
  const sabqiN = Math.min(sabqiDue.length, Math.max(5, pagesFor(reviewBudget * 0.5)));
  const manzilN = Math.min(manzilDue.length, pagesFor(reviewBudget - sabqiN * MINUTES.reviewPage));
  const sabqi = sabqiDue.slice(0, sabqiN);
  const manzil = interleaveByJuz(manzilDue.slice(0, manzilN));

  // 1. Manzil first in the session, so a tired student still protects old hifz
  if (manzil.length) {
    used += manzil.length * MINUTES.reviewPage;
    steps.push({ type: "manzil", pages: manzil, minutes: Math.round(manzil.length * MINUTES.reviewPage) });
  }
  // 2. Sabqi
  if (sabqi.length) {
    used += sabqi.length * MINUTES.reviewPage;
    steps.push({ type: "sabqi", pages: sabqi, minutes: Math.round(sabqi.length * MINUTES.reviewPage) });
  }
  // 3. Weak spots: the 6 worst words / transitions / similar verses
  const spots = Object.values(s.weakSpots)
    .sort((a, b) => b.fails - b.passes - (a.fails - a.passes) || (a.lastFailed < b.lastFailed ? 1 : -1))
    .slice(0, 6);
  if (spots.length) {
    used += 1 + spots.length * 0.5;
    steps.push({ type: "weakSpots", spots, minutes: Math.round(1 + spots.length * 0.5) });
  }

  const carriedOver = due.length - manzil.length - sabqi.length;
  // 4. Sabaq: only if review is under control
  let newPaused: string | undefined;
  if (!next) newPaused = "You have memorized everything in your plan. Review keeps it strong.";
  else if (!studyDay) newPaused = "Rest day for new memorization. Review only.";
  else if (inConsolidation(s, today)) newPaused = "Consolidation days: you just finished a block, so today is review only.";
  else if (carriedOver > 3) newPaused = `Review is behind by ${carriedOver} pages. New memorization pauses until it's caught up.`;
  else {
    const remaining = linesOnPage(next.page) - next.fromLine;
    let lines = Math.min(s.plan.newLinesPerDay, remaining);
    const left = budget - used;
    // shrink the sabaq rather than overrun the day (but always at least 2 lines if any time is left)
    lines = Math.max(Math.min(lines, 2), Math.min(lines, Math.floor(left / MINUTES.newLine)));
    if (left < MINUTES.newLine * 2) newPaused = "Today's time is used by review. New lines resume tomorrow.";
    else {
      used += lines * MINUTES.newLine;
      steps.push({ type: "sabaq", page: next.page, fromLine: next.fromLine, lines, minutes: Math.round(lines * MINUTES.newLine) });
      // 5. Link today's new part to the previous day's
      const linkPages = [...new Set([next.page, ...recentNewPages(s, today, 1)])];
      steps.push({ type: "link", pages: linkPages, minutes: 2 });
      used += 2;
    }
  }

  return { date: today, steps, totalMinutes: Math.round(used), dueCount: due.length, carriedOver: Math.max(0, carriedOver), newPaused };
}

function recentNewPages(s: HifzState, today: string, days: number): number[] {
  return Object.values(s.pages)
    .filter((r) => r.history.some((h) => h.kind === "sabaq" && daysBetween(h.date, today) >= 1 && daysBetween(h.date, today) <= days))
    .map((r) => r.page);
}

// ---------- stats ----------

export function stats(s: HifzState, q: QuranIndex, today: string) {
  const recs = Object.values(s.pages);
  const memorized = recs.filter((r) => r.stage === "sabqi" || r.stage === "manzil");
  const linesMemorized =
    memorized.reduce((a, r) => a + linesOnPage(r.page), 0) +
    recs.filter((r) => r.stage === "learning").reduce((a, r) => a + r.linesLearned, 0);
  const totalLines = q.pages.reduce((a, p) => a + p.lines, 0);
  const recent = recs.flatMap((r) => r.history).filter((h) => h.kind !== "sabaq" && daysBetween(h.date, today) <= 30);
  const retention = recent.length ? recent.filter((h) => h.grade >= 3).length / recent.length : null;
  const avgStrength = memorized.length ? memorized.reduce((a, r) => a + strength(r.memory, today), 0) / memorized.length : 0;

  // streak: consecutive days (ending today or yesterday) with any work
  let streak = 0;
  let d = s.dayLog[today] ? today : addDays(today, -1);
  while (s.dayLog[d] && (s.dayLog[d].newLines > 0 || s.dayLog[d].reviews > 0)) {
    streak++;
    d = addDays(d, -1);
  }

  const forecast = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today, i);
    return { date: day, due: memorized.filter((r) => r.memory && r.memory.due === day).length };
  });

  const byJuz = Array.from({ length: 30 }, (_, i) => {
    const juz = i + 1;
    const pages = q.pages.filter((p) => p.juz === juz).map((p) => p.page);
    const held = pages.filter((p) => s.pages[p]?.memory);
    return {
      juz,
      pages: pages.length,
      memorized: held.length,
      strength: held.length ? held.reduce((a, p) => a + strength(s.pages[p].memory, today), 0) / held.length : 0,
    };
  });

  return {
    pagesMemorized: memorized.length,
    percentOfQuran: linesMemorized / totalLines,
    retention30d: retention,
    averageStrength: avgStrength,
    streak,
    forecast,
    byJuz,
    weakest: memorized
      .map((r) => ({ page: r.page, strength: strength(r.memory, today), lapses: r.memory?.lapses ?? 0 }))
      .sort((a, b) => a.strength - b.strength)
      .slice(0, 5),
  };
}
