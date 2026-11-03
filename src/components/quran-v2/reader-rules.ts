import type { Marks, RecitePage, ReciteWord } from "@/lib/recite/model";
export const LAYOUTS = ["Mushaf text", "Framed mushaf", "Translation"] as const;
export type ReaderLayout = typeof LAYOUTS[number];
export type ReaderPaging = "scroll" | "swipe";
export function normalizeSurahSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06edـ]/g,"").replace(/[أإآٱ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه").toLowerCase().trim().replace(/^سوره\s*/,"").replace(/^ال/,"").replace(/^al[\s-]+/,"").replace(/[\s'’\-]/g,"");
}
export function matchesSurahSearch(chapter: {id:number;name_simple:string;name_arabic:string}, query:string) {
  const q=normalizeSurahSearch(query);
  if(!q)return true;
  if(/^\d+$/.test(q))return chapter.id===Number(q);
  return [chapter.name_simple,chapter.name_arabic].some(name=>normalizeSurahSearch(name).includes(q));
}
export function swipeDestination(page: number, dx: number, dy: number): number {
  if (Math.abs(dx) < 65 || Math.abs(dx) <= Math.abs(dy) * 1.3) return page;
  return Math.max(1, Math.min(604, page + (dx > 0 ? 1 : -1)));
}
export function recitedWord(status: string | undefined) { return status === "correct" || status === "unsure"; }
export function hiddenWordVisible(status: string | undefined, manuallyRevealed = false) {
  return manuallyRevealed || status === "in_progress" || recitedWord(status) || status === "wrong" || status === "skipped";
}
// Decoration may occupy only empty source rows; never replace Quran words.
export function mushafRows(page: RecitePage) {
  const words = page.verses.flatMap(v => v.words);
  const last = Math.max(15, ...words.map(w => w.line));
  return Array.from({length:last}, (_, i) => {
    const line = i + 1;
    const text = words.filter(w => w.line === line);
    const title = page.verses.find(v => v.number === 1 && v.words[0]?.position === 1 && v.words[0]?.line === line + (v.chapter === 9 ? 1 : 2));
    const basmala = page.verses.find(v => v.number === 1 && v.chapter !== 1 && v.chapter !== 9 && v.words[0]?.position === 1 && v.words[0]?.line === line + 1);
    return {line, words:text, title:text.length ? undefined : title?.chapter, basmala:!text.length && !!basmala};
  });
}
export function topReadingWord(words: {key:string;top:number;bottom:number}[], top:number, bottom:number) {
  return words.filter(w => w.bottom > top && w.top < bottom).sort((a,b)=>a.top-b.top)[0]?.key;
}
export function recitationReadingWord(words: ReciteWord[], marks: Marks) {
  const text = words.filter(w => !w.end);
  return text.find(w => marks[w.key] === "in_progress")?.key ?? text.slice().reverse().find(w => ["correct","unsure","wrong","skipped"].includes(marks[w.key]))?.key;
}
export function visiblePageNumber(pages: {page:number;top:number;bottom:number}[], top:number, bottom:number) {
  return pages.map(p=>({...p,visible:Math.max(0,Math.min(p.bottom,bottom)-Math.max(p.top,top))}))
    .filter(p=>p.visible>0).sort((a,b)=>b.visible-a.visible||a.page-b.page)[0]?.page;
}
export function passageContains(page:RecitePage, location:{sura:number;aya:number}) {
  return page.verses.some(v=>v.chapter===location.sura&&v.number===location.aya);
}
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