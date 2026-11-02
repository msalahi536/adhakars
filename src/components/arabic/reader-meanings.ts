/**
 * Reader hook: meanings of words the learner knows, shown faintly in the Quran v2 reader.
 * Loaded lazily so the reader bundle stays light; returns null unless the setting is on and
 * at least 20 words are known. Never used in the hifz mushaf.
 */
import { loadState, localDay, knownWords, analyzeWord } from "@/lib/arabic";

let cache: { known: Set<string>; meanings: Map<string, string> } | null | undefined;

export function knownWordMeanings(): { meaningFor(text: string): string | undefined } | null {
  if (cache === undefined) {
    try {
      const s = loadState(localDay());
      if (!s.settings.showMeanings) { cache = null; return null; }
      const known = knownWords(s);
      cache = known.size >= 20 ? { known, meanings: new Map() } : null;
    } catch {
      cache = null;
    }
  }
  if (!cache) return null;
  const { known, meanings } = cache;
  return {
    meaningFor(text: string) {
      if (meanings.has(text)) return meanings.get(text);
      const a = analyzeWord(text);
      const en = a.word && known.has(a.word.id) ? a.word.en : undefined;
      meanings.set(text, en ?? "");
      return en || undefined;
    },
  };
}
