/** Tafsir books and text, read directly from the public Quran.com v4 API. */
import { cached, DAY } from "@/lib/hadith-cache";

export type TafsirBook = { id: number; name: string; author?: string; lang: string; rtl?: boolean };

export const TAFSIR_BOOKS: TafsirBook[] = [
  { id: 169, name: "Tafsir Ibn Kathir (Abridged)", author: "Hafiz Ibn Kathir", lang: "English" },
  { id: 168, name: "Ma'arif al-Qur'an", author: "Mufti Muhammad Shafi", lang: "English" },
  { id: 817, name: "Tazkirul Quran", author: "Maulana Wahiduddin Khan", lang: "English" },
  { id: 14, name: "Tafsir Ibn Kathir", lang: "Arabic", rtl: true },
  { id: 15, name: "Tafsir al-Tabari", lang: "Arabic", rtl: true },
  { id: 90, name: "Tafsir al-Qurtubi", lang: "Arabic", rtl: true },
  { id: 91, name: "Tafsir al-Sa'di", author: "Taysir al-Karim al-Rahman", lang: "Arabic", rtl: true },
  { id: 94, name: "Tafsir al-Baghawi", lang: "Arabic", rtl: true },
  { id: 16, name: "Tafsir al-Muyassar", author: "King Fahd Complex", lang: "Arabic", rtl: true },
  { id: 93, name: "Al-Tafsir al-Wasit", author: "Tantawi", lang: "Arabic", rtl: true },
  { id: 160, name: "Tafsir Ibn Kathir", lang: "Urdu", rtl: true },
  { id: 159, name: "Bayan ul Quran", author: "Dr. Israr Ahmad", lang: "Urdu", rtl: true },
  { id: 157, name: "Fi Zilal al-Quran", author: "Sayyid Qutb", lang: "Urdu", rtl: true },
  { id: 818, name: "Tazkir ul Quran", author: "Maulana Wahiduddin Khan", lang: "Urdu", rtl: true },
  { id: 164, name: "Tafsir Ibn Kathir", lang: "Bengali" },
  { id: 165, name: "Tafsir Ahsanul Bayaan", lang: "Bengali" },
  { id: 166, name: "Tafsir Abu Bakr Zakaria", lang: "Bengali" },
  { id: 381, name: "Tafsir Fathul Majid", lang: "Bengali" },
  { id: 170, name: "Tafsir al-Sa'di", lang: "Russian" },
  { id: 804, name: "Rebar Kurdish Tafsir", lang: "Kurdish", rtl: true },
];

export const findTafsirBook = (id?: number) => TAFSIR_BOOKS.find((b) => b.id === id);

const ALLOWED = /^(p|br|h[1-6]|b|strong|i|em|ul|ol|li|blockquote|span|div|sup)$/i;
/** Keeps only simple formatting tags and strips every attribute. */
export function sanitizeTafsir(html: string): string {
  return html
    .replace(/<(script|style|iframe)[\s\S]*?<\/\1>/gi, "")
    .replace(/<\/?([a-z0-9]+)[^>]*>/gi, (m, tag: string) => (ALLOWED.test(tag) ? (m.startsWith("</") ? `</${tag}>` : `<${tag}>`) : ""));
}

export async function getTafsir(book: number, key: string): Promise<string> {
  return cached(`tafsir:${book}:${key}`, 30 * DAY, async () => {
    const r = await fetch(`https://api.quran.com/api/v4/tafsirs/${book}/by_ayah/${key}`);
    if (!r.ok) throw new Error("tafsir");
    const j = (await r.json()) as { tafsir?: { text?: string } };
    return sanitizeTafsir(j.tafsir?.text ?? "");
  })();
}

const LAST = "tafsir:last";
export type TafsirProgress = { book: number; key: string };
export function getTafsirProgress(): TafsirProgress | null {
  try { return JSON.parse(localStorage.getItem(LAST) || "null"); } catch { return null; }
}
export function saveTafsirProgress(p: TafsirProgress) {
  try { localStorage.setItem(LAST, JSON.stringify(p)); localStorage.setItem("tafsir:book", String(p.book)); } catch { /* ignore */ }
}
export function preferredTafsirBook(): number {
  const n = Number(typeof localStorage !== "undefined" ? localStorage.getItem("tafsir:book") : 0);
  return findTafsirBook(n) ? n : 169;
}

