/**
 * The 28 letters + hamza: sounds, names, joined shapes, where each sound is made (makhraj),
 * and the groups a teacher uses (look-alikes, heavy letters, qalqalah, sun/moon letters).
 */
import EXAMPLES from "@/data/arabic-letter-examples.json";

export type Makhraj = "throat" | "back-tongue" | "mid-tongue" | "side-tongue" | "tongue-tip" | "tip-gum" | "tip-teeth" | "between-teeth" | "lips" | "lip-teeth" | "nose";

export interface Letter {
  ar: string;
  key: string; // ASCII id, also the audio file name ("ba" -> /arabic/audio/letters/ba.mp3)
  name: string; // English spelling of the letter's name
  nameAr: string;
  sound: string; // simple sound hint for English speakers
  tip: string; // one short teacher tip for saying it right
  makhraj: Makhraj;
  heavy: boolean; // isti'la letters (full mouth): خ ص ض غ ط ق ظ
  qalqalah: boolean; // ق ط ب ج د bounce when they have sukoon
  sun: boolean; // ال is silent before it (ٱلشَّمْس)
  joinsNext: boolean; // false for ا د ذ ر ز و: never connect to the letter after them
  family: string; // look-alike shape family (same body, different dots)
  example?: { ar: string; tr: string; en: string; audio: string }; // a real recited Quran word with this letter
}

const EX = EXAMPLES as Record<string, { ar: string; tr: string; en: string; audio: string }>;

function L(ar: string, key: string, name: string, nameAr: string, sound: string, tip: string, makhraj: Makhraj, family: string): Letter {
  const e = EX[ar];
  return {
    ar, key, name, nameAr, sound, tip, makhraj, family,
    heavy: "خصضغطقظ".includes(ar),
    qalqalah: "قطبجد".includes(ar),
    sun: "تثدذرزسشصضطظلن".includes(ar),
    joinsNext: !"اءدذرزو".includes(ar),
    example: e && { ...e, audio: `https://audio.qurancdn.com/${e.audio}` },
  };
}

export const LETTERS: Letter[] = [
  L("ا", "alif", "Alif", "أَلِف", "a (a seat for vowels)", "Alif has no sound of its own: it carries a vowel or stretches a.", "throat", "alif"),
  L("ب", "ba", "Baa", "بَاء", "b", "Close both lips, then release.", "lips", "ba"),
  L("ت", "ta", "Taa", "تَاء", "t (soft)", "Tongue tip behind the top teeth, light and thin.", "tip-gum", "ba"),
  L("ث", "tha", "Thaa", "ثَاء", "th as in think", "Tongue tip peeks out between the teeth.", "between-teeth", "ba"),
  L("ج", "jim", "Jeem", "جِيم", "j", "Middle of the tongue presses the roof of the mouth.", "mid-tongue", "jim"),
  L("ح", "haa", "Haa (deep)", "حَاء", "a breathy h from the middle of the throat", "Squeeze the middle of your throat like fogging a mirror, no scratch.", "throat", "jim"),
  L("خ", "kha", "Khaa", "خَاء", "kh as in Scottish loch", "Scrape gently at the top of the throat; mouth full.", "throat", "jim"),
  L("د", "dal", "Daal", "دَال", "d", "Tongue tip behind the top teeth.", "tip-gum", "dal"),
  L("ذ", "dhal", "Dhaal", "ذَال", "th as in this", "Tongue tip between the teeth, with voice.", "between-teeth", "dal"),
  L("ر", "ra", "Raa", "رَاء", "r (tapped)", "One light tap of the tongue tip, not rolled long.", "tongue-tip", "ra"),
  L("ز", "zay", "Zaay", "زَاي", "z", "Like a buzzing s.", "tip-teeth", "ra"),
  L("س", "sin", "Seen", "سِين", "s", "Thin and light, mouth relaxed.", "tip-teeth", "sin"),
  L("ش", "shin", "Sheen", "شِين", "sh", "Let the air spread across the tongue.", "mid-tongue", "sin"),
  L("ص", "sad", "Saad", "صَاد", "a heavy s", "Same place as س but raise the back of the tongue: full, deep sound.", "tip-teeth", "sad"),
  L("ض", "dad", "Daad", "ضَاد", "a heavy d", "The side of the tongue presses the upper molars; full mouth.", "side-tongue", "sad"),
  L("ط", "taa", "Taa (heavy)", "طَاء", "a heavy t", "Same place as ت but the mouth is full and deep.", "tip-gum", "taa"),
  L("ظ", "dhaa", "Dhaa (heavy)", "ظَاء", "a heavy th as in this", "Same place as ذ, mouth full.", "between-teeth", "taa"),
  L("ع", "ayn", "Ayn", "عَيْن", "a squeezed sound from the middle of the throat", "Tighten the middle of the throat, with voice. It is a real letter, never skip it.", "throat", "ayn"),
  L("غ", "ghayn", "Ghayn", "غَيْن", "a gargled g, like French r", "Top of the throat, with voice, like gentle gargling.", "throat", "ayn"),
  L("ف", "fa", "Faa", "فَاء", "f", "Top teeth on the lower lip.", "lip-teeth", "fa"),
  L("ق", "qaf", "Qaaf", "قَاف", "a deep k from the back", "Further back than ك: the very back of the tongue, full mouth.", "back-tongue", "fa"),
  L("ك", "kaf", "Kaaf", "كَاف", "k", "Back of the tongue, a little forward of ق, light.", "back-tongue", "kaf"),
  L("ل", "lam", "Laam", "لَام", "l", "Tongue tip on the gum behind the top teeth.", "tongue-tip", "lam"),
  L("م", "mim", "Meem", "مِيم", "m", "Lips together, with a little hum in the nose.", "lips", "mim"),
  L("ن", "nun", "Noon", "نُون", "n", "Tongue tip on the gum, with a hum in the nose.", "tongue-tip", "nun"),
  L("ه", "ha", "Haa (light)", "هَاء", "h as in hat", "A soft breath from the bottom of the throat.", "throat", "ha"),
  L("و", "waw", "Waaw", "وَاو", "w", "Round the lips.", "lips", "waw"),
  L("ي", "ya", "Yaa", "يَاء", "y", "Middle of the tongue rises.", "mid-tongue", "ya"),
  L("ء", "hamza", "Hamzah", "هَمْزَة", "a short catch in the throat, as in uh-oh", "A clean stop at the bottom of the throat, then release.", "throat", "hamza"),
];

