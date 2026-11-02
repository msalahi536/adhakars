/**
 * Track 2 (Understand): the Quran's most frequent word families, our own list (counted from the
 * recitation model's Quran text; no third-party corpus). Each entry groups every form of a word
 * (قَالَ: قَالُوا, يَقُولُ, قُلْ…) under one dictionary form with its root and meaning.
 *
 * analyzeWord() finds a Quran word's family and the small pieces around it (وَ, بِ, ٱل, هُمْ…),
 * so the reader can show meanings of known words and "you understood 9 of 12 words".
 */
import WORDS from "@/data/arabic/words.json";
import FORMS from "@/data/arabic/forms.json";

export type WordKind = "p" | "pr" | "n" | "v" | "adj" | "name";
export interface VocabWord {
  id: string; // "v1".. by frequency
  ar: string; // dictionary form, vowelled
  root: string; // 3 root letters, "" for particles and names
  en: string; // short meaning
  kind: WordKind;
  freq: number; // times it appears in the Quran
  ex: string; // example "sura:aya:word" (Al-Fatiha / Juz Amma first)
  exText: string; // that word as written
}

const DATA = WORDS as { total: number; words: VocabWord[]; coverage: number[] };
export const VOCAB: VocabWord[] = DATA.words;
export const VOCAB_BY_ID = new Map(VOCAB.map((w) => [w.id, w]));
/** Total words in the Quran (77,433). */
export const QURAN_WORDS = DATA.total;
const FORM_INDEX = FORMS as Record<string, number>;

/** Share of all Quran words covered by the first n families (n = 500 -> ~0.80). */
export function coverageOfTop(n: number): number {
  return n <= 0 ? 0 : DATA.coverage[Math.min(n, DATA.coverage.length) - 1];
}

/** Share of Quran words covered by a set of known families. */
export function coverageOf(known: Iterable<string>): number {
  let n = 0;
  for (const id of known) n += VOCAB_BY_ID.get(id)?.freq ?? 0;
  return n / QURAN_WORDS;
}

// ---------- the small pieces: taught as items of their own ----------

export interface Affix {
  id: string;
  ar: string;
  at: "front" | "end";
  en: string;
  bare: string; // as it appears in bare letters
}
export const AFFIXES: Affix[] = [
  { id: "a:wa", ar: "وَ", at: "front", en: "and", bare: "و" },
  { id: "a:fa", ar: "فَ", at: "front", en: "so, then", bare: "ف" },
  { id: "a:bi", ar: "بِ", at: "front", en: "with, by, in", bare: "ب" },
  { id: "a:li", ar: "لِ", at: "front", en: "for, to", bare: "ل" },
  { id: "a:ka", ar: "كَ", at: "front", en: "like", bare: "ك" },
  { id: "a:al", ar: "ٱلْ", at: "front", en: "the", bare: "ال" },
  { id: "a:sa", ar: "سَ", at: "front", en: "will (soon)", bare: "س" },
  { id: "a:hu", ar: "ـهُ", at: "end", en: "him, his, it", bare: "ه" },
  { id: "a:ha", ar: "ـهَا", at: "end", en: "her, its", bare: "ها" },
  { id: "a:hum", ar: "ـهُمْ", at: "end", en: "them, their", bare: "هم" },
  { id: "a:huma", ar: "ـهُمَا", at: "end", en: "the two of them", bare: "هما" },
  { id: "a:hunna", ar: "ـهُنَّ", at: "end", en: "them (women)", bare: "هن" },
  { id: "a:ka2", ar: "ـكَ", at: "end", en: "you, your", bare: "ك" },
  { id: "a:kum", ar: "ـكُمْ", at: "end", en: "you all, your", bare: "كم" },
  { id: "a:kuma", ar: "ـكُمَا", at: "end", en: "you two, your", bare: "كما" },
  { id: "a:kunna", ar: "ـكُنَّ", at: "end", en: "you (women), your", bare: "كن" },
  { id: "a:na", ar: "ـنَا", at: "end", en: "us, our; we", bare: "نا" },
  { id: "a:ni", ar: "ـنِي", at: "end", en: "me", bare: "ني" },
  { id: "a:i", ar: "ـِي", at: "end", en: "my, me", bare: "ي" },
];
export const AFFIX = new Map(AFFIXES.map((a) => [a.id, a]));

