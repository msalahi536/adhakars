/**
 * Track 1 (Read): 30 short daily lessons in the traditional primer order
 * (letters -> joining -> short vowels -> tanween -> long vowels -> sukoon -> shadda -> Quran spelling -> real reading).
 * A lesson unlocks only when the one before it is solid.
 */
import POOL from "@/data/arabic/practice.json";
import { canRead, needs, type Known, type Skill } from "./readable";
import { LETTERS } from "./letters";

export type Drill =
  | "meet" // see it big, hear it, read the tip (new items only)
  | "say" // say it into the mic, checked by the AI
  | "listen-pick" // hear a sound, tap the letter / syllable (4 choices, look-alikes included)
  | "duel" // two look-alikes, one sound played, tap the right one, faster each round
  | "trace" // trace the shape with a finger
  | "shapes" // match a letter to its start / middle / end shape
  | "spot" // find the letter inside a real Quran word
  | "short-long" // hear it: بَ or بَا ?
  | "build" // hear a syllable, build it from a letter + mark
  | "read-word" // read a real Quran word aloud, checked by the AI
  | "read-ayah"; // read a whole ayah while the AI follows

export interface Lesson {
  day: number;
  id: string; // "r1".."r30"
  title: string;
  goal: string; // "By the end you can…"
  letters: string[]; // new letters
  skills: Skill[]; // new reading skills
  drills: Drill[];
  /** Syllables / words said into the mic in this lesson (vowelled). */
  say: string[];
  /** Reading of real Quran: surah + ayat to read in this lesson (lessons 28–30). */
  read?: { sura: number; first: number; last: number }[];
  mastery: number; // share of answers right needed to pass (0..1)
  note?: string; // teacher's note shown once
  /** Review lessons with nothing new pick practice words that show this off. */
  focus?: "mixed-vowels" | "qalqalah" | "shadda-vowels";
}

const F = "َ", K = "ِ", D = "ُ";
const syl = (letters: string[], vowels = [F]) => letters.filter((l) => l !== "ا").flatMap((l) => vowels.map((v) => l + v));
const LETTER_DRILLS: Drill[] = ["meet", "listen-pick", "say", "duel", "trace", "spot"];

