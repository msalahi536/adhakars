import type { Marks, RecitePage, ReciteWord } from "@/lib/recite/model";
export const LAYOUTS = ["Mushaf text", "Framed mushaf", "Translation"] as const;
export type ReaderLayout = typeof LAYOUTS[number];
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
  return text.slice(last + 1).find(w => !marks[w.key] || marks[w.key] === "pending")?.key;
}