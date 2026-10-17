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
  }))
  .handler(async ({ data }): Promise<HadithPage> => {
    const base = { book: data.book, chapter: data.chapter, hadithNumber: data.number };
    const raw = (data.q ?? "").trim().replace(/\s+/g, " ");
    if (!raw) return direct(base, data.page);
    const arabic = /[\u0600-\u06FF]/.test(raw);
    if (arabic) {
      const q = raw.replace(/[\u064B-\u065F\u0670]/g, "");
      return { ...(await direct({ ...base, hadithArabic: q }, data.page)), terms: q.split(" ") };
    }
    const lower = raw.toLowerCase();
    // Reference lookup: "<collection> <number>" or "#<number>" inside a book.
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
    const exact = await direct({ ...base, hadithEnglish: phrase }, data.page);
    if (exact.total || quoted || !words.length) return { ...exact, terms: [phrase] };
    const stems = [...new Set(words.map(stem))];
    if (stems.length === 1) return { ...(await direct({ ...base, hadithEnglish: stems[0] }, data.page)), terms: stems };
    // All words, any order: fetch candidates by the rarest-looking word, then filter.
    const anchor = [...stems].sort((a, b) => b.length - a.length)[0];
    const first = await direct({ ...base, hadithEnglish: anchor }, 1, 100);
    const more = await Promise.all(Array.from({ length: Math.min(first.lastPage, 4) - 1 }, (_, i) => direct({ ...base, hadithEnglish: anchor }, i + 2, 100)));
    const all = [first, ...more].flatMap((r) => r.items).filter((h) => { const t = text(h); return stems.every((w) => t.includes(w)); });
    const lastPage = Math.max(1, Math.ceil(all.length / PAGE));
    const page = Math.min(data.page, lastPage);
    return { items: all.slice((page - 1) * PAGE, page * PAGE), page, lastPage, total: all.length, terms: stems };
  });

/** Translates an Arabic isnad (list of narrator links) into English names, in order. */
export const translateIsnad = createServerFn({ method: "POST" })
  .inputValidator(z.object({ links: z.array(z.string().max(400)).min(1).max(20) }))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { names: [] as string[] };
    const r = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Lovable-API-Key": key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions: "You transliterate hadith narrator names from Arabic into standard English scholarly transliteration (e.g. 'Umar ibn al-Khattab, Yahya ibn Sa'id al-Ansari). Return one name per input line, same order. Name only, no verbs like 'narrated'.",
        input: data.links.map((l, i) => `${i + 1}. ${l}`).join("\n"),
        text: { format: { type: "json_schema", name: "isnad", strict: true, schema: {
          type: "object", additionalProperties: false, required: ["names"],
          properties: { names: { type: "array", items: { type: "string" } } },
        } } },
      }),
    });
    if (!r.ok || !r.body) return { names: [] as string[] };
    const reader = r.body.getReader();
    const dec = new TextDecoder();
    let buf = "", txt = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n"); buf = lines.pop() ?? "";
      for (const ln of lines) {
        if (!ln.startsWith("data:")) continue;
        try { const ev = JSON.parse(ln.slice(5)); if (ev.type === "response.output_text.delta") txt += ev.delta; } catch { /* skip */ }
      }
    }
    try {
      const arr = (JSON.parse(txt) as { names: unknown[] }).names;
      return { names: Array.isArray(arr) ? arr.map(String).slice(0, data.links.length) : [] };
    } catch { return { names: [] as string[] }; }
  });
