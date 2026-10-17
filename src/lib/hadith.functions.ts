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
export type HadithPage = { items: Hadith[]; page: number; lastPage: number; total: number };

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

export const getHadiths = createServerFn({ method: "GET" })
  .inputValidator(z.object({
    book: z.string().max(60).optional(),
    chapter: z.number().int().optional(),
    q: z.string().max(100).optional(),
    number: z.string().max(12).optional(),
    page: z.number().int().min(1).max(5000).default(1),
  }))
  .handler(async ({ data }): Promise<HadithPage> => {
    const arabic = data.q && /[\u0600-\u06FF]/.test(data.q);
    const d = await call("hadiths", {
      book: data.book, chapter: data.chapter, hadithNumber: data.number,
      hadithEnglish: arabic ? undefined : data.q, hadithArabic: arabic ? data.q : undefined,
      paginate: 15, page: data.page,
    });
    const h = d?.hadiths;
    if (!h) return { items: [], page: 1, lastPage: 1, total: 0 };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: Hadith[] = (h.data ?? []).map((x: any) => ({
      id: String(x.id), hadithNumber: String(x.hadithNumber), englishNarrator: x.englishNarrator,
      hadithEnglish: x.hadithEnglish, hadithArabic: x.hadithArabic, headingEnglish: x.headingEnglish,
      status: x.status, bookSlug: x.bookSlug, bookName: x.book?.bookName ?? x.bookSlug,
      chapterEnglish: x.chapter?.chapterEnglish ?? null,
    }));
    return { items, page: h.current_page, lastPage: h.last_page, total: h.total };
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
    if (!r.ok) return { names: [] as string[] };
    const j = (await r.json()) as { choices?: { message?: { content?: string } }[] };
    const txt = j.choices?.[0]?.message?.content ?? "";
    try {
      const arr = JSON.parse(txt.slice(txt.indexOf("["), txt.lastIndexOf("]") + 1));
      return { names: Array.isArray(arr) ? arr.map(String).slice(0, data.links.length) : [] };
    } catch { return { names: [] as string[] }; }
  });
