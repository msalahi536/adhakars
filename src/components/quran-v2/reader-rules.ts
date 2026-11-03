import type { Marks, RecitePage, ReciteWord } from "@/lib/recite/model";
export const LAYOUTS = ["Mushaf text", "Framed mushaf", "Translation"] as const;
export type ReaderLayout = typeof LAYOUTS[number];
export type ReaderPaging = "scroll" | "swipe";
export function swipeDestination(page: number, dx: number, dy: number): number {
  if (Math.abs(dx) < 65 || Math.abs(dx) <= Math.abs(dy) * 1.3) return page;
  return Math.max(1, Math.min(604, page + (dx > 0 ? 1 : -1)));
}
export function recitedWord(status: string | undefined) { return status === "correct" || status === "unsure"; }
export function hiddenWordVisible(status: string | undefined, manual = false) {
  return manual || status === "in_progress" || recitedWord(status) || status === "wrong" || status === "skipped";
}
export function recitationReadingWord(words: ReciteWord[], marks: Marks): ReciteWord | undefined {
  const text = words.filter(w => !w.end);
  return text.find(w => marks[w.key] === "in_progress") ?? [...text].reverse().find(w => ["correct", "unsure", "wrong", "skipped"].includes(marks[w.key]));
}
export function topReadingWord(words: {key:string;top:number;bottom:number}[], top:number, bottom:number) {
  return words.filter(w => w.bottom > top && w.top < bottom).sort((a,b) => a.top-b.top)[0]?.key;
}
export function mushafRows(page: RecitePage) {
  const words = page.verses.flatMap(v => v.words);
  const rows = Array.from({length:Math.max(15, ...words.map(w => w.line))}, (_,i) => ({line:i+1, words:words.filter(w => w.line===i+1), chapter:0, basmala:false}));
  for (const verse of page.verses) {
    if (verse.number !== 1 || !verse.words.some(w => w.position === 1)) continue;
    const firstLine = Math.min(...verse.words.map(w => w.line));
    const title = rows.find(r => r.line === firstLine-(verse.chapter===9?1:2));
    if (title && !title.words.length) title.chapter = verse.chapter;
    const basmala = rows.find(r => r.line === firstLine-1);
    if (verse.chapter!==1 && verse.chapter!==9 && basmala && !basmala.words.length && !basmala.chapter) basmala.basmala = true;
  }
  return rows;
}
export function normalizeSurahSearch(value:string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/g, "")
    .replace(/[أإآٱ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه")
    .replace(/[٠-٩]/g,d=>String(d.charCodeAt(0)-0x660)).replace(/[۰-۹]/g,d=>String(d.charCodeAt(0)-0x6f0))
    .trim().replace(/^سوره\s*/,"").replace(/^ال/,"").replace(/^al[\s-]+/,"").replace(/[\s'-]/g,"");
}
export function matchesSurahSearch(chapter:{id:number;name_simple:string;name_arabic:string;name_complex?:string}, query:string) {
  const q=normalizeSurahSearch(query);
  if (!q) return true;
  if (/^\d+$/.test(q)) return chapter.id===Number(q);
  return [chapter.name_simple,chapter.name_arabic,chapter.name_complex??""].some(name=>normalizeSurahSearch(name).includes(q));
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