/**
 * Vowelled Arabic -> the recitation model's sound alphabet (same script as /hifz-ai/ayat keys).
 *
 * Covers what a beginner course needs: letters, the three short vowels, long vowels (2 counts),
 * sukoon, shadda, tanween, hamza seats, ta marbuta, hamzat al-wasl, silent letters, sun-letter
 * assimilation and the Uthmani small letters. Checked against the whole-Quran answer key
 * (see phonetic.test.ts): long vowels are written as doubled marks ("اا", "ۦۦ", "ۥۥ"),
 * shadda as a doubled consonant.
 */

const FATHA = "َ";
const DAMMA = "ُ";
const KASRA = "ِ";
const SUKUN = "ْ";
const SHADDA = "ّ";
const FATHATAN = "ً";
const DAMMATAN = "ٌ";
const KASRATAN = "ٍ";
const MADDAH = "ٓ";
const SUPER_ALIF = "ٰ";
const SMALL_WAW = "ۥ";
const SMALL_YEH = "ۦ";
const SILENT = "۟"; // small high rounded zero: letter not pronounced
const SILENT_WASL = "۠"; // small high upright rectangular zero: silent unless stopping
const SMALL_MEEM = new Set(["ۢ", "ۭ"]); // iqlab: noon/tanween said as meem
const WASLA = "ٱ";
const TATWEEL = "ـ";
const HAMZA_ABOVE = "ٔ";

const SHORT = new Set([FATHA, DAMMA, KASRA]);
const TANWEEN: Record<string, string> = { [FATHATAN]: FATHA, [DAMMATAN]: DAMMA, [KASRATAN]: KASRA };
const LONG_OF: Record<string, string> = { [FATHA]: "اا", [KASRA]: "ۦۦ", [DAMMA]: "ۥۥ" };
const HAMZAS = new Set(["ء", "أ", "إ", "ؤ", "ئ"]);
export const CONSONANTS = new Set(Array.from("ءبتثجحخدذرزسشصضطظعغفقكلمنهوي"));
const SUN = new Set(Array.from("تثدذرزسشصضطظلن"));

interface Cell {
  base: string; // written letter
  marks: string[];
}

function cells(text: string): Cell[] {
  const out: Cell[] = [];
  for (const ch of text) {
    if (ch === TATWEEL) { out.push({ base: TATWEEL, marks: [] }); continue; }
    const code = ch.codePointAt(0)!;
    const isMark = (code >= 0x064b && code <= 0x065f) || code === 0x0670 || (code >= 0x06d6 && code <= 0x06ed && ch !== SMALL_WAW && ch !== SMALL_YEH);
    if (isMark && out.length) out[out.length - 1].marks.push(ch);
    else out.push({ base: ch, marks: [] });
  }
  // a tatweel only stretches the line; its marks are a hamza seat (ـَٔ) or a dagger alif (مَـٰلِكِ)
  const merged: Cell[] = [];
  for (const c of out) {
    if (c.base !== TATWEEL) { merged.push(c); continue; }
    if (c.marks.includes(HAMZA_ABOVE)) merged.push({ base: "ء", marks: c.marks.filter((m) => m !== HAMZA_ABOVE) });
    else if (c.marks.length && merged.length) merged[merged.length - 1].marks.push(...c.marks);
  }
  return merged;
}

const has = (c: Cell | undefined, m: string) => !!c && c.marks.includes(m);
const vowelOf = (c: Cell | undefined) => c?.marks.find((m) => SHORT.has(m));
const tanweenOf = (c: Cell | undefined) => c?.marks.find((m) => m in TANWEEN);

/** The name of Allah (ٱللَّه, لِلَّه, ٱللَّهُمَّ): its lam carries an unwritten long a. */
function isAllah(cs: Cell[], i: number): boolean {
  const c = cs[i];
  if (c.base !== "ل" || !has(c, SHADDA) || vowelOf(c) !== FATHA || cs[i + 1]?.base !== "ه") return false;
  const before = cs.slice(0, i).map((x) => x.base).join("");
  const after = cs.slice(i + 2);
  const tail = after.length === 0 || (after.length === 1 && after[0].base === "م");
  return tail && /^(ٱل|ل|وَ?ٱل|بِ?ٱل|فَ?ٱل|تَ?ٱل|و?ل|ف?ل|ب?ل)$/.test(before.replace(/[َُِ]/g, "")) || (tail && /^[وفبتل]?[ٱا]?ل$/.test(before));
}

export interface PhoneticOptions {
  /** Word is said on its own: an opening hamzat al-wasl is pronounced (ءَ / ءِ / ءُ). Default true. */
  standalone?: boolean;
  /** Stopping at the end (waqf): last short vowel and tanween drop, ًا becomes "اا", ة becomes ه. Default false. */
  pause?: boolean;
}

