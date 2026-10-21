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
