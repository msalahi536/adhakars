import { queryOptions } from "@tanstack/react-query";
import { stripTags } from "@/lib/quran";
import { loadPageFont } from "@/lib/recite/data";
import type { RecitePage, ReciteWord } from "@/lib/recite/model";
export type VoiceWord = ReciteWord & { glyphPage?: number };
const API = "https://api.quran.com/api/v4";
type RawWord = { position: number; page_number: number; line_number: number; char_type_name: string; text_uthmani: string; code_v2?: string };
type RawVerse = { verse_key: string; verse_number: number; juz_number: number; words: RawWord[]; translations?: { text: string }[] };
const glyphs = new Map<number, Promise<Map<string, RawWord>>>();
const coordinates = new Map<number, Promise<RawVerse[]>>();
function chapterCoordinates(chapter: number) {
  const previous = coordinates.get(chapter); if (previous) return previous;
  const task = (async () => {
    const verses: RawVerse[] = []; let cursor: number | null = 1;
    while (cursor) {
      const response = await fetch(`${API}/verses/by_chapter/${chapter}?words=true&word_fields=page_number,line_number&fields=juz_number&translations=20&language=en&per_page=300&page=${cursor}`);
      if (!response.ok) throw new Error("Page coordinates unavailable");
      const data = await response.json() as {verses:RawVerse[];pagination:{next_page:number|null}};
      verses.push(...data.verses);cursor=data.pagination.next_page;
    }
    return verses;
  })();
  coordinates.set(chapter,task);void task.catch(()=>coordinates.delete(chapter));return task;
}
function chapterGlyphs(chapter: number) {
  const previous = glyphs.get(chapter); if (previous) return previous;
  const task = (async () => {
    const map = new Map<string, RawWord>(); let cursor: number | null = 1;
    while (cursor) {
      const response = await fetch(`${API}/verses/by_chapter/${chapter}?words=true&word_fields=code_v2,page_number,line_number&per_page=300&page=${cursor}`);
      if (!response.ok) throw new Error("Page glyphs unavailable");
      const data = await response.json() as { verses: RawVerse[]; pagination: { next_page: number | null } };
      for (const verse of data.verses) for (const word of verse.words) map.set(`${verse.verse_key}:${word.position}`, word);
      cursor = data.pagination.next_page;
    }
    return map;
  })();
  glyphs.set(chapter, task); void task.catch(() => glyphs.delete(chapter)); return task;
}
export async function fetchVoicePage(page: number): Promise<RecitePage> {
  // code_v2 switches Quran.com's coordinates to a different edition. Keep standard
  // Madani slots, but pair each word with its authentic v2 glyph AND matching font page.
  const raw: RawVerse[] = []; let cursor: number | null = 1;
  while (cursor) {
    const response = await fetch(`${API}/verses/by_page/${page}?words=true&word_fields=text_uthmani,page_number,line_number&fields=juz_number&translations=20&language=en&per_page=50&page=${cursor}`);
    if (!response.ok) throw new Error("Mushaf page unavailable");
    const data = await response.json() as { verses: RawVerse[]; pagination: { next_page: number | null } };
    raw.push(...data.verses); cursor = data.pagination.next_page;
  }
  const chapters = [...new Set(raw.map(v => Number(v.verse_key.split(":")[0])))];
  const maps = new Map(await Promise.all(chapters.map(async chapter => [chapter, await chapterGlyphs(chapter)] as const)));
  // by_page selects verses using v2 boundaries even without code_v2. Read entire
  // chapters to retain ayahs that belong on this standard page but moved in v2.
  const standard = (await Promise.all(chapters.map(chapterCoordinates))).flat().filter(v=>v.words.some(w=>w.page_number===page));
  return { page, verses: standard.map(v => {
    const chapter = Number(v.verse_key.split(":")[0]);
    return { key:v.verse_key, number:v.verse_number, chapter, juz:v.juz_number, translation:stripTags(v.translations?.[0]?.text ?? ""), words:v.words.filter(w=>w.page_number===page).map(w=>{
      const key = `${v.verse_key}:${w.position}`; const glyph = maps.get(chapter)?.get(key);
      return {key,verse:v.verse_key,position:w.position,line:w.line_number,page,text:w.text_uthmani,glyph:glyph?.code_v2 ?? "",glyphPage:glyph?.page_number,end:w.char_type_name==="end",audio:null,translation:"",transliteration:""} satisfies VoiceWord;
    }) };
  }) };
}
export const voicePageOptions = (page: number) => queryOptions({queryKey:["quran-follow-standard-page",page],queryFn:()=>fetchVoicePage(page),staleTime:Infinity});
export async function voicePageFonts(page: RecitePage) {
  const pages = [...new Set(page.verses.flatMap(v=>v.words).map(w=>(w as VoiceWord).glyphPage ?? page.page))];
  const fonts = await Promise.all(pages.map(loadPageFont));
  return fonts.every(Boolean) ? fonts[0] ?? null : null;
}