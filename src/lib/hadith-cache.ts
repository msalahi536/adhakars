/** Device cache for hadith data so repeat visits open instantly. */
const PREFIX = "hadith-cache:v1:";

export function cached<T>(key: string, maxAgeMs: number, fetcher: () => Promise<T>): () => Promise<T> {
  return async () => {
    const k = PREFIX + key;
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const { t, v } = JSON.parse(raw) as { t: number; v: T };
        if (Date.now() - t < maxAgeMs) return v;
      }
    } catch { /* ignore */ }
    const v = await fetcher();
    try { localStorage.setItem(k, JSON.stringify({ t: Date.now(), v })); } catch { /* storage full */ }
    return v;
  };
}

export const DAY = 86_400_000;
