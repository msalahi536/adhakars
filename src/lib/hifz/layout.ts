// Static Madani 15-line layout per ayah (generated once from Quran.com's words API: juz, start page/line,
// end page/line). Pure helpers only, so placement and pace maths are testable and work offline.
import raw from "@/data/hifz-layout.json";

type Row = [number, number, number, number, number]; // juz, startPage, startLine, endPage, endLine
const DATA = raw as Row[][];

export const surahLength = (c: number) => DATA[c - 1]?.length ?? 0;
const row = (key: string): Row | undefined => {
  const [c, a] = key.split(":").map(Number);
  return DATA[c - 1]?.[a - 1];
};
export const keyOf = (c: number, a: number) => `${c}:${a}`;
/** An ayah belongs to the page its first word is on. */
export const pageOfAyah = (key: string) => row(key)?.[1] ?? 0;
export const juzOfAyah = (key: string) => row(key)?.[0] ?? 0;
export const surahOf = (key: string) => Number(key.split(":")[0]);

export function surahAyahs(c: number, from = 1, to = surahLength(c)): string[] {
  const out: string[] = [];
  for (let a = Math.max(1, from); a <= Math.min(to, surahLength(c)); a++) out.push(keyOf(c, a));
  return out;
}

/** Real mushaf line ids ("page-line") an ayah occupies. */
export function linesOfAyah(key: string): string[] {
  const r = row(key);
  if (!r) return [];
  const [, sp, sl, ep, el] = r;
  const out: string[] = [];
  for (let p = sp; p <= ep; p++) {
    const a = p === sp ? sl : 1, b = p === ep ? el : 15;
    for (let l = a; l <= b; l++) out.push(`${p}-${l}`);
  }
  return out;
}

export const countLines = (keys: string[]) => new Set(keys.flatMap(linesOfAyah)).size;

export function allAyahs(): string[] {
  return DATA.flatMap((s, i) => s.map((_, a) => keyOf(i + 1, a + 1)));
}
export const ayahsOfJuz = (j: number) => allAyahs().filter((k) => juzOfAyah(k) === j);
export const ayahsOfPage = (p: number) => allAyahs().filter((k) => pageOfAyah(k) === p);

export type Goal =
  | { type: "juz-amma" }
  | { type: "surahs"; surahs: number[] }
  | { type: "whole"; direction: "forward" | "backward" }
  | { type: "custom"; from: string; to: string };

const range = (a: number, b: number) => (a <= b ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : Array.from({ length: a - b + 1 }, (_, i) => a - i));

/** Ayahs in memorization order. Backward goals go surah by surah from An-Nas; ayahs inside a surah stay in order. */
export function goalAyahs(g: Goal): string[] {
  if (g.type === "juz-amma") return range(114, 78).flatMap((c) => surahAyahs(c));
  if (g.type === "surahs") return g.surahs.flatMap((c) => surahAyahs(c));
  if (g.type === "whole") return (g.direction === "forward" ? range(2, 114) : range(114, 2)).flatMap((c) => surahAyahs(c));
  const all = allAyahs();
  const i = all.indexOf(g.from), j = all.indexOf(g.to);
  if (i < 0 || j < 0) return [];
  return all.slice(Math.min(i, j), Math.max(i, j) + 1);
}

/**
 * One day's new ayahs from the front of `left`: ends at the ayah boundary nearest the line target (it may go
 * slightly over; ties stay under). An ayah longer than the pace is assigned alone, so a day is never empty.
 * pace 0 = the rest of the first ayah's page.
 */
export function dayChunk(left: string[], paceLines: number, from = 0): string[] {
  const out: string[] = [];
  if (from >= left.length) return out;
  if (paceLines === 0) {
    const pg = pageOfAyah(left[from]);
    for (let i = from; i < left.length && pageOfAyah(left[i]) === pg; i++) out.push(left[i]);
    return out;
  }
  const lines = new Set<string>();
  for (let i = from; i < left.length; i++) {
    const k = left[i];
    const before = lines.size;
    const add = linesOfAyah(k).filter((l) => !lines.has(l));
    const after = before + add.length;
    if (out.length > 0 && after > paceLines && after - paceLines >= paceLines - before) break;
    out.push(k);
    add.forEach((l) => lines.add(l));
    if (after >= paceLines) break;
  }
  return out;
}

/** Days to finish the not-yet-memorized part of a goal, chunked day by day with the same rule as the daily sabaq. */
export function daysToFinish(goal: string[], memorized: Set<string>, linesPerDay: number): number {
  const left = remainingGoal(goal, memorized);
  let days = 0;
  for (let i = 0; i < left.length; days++) i += dayChunk(left, linesPerDay, i).length;
  return days;
}

/** The part of a goal still to memorize, in goal order: known ayahs never count toward lines, days or finish. */
export const remainingGoal = (goal: string[], known: Set<string>) => goal.filter((k) => !known.has(k));