/** Verb patterns: taught as tiny grammar, only because they unlock meaning. */
export const PATTERNS = [
  { id: "g:ya", ar: "يَـ…", en: "he does / will do", example: "يَعْلَمُ — he knows" },
  { id: "g:ta", ar: "تَـ…", en: "you do / she does", example: "تَعْلَمُونَ — you (all) know" },
  { id: "g:na", ar: "نَـ…", en: "we do", example: "نَعْبُدُ — we worship" },
  { id: "g:a", ar: "أَ…", en: "I do", example: "أَعْبُدُ — I worship" },
  { id: "g:una", ar: "…ونَ", en: "they / you (all) do", example: "يَعْلَمُونَ — they know" },
  { id: "g:u", ar: "…وا", en: "they did", example: "ءَامَنُوا — they believed" },
  { id: "g:tu", ar: "…تُ / …تَ", en: "I did / you did", example: "أَنْعَمْتَ — You blessed" },
  { id: "g:nam", ar: "…نَا", en: "we did", example: "خَلَقْنَا — We created" },
  { id: "g:alladhi", ar: "ٱلَّذِي / ٱلَّذِينَ", en: "who, the one(s) who", example: "ٱلَّذِينَ ءَامَنُوا — those who believed" },
];

// ---------- word analysis ----------

const MARKS = /[ً-ٰٟۖ-ۭـ]/g;
/** Letters only, with every alif/hamza seat folded the same way as the word list. */
export function bareLetters(text: string): string {
  return text
    .replace(/[ٱأإآ]/g, "ا").replace(/ى/g, "ي").replace(/[ؤئ]/g, "ء")
    .replace(/[ۥۦ]/g, "")
    .replace(MARKS, "");
}

const P1 = ["", "و", "ف"];
const P2 = ["", "ال", "لل", "بال", "كال", "ب", "ل", "ك", "س", "ا"];
const SUF = ["", "ا", "هما", "كما", "هم", "هن", "كم", "كن", "نا", "ها", "ني", "ه", "ك", "ي", "ن"];
const FRONT: Record<string, string> = { "و": "a:wa", "ف": "a:fa", "ب": "a:bi", "ل": "a:li", "ك": "a:ka", "ال": "a:al", "لل": "a:li", "س": "a:sa" };
const END: Record<string, string> = { "ه": "a:hu", "ها": "a:ha", "هم": "a:hum", "هما": "a:huma", "هن": "a:hunna", "ك": "a:ka2", "كم": "a:kum", "كما": "a:kuma", "كن": "a:kunna", "نا": "a:na", "ني": "a:ni", "ي": "a:i" };

export interface WordAnalysis {
  word?: VocabWord; // the family, when it is in the list
  front: string[]; // affix ids in front (وَ, بِ, ٱلْ…)
  end?: string; // pronoun ending id
}

function byText(id: string) { return VOCAB.find((w) => w.ar === id); }
const MAN = byText("مَنْ"), IN_ = byText("إِنْ"), AN = byText("أَنْ");

/** Find a Quran word's family and its pieces. Works on Uthmani or simple vowelled text. */
export function analyzeWord(text: string): WordAnalysis {
  const b = bareLetters(text);
  if (/^(و|ف)?(ب|ل|ت)?(ا)?لله(م)?$/.test(b)) return { word: VOCAB.find((w) => w.ar === "ٱللَّه"), front: b.startsWith("و") ? ["a:wa"] : b.startsWith("ف") ? ["a:fa"] : [] };
  let best: { score: number; p1: string; p2: string; st: string; x: string } | null = null;
  for (const p1 of P1) {
    if (!b.startsWith(p1)) continue;
    const r = b.slice(p1.length);
    for (const p2 of P2) {
      if (!r.startsWith(p2)) continue;
      const s = r.slice(p2.length);
      for (const x of SUF) {
        if (x && !s.endsWith(x)) continue;
        const st = x ? s.slice(0, s.length - x.length) : s;
        if (!st || !(st in FORM_INDEX)) continue;
        if (st.length === 1 && (!x || x === "ا" || p2)) continue; // لَهُ, بِهِمْ only
        if (p2 === "س" && !"يتنا".includes(st[0])) continue;
        const score = st.length * 10 - (p1.length + p2.length + x.length > 0 ? 1 : 0);
        if (!best || score > best.score) best = { score, p1, p2, st, x };
      }
    }
  }
  if (!best) return { front: [] };
  let word: VocabWord | undefined = VOCAB[FORM_INDEX[best.st]];
  // bare letters hide two very common splits: مِن / مَن and إِنَّ / إِن / أَن
  const plain = text.replace(/ّ/g, "");
  if (best.st === "من" && plain.includes("مَن") && !plain.includes("مِن")) word = MAN;
  if (best.st === "ان" && !text.includes("ّ")) word = text.includes("إ") ? IN_ : AN;
  const front = [best.p1, best.p2].filter(Boolean).map((p) => FRONT[p]).filter(Boolean);
  const end = best.x && best.x !== "ا" && best.x !== "ن" ? END[best.x] : undefined;
  return { word, front, end };
}

