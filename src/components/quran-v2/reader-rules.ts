import type { Marks, RecitePage, ReciteWord } from "@/lib/recite/model";
export const LAYOUTS = ["Mushaf text", "Framed mushaf", "Translation"] as const;
export type ReaderLayout = typeof LAYOUTS[number];
export type ReaderPaging = "scroll" | "swipe";
export function swipeDestination(page: number, dx: number, dy: number): number {
  if (Math.abs(dx) < 65 || Math.abs(dx) <= Math.abs(dy) * 1.3) return page;
  return Math.max(1, Math.min(604, page + (dx > 0 ? 1 : -1)));
}
export function recitedWord(status: string | undefined) { return status === "correct" || status === "unsure"; }
export const ELSEWHERE_DELAY = 2000;
export function pageRanges(page: RecitePage) {
  return [...new Set(page.verses.map(v=>v.chapter))].map(sura=>{
    const ayat=page.verses.filter(v=>v.chapter===sura).map(v=>v.number);
    return {sura,first:Math.min(...ayat),last:Math.max(...ayat)};
  });
}
export function nextLayout(layout: ReaderLayout): ReaderLayout { return LAYOUTS[(LAYOUTS.indexOf(layout)+1)%3]; }
export function completedReading(verse: number, total: number) { return total>0 && verse>=total; }
export function adjacentPage(current: number, destination: number) {return destination===current+1 && destination<=604;}
export function currentRecitationWord(words: ReciteWord[], marks: Marks, active: boolean): string | undefined {
  if (!active) return;
  const text = words.filter(w => !w.end);
  const explicit = text.find(w => marks[w.key] === "in_progress");
  if (explicit) return explicit.key;
  let last = -1;
  text.forEach((w, i) => { if (["correct", "unsure", "wrong", "skipped"].includes(marks[w.key])) last = i; });
  if (last < 0) return;
  const next = text[last + 1];
  return next && (!marks[next.key] || marks[next.key] === "pending") ? next.key : undefined;
}