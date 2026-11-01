/**
 * Hifz insights built on the FSRS memory model:
 *  - memoryMap: every page's strength today + the day it starts slipping (the Mushaf memory map)
 *  - slippingSoon: "Page 312 will start slipping in 3 days, review it today"
 *  - salahPlan: which recent portions to recite in today's sunnah prayers (logged via recordSalah)
 *  - sleepBoost: tonight's preview of tomorrow's lesson + this morning's recall of last night's preview
 *  - positionQuiz: "Which line does this ayah start on?" (spatial memory of the page)
 *  - drillRange: the ayah range to check by voice for an engine drill (voice quizzes)
 */
import { addDays, daysBetween, retrievability } from "./fsrs";
import { nextNew } from "./engine";
import type { Drill, PageVerses } from "./drills";
import type { HifzState, PageStage, QuranIndex } from "./types";

export type MemoryLevel = "strong" | "good" | "due" | "slipping" | "weak" | "learning" | "new";
// strong/good: fine. due: still remembered but its review day has come (hifz rule: recent pages weekly,
// every page at least monthly). slipping/weak: memory is fading below the target.

export interface PageMemory {
  page: number;
  stage: PageStage;
  strength: number; // 0..1 chance of reciting it correctly today
  level: MemoryLevel;
  slipsOn?: string; // date it drops below the plan's target retention (= its review due date)
  daysLeft?: number; // days until then (negative = already slipping)
}

/** Strength of every page (1..604) for the memory map. */
export function memoryMap(s: HifzState, today: string): PageMemory[] {
  const target = s.plan.targetRetention;
  const out: PageMemory[] = [];
  for (let page = 1; page <= 604; page++) {
    const rec = s.pages[page];
    if (!rec || rec.stage === "new") { out.push({ page, stage: "new", strength: 0, level: "new" }); continue; }
    if (rec.stage === "learning" || !rec.memory) { out.push({ page, stage: rec.stage, strength: 0, level: "learning" }); continue; }
    const m = rec.memory;
    const r = retrievability(daysBetween(m.lastReview, today), m.stability);
    const daysLeft = daysBetween(today, m.due);
    let level: MemoryLevel = r >= 0.97 ? "strong" : r >= target ? "good" : r >= target - 0.08 ? "slipping" : "weak";
    if (daysLeft < 0 && (level === "strong" || level === "good")) level = "due";
    out.push({ page, stage: rec.stage, strength: Math.round(r * 1000) / 1000, level, slipsOn: m.due, daysLeft });
  }
  return out;
}

/** Pages that will start slipping within `days` (weakest first): the "review it today" nudges. */
export function slippingSoon(s: HifzState, today: string, days = 3): PageMemory[] {
  return memoryMap(s, today)
    .filter((p) => p.daysLeft !== undefined && p.daysLeft <= days)
    .sort((a, b) => (a.daysLeft as number) - (b.daysLeft as number) || a.strength - b.strength);
}

/** Overall picture for the map header. */
export function memorySummary(s: HifzState, today: string) {
  const map = memoryMap(s, today).filter((p) => p.level !== "new");
  const count = (l: MemoryLevel) => map.filter((p) => p.level === l).length;
  const memorized = map.filter((p) => p.level !== "learning");
  const avg = memorized.length ? memorized.reduce((a, p) => a + p.strength, 0) / memorized.length : 0;
  return { pages: memorized.length, strong: count("strong"), good: count("good"), due: count("due"), slipping: count("slipping"), weak: count("weak"), learning: count("learning"), averageStrength: Math.round(avg * 100) };
}

export interface SalahPortion {
  prayer: string; // suggested prayer
  page: number;
  verses: string[]; // "sura:aya" keys to recite (about half a page: one rakah's worth)
  reason: "due" | "recent" | "weak";
}

const SUNNAH = ["Fajr sunnah", "Dhuhr sunnah", "Maghrib sunnah", "Isha sunnah", "Witr / Qiyam"];

