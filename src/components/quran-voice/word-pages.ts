const API = "https://api.quran.com/api/v4";
const CACHE = "quran-follow-word-pages-v1";
export const wordPages = new Map<string, number>();
const pending = new Map<number, Promise<void>>();
type RawVerse = { verse_key: string; words: { position: number; page_number: number; line_number: number; char_type_name: string }[] };
export function indexWordPages(verses: RawVerse[], lookup = wordPages) {
  for (const verse of verses) for (const word of verse.words) {
    if (word.char_type_name !== "end") lookup.set(`${verse.verse_key}:${word.position}`, word.page_number);
  }
}
export function loadWordPages(sura: number): Promise<void> {
  const existing = pending.get(sura); if (existing) return existing;
  const task = (async () => {
    let store: Cache | undefined;
    try { if (typeof caches !== "undefined") store = await caches.open(CACHE); } catch { /* Private browsing can disable Cache Storage. */ }
    let cursor: number | null = 1;
    while (cursor) {
      const url = `${API}/verses/by_chapter/${sura}?words=true&word_fields=page_number,line_number&per_page=300&page=${cursor}`;
      let response: Response | undefined;
      try { response = await store?.match(url); } catch { /* Use the source API instead. */ }
      if (!response) {
        response = await fetch(url);
        if (!response.ok) throw new Error("Word locations unavailable");
        try { await store?.put(url, response.clone()); } catch { /* Memory cache remains available. */ }
      }
      const data = await response.json() as { verses: RawVerse[]; pagination: { next_page: number | null } };
      indexWordPages(data.verses);
      cursor = data.pagination.next_page;
    }
  })();
  pending.set(sura, task);
  void task.catch(() => pending.delete(sura));
  return task;
}
export async function prepareWordPages() {
  let next = 1;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (next <= 114) await loadWordPages(next++);
  }));
}