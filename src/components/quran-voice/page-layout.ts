import type { RecitePage, ReciteWord } from "@/lib/recite/model";

export type LineSlot = { line: number; words: ReciteWord[]; header?: number; basmala?: number };
export function madaniSlots(page: RecitePage): LineSlot[] {
  const slots = Array.from({ length: 15 }, (_, i) => ({ line: i + 1, words: page.verses.flatMap(v => v.words).filter(w => w.line === i + 1) } as LineSlot));
  for (const verse of page.verses) {
    const first = verse.words.find(w => !w.end);
    if (verse.number !== 1 || first?.position !== 1) continue;
    const before = (first?.line ?? 1) - 2;
    const empty = (index: number) => index >= 0 && !slots[index].words.length && !slots[index].header && !slots[index].basmala;
    if (verse.chapter === 1 || verse.chapter === 9) {
      if (empty(before)) slots[before].header = verse.chapter;
    } else if (empty(before) && empty(before - 1)) {
      slots[before - 1].header = verse.chapter;
      slots[before].basmala = verse.chapter;
    } else if (empty(before)) slots[before].header = verse.chapter;
  }
  return slots;
}

export function followPage(position: { sura: number; aya: number; word: number; locked: boolean }, lookup: ReadonlyMap<string, number>, currentPage: number) {
  return position.locked ? lookup.get(`${position.sura}:${position.aya}:${position.word}`) ?? currentPage : currentPage;
}