export const LESSONS: Lesson[] = [
  { day: 1, id: "r1", title: "Alif and the dotted family", goal: "Say and recognise ا ب ت ث", letters: ["ا", "ب", "ت", "ث"], skills: [], drills: LETTER_DRILLS, say: syl(["ب", "ت", "ث"]), mastery: 0.85,
    note: "Arabic is read from right to left. ب ت ث share one shape: only the dots change." },
  { day: 2, id: "r2", title: "ج ح خ and د ذ", goal: "Say and recognise ج ح خ د ذ", letters: ["ج", "ح", "خ", "د", "ذ"], skills: [], drills: LETTER_DRILLS, say: syl(["ج", "ح", "خ", "د", "ذ"]), mastery: 0.85,
    note: "ح is a smooth breath from the middle of the throat. Do not confuse it with the light ه you will meet on day 5." },
  { day: 3, id: "r3", title: "ر ز, س ش and ص ض", goal: "Say and recognise ر ز س ش ص ض", letters: ["ر", "ز", "س", "ش", "ص", "ض"], skills: [], drills: LETTER_DRILLS, say: syl(["ر", "ز", "س", "ش", "ص", "ض"]), mastery: 0.85,
    note: "ص and ض are heavy letters: the mouth is full and the sound is deep. س is thin and light." },
  { day: 4, id: "r4", title: "ط ظ, ع غ and ف ق", goal: "Say and recognise ط ظ ع غ ف ق", letters: ["ط", "ظ", "ع", "غ", "ف", "ق"], skills: [], drills: LETTER_DRILLS, say: syl(["ط", "ظ", "ع", "غ", "ف", "ق"]), mastery: 0.85,
    note: "ع is a real letter made by tightening the middle of the throat. Skipping it changes the word." },
  { day: 5, id: "r5", title: "The last letters and hamza", goal: "Say and recognise all 28 letters and ء", letters: ["ك", "ل", "م", "ن", "ه", "و", "ي", "ء"], skills: [], drills: LETTER_DRILLS, say: syl(["ك", "ل", "م", "ن", "ه", "و", "ي", "ء"]), mastery: 0.85,
    note: "Hamza ء often sits on an alif: أ and إ are read as ء." },
  { day: 6, id: "r6", title: "Joining: the letters that connect both sides", goal: "Spot ب ت ث ن ي at the start, middle and end of a word", letters: [], skills: ["join"], drills: ["meet", "shapes", "spot", "trace"], say: [], mastery: 0.85,
    note: "Inside a word most letters keep only their 'head'. ب ت ث ن ي become a small tooth with dots." },
  { day: 7, id: "r7", title: "Joining: the rest of the connectors", goal: "Spot every connecting letter inside a word", letters: [], skills: [], drills: ["meet", "shapes", "spot", "trace"], say: [], mastery: 0.85 },
  { day: 8, id: "r8", title: "The six that never join forward", goal: "Know ا د ذ ر ز و break the word after them", letters: [], skills: [], drills: ["meet", "shapes", "spot"], say: [], mastery: 0.85,
    note: "ا د ذ ر ز و join to the letter before them but never to the one after, so a small gap follows them." },
  { day: 9, id: "r9", title: "Fatha َ  — the a sound", goal: "Read any letter with fatha (بَ تَ)", letters: [], skills: ["fatha"], drills: ["meet", "say", "listen-pick", "build"], say: syl(LETTERS.map((l) => l.ar), [F]), mastery: 0.85,
    note: "A small line above the letter is fatha: say a short a." },
  { day: 10, id: "r10", title: "Kasra ِ  — the i sound", goal: "Read any letter with kasra (بِ تِ)", letters: [], skills: ["kasra"], drills: ["meet", "say", "listen-pick", "build"], say: syl(LETTERS.map((l) => l.ar), [K]), mastery: 0.85,
    note: "A small line below the letter is kasra: say a short i." },
  { day: 11, id: "r11", title: "Damma ُ  — the u sound", goal: "Read any letter with damma (بُ تُ)", letters: [], skills: ["damma"], drills: ["meet", "say", "listen-pick", "build"], say: syl(LETTERS.map((l) => l.ar), [D]), mastery: 0.85,
    note: "A small waw-like curl above the letter is damma: say a short u." },
  { day: 12, id: "r12", title: "Mixing the three vowels", goal: "Read any open syllable and your first real words", letters: [], skills: [], drills: ["listen-pick", "say", "build", "read-word"], say: ["بَ", "بِ", "بُ", "خَلَقَ", "حَسَدَ", "كَتَبَ"], mastery: 0.85, focus: "mixed-vowels" },
  { day: 13, id: "r13", title: "Tanween ً  — an", goal: "Read endings like بًا and ة", letters: [], skills: ["tanween-an", "ta-marbuta"], drills: ["meet", "say", "listen-pick", "read-word"], say: ["بًا", "تًا", "رَحْمَةً", "أَحَدًا"], mastery: 0.85,
    note: "Two fathas say an. The alif after them is only written. ة is a ta (read as h when you stop)." },
  { day: 14, id: "r14", title: "Tanween ٍ  — in", goal: "Read endings like بٍ", letters: [], skills: ["tanween-in"], drills: ["meet", "say", "listen-pick", "read-word"], say: ["بٍ", "تٍ", "قَدَرٍ"], mastery: 0.85 },
  { day: 15, id: "r15", title: "Tanween ٌ  — un", goal: "Read endings like بٌ", letters: [], skills: ["tanween-un"], drills: ["meet", "say", "listen-pick", "read-word"], say: ["بٌ", "تٌ", "أَحَدٌ"], mastery: 0.85 },
  { day: 16, id: "r16", title: "Long a: ا and ى", goal: "Stretch a for two counts (بَا)", letters: [], skills: ["long-a"], drills: ["meet", "short-long", "say", "read-word"], say: ["بَا", "تَا", "قَالَ", "نَارًا"], mastery: 0.85,
    note: "Fatha + alif = a long a, two counts. Short or long changes the meaning: قَتَلَ (he killed), قَاتَلَ (he fought)." },
  { day: 17, id: "r17", title: "Long i: ي", goal: "Stretch i for two counts (بِي)", letters: [], skills: ["long-i"], drills: ["meet", "short-long", "say", "read-word"], say: ["بِي", "تِي", "فِيهَا"], mastery: 0.85 },
  { day: 18, id: "r18", title: "Long u: و", goal: "Stretch u for two counts (بُو)", letters: [], skills: ["long-u"], drills: ["meet", "short-long", "say", "read-word"], say: ["بُو", "تُو", "نُوحًا"], mastery: 0.85 },
  { day: 19, id: "r19", title: "Sukoon ْ  — no vowel", goal: "Read closed syllables (أَبْ, مِنْ)", letters: [], skills: ["sukun"], drills: ["meet", "say", "build", "read-word"], say: ["أَبْ", "مِنْ", "قُلْ", "لَمْ"], mastery: 0.85,
    note: "A small circle means the letter has no vowel: join it to the vowel before it." },
  { day: 20, id: "r20", title: "Qalqalah: the bouncing letters", goal: "Bounce ق ط ب ج د when they have sukoon", letters: [], skills: [], drills: ["meet", "say", "read-word"], say: ["أَقْ", "أَطْ", "أَبْ", "أَجْ", "أَدْ", "يَلِدْ"], mastery: 0.85, focus: "qalqalah",
    note: "ق ط ب ج د with sukoon get a small echo, like a ball bouncing once." },
  { day: 21, id: "r21", title: "Soft vowels: وْ and يْ after fatha", goal: "Read يَوْم and بَيْت", letters: [], skills: ["leen"], drills: ["meet", "say", "read-word"], say: ["يَوْمِ", "بَيْتِ", "خَوْفٍ"], mastery: 0.85 },
  { day: 22, id: "r22", title: "Shadda ّ  — the doubled letter", goal: "Read doubled letters (رَبِّ)", letters: [], skills: ["shadda"], drills: ["meet", "say", "listen-pick", "read-word"], say: ["رَبِّ", "ثُمَّ", "إِنَّ"], mastery: 0.85,
    note: "Shadda means the letter is said twice: once closing the syllable before, once opening the next. Hold it a moment." },
  { day: 23, id: "r23", title: "Shadda with every vowel", goal: "Read shadda with fatha, kasra, damma and tanween", letters: [], skills: [], drills: ["say", "build", "read-word"], say: ["بَّ", "بِّ", "بُّ", "حَقًّا"], mastery: 0.85, focus: "shadda-vowels" },
  { day: 24, id: "r24", title: "ٱلْ  — the and the moon letters", goal: "Read ٱلْ before moon letters (ٱلْحَمْدُ)", letters: [], skills: ["al"], drills: ["meet", "say", "read-word"], say: ["ٱلْحَمْدُ", "ٱلْقَمَرُ", "ٱلْكِتَـٰبُ"], mastery: 0.85,
    note: "At the start of a sentence ٱلْ is read al. Before the 14 moon letters the lam is clear." },
  { day: 25, id: "r25", title: "Sun letters and the joining alif ٱ", goal: "Skip the lam before sun letters (ٱلشَّمْسُ)", letters: [], skills: ["sun", "wasl"], drills: ["meet", "say", "read-word"], say: ["ٱلشَّمْسُ", "ٱلرَّحْمَـٰنِ", "ٱلنَّاسِ"], mastery: 0.85,
    note: "Before the 14 sun letters the lam is written but not said; the next letter doubles instead. ٱ is only said at the very start." },
  { day: 26, id: "r26", title: "Quran spelling: the small letters", goal: "Read the small alif ٰ, small waw ۥ, small yaa ۦ and the long stretch ٓ", letters: [], skills: ["dagger", "small", "madd"], drills: ["meet", "say", "read-word"], say: ["ٱلرَّحْمَـٰنِ", "مَـٰلِكِ", "بِهِۦ", "لَهُۥ", "ٱلضَّآلِّينَ"], mastery: 0.85,
    note: "The Quran is written in Uthmani spelling. A small alif is a long a. A small waw or yaa stretches the vowel. The wavy line ٓ stretches it longer." },
  { day: 27, id: "r27", title: "Quran spelling: silent letters, seats and stop signs", goal: "Read أُو۟لَـٰٓئِكَ and the hamza seats ؤ ئ", letters: [], skills: ["silent", "seats"], drills: ["meet", "say", "read-word"], say: ["قَالُوا۟", "ءَامَنُوا۟", "يُؤْمِنُونَ", "شَىْءٍ"], mastery: 0.85,
    note: "A small circle ۟ over a letter means it is written but not said. Small letters above the line (مـ ج قلى صلى) are stop signs: you may stop or continue." },
  { day: 28, id: "r28", title: "Read Al-Fatiha", goal: "Read Al-Fatiha ayah by ayah", letters: [], skills: [], drills: ["read-word", "read-ayah"], say: [], read: [{ sura: 1, first: 1, last: 7 }], mastery: 0.85 },
  { day: 29, id: "r29", title: "Read Al-Ikhlas and Al-Falaq", goal: "Read two short surahs", letters: [], skills: [], drills: ["read-ayah"], say: [], read: [{ sura: 112, first: 1, last: 4 }, { sura: 113, first: 1, last: 5 }], mastery: 0.85 },
  { day: 30, id: "r30", title: "Read An-Nas, then Al-Fatiha alone", goal: "Read Al-Fatiha on your own, checked by the AI", letters: [], skills: [], drills: ["read-ayah"], say: [], read: [{ sura: 114, first: 1, last: 6 }, { sura: 1, first: 1, last: 7 }], mastery: 0.9,
    note: "Al-Fatiha is recited in every prayer. Read it slowly. Then read it to a teacher or someone who reads well." },
];