/**
 * Revise in Salah: up to 5 short portions for today's sunnah prayers, from pages that are due soon,
 * recently memorized (sabqi) or weak. After praying, log with recordSalah(state, pages, today).
 * `pageVerses` gives each page's "sura:aya" keys in order (from Quran.com).
 */
export function salahPlan(s: HifzState, today: string, pageVerses: Record<number, string[]>, count = 5): SalahPortion[] {
  const map = memoryMap(s, today).filter((p) => p.slipsOn && pageVerses[p.page]?.length);
  const score = (p: PageMemory) => (p.daysLeft as number) * 2 + (p.stage === "sabqi" ? -3 : 0) + p.strength * 5;
  const picks = map.sort((a, b) => score(a) - score(b)).slice(0, count);
  return picks.map((p, i) => {
    const keys = pageVerses[p.page];
    const half = keys.slice(0, Math.max(1, Math.ceil(keys.length / 2))); // one rakah's worth
    const reason: SalahPortion["reason"] = (p.daysLeft as number) <= 1 ? "due" : p.stage === "sabqi" ? "recent" : "weak";
    return { prayer: SUNNAH[i % SUNNAH.length], page: p.page, verses: half, reason };
  });
}

/**
 * Sleep boost (sleep consolidates new memory): tonight, read/listen to tomorrow's new lines a few times
 * (no pressure to memorize); in the morning, try to recite them before the real lesson.
 */
export function sleepBoost(s: HifzState, q: QuranIndex, today: string) {
  const next = nextNew(s, q);
  const tonight = next ? { page: next.page, fromLine: next.fromLine, lines: s.plan.newLinesPerDay, forDate: addDays(today, 1) } : null;
  return {
    tonight, // show after Isha: "Preview tomorrow's lesson (2 min)"
    morning: tonight ? { ...tonight, date: tonight.forDate } : null, // next morning: "Recall last night's preview"
    tip: "Listen to tomorrow's lines 3 times before sleeping, then try to recite them after Fajr.",
  };
}

export interface PositionQuiz {
  page: number;
  verse: string; // "sura:aya"
  answerLine: number; // line its first word sits on (1..15)
  options: number[]; // 4 line numbers incl. the answer, sorted
}

/**
 * "Which line does this ayah start on?" Needs each verse's start line on its page (from Quran.com
 * word data: line_number of the verse's first word).
 */
export function positionQuiz(pages: (PageVerses & { startLines: Record<string, number> })[], seed: string, count = 5): PositionQuiz[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const rnd = () => ((h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) >>> 0) / 4294967296);
  const out: PositionQuiz[] = [];
  const pool = pages.flatMap((p) => p.verses.filter((v) => p.startLines[v.key]).map((v) => ({ page: p.page, verse: v.key, line: p.startLines[v.key] })));
  for (let k = 0; k < count && pool.length; k++) {
    const pick = pool.splice(Math.floor(rnd() * pool.length), 1)[0];
    const opts = new Set([pick.line]);
    while (opts.size < 4) {
      const o = Math.max(1, Math.min(15, pick.line + Math.round((rnd() - 0.5) * 8)));
      opts.add(o);
      if (opts.size < 4 && rnd() < 0.05) opts.add(Math.floor(rnd() * 15) + 1);
    }
    out.push({ page: pick.page, verse: pick.verse, answerLine: pick.line, options: [...opts].sort((a, b) => a - b) });
  }
  return out;
}