/** How much of an ayah the learner understands: words whose family (and pieces) they know. */
export function understood(words: string[], knownWords: Set<string>, knownAffixes: Set<string>): { total: number; known: number; each: boolean[] } {
  const each = words.map((w) => {
    const a = analyzeWord(w);
    if (!a.word || !knownWords.has(a.word.id)) return false;
    return a.front.every((f) => knownAffixes.has(f)) && (!a.end || knownAffixes.has(a.end));
  });
  return { total: words.length, known: each.filter(Boolean).length, each };
}

// ---------- the 60-day plan ----------

export interface VocabDay {
  day: number; // 1..60
  words: string[]; // family ids
  affixes: string[]; // affix / pattern ids introduced today
  theme: string;
}

const TINY = ["مِنْ", "فِي", "مَا", "لَا", "إِلَّا", "عَلَى", "إِلَى", "ٱلَّذِي", "ثُمَّ", "قَالَ"];

/**
 * Most frequent first, always: week 1 the tiny words and the pieces that attach to everything,
 * then about 8 families a day, pulling a word's root-siblings into the same or next day
 * (learn ع-ل-م once, then عِلْم, عَلِيم, عَلِمَ come together).
 */
export function vocabPlan(perDay = 8, days = 60): VocabDay[] {
  const plan: VocabDay[] = [];
  const placed = new Set<string>();
  const queue: VocabWord[] = [];
  const tiny = TINY.map((t) => VOCAB.find((w) => w.ar === t)!).filter(Boolean);
  const top = VOCAB.slice(0, perDay * days + 40);
  const affixDays: Record<number, string[]> = {
    1: ["a:wa", "a:al"], 2: ["a:bi", "a:li", "a:fa"], 3: ["a:hu", "a:hum", "a:ha"], 4: ["a:ka2", "a:kum", "a:na"],
    5: ["a:ka", "a:sa", "a:i", "a:ni"], 6: ["g:ya", "g:una", "g:alladhi"], 7: ["g:u", "g:nam", "g:tu"],
    8: ["g:ta", "g:na", "g:a"], 9: ["a:huma", "a:hunna", "a:kuma", "a:kunna"],
  };
  const pushDay = (words: VocabWord[], theme: string) => {
    const d = plan.length + 1;
    words.forEach((w) => placed.add(w.id));
    plan.push({ day: d, words: words.map((w) => w.id), affixes: affixDays[d] ?? [], theme });
  };
  // days 1-2: the tiny words (5 a day, so the pieces have room)
  pushDay(tiny.slice(0, 5), "The tiny words");
  pushDay(tiny.slice(5, 10), "The tiny words");
  for (const w of top) if (!placed.has(w.id)) queue.push(w);
  while (plan.length < days && queue.length) {
    const today: VocabWord[] = [];
    while (today.length < perDay && queue.length) {
      const w = queue.shift()!;
      if (placed.has(w.id)) continue;
      today.push(w);
      placed.add(w.id);
      if (!w.root) continue;
      // root-siblings join the same day when there is room, otherwise go to the front of the queue
      const sibs = queue.filter((x) => x.root === w.root && !placed.has(x.id));
      for (const s of sibs) {
        if (today.length < perDay) { today.push(s); placed.add(s.id); }
        else { queue.splice(queue.indexOf(s), 1); queue.unshift(s); }
      }
    }
    const d = plan.length + 1;
    const theme = d <= 9 ? "Everyday words + the pieces" : today.some((w) => w.kind === "v") ? "Words and their families" : "Words of the Quran";
    plan.push({ day: d, words: today.map((w) => w.id), affixes: affixDays[d] ?? [], theme });
  }
  return plan;
}

/** Root siblings of a family (for the "one root, many words" card). */
export function rootFamily(id: string): VocabWord[] {
  const w = VOCAB_BY_ID.get(id);
  if (!w?.root) return [];
  return VOCAB.filter((x) => x.root === w.root);
}
