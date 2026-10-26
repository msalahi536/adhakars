// Uthmani (Hafs) words with Madani 15-line page/line positions from Quran.com, cached on the
// device so a surah works offline once loaded. Audio is never cached; it streams when online.
const API = "https://api.quran.com/api/v4";

export type MWord = { key: string; pos: number; text: string; end: boolean; page: number; line: number };
export type MChapter = { id: number; name: string; arabic: string; verses: number };

const read = <T,>(k: string): T | null => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
};
const write = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* storage full: still works online */
  }
};

export async function hifzChapters(): Promise<MChapter[]> {
  const k = "hifz:chapters";
  const hit = read<MChapter[]>(k);
  if (hit) return hit;
  const r = await fetch(`${API}/chapters?language=en`).then((x) => x.json());
  const list: MChapter[] = r.chapters.map((c: { id: number; name_simple: string; name_arabic: string; verses_count: number }) => ({
    id: c.id, name: c.name_simple, arabic: c.name_arabic, verses: c.verses_count,
  }));
  write(k, list);
  return list;
}

export async function hifzWords(chapter: number): Promise<MWord[]> {
  const k = `hifz:words:${chapter}`;
  const hit = read<MWord[]>(k);
  if (hit) return hit;
  type Raw = { verse_key: string; words: { position: number; text_uthmani: string; char_type_name: string; page_number: number; line_number: number }[] };
  const out: MWord[] = [];
  for (let page = 1; ; ) {
    const r = await fetch(`${API}/verses/by_chapter/${chapter}?words=true&word_fields=text_uthmani,page_number,line_number&per_page=50&page=${page}`).then((x) => {
      if (!x.ok) throw new Error("Could not load this surah");
      return x.json();
    });
    for (const v of r.verses as Raw[])
      for (const w of v.words)
        out.push({ key: v.verse_key, pos: w.position, text: w.text_uthmani, end: w.char_type_name === "end", page: w.page_number, line: w.line_number });
    if (!r.pagination.next_page) break;
    page = r.pagination.next_page;
  }
  write(k, out);
  return out;
}

/** Group a chunk's words into mushaf lines (page, then line), in reading order. */
export function toLines(words: MWord[]): { id: string; page: number; line: number; words: MWord[] }[] {
  const map = new Map<string, { id: string; page: number; line: number; words: MWord[] }>();
  for (const w of words) {
    const id = `${w.page}-${w.line}`;
    if (!map.has(id)) map.set(id, { id, page: w.page, line: w.line, words: [] });
    map.get(id)!.words.push(w);
  }
  return [...map.values()];
}

/** Deterministic progressive fade: pass 1 hides ~25% of words, each pass ~25% more. */
export function fadeHidden(index: number, pass: number): boolean {
  const h = ((index + 1) * 2654435761) % 100;
  return h < Math.min(90, pass * 25);
}

export const firstLetter = (t: string) => {
  const m = t.match(/^\p{L}\p{M}*/u);
  return m ? m[0] : t.slice(0, 1);
};
