import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const BASE = "https://hadithapi.com/api";

export type HadithBook = {
  bookName: string; writerName: string; bookSlug: string; hadiths_count: number; chapters_count: number;
};
export type HadithChapter = { chapterNumber: number; chapterEnglish: string; chapterArabic: string };
export type Hadith = {
  id: string; hadithNumber: string; englishNarrator: string | null; hadithEnglish: string | null;
  hadithArabic: string | null; headingEnglish: string | null; status: string | null; bookSlug: string;
  bookName: string; chapterEnglish: string | null;
};
export type HadithPage = { items: Hadith[]; page: number; lastPage: number; total: number; terms?: string[] };

async function call(path: string, params: Record<string, string | number | undefined> = {}) {
  const key = process.env.HADITH_API_KEY;
  if (!key) throw new Error("Hadith service is not configured");
  const u = new URL(`${BASE}/${path}`);
  u.searchParams.set("apiKey", key);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") u.searchParams.set(k, String(v));
  const r = await fetch(u.toString());
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Hadith service error ${r.status}`);
  return r.json();
}

export const getHadithBooks = createServerFn({ method: "GET" }).handler(async () => {
  const d = await call("books");
  const books = ((d?.books ?? []) as HadithBook[])
    .filter((b) => Number(b.hadiths_count) > 0)
    .map((b) => ({ bookName: b.bookName, writerName: b.writerName, bookSlug: b.bookSlug,
      hadiths_count: Number(b.hadiths_count), chapters_count: Number(b.chapters_count) }));
  return books;
});

export const getHadithChapters = createServerFn({ method: "GET" })
  .inputValidator(z.object({ book: z.string().min(1).max(60) }))
  .handler(async ({ data }) => {
    const d = await call(`${data.book}/chapters`);
    return ((d?.chapters ?? []) as HadithChapter[]).map((c) => ({
      chapterNumber: Number(c.chapterNumber), chapterEnglish: c.chapterEnglish, chapterArabic: c.chapterArabic,
    }));
  });

const BOOK_ALIASES: [RegExp, string][] = [
  [/^(sahih\s*)?(al[-\s]?)?bukh?ari$/, "sahih-bukhari"], [/^(sahih\s*)?muslim$/, "sahih-muslim"],
  [/^(jami\S*\s*)?(at|al)?[-\s]?tirmi?dhi$/, "al-tirmidhi"], [/^(sunan\s*)?abu?\s*daw(oo|u)?d$/, "abu-dawood"],
  [/^(sunan\s*)?ibn[-\s]?(e[-\s]?)?maja?h?$/, "ibn-e-majah"], [/^(sunan\s*)?(an[-\s]?)?nasa\W?i$/, "sunan-nasai"],
  [/^mishkat(\s*al[-\s]?masabih)?$/, "mishkat"],
];
const STOP = new Set("the a an of and or to in on for is was be by with that this it as at from his her he she they who what about".split(" "));
const stem = (w: string) => w.length > 5 ? w.replace(/(ings?|ness|ers?|ed|es|s)$/, "") : w.length > 3 ? w.replace(/s$/, "") : w;
const PAGE = 15;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapItem = (x: any): Hadith => ({
  id: String(x.id), hadithNumber: String(x.hadithNumber), englishNarrator: x.englishNarrator,
  hadithEnglish: x.hadithEnglish, hadithArabic: x.hadithArabic, headingEnglish: x.headingEnglish,
  status: x.status, bookSlug: x.bookSlug, bookName: x.book?.bookName ?? x.bookSlug,
  chapterEnglish: x.chapter?.chapterEnglish ?? null,
});
const text = (h: Hadith) => [h.hadithEnglish, h.headingEnglish, h.englishNarrator, h.chapterEnglish].join(" ").toLowerCase();

async function direct(p: Record<string, string | number | undefined>, page: number, size = PAGE) {
  const d = await call("hadiths", { ...p, paginate: size, page });
  const h = d?.hadiths;
  if (!h) return { items: [] as Hadith[], page: 1, lastPage: 1, total: 0 };
  return { items: (h.data ?? []).map(mapItem) as Hadith[], page: h.current_page, lastPage: h.last_page, total: h.total };
}

/**
 * Smart search on top of the service's plain substring filter:
 * "bukhari 1" / "muslim #50" references, "quoted phrases", exact phrase first,
 * then all-words-in-any-order matching with simple word stems.
 */
export const getHadiths = createServerFn({ method: "GET" })
  .inputValidator(z.object({
    book: z.string().max(60).optional(),
    chapter: z.number().int().optional(),
    q: z.string().max(140).optional(),
    number: z.string().max(12).optional(),
    page: z.number().int().min(1).max(5000).default(1),
    sort: z.enum(["relevance", "grade", "book", "number"]).optional(),
  }))
  .handler(async ({ data }): Promise<HadithPage> => {
    if (!data.sort || data.sort === "relevance") return search(data, data.page, PAGE);
    // Sorting needs results from every collection, not just the service's first
    // pages (which are all one book): gather up to 100 per collection, then sort.
    const books = data.book ? [data.book] : BOOK_ALIASES.map(([, slug]) => slug);
    const parts = await Promise.all(books.map((book) => search({ ...data, book }, 1, 100).catch(() => null)));
    const seen = new Set<string>();
    const all = parts.flatMap((r) => r?.items ?? []).filter((h) => !seen.has(h.id) && !!seen.add(h.id));
    const first = { total: parts.reduce((n, r) => n + (r?.total ?? 0), 0), terms: parts.find((r) => r?.terms)?.terms };
    const rank = (st: string | null) => { const v = (st || "").toLowerCase(); return v.includes("sahih") ? 0 : v.includes("hasan") ? 1 : 2; };
    const num = (h: Hadith) => parseInt(h.hadithNumber, 10) || 0;
    if (data.sort === "grade") all.sort((a, b) => rank(a.status) - rank(b.status));
    if (data.sort === "book") all.sort((a, b) => a.bookName.localeCompare(b.bookName) || num(a) - num(b));
    if (data.sort === "number") all.sort((a, b) => num(a) - num(b));
    const lastPage = Math.max(1, Math.ceil(all.length / PAGE));
    const page = Math.min(data.page, lastPage);
    return { items: all.slice((page - 1) * PAGE, page * PAGE), page, lastPage, total: Math.max(first.total, all.length), terms: first.terms };
  });

type Q = { book?: string; chapter?: number; q?: string; number?: string };
async function search(data: Q, pageIn: number, size: number): Promise<HadithPage> {
    const base = { book: data.book, chapter: data.chapter, hadithNumber: data.number };
    const raw = (data.q ?? "").trim().replace(/\s+/g, " ");
    if (!raw) return direct(base, pageIn, size);
    const arabic = /[\u0600-\u06FF]/.test(raw);
    if (arabic) {
      const q = raw.replace(/[\u064B-\u065F\u0670]/g, "");
      return { ...(await direct({ ...base, hadithArabic: q }, pageIn, size)), terms: q.split(" ") };
    }
    const lower = raw.toLowerCase();
    const ref = lower.match(/^(.*?)\s*#?\s*(\d{1,5})$/);
    if (ref) {
      const name = ref[1].trim();
      const slug = name ? BOOK_ALIASES.find(([r]) => r.test(name))?.[1] : data.book;
      if (slug) {
        const r = await direct({ book: slug, hadithNumber: ref[2] }, 1);
        if (r.total) return { ...r, terms: [] };
      }
    }
    const quoted = /^["“].*["”]$/.test(raw);
    const phrase = lower.replace(/^["“]|["”]$/g, "").replace(/[^\p{L}\p{N}' -]/gu, " ").replace(/\s+/g, " ").trim();
    const words = phrase.split(" ").filter((w) => w.length > 1 && !STOP.has(w));
    const smart = !quoted && pageIn === 1 && size === PAGE && words.length >= 2 ? aiMatches(raw, base) : Promise.resolve([] as Hadith[]);
    const withSmart = async (r: HadithPage): Promise<HadithPage> => {
      const extra = await smart.catch(() => [] as Hadith[]);
      if (!extra.length) return r;
      const ids = new Set(extra.map((h) => h.id));
      return { ...r, items: [...extra, ...r.items.filter((h) => !ids.has(h.id))], total: Math.max(r.total, extra.length) };
    };
    const exact = await direct({ ...base, hadithEnglish: phrase }, pageIn, size);
    if (exact.total || quoted || !words.length) return withSmart({ ...exact, terms: [phrase] });
    const stems = [...new Set(words.map(stem))];
    if (stems.length === 1) return withSmart({ ...(await direct({ ...base, hadithEnglish: stems[0] }, pageIn, size)), terms: stems });
    const anchor = [...stems].sort((a, b) => b.length - a.length)[0];
    const first = await direct({ ...base, hadithEnglish: anchor }, 1, 100);
    const more = await Promise.all(Array.from({ length: Math.min(first.lastPage, 4) - 1 }, (_, i) => direct({ ...base, hadithEnglish: anchor }, i + 2, 100)));
    const all = [first, ...more].flatMap((r) => r.items).filter((h) => { const t = text(h); return stems.every((w) => t.includes(w)); });
    const lastPage = Math.max(1, Math.ceil(all.length / size));
    const page = Math.min(pageIn, lastPage);
    return withSmart({ items: all.slice((page - 1) * size, page * size), page, lastPage, total: all.length, terms: stems });
}

/**
 * Meaning search: AI picks rare words to gather candidates from the service,
 * then picks which candidates match the description. Hadith text always comes
 * from the service, never from AI.
 */
async function aiMatches(q: string, base: Record<string, string | number | undefined>): Promise<Hadith[]> {
  const { geminiJson } = await import("./gemini.server");
  const arr = { type: "array", items: { type: "string" } };
  const w = await geminiJson<{ words: unknown[] }>(
    "You help find hadith from vague descriptions or paraphrases. Return 1-4 rare single words (names of surahs, people, places, objects, distinctive acts) likely to appear in the English translation of matching hadith, including common spelling variants (e.g. baqara and baqarah). Lowercase.",
    q, { type: "object", properties: { words: arr }, required: ["words"] },
  );
  const words = [...new Set((Array.isArray(w?.words) ? w.words : []).map((x) => String(x).toLowerCase().trim()).filter((x) => x.length > 2))].slice(0, 4);
  if (!words.length) return [];
  const seen = new Set<string>();
  const pool = (await Promise.all(words.map((x) => direct({ ...base, hadithEnglish: x }, 1, 100).catch(() => null))))
    .flatMap((r) => r?.items ?? []).filter((h) => !seen.has(h.id) && !!seen.add(h.id)).slice(0, 220);
  if (!pool.length) return [];
  const list = pool.map((h) => `${h.id}: ${(h.hadithEnglish ?? "").replace(/\s+/g, " ").slice(0, 500)}`).join("\n");
  const pick = await geminiJson<{ ids: unknown[] }>(
    "Given a user's description and hadith texts (id: text), return ids of hadith whose meaning matches the description, best first, max 5. Return an empty list if none truly match.",
    `Description: ${q}\n\n${list}`, { type: "object", properties: { ids: arr }, required: ["ids"] },
  );
  const byId = new Map(pool.map((h) => [h.id, h]));
  return (Array.isArray(pick?.ids) ? pick.ids : []).map((x) => byId.get(String(x))).filter((h): h is Hadith => !!h).slice(0, 5);
}

/** Translates an Arabic isnad (list of narrator links) into English names, in order. */
export const translateIsnad = createServerFn({ method: "POST" })
  .inputValidator(z.object({ links: z.array(z.string().max(400)).min(1).max(20) }))
  .handler(async ({ data }) => {
    // Shared narrator dictionary: names translated once are reused by everyone instantly.
    const norm = (t: string) => t.replace(/[\u064B-\u065F\u0670\u0640]/g, "").replace(/[أإآ]/g, "ا").replace(/\s+/g, " ").trim();
    const keys = data.links.map(norm);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const known = new Map<string, string>();
    try {
      const { data: rows } = await supabaseAdmin.from("isnad_names").select("ar,en").in("ar", [...new Set(keys)]);
      for (const r of rows ?? []) known.set(r.ar, r.en);
    } catch { /* dictionary unavailable; fall through to AI */ }
    const missingIdx = keys.map((k, i) => (known.has(k) ? -1 : i)).filter((i) => i >= 0);
    if (!missingIdx.length) return { names: keys.map((k) => known.get(k)!) };
    const fresh = await aiNames(missingIdx.map((i) => data.links[i]));
    if (fresh.length === missingIdx.length) {
      const up = missingIdx.map((i, j) => ({ ar: keys[i], en: fresh[j] })).filter((r) => r.en.trim());
      missingIdx.forEach((i, j) => known.set(keys[i], fresh[j]));
      try { await supabaseAdmin.from("isnad_names").upsert(up, { onConflict: "ar", ignoreDuplicates: true }); } catch { /* ignore */ }
    }
    return { names: keys.map((k) => known.get(k) ?? "") };
  });

async function aiNames(links: string[]): Promise<string[]> {
    const { geminiJson } = await import("./gemini.server");
    const res = await geminiJson<{ names: unknown[] }>(
      "You transliterate hadith narrator names from Arabic into standard English scholarly transliteration without diacritics (e.g. 'Umar ibn al-Khattab, Yahya ibn Sa'id al-Ansari). Return one name per input line, same order. Name only, no verbs like 'narrated'.",
      links.map((l, i) => `${i + 1}. ${l}`).join("\n"),
      { type: "object", properties: { names: { type: "array", items: { type: "string" } } }, required: ["names"] },
    );
    return Array.isArray(res?.names) ? res.names.map(String).slice(0, links.length) : [];
}