/** Phonemes for one word or syllable (no spaces). */
export function toPhonemes(text: string, opt: PhoneticOptions = {}): string {
  const standalone = opt.standalone ?? true;
  const cs = cells(text.replace(/\s+/g, ""));
  let out = "";
  for (let i = 0; i < cs.length; i++) {
    const c = cs[i];
    const prev = cs[i - 1];
    const next = cs[i + 1];
    let b = c.base;
    if (has(c, SILENT) || (has(c, SILENT_WASL) && !(opt.pause && i === cs.length - 1))) continue;
    if (has(c, SILENT_WASL)) { out += "اا"; continue; }

    // hamzat al-wasl: only voiced at the very start of a word said alone
    if (b === WASLA) {
      if (i === 0 && standalone) {
        // "ال" and most nouns: a; verbs of the form اُفْعُلْ: u; otherwise i
        const third = cs[2];
        const isAl = next?.base === "ل";
        out += isAl ? "ءَ" : vowelOf(third) === DAMMA ? "ءُ" : "ءِ";
      }
      continue;
    }

    // alif (and alif maqsura) as a long vowel or silent seat
    if (b === "ى" && (vowelOf(c) || tanweenOf(c) || has(c, SUKUN) || has(c, SHADDA))) b = "ي";
    // و / ي carrying a dagger alif are only seats for a long a: ٱلصَّلَوٰة, حَيَوٰة
    if ((b === "و" || b === "ي") && has(c, SUPER_ALIF) && !vowelOf(c)) { if (!out.endsWith("اا")) out += "اا"; continue; }
    if (b === "ى" && !has(c, SUPER_ALIF) && vowelOf(prev) === KASRA) { out += "ۦۦ" + (has(c, MADDAH) ? "ۦۦۦۦ" : ""); continue; }
    if (b === "ا" || b === "ى") {
      if (has(c, HAMZA_ABOVE)) { out += "ء" + (vowelOf(c) ?? ""); continue; }
      if (has(c, MADDAH) && i === 0) { out += "ءَاا"; continue; }
      if (prev && tanweenOf(prev) === FATHATAN) continue; // ًا: written, not said (handled at the tanween)
      if (has(c, SUPER_ALIF) || vowelOf(prev) === FATHA || prev?.base === "ا") {
        if (!out.endsWith("اا")) out += "اا";
        if (has(c, MADDAH)) out += "اااا";
        continue;
      }
      if (vowelOf(c)) { out += "ء" + vowelOf(c); continue; }
      continue; // bare seat (e.g. after damma in قَالُوا): silent
    }
    // آ: at the start a hamza + long a (ءَامَنُوا); inside a word the long madd before a hamza or shadda (ٱلضَّآلِّينَ)
    if (b === "آ") { out += i === 0 ? "ءَاا" : out.endsWith("اا") ? "اااا" : "اااااا"; continue; }
    if (b === SMALL_WAW || b === SMALL_YEH) {
      out += b === SMALL_WAW ? "ۥۥ" : "ۦۦ";
      if (has(c, MADDAH)) out += b === SMALL_WAW ? "ۥۥۥۥ" : "ۦۦۦۦ";
      continue;
    }

    const base = c.base;
    let cons = HAMZAS.has(b) ? "ء" : b === "ة" ? (opt.pause && i === cs.length - 1 ? "ه" : "ت") : b;
    if (!CONSONANTS.has(cons)) continue;

    const v = vowelOf(c);
    const tn = tanweenOf(c);
    const shadda = has(c, SHADDA);
    const sukun = has(c, SUKUN);

    // و / ي carrying no vowel after a matching short vowel = long vowel
    if (!v && !tn && !shadda && !sukun) {
      if (b === "ي" && vowelOf(prev) === FATHA && has(c, MADDAH)) { /* leen */ }
      if (b === "و" && vowelOf(prev) === DAMMA) { out += "ۥۥ" + (has(c, MADDAH) ? "ۥۥۥۥ" : ""); continue; }
      if (b === "ي" && vowelOf(prev) === KASRA) { out += "ۦۦ" + (has(c, MADDAH) ? "ۦۦۦۦ" : ""); continue; }
      // a bare consonant before a doubled one is swallowed (sun letters, idgham): ٱلشَّمْس, مِن رَّبِّ
      if (next && has(next, SHADDA) && (b === "ل" || b === "ن" || SUN.has(b))) continue;
    }

    const last = i === cs.length - 1 || cs.slice(i + 1).every((x) => (x.base === "ا" || x.base === "ى") && !vowelOf(x) && !x.marks.includes(MADDAH));
    if (shadda) cons += cons;
    if (opt.pause && last) {
      out += shadda ? cons.slice(1) : cons;
      if (tn === FATHATAN && cs[i + 1]?.base === "ا") out += "َاا";
      else if (tn === FATHATAN && b !== "ة") out += "َاا";
      continue;
    }
    out += cons;
    if (v) {
      out += v;
      if (has(c, SUPER_ALIF)) out += "اا";
      else if (isAllah(cs, i)) out += "اا";
      if (has(c, "\u06E7")) out += "ۦۦ"; // small yeh above (إِبْرَٰهِـۧمَ)
    } else if (tn) {
      out += TANWEEN[tn] + "ن";
    } else if (has(c, SUPER_ALIF)) out += FATHA + "اا";
    // a small meem over a sukoon-less noon (iqlab): ن said as م
    if (b === "ن" && !v && c.marks.some((m) => SMALL_MEEM.has(m))) out = out.slice(0, -1) + "م";
  }
  return out;
}

/** Long vowels as 2 counts, so "اااا" and "اا" compare as the same length class. */
export function lengthClass(ph: string): string {
  return ph.replace(/ا{2,}/g, "اا").replace(/ۦ{2,}/g, "ۦۦ").replace(/ۥ{2,}/g, "ۥۥ");
}

export const _internal = { cells, LONG_OF };
