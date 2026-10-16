// Quran content from the public Quran.com API (v4). Fetched in the browser
// and cached in memory per session.
const API = "https://api.quran.com/api/v4";

export type Chapter = {
  id: number;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
  revelation_place: string;
  bismillah_pre: boolean;
  translated_name: { name: string };
};

export type Word = { position: number; text: string; isEnd: boolean };
export type Verse = {
  key: string;
  number: number;
  words: Word[];
  translation: string;
  transliteration: string;
};
export type Timing = { key: string; from: number; to: number; segments: [number, number, number][] };
export type ChapterAudio = { url: string; timings: Timing[] };

export const RECITERS = [
  { id: 7, name: "Mishary Alafasy" },
  { id: 3, name: "Abdur-Rahman as-Sudais" },
  { id: 2, name: "Abdul Basit (Murattal)" },
  { id: 6, name: "Mahmoud Khalil Al-Husary" },
  { id: 9, name: "Mohamed Siddiq al-Minshawi" },
] as const;

const cache = new Map<string, Promise<unknown>>();
function get<T>(path: string): Promise<T> {
  if (!cache.has(path)) {
    const p = fetch(API + path).then((r) => {
      if (!r.ok) throw new Error("Quran request failed");
      return r.json();
    });
    p.catch(() => cache.delete(path));
    cache.set(path, p);
  }
  return cache.get(path) as Promise<T>;
}

export const stripTags = (s: string) => s.replace(/<sup[^>]*>.*?<\/sup>/g, "").replace(/<[^>]+>/g, "").trim();

export async function getChapters(): Promise<Chapter[]> {
  return (await get<{ chapters: Chapter[] }>("/chapters?language=en")).chapters;
}

export async function getVerses(chapter: number): Promise<Verse[]> {
  type Raw = { verse_key: string; verse_number: number; words: { position: number; text_uthmani: string; char_type_name: string }[]; translations: { text: string }[] };
  const raw: Raw[] = [];
  let page = 1;
  for (;;) {
    const res = await get<{ verses: Raw[]; pagination: { next_page: number | null } }>(
      `/verses/by_chapter/${chapter}?language=en&words=true&word_fields=text_uthmani&translations=20&per_page=50&page=${page}`,
    );
    raw.push(...res.verses);
    if (!res.pagination.next_page) break;
    page = res.pagination.next_page;
  }
  const translit = await get<{ translations: { text: string }[] }>(`/quran/translations/57?chapter_number=${chapter}`)
    .then((r) => r.translations).catch(() => []);
  return raw.map((v, i) => ({
    key: v.verse_key,
    number: v.verse_number,
    words: v.words.map((w) => ({ position: w.position, text: w.text_uthmani, isEnd: w.char_type_name === "end" })),
    translation: stripTags(v.translations[0]?.text ?? ""),
    transliteration: stripTags(translit[i]?.text ?? ""),
  }));
}

export async function getChapterAudio(reciter: number, chapter: number): Promise<ChapterAudio> {
  type Raw = { audio_file: { audio_url: string; timestamps: { verse_key: string; timestamp_from: number; timestamp_to: number; segments: number[][] }[] } };
  const r = await get<Raw>(`/chapter_recitations/${reciter}/${chapter}?segments=true`);
  return {
    url: r.audio_file.audio_url,
    timings: r.audio_file.timestamps.map((t) => ({
      key: t.verse_key,
      from: t.timestamp_from,
      to: t.timestamp_to,
      segments: (t.segments ?? []).filter((s) => s.length >= 3).map((s) => [s[0], s[1], s[2]] as [number, number, number]),
    })),
  };
}

/** Which verse and word are being recited at `ms` into the chapter audio. */
export function locate(timings: Timing[], ms: number): { key: string | null; word: number | null } {
  const t = timings.find((x) => ms >= x.from && ms < x.to);
  if (!t) return { key: null, word: null };
  const seg = t.segments.find((s) => ms >= s[1] && ms < s[2]);
  return { key: t.key, word: seg ? seg[0] : null };
}
