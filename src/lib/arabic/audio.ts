/**
 * Where each sound comes from. Letter and syllable sounds are real recordings only (never
 * text-to-speech); Quran words use Quran.com's word-by-word recitation.
 *
 * Recordings live in /public/arabic/audio/<file>.mp3 and are listed in src/data/arabic/audio.json
 * once recorded, so a missing clip shows the "audio coming" state instead of failing.
 */
import RECORDED from "@/data/arabic/audio.json";
import { LETTERS } from "./letters";

const HAVE = new Set((RECORDED as { files: string[] }).files);
const VOWEL_KEY: Record<string, string> = { "َ": "a", "ِ": "i", "ُ": "u" };
const LONG_KEY: Record<string, string> = { a: "aa", i: "ii", u: "uu" };

export interface Clip {
  file: string; // "letters/ba", "syllables/ba-i"
  text: string; // what to say
  note: string; // how to say it (for the person recording)
  priority: 1 | 2 | 3; // 1 = needed in week 1-2
}

/** Every clip to record, in recording order (one session with a clear teacher's voice). */
export function recordingList(): Clip[] {
  const out: Clip[] = [];
  const ls = LETTERS.filter((l) => l.ar !== "ا");
  for (const l of LETTERS) out.push({ file: `names/${l.key}`, text: l.nameAr, note: `The letter's name, as a teacher says it (${l.name}).`, priority: 1 });
  for (const l of ls) for (const [m, v] of Object.entries(VOWEL_KEY)) out.push({ file: `syllables/${l.key}-${v}`, text: l.ar + m, note: "Short, clear, one beat.", priority: 1 });
  for (const l of ls) for (const [m, v] of Object.entries(VOWEL_KEY)) {
    const seat = v === "a" ? "ا" : v === "i" ? "ي" : "و";
    out.push({ file: `syllables/${l.key}-${LONG_KEY[v]}`, text: l.ar + m + seat, note: "Long vowel: two even counts.", priority: 2 });
  }
  for (const l of ls) out.push({ file: `syllables/a-${l.key}`, text: "أَ" + l.ar + "ْ", note: l.qalqalah ? "With sukoon: give it a small bounce (qalqalah)." : "With sukoon: stop on the letter.", priority: 2 });
  for (const l of ls) for (const [m, v] of [["ً", "an"], ["ٍ", "in"], ["ٌ", "un"]] as const) out.push({ file: `syllables/${l.key}-${v}`, text: l.ar + m + (m === "ً" ? "ا" : ""), note: "Tanween.", priority: 3 });
  return out;
}

/** The recorded clip for a letter's name. */
export function letterNameAudio(letter: string): string | undefined {
  const l = LETTERS.find((x) => x.ar === letter);
  return l && file(`names/${l.key}`);
}

/** The recorded clip for a syllable like بَ, بِي, أَبْ, بًا (letter + mark, optional long seat). */
export function syllableAudio(syllable: string): string | undefined {
  const chars = Array.from(syllable);
  if (chars[0] === "أ" && chars.length === 3 && chars[2] === "ْ") {
    const l = LETTERS.find((x) => x.ar === chars[1]);
    return l && file(`syllables/a-${l.key}`);
  }
  const l = LETTERS.find((x) => x.ar === chars[0]);
  if (!l) return undefined;
  const mark = chars[1];
  if (mark === "ً") return file(`syllables/${l.key}-an`);
  if (mark === "ٍ") return file(`syllables/${l.key}-in`);
  if (mark === "ٌ") return file(`syllables/${l.key}-un`);
  const v = VOWEL_KEY[mark];
  if (!v) return undefined;
  return file(`syllables/${l.key}-${chars.length > 2 ? LONG_KEY[v] : v}`);
}

/** The sound of a letter = the letter with fatha, as teachers say it ("ba"). */
export function letterSoundAudio(letter: string): string | undefined {
  if (letter === "ا") return letterNameAudio(letter);
  return syllableAudio(letter + "َ");
}

/** Quran.com word-by-word recitation for a Quran word key "sura:aya:word". */
export function quranWordAudio(key: string): string {
  const [s, a, w] = key.split(":").map((x) => x.padStart(3, "0"));
  return `https://audio.qurancdn.com/wbw/${s}_${a}_${w}.mp3`;
}

function file(name: string): string | undefined {
  return HAVE.has(name) ? `/arabic/audio/${name}.mp3` : undefined;
}
