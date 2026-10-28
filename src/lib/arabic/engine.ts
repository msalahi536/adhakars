// Pure Arabic Companion rules: append-only answer/lesson log replayed into item review state,
// lesson unlocks (mastery gate) and an error log. Intervals reuse the Hifz scheduler.
import { addDays, localDay, reviewInterval, FIRST_INTERVAL, type Grade } from "@/lib/hifz/scheduler";
import { ITEMS, LESSONS, type ExerciseType, type Item, type Lesson } from "./content";

export type ArabicEvent = {
  id: string;
  at: string;
  day: string;
  kind: "answer" | "lesson";
  lessonId: string;
  itemId?: string;
  exercise?: ExerciseType;
  correct?: boolean;
  grade?: Grade; // self-grade (read aloud) or derived from correct
  picked?: string; // item id chosen when wrong → confusion
  score?: number; // lesson only, 0..1
};

export type ItemState = { id: string; interval: number; due: string };
export type Derived = {
  items: Record<string, ItemState>;
  passed: Set<string>;
  retryOn: Record<string, string>; // failed lesson → day it may be retried
  confusions: Record<string, number>; // "l:ح>l:ه" → count
};

const order = (a: ArabicEvent, b: ArabicEvent) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id);

export function derive(events: ArabicEvent[]): Derived {
  const d: Derived = { items: {}, passed: new Set(), retryOn: {}, confusions: {} };
  for (const e of [...events].sort(order)) {
    if (e.kind === "lesson") {
      const l = LESSONS.find((x) => x.id === e.lessonId);
      if (!l) continue;
      if ((e.score ?? 0) >= l.mastery) {
        d.passed.add(l.id);
        delete d.retryOn[l.id];
        // Every taught item enters review once the lesson is mastered.
        for (const id of [...l.newItems, ...l.apply])
          d.items[id] ??= { id, interval: FIRST_INTERVAL, due: addDays(e.day, FIRST_INTERVAL) };
      } else d.retryOn[l.id] = addDays(e.day, 1);
      continue;
    }
    if (!e.itemId) continue;
    if (e.correct === false && e.picked) {
      const k = `${e.itemId}>${e.picked}`;
      d.confusions[k] = (d.confusions[k] ?? 0) + 1;
    }
    const it = d.items[e.itemId];
    if (!it) continue; // not yet in review: lesson practice only
    const grade: Grade = e.grade ?? (e.correct ? "perfect" : "mistake");
    const interval = reviewInterval(it.interval, it.due, grade, e.day);
    d.items[e.itemId] = { ...it, interval, due: addDays(e.day, interval) };
  }
  return d;
}

export type LessonStatus = "passed" | "open" | "retry-tomorrow" | "locked";
export function lessonStatus(d: Derived, lessonId: string, today: string): LessonStatus {
  if (d.passed.has(lessonId)) return "passed";
  const i = LESSONS.findIndex((l) => l.id === lessonId);
  if (i > 0 && !d.passed.has(LESSONS[i - 1].id)) return "locked";
  const r = d.retryOn[lessonId];
  return r && today < r ? "retry-tomorrow" : "open";
}

export const dueItems = (d: Derived, today: string) =>
  Object.values(d.items).filter((i) => i.due <= today).sort((a, b) => a.due.localeCompare(b.due));

/** Lesson score: share of correct answers in this attempt. */
export const scoreOf = (answers: { correct: boolean }[]) =>
  answers.length ? answers.filter((a) => a.correct).length / answers.length : 0;

// ---------- Steps of the lesson loop ----------
export type Step =
  | { kind: "review"; item: Item; options: Item[] }
  | { kind: "model"; item: Item }
  | { kind: "repeat"; item: Item }
  | { kind: "pick"; phase: "guided" | "independent"; item: Item; options: Item[]; hint: boolean }
  | { kind: "dots"; target: Item; line: Item[] }
  | { kind: "read"; item: Item }
  | { kind: "apply"; item: Item };

type Rng = () => number;
const shuffle = <T,>(a: T[], rng: Rng) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

/** Distractors: look-alikes from the same family first, then others of the same type. */
export function distractors(item: Item, n: number, rng: Rng): Item[] {
  const pool = Object.values(ITEMS).filter((x) => x.type === item.type && x.id !== item.id);
  const same = shuffle(pool.filter((x) => item.family && x.family === item.family), rng);
  const rest = shuffle(pool.filter((x) => !same.includes(x)), rng);
  return [...same, ...rest].slice(0, n);
}

export function buildLesson(lesson: Lesson, d: Derived, today: string, rng: Rng = Math.random): Step[] {
  const it = (id: string) => ITEMS[id];
  const items = lesson.newItems.map(it);
  const steps: Step[] = [];
  for (const r of dueItems(d, today).slice(0, 4)) {
    const item = it(r.id);
    if (item) steps.push({ kind: "review", item, options: shuffle([item, ...distractors(item, 2, rng)], rng) });
  }
  for (const item of items) steps.push({ kind: "model", item }, { kind: "repeat", item });
  for (const item of shuffle(items, rng)) steps.push({ kind: "pick", phase: "guided", item, options: shuffle([item, ...distractors(item, 2, rng)], rng), hint: true });
  const dotted = items.filter((i) => items.some((j) => j !== i && j.family === i.family));
  if (dotted.length) {
    const target = dotted[Math.floor(rng() * dotted.length)];
    const fam = items.filter((i) => i.family === target.family);
    const line = shuffle([...Array(8)].map((_, k) => fam[k % fam.length]), rng);
    steps.push({ kind: "dots", target, line });
  }
  for (const item of shuffle(items, rng)) steps.push({ kind: "pick", phase: "independent", item, options: shuffle([item, ...distractors(item, 3, rng)], rng), hint: false });
  for (const id of lesson.apply) if (it(id)) steps.push({ kind: "apply", item: it(id) });
  return steps;
}

export const todayLocal = () => localDay(new Date());
