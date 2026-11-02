/**
 * Which reading skills a written word needs, so the course can say "you can read this word now"
 * and pick real Quran words for each lesson using only what has been taught.
 */
export type Skill =
  | "join" // letters joined inside a word
  | "fatha" | "kasra" | "damma"
  | "tanween-an" | "tanween-in" | "tanween-un" // ً (and the silent alif after it), ٍ, ٌ
  | "ta-marbuta" // ة
  | "long-a" | "long-i" | "long-u" // ا / ى after fatha, ي after kasra, و after damma
  | "sukun" // ْ
  | "leen" // وْ / يْ after fatha: يَوْم, بَيْت
  | "shadda" // ّ
  | "al" // ٱلْ before a moon letter
  | "sun" // ٱل before a sun letter: written, not said
  | "wasl" // ٱ at the start of other words
  | "seats" // hamza on و / ي (ؤ ئ) and hamza alone mid-word
  | "dagger" // small alif ٰ (and ـٰ)
  | "small" // small waw ۥ, small yeh ۦ ۧ, small meem ۢ ۭ
  | "madd" // ٓ long stretch
  | "silent"; // ۟ ۠ letters written but not said

const MARK_SKILL: Record<string, Skill> = {
  "َ": "fatha", "ِ": "kasra", "ُ": "damma",
  "ً": "tanween-an", "ٌ": "tanween-un", "ٍ": "tanween-in",
  "ْ": "sukun", "ّ": "shadda", "ٰ": "dagger", "ٓ": "madd",
  "۟": "silent", "۠": "silent",
  "ۢ": "small", "ۭ": "small", "ۧ": "small",
};
const IGNORE = new Set(["ـ", "ۖ", "ۗ", "ۘ", "ۙ", "ۚ", "ۛ", "ۜ", "۞", "۩", "۪", "۫", "۬", "ٔ"]);
const BASE_LETTER: Record<string, string> = { "أ": "ء", "إ": "ء", "ؤ": "ء", "ئ": "ء", "آ": "ء", "ٱ": "ا", "ة": "ت", "ى": "ا", "ۥ": "و", "ۦ": "ي" };

export interface Needs {
  letters: Set<string>; // base letters (hamza seats count as ء, ة as ت, ى as ا)
  skills: Set<Skill>;
}

const isMark = (ch: string) => {
  const c = ch.codePointAt(0)!;
  return (c >= 0x064b && c <= 0x065f) || c === 0x0670 || (c >= 0x06d6 && c <= 0x06ed && ch !== "ۥ" && ch !== "ۦ");
};

/** Everything a learner must know to read this written word (Uthmani or simple script). */
export function needs(word: string): Needs {
  const letters = new Set<string>();
  const skills = new Set<Skill>();
  const chars = Array.from(word.replace(/\s+/g, ""));
  const cells: { b: string; m: string[] }[] = [];
  for (const ch of chars) {
    if (isMark(ch) || IGNORE.has(ch)) { if (cells.length && !IGNORE.has(ch)) cells[cells.length - 1].m.push(ch); continue; }
    cells.push({ b: ch, m: [] });
  }
  if (cells.length > 1) skills.add("join");
  cells.forEach((c, i) => {
    const prev = cells[i - 1];
    const next = cells[i + 1];
    const pv = prev?.m.find((m) => "َُِ".includes(m));
    letters.add(BASE_LETTER[c.b] ?? c.b);
    for (const m of c.m) { const s = MARK_SKILL[m]; if (s) skills.add(s); }
    if (c.b === "ة") skills.add("ta-marbuta");
    if (c.b === "ؤ" || c.b === "ئ" || (c.b === "ء" && i > 0)) skills.add("seats");
    if (c.b === "ۥ" || c.b === "ۦ") skills.add("small");
    if (c.b === "ٱ") {
      const al = next?.b === "ل";
      const sunNext = al && cells[i + 2]?.m.includes("ّ") && !next.m.length;
      skills.add(al ? (sunNext ? "sun" : "al") : "wasl");
      if (al && sunNext) letters.delete("ل"); // the lam is not said
      letters.delete("ا");
      return;
    }
    const bare = !c.m.some((m) => MARK_SKILL[m]);
    if ((c.b === "ا" || c.b === "ى") && bare && i > 0) {
      if (prev && prev.m.includes("ً")) skills.add("tanween-an"); // ـًا
      else if (pv === "َ" || prev?.m.includes("ٰ")) skills.add("long-a");
      else if (c.b === "ى" && pv === "ِ") skills.add("long-i");
      else skills.add("silent"); // قَالُوا: alif written, not said
    }
    if (c.b === "ي" && bare && pv === "ِ") skills.add("long-i");
    if (c.b === "و" && bare && pv === "ُ") skills.add("long-u");
    if ((c.b === "و" || c.b === "ي") && c.m.includes("ْ") && pv === "َ") skills.add("leen");
    // a bare letter before a doubled one is swallowed (مِن رَّبِّ): Quran spelling
    const swallowed = bare && !!next?.m.includes("ّ") && "لن".includes(c.b) && cells[i - 1]?.b !== "ٱ";
    if (swallowed) skills.add("silent");
    // Uthmani leaves sukoon unwritten on a consonant that ends a word or hides its noon (مِن, كُنتُم)
    const seat = c.b === "ا" || c.b === "ى" || c.b === "ة" || c.b === "ۥ" || c.b === "ۦ" || ((c.b === "و" || c.b === "ي") && (pv === "ُ" || pv === "ِ"));
    if (bare && !swallowed && !seat && i > 0) skills.add("sukun");
  });
  return { letters, skills };
}

export interface Known {
  letters: Set<string>;
  skills: Set<Skill>;
}

/** True when every letter and mark in the word has been taught. */
export function canRead(word: string, known: Known): boolean {
  const n = needs(word);
  for (const l of n.letters) if (!known.letters.has(l)) return false;
  for (const s of n.skills) if (!known.skills.has(s)) return false;
  return true;
}

/** The first skill or letter still missing (for "learn X to read this word"). */
export function missingFor(word: string, known: Known): { letters: string[]; skills: Skill[] } {
  const n = needs(word);
  return { letters: [...n.letters].filter((l) => !known.letters.has(l)), skills: [...n.skills].filter((s) => !known.skills.has(s)) };
}