const API = "https://api.quran.com/api/v4";
async function j<T>(path: string): Promise<T> {
  const r = await fetch(API + path);
  if (!r.ok) throw new Error(path);
  return r.json() as Promise<T>;
}
const strip = (s: string) => s.replace(/<sup[^>]*>.*?<\/sup>/g, "").replace(/<[^>]+>/g, "").trim();

export type ChapterInfo = { short: string; source: string };
export const getChapterInfo = (id: number) => cached(`info:${id}`, 30 * DAY, async () => {
  const r = await j<{ chapter_info: { short_text: string; source: string } }>(`/chapters/${id}/info?language=en`);
  return { short: r.chapter_info.short_text, source: r.chapter_info.source } as ChapterInfo;
})();

export type Juz = { n: number; mapping: Record<string, string> };
export const getJuzs = cached("juzs", 60 * DAY, async () => {
  const r = await j<{ juzs: { juz_number: number; verse_mapping: Record<string, string> }[] }>("/juzs");
  const seen = new Map<number, Juz>();
  for (const z of r.juzs) if (!seen.has(z.juz_number)) seen.set(z.juz_number, { n: z.juz_number, mapping: z.verse_mapping });
  return [...seen.values()].sort((a, b) => a.n - b.n);
});

export type VerseDetail = {
  key: string; arabic: string; translation: string; translit: string;
  words: { ar: string; en: string; tr: string }[];
};
export const getVerseDetail = (key: string) => cached(`vd:${key}`, 30 * DAY, async () => {
  type W = { char_type_name: string; text_uthmani: string; translation?: { text: string }; transliteration?: { text: string } };
  const r = await j<{ verse: { verse_key: string; text_uthmani: string; words: W[]; translations: { resource_id: number; text: string }[] } }>(
    `/verses/by_key/${key}?words=true&word_fields=text_uthmani&translations=20,57&fields=text_uthmani`);
  const t = (id: number) => strip(r.verse.translations.find((x) => x.resource_id === id)?.text ?? "");
  return {
    key, arabic: r.verse.text_uthmani, translation: t(20), translit: t(57),
    words: r.verse.words.filter((w) => w.char_type_name === "word").map((w) => ({ ar: w.text_uthmani, en: w.translation?.text ?? "", tr: w.transliteration?.text ?? "" })),
  } as VerseDetail;
})();

export async function getAyahAudio(key: string): Promise<string | null> {
  const r = await j<{ audio_files: { url: string }[] }>(`/recitations/7/by_ayah/${key}`);
  const u = r.audio_files[0]?.url;
  return u ? (u.startsWith("http") ? u : `https://verses.quran.com/${u}`) : null;
}

/* Device-only bookmarks, history and notes. */
function readList<T>(k: string): T[] { try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return []; } }
function writeList<T>(k: string, v: T[]) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } }
export const getTafsirBookmarks = () => readList<TafsirProgress>("tafsir:bookmarks");
export function toggleTafsirBookmark(p: TafsirProgress): boolean {
  const list = getTafsirBookmarks();
  const has = list.some((b) => b.key === p.key && b.book === p.book);
  writeList("tafsir:bookmarks", has ? list.filter((b) => !(b.key === p.key && b.book === p.book)) : [p, ...list]);
  return !has;
}
export const getTafsirHistory = () => readList<TafsirProgress & { t: number }>("tafsir:history");
export function pushTafsirHistory(p: TafsirProgress) {
  const list = getTafsirHistory().filter((h) => !(h.key === p.key && h.book === p.book));
  writeList("tafsir:history", [{ ...p, t: Date.now() }, ...list].slice(0, 50));
}
export const getTafsirNote = (key: string) => { try { return localStorage.getItem(`tafsir:note:${key}`) ?? ""; } catch { return ""; } };
export const setTafsirNote = (key: string, v: string) => { try { if (v) localStorage.setItem(`tafsir:note:${key}`, v); else localStorage.removeItem(`tafsir:note:${key}`); } catch { /* ignore */ } };
