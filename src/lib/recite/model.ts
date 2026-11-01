// Fresh recite state. No dependency on the retired Hifz scheduler or log.
export const RECITE_KEY = "quran-recitation:v1";
export const WORD_STATES = ["pending", "in_progress", "correct", "wrong", "skipped", "unsure"] as const;
export type WordState = (typeof WORD_STATES)[number];
export type ReciteWord = { key: string; verse: string; position: number; line: number; page: number; text: string; glyph: string; tajweed?: string; end: boolean; audio: string | null; translation: string; transliteration: string };
export type ReciteVerse = { key: string; number: number; chapter: number; juz: number; words: ReciteWord[]; translation: string };
export type RecitePage = { page: number; verses: ReciteVerse[] };
export type Marks = Record<string, WordState>;
export type ReciteSettings = {
  layout: "mushaf" | "ayah" | "translation"; size: number; numbers: boolean;
  translation: boolean; transliteration: boolean; hints: "off" | "letter" | "peek";
  mist: boolean; theme: "auto" | "day" | "night"; reciter: number; repeat: string; speed: number;
  mode: "self" | "ai"; hideStyle: "faint" | "mist" | "blank"; hideAmount: "page" | "ayah" | "line"; tajweed: boolean;
};
export const DEFAULT_SETTINGS: ReciteSettings = { layout: "mushaf", size: 26, numbers: true, translation: false, transliteration: false, hints: "off", mist: true, theme: "auto", reciter: 7, repeat: "1", speed: 1, mode: "self", hideStyle: "faint", hideAmount: "page", tajweed: false };
export type SavedRecite = { page: number; settings: ReciteSettings; marks: Marks; grades: Record<string, "Easy" | "Okay" | "Hard">; seconds: Record<number, number> };
export const freshRecite = (): SavedRecite => ({ page: 562, settings: { ...DEFAULT_SETTINGS }, marks: {}, grades: {}, seconds: {} });
export const pageWords = (page: RecitePage) => page.verses.flatMap((v) => v.words).filter((w) => !w.end);
export const revealed = (state?: WordState) => !!state && state !== "pending" && state !== "in_progress";
export function nextWord(words: ReciteWord[], marks: Marks): ReciteWord | undefined { return words.find((w) => !revealed(marks[w.key])); }
export function revealNext(words: ReciteWord[], marks: Marks): Marks {
  const word = nextWord(words, marks);
  return word ? { ...marks, [word.key]: "correct" } : marks;
}
export function revealAyah(words: ReciteWord[], marks: Marks): Marks {
  const word = nextWord(words, marks);
  if (!word) return marks;
  const updated = { ...marks };
  for (const w of words) if (w.verse === word.verse && !revealed(updated[w.key])) updated[w.key] = "correct";
  return updated;
}
export function restartPage(words: ReciteWord[], marks: Marks): Marks {
  const updated = { ...marks };
  for (const w of words) delete updated[w.key];
  return updated;
}
export const markedWords = (words: ReciteWord[], marks: Marks) => words.filter((w) => ["wrong", "skipped", "unsure"].includes(marks[w.key]));
export function isOpeningWord(word: ReciteWord, words: ReciteWord[], amount: ReciteSettings["hideAmount"]): boolean {
  if (amount === "page") return false;
  return words.find((w) => amount === "ayah" ? w.verse === word.verse : w.line === word.line)?.key === word.key;
}
export function readRecite(): SavedRecite {
  try {
    const value = JSON.parse(localStorage.getItem(RECITE_KEY) || "null");
    return value ? { ...freshRecite(), ...value, page: Math.max(1, Math.min(604, Number(value.page) || 562)), settings: { ...DEFAULT_SETTINGS, ...value.settings } } : freshRecite();
  } catch { return freshRecite(); }
}
export function saveRecite(value: SavedRecite) {
  try { localStorage.setItem(RECITE_KEY, JSON.stringify(value)); } catch { /* Reading still works with restricted storage. */ }
}