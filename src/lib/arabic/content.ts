import EXAMPLES from "@/data/arabic-letter-examples.json";
// Arabic Companion content model: levels → units → lessons → exercises → items.
// Audio: recorded files only (never text-to-speech). A missing `audio` shows an "audio coming" state.

export type ItemType = "letter" | "syllable" | "word" | "rule" | "vocab";
export type Item = {
  id: string;
  type: ItemType;
  ar: string;
  tr: string; // sound, e.g. "ba"
  name?: string; // letter name
  meaning?: string;
  family?: string; // look-alike shape family
  audio?: string; // recorded clip URL
  example?: { ar: string; tr: string; en: string; audio: string }; // real recited Quran word starting with this letter
};

export type ExerciseType =
  | "listen-pick"
  | "minimal-pair"
  | "read-aloud"
  | "spot-dots"
  | "build-word"
  | "syllable-sprint"
  | "root-family"
  | "meaning-recall"
  | "ayah-decode";

export type Lesson = {
  id: string;
  title: string;
  goal: string;
  newItems: string[]; // taught in this lesson
  apply: string[]; // real Quran words using only what's taught so far
  guided: ExerciseType[];
  independent: ExerciseType[];
  mastery: number; // 0..1
};
export type Unit = { id: string; title: string; lessons: Lesson[] };
export type Level = { id: number; title: string; goal: string; units: Unit[] };

// Throat letters (huruf al-halq): ء ه ع ح غ خ. Heavy letters (isti'la): خ ص ض غ ط ق ظ.
export const THROAT = ["ء", "ه", "ع", "ح", "غ", "خ"];
export const HEAVY = ["خ", "ص", "ض", "غ", "ط", "ق", "ظ"];
// Letters that never join to the following letter.
export const NON_JOINING = ["ا", "د", "ذ", "ر", "ز", "و"];

const EX = EXAMPLES as Record<string, { ar: string; tr: string; en: string; audio: string }>;
const L = (ar: string, name: string, tr: string, family: string): Item => {
  const e = EX[ar];
  return {
    id: `l:${ar}`, type: "letter", ar, name, tr, family,
    example: e && { ...e, audio: `https://audio.qurancdn.com/${e.audio}` },
  };
};
const LETTERS: Item[] = [
  L("ب", "Bā’", "ba", "ba"), L("ت", "Tā’", "ta", "ba"), L("ث", "Thā’", "tha", "ba"),
  L("ج", "Jīm", "ja", "jim"), L("ح", "Ḥā’", "ḥa", "jim"), L("خ", "Khā’", "kha", "jim"),
  L("د", "Dāl", "da", "dal"), L("ذ", "Dhāl", "dha", "dal"),
  L("ر", "Rā’", "ra", "ra"), L("ز", "Zāy", "za", "ra"),
  L("س", "Sīn", "sa", "sin"), L("ش", "Shīn", "sha", "sin"),
  L("ص", "Ṣād", "ṣa", "sad"), L("ض", "Ḍād", "ḍa", "sad"),
  L("ط", "Ṭā’", "ṭa", "ta"), L("ظ", "Ẓā’", "ẓa", "ta"),
  L("ع", "‘Ayn", "‘a", "ayn"), L("غ", "Ghayn", "gha", "ayn"),
  L("ف", "Fā’", "fa", "fa"), L("ق", "Qāf", "qa", "fa"),
  L("ك", "Kāf", "ka", "rest"), L("ل", "Lām", "la", "rest"), L("م", "Mīm", "ma", "rest"),
  L("ن", "Nūn", "na", "rest"), L("ه", "Hā’", "ha", "rest"), L("و", "Wāw", "wa", "rest"), L("ي", "Yā’", "ya", "rest"),
  L("ا", "Alif", "ā", "alif"), L("ء", "Hamzah", "’a", "alif"),
];

// Real Quran words. Audio: Quran.com word-by-word (terms still to be confirmed before launch).
const W = (ar: string, tr: string, meaning: string, ref: string): Item => ({
  id: `w:${ref}`, type: "word", ar, tr, meaning, audio: `https://audio.qurancdn.com/wbw/${ref}.mp3`,
});
const WORDS: Item[] = [
  W("ثُمَّ", "thumma", "then", "002_029_005"),
  W("بَيْتَ", "bayta", "house", "106_003_004"),
  W("خَلَقَ", "khalaqa", "created", "096_001_005"),
  W("ٱلْحَمْدُ", "al-ḥamdu", "all praise", "001_002_001"),
  W("أَحَدٌ", "aḥad", "One", "112_001_004"),
  W("رَبِّ", "rabbi", "Lord of", "001_002_003"),
  W("ٱلنَّاسِ", "an-nās", "mankind", "114_001_004"),
  W("قُلْ", "qul", "say", "112_001_001"),
];

export const ITEMS: Record<string, Item> = Object.fromEntries([...LETTERS, ...WORDS].map((i) => [i.id, i]));
export const letterIds = (s: string) => [...s].map((c) => `l:${c}`);

const lesson = (id: string, title: string, goal: string, letters: string, apply: string[] = []): Lesson => ({
  id, title, goal, newItems: letterIds(letters), apply,
  guided: ["listen-pick", "spot-dots"], independent: ["read-aloud", "listen-pick"], mastery: 0.9,
});

export const CURRICULUM: Level[] = [
  {
    id: 1,
    title: "Letters and sounds",
    goal: "Recognise all 28 letters by sight and sound",
    units: [
      {
        id: "1.1",
        title: "Shape families",
        lessons: [
          lesson("1.1.1", "ب ت ث", "Same shape, different dots", "بتث", ["w:002_029_005", "w:106_003_004"]),
          lesson("1.1.2", "ج ح خ", "Same shape, dot inside, above, or none", "جحخ", ["w:096_001_005"]),
          lesson("1.1.3", "د ذ · ر ز", "Short letters that never join forward", "دذرز"),
          lesson("1.1.4", "س ش · ص ض", "Teeth and the heavy ṣād family", "سشصض"),
          lesson("1.1.5", "ط ظ · ع غ", "Heavy letters and the deep throat", "طظعغ"),
          lesson("1.1.6", "ف ق", "Fā’ and the heavy qāf", "فق"),
          lesson("1.1.7", "ك ل م ن ه و ي", "The remaining letters", "كلمنهوي", ["w:001_002_003", "w:112_001_001"]),
          lesson("1.1.8", "ا and ء", "Alif is not hamzah", "اء", ["w:001_002_001", "w:112_001_004", "w:114_001_004"]),
        ],
      },
    ],
  },
];

export const LESSONS: Lesson[] = CURRICULUM.flatMap((l) => l.units.flatMap((u) => u.lessons));