export const LESSON = new Map(LESSONS.map((l) => [l.id, l]));

/** Letters and skills known after finishing every lesson up to and including `upToDay`. */
export function knownAfter(upToDay: number): Known {
  const letters = new Set<string>();
  const skills = new Set<Skill>();
  for (const l of LESSONS) {
    if (l.day > upToDay) break;
    l.letters.forEach((x) => letters.add(x));
    l.skills.forEach((x) => skills.add(x));
  }
  return { letters, skills };
}

const QALQALAH = /[قطبجد]\u0652|[قطبجد]$/;
function showsFocus(text: string, focus: NonNullable<Lesson["focus"]>): boolean {
  if (focus === "qalqalah") return QALQALAH.test(text.replace(/[\u06D6-\u06DC]/g, ""));
  if (focus === "shadda-vowels") return /\u0651[\u0650\u064F\u064B\u064C\u064D]|[\u0650\u064F\u064B\u064C\u064D]\u0651/.test(text);
  const vowels = new Set(Array.from(text).filter((c) => "\u064E\u0650\u064F".includes(c)));
  return vowels.size >= 2;
}

type PoolWord = [key: string, text: string, freq: number];
const pool = (POOL as unknown as { words: PoolWord[] }).words;
const FATIHA = (POOL as unknown as { fatiha: [string, string][] }).fatiha;