/** The ayah range to check by voice when a drill is answered out loud (voice quizzes). */
export function drillRange(d: Drill): { sura: number; first: number; last: number } | null {
  const parse = (k: string) => k.split(":").map(Number) as [number, number];
  switch (d.kind) {
    case "cue":
    case "listen": {
      const [s, a] = parse(d.verse);
      return { sura: s, first: a, last: a };
    }
    case "transition": {
      const [s, a] = parse(d.to);
      return { sura: s, first: a, last: a };
    }
    case "randomEntry": {
      const [s, a] = parse(d.startVerse);
      return { sura: s, first: a, last: a + d.ayat - 1 };
    }
    case "before":
    case "pageStart": {
      const [s, a] = parse(d.kind === "before" ? d.answer : d.answerVerse);
      return { sura: s, first: a, last: a };
    }
    case "mutashabih": {
      const [s, a] = parse(d.a);
      return { sura: s, first: a, last: a };
    }
  }
}

// ---------- milestones & weak spots ----------

export interface Milestone {
  kind: "surah" | "juz" | "quarter" | "half" | "khatm";
  id: number; // surah number, juz number, or 0
  label: string; // e.g. "Al-Mulk", "Juz 30", "Half the Quran"
}

/**
 * Milestones reached: a surah or juz whose every page is memorized (recent or old review stage), plus
 * quarter / half / whole Quran. Compare with the set already celebrated to show only new ones.
 * `surahNames`: id -> name (from Quran.com chapters).
 */
export function milestones(s: HifzState, q: QuranIndex, surahNames: Record<number, string>): Milestone[] {
  const done = (p: number) => {
    const st = s.pages[p]?.stage;
    return st === "sabqi" || st === "manzil";
  };
  const out: Milestone[] = [];
  for (const [id, [a, b]] of Object.entries(q.surahPages)) {
    let ok = true;
    for (let p = a; p <= b && ok; p++) ok = done(p);
    if (ok) out.push({ kind: "surah", id: Number(id), label: surahNames[Number(id)] ?? `Surah ${id}` });
  }
  for (let j = 1; j <= 30; j++) {
    const pages = q.pages.filter((p) => p.juz === j).map((p) => p.page);
    if (pages.length && pages.every(done)) out.push({ kind: "juz", id: j, label: `Juz ${j}` });
  }
  const total = q.pages.filter((p) => done(p.page)).length;
  if (total >= 151) out.push({ kind: "quarter", id: 0, label: "A quarter of the Quran" });
  if (total >= 302) out.push({ kind: "half", id: 0, label: "Half the Quran" });
  if (total >= 604) out.push({ kind: "khatm", id: 0, label: "The whole Quran" });
  return out;
}

/** Milestones not celebrated yet (keys like "surah:67", "juz:30"). */
export function newMilestones(all: Milestone[], celebrated: string[]): Milestone[] {
  const seen = new Set(celebrated);
  return all.filter((m) => !seen.has(`${m.kind}:${m.id}`));
}

export interface WeakSpotView {
  key: string;
  kind: "word" | "transition" | "mutashabih";
  page: number;
  fails: number;
  passes: number;
  lastFailed: string;
  // what to show: a word key "sura:aya:word", the ayah you struggle to START ("sura:aya"),
  // or the pair of similar ayat you mix up
  word?: string;
  ayah?: string;
  mixUp?: { from: string; to: string };
  strength: number; // 0..1, how close it is to being fixed (passes needed = fails + 2)
}

/** Every weak spot, worst first, ready for the "My weak spots" screen. */
export function weakSpotList(s: HifzState, today: string): WeakSpotView[] {
  return Object.values(s.weakSpots)
    .map((w) => {
      const v: WeakSpotView = { ...w, strength: Math.min(1, w.passes / (w.fails + 2)) };
      if (w.kind === "transition") v.ayah = w.key.replace(/^t:/, "");
      else if (w.kind === "mutashabih") {
        const [from, to] = w.key.replace(/^m:/, "").split(">");
        v.mixUp = { from, to };
      } else v.word = w.key;
      return v;
    })
    .sort((a, b) => b.fails - b.passes - (a.fails - a.passes) || daysBetween(a.lastFailed, today) - daysBetween(b.lastFailed, today));
}
