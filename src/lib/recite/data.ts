import { queryOptions } from "@tanstack/react-query";
import { getChapters, stripTags } from "@/lib/quran";
import type { RecitePage, ReciteVerse } from "./model";
const API = "https://api.quran.com/api/v4";
type RawVerse = { verse_key: string; verse_number: number; juz_number: number; translations?: { text: string }[]; words: { position: number; page_number: number; line_number: number; text_uthmani: string; text_uthmani_tajweed?: string; code_v2: string; char_type_name: string; audio_url?: string; translation?: { text: string }; transliteration?: { text: string } }[] };
export async function fetchRecitePage(page: number): Promise<RecitePage> {
  const verses: ReciteVerse[] = [];
  let cursor: number | null = 1;
  while (cursor) {
    const res = await fetch(`${API}/verses/by_page/${page}?words=true&word_fields=text_uthmani,text_uthmani_tajweed,code_v2,line_number,page_number,audio_url&fields=page_number,juz_number&translations=20&language=en&per_page=50&page=${cursor}`);
    if (!res.ok) throw new Error("This page could not be loaded. Please check your connection.");
    const data = await res.json() as { verses: RawVerse[]; pagination: { next_page: number | null } };
    for (const v of data.verses) verses.push({
      key: v.verse_key, number: v.verse_number, chapter: Number(v.verse_key.split(":")[0]), juz: v.juz_number,
      translation: stripTags(v.translations?.[0]?.text ?? ""),
      words: v.words.filter((w) => w.page_number === page).map((w) => ({
        key: `${v.verse_key}:${w.position}`, verse: v.verse_key, position: w.position, page: w.page_number, line: w.line_number,
        text: w.text_uthmani, glyph: w.code_v2, tajweed: w.text_uthmani_tajweed, end: w.char_type_name === "end",
        audio: w.audio_url ? `https://audio.qurancdn.com/${w.audio_url}` : null,
        translation: stripTags(w.translation?.text ?? ""), transliteration: w.transliteration?.text ?? "",
      })),
    });
    cursor = data.pagination.next_page;
  }
  return { page, verses };
}
export const recitePageOptions = (page: number) => queryOptions({ queryKey: ["fresh-recitation-page", page], queryFn: () => fetchRecitePage(page), staleTime: Infinity });
export const reciteChaptersOptions = queryOptions({ queryKey: ["fresh-recitation-chapters"], queryFn: getChapters, staleTime: Infinity });
const pageFonts = new Map<number, Promise<string | null>>();
export function loadPageFont(page: number): Promise<string | null> {
  const cached = pageFonts.get(page);
  if (cached) return cached;
  const pending = fetchPageFont(page);
  pageFonts.set(page, pending);
  void pending.then((name) => { if (!name) pageFonts.delete(page); });
  return pending;
}
async function fetchPageFont(page: number): Promise<string | null> {
  try {
    const name = `RecitePage${page}`;
    const font = new FontFace(name, `url(https://static.qurancdn.com/fonts/quran/hafs/v2/woff2/p${page}.woff2)`);
    const loaded = await font.load();
    document.fonts.add(loaded);
    return name;
  } catch { return null; }
}

export async function reciteDestinationPage(kind: "surah" | "juz", id: number): Promise<number> {
  const path = kind === "surah" ? `by_chapter/${id}` : `by_juz/${id}`;
  const res = await fetch(`${API}/verses/${path}?fields=page_number&per_page=1&page=1`);
  if (!res.ok) throw new Error("This destination could not be loaded. Please try again.");
  const data = await res.json() as { verses: { page_number: number }[] };
  const page = data.verses[0]?.page_number;
  if (!page || page < 1 || page > 604) throw new Error("This destination is unavailable.");
  return page;
}