export const LETTER = new Map(LETTERS.map((l) => [l.ar, l]));

/** Hamza can sit on a seat; these all read as ء. */
export const HAMZA_SEATS = ["أ", "إ", "ؤ", "ئ", "ء", "آ"];

/** Pairs beginners mix up, drilled side by side. */
export const LOOKALIKES: [string, string][] = [
  ["ب", "ت"], ["ت", "ث"], ["ب", "ث"], ["ج", "ح"], ["ح", "خ"], ["د", "ذ"], ["ر", "ز"], ["س", "ش"],
  ["ص", "ض"], ["ط", "ظ"], ["ع", "غ"], ["ف", "ق"], ["ن", "ب"], ["ي", "ب"],
];
export const SOUNDALIKES: [string, string][] = [
  ["ح", "ه"], ["س", "ص"], ["ت", "ط"], ["د", "ض"], ["ذ", "ظ"], ["ذ", "ز"], ["ك", "ق"], ["ء", "ع"], ["ث", "س"], ["خ", "غ"],
];

const ZWJ = "‍";
export type Position = "isolated" | "initial" | "medial" | "final";

/** The letter as it looks at each position in a word (rendered with zero-width joiners). */
export function shapes(ar: string): Record<Position, string> {
  const joins = LETTER.get(ar)?.joinsNext ?? true;
  return {
    isolated: ar,
    initial: joins ? ar + ZWJ : ar,
    medial: joins ? ZWJ + ar + ZWJ : ZWJ + ar,
    final: ZWJ + ar,
  };
}

export const MAKHRAJ_LABEL: Record<Makhraj, string> = {
  throat: "Throat",
  "back-tongue": "Back of the tongue",
  "mid-tongue": "Middle of the tongue",
  "side-tongue": "Side of the tongue",
  "tongue-tip": "Tip of the tongue",
  "tip-gum": "Tongue tip and gum",
  "tip-teeth": "Tongue tip near the teeth",
  "between-teeth": "Tongue between the teeth",
  lips: "Lips",
  "lip-teeth": "Lip and teeth",
  nose: "Nose",
};