/**
 * Real Quran words for a lesson: readable with everything taught so far, using something new from
 * this lesson, most frequent first (Al-Fatiha and Juz Amma words only, so they are familiar).
 */
export function practiceWords(lesson: Lesson, max = 8): { key: string; text: string }[] {
  if (lesson.day < 6) return []; // before joining, letters are found inside words (spot), not read
  const known = knownAfter(lesson.day);
  const before = knownAfter(lesson.day - 1);
  const out: { key: string; text: string }[] = [];
  for (const [key, text] of pool) {
    if (!canRead(text, known)) continue;
    const n = needs(text);
    const usesNew = lesson.letters.some((l) => n.letters.has(l)) || lesson.skills.some((s) => n.skills.has(s)) || !canRead(text, before);
    if (lesson.focus ? !showsFocus(text, lesson.focus) : !usesNew) continue;
    out.push({ key, text });
    if (out.length >= max) break;
  }
  return out;
}

const TEXT_BY_KEY = new Map<string, string>([...FATIHA, ...pool.map(([k, t]) => [k, t] as [string, string])]);
/** Al-Fatiha + Juz Amma words, most frequent first. */
export function practicePool(): { key: string; text: string }[] {
  return pool.map(([key, text]) => ({ key, text }));
}

/** The written text of an Al-Fatiha / Juz Amma word by its key ("1:2:1" -> ٱلْحَمْدُ). */
export function quranWordText(key: string): string | undefined {
  return TEXT_BY_KEY.get(key);
}

/** Al-Fatiha progress meter: which of its 29 words the learner can read now. */
export function fatihaMeter(known: Known): { total: number; readable: number; words: { key: string; text: string; ok: boolean }[] } {
  const words = FATIHA.map(([key, text]) => ({ key, text, ok: canRead(text, known) }));
  return { total: words.length, readable: words.filter((w) => w.ok).length, words };
}

/** Real Quran words that contain a letter (for "spot it" drills before vowels are taught). */
export function wordsWithLetter(letter: string, max = 6): { key: string; text: string }[] {
  const out: { key: string; text: string }[] = [];
  for (const [key, text] of pool) {
    if (needs(text).letters.has(letter)) out.push({ key, text });
    if (out.length >= max) break;
  }
  return out;
}
