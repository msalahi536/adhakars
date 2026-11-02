/**
 * Today's practice: due reviews first (interleaved), then the next reading lesson and/or the next
 * vocabulary day, each turned into concrete steps the screens can render one by one.
 *
 * Every lesson follows the same loop: See -> Hear -> Say -> Trace / Pick -> (later) Recall.
 */
import { LESSONS, LESSON, practiceWords, practicePool, wordsWithLetter, knownAfter, quranWordText, type Lesson } from "./curriculum";
import { letterSoundAudio, syllableAudio } from "./audio";
import { LETTERS, LETTER, LOOKALIKES, SOUNDALIKES, type Position } from "./letters";
import { VOCAB, VOCAB_BY_ID, AFFIX, PATTERNS, vocabPlan, rootFamily, type VocabDay } from "./vocab";
import { dueItems, enterReview, topConfusions } from "./scheduler";
import type { ArabicState } from "./state";
import { needs, type Skill } from "./readable";

export type Step =
  | { kind: "meet-letter"; letter: string }
  | { kind: "meet-skill"; skill: Skill; lessonId: string; examples: string[] }
  | { kind: "say"; itemId: string; text: string; strictLetters?: boolean; review?: boolean }
  | { kind: "listen-pick"; itemId: string; answer: string; choices: string[]; review?: boolean }
  | { kind: "duel"; itemId: string; a: string; b: string; answer: string; rounds: number }
  | { kind: "trace"; letter: string; position: Position }
  | { kind: "shapes"; itemId: string; letter: string; position: Position; choices: string[] }
  | { kind: "spot"; itemId: string; letter: string; choices: { key: string; text: string }[]; answer: string } // which word has the letter? (answer = key)
  | { kind: "short-long"; itemId: string; short: string; long: string; answer: string }
  | { kind: "build"; itemId: string; target: string; letters: string[]; marks: string[] }
  | { kind: "read-word"; itemId: string; key: string; text: string; review?: boolean }
  | { kind: "read-ayah"; sura: number; first: number; last: number }
  | { kind: "meet-word"; itemId: string; wordId: string; family: string[] }
  | { kind: "meet-piece"; itemId: string; pieceId: string }
  | { kind: "meaning-pick"; itemId: string; wordId: string; choices: string[]; review?: boolean }
  | { kind: "piece-pick"; itemId: string; pieceId: string; choices: string[]; review?: boolean }
  | { kind: "understand-ayah"; key: string }; // "sura:aya": known words lit, the rest faint

// ---------- deterministic shuffling (same day + lesson -> same session) ----------

function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}
function shuffle<T>(xs: T[], rnd: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

const FATHA = "َ", KASRA = "ِ", DAMMA = "ُ";
const JOIN_GROUPS: Record<number, string[]> = {
  6: ["ب", "ت", "ث", "ن", "ي"],
  7: ["ج", "ح", "خ", "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ك", "ل", "م", "ه"],
  8: ["ا", "د", "ذ", "ر", "ز", "و"],
};
const SKILL_MARK: Partial<Record<Skill, string>> = { fatha: FATHA, kasra: KASRA, damma: DAMMA, "tanween-an": "ً", "tanween-in": "ٍ", "tanween-un": "ٌ", sukun: "ْ", shadda: "ّ" };

/** Choices for "hear it, tap it": the answer, its look-/sound-alikes, then other known letters. */
function letterChoices(answer: string, pool: string[], rnd: () => number, n = 4): string[] {
  const alikes = [...LOOKALIKES, ...SOUNDALIKES].filter((p) => p.includes(answer)).map((p) => (p[0] === answer ? p[1] : p[0]));
  const picks = [answer, ...shuffle(alikes.filter((x) => pool.includes(x)), rnd)];
  for (const x of shuffle(pool, rnd)) if (!picks.includes(x)) picks.push(x);
  return shuffle(picks.slice(0, n), rnd);
}

/** The steps of one reading lesson. */
export function lessonSteps(lesson: Lesson, s: ArabicState, today: string): Step[] {
  const rnd = seeded(`${lesson.id}:${today}`);
  const known = knownAfter(lesson.day);
  const knownLetters = LETTERS.map((l) => l.ar).filter((l) => known.letters.has(l));
  const steps: Step[] = [];
  const speaker = s.learner === "speaker";

  if (lesson.letters.length) {
    // See, hear, say, trace — one letter at a time
    for (const l of lesson.letters) {
      steps.push({ kind: "meet-letter", letter: l });
      if (l !== "ا" && !speaker) steps.push({ kind: "say", itemId: `l:${l}`, text: l + FATHA, strictLetters: true });
      steps.push({ kind: "trace", letter: l, position: "isolated" });
    }
    // hear a sound, tap the letter (new letters twice, with their look-alikes)
    for (const l of shuffle([...lesson.letters, ...lesson.letters], rnd))
      if (l !== "ا") steps.push({ kind: "listen-pick", itemId: `l:${l}`, answer: l, choices: letterChoices(l, knownLetters, rnd) });
    // look-alike duels inside what is known, plus this learner's own mix-ups
    const pairs = [...LOOKALIKES, ...SOUNDALIKES].filter(([a, b]) => known.letters.has(a) && known.letters.has(b) && (lesson.letters.includes(a) || lesson.letters.includes(b)));
    for (const [a, b] of shuffle(pairs, rnd).slice(0, 3)) steps.push({ kind: "duel", itemId: `l:${a}`, a, b, answer: rnd() < 0.5 ? a : b, rounds: 6 });
    // find it in a real Quran word
    for (const l of lesson.letters) { const st = spotStep(l, rnd); if (st) steps.push(st); }
    return withAudioFallback(steps);
  }

  if (JOIN_GROUPS[lesson.day]) {
    const group = JOIN_GROUPS[lesson.day];
    steps.push({ kind: "meet-skill", skill: "join", lessonId: lesson.id, examples: group });
    const positions: Position[] = lesson.day === 8 ? ["isolated", "final"] : ["initial", "medial", "final"];
    for (const l of shuffle(group, rnd)) {
      const p = positions[Math.floor(rnd() * positions.length)];
      const others = shuffle(group.filter((x) => x !== l), rnd).slice(0, 3);
      steps.push({ kind: "shapes", itemId: `l:${l}`, letter: l, position: p, choices: shuffle([l, ...others], rnd) });
      if (rnd() < 0.4) steps.push({ kind: "trace", letter: l, position: p });
    }
    for (const l of shuffle(group, rnd).slice(0, 4)) { const st = spotStep(l, rnd); if (st) steps.push(st); }
    return withAudioFallback(steps);
  }

  if (lesson.read) {
    for (const r of lesson.read) steps.push({ kind: "read-ayah", ...r });
    return steps;
  }

  // vowel / mark lessons: meet the mark, say syllables, pick by ear, build, read real words
  for (const sk of lesson.skills) steps.push({ kind: "meet-skill", skill: sk, lessonId: lesson.id, examples: lesson.say.slice(0, 3) });
  const sayList = lesson.say.length > 8 ? shuffle(lesson.say, rnd).slice(0, 8) : lesson.say;
  for (const t of sayList) steps.push({ kind: "say", itemId: t.length <= 3 ? `s:${t}` : `w:${t}`, text: t });
  const mark = lesson.skills.map((k) => SKILL_MARK[k]).find(Boolean);
  if (mark && lesson.day <= 23) {
    const marks = [FATHA, KASRA, DAMMA].filter((m) => (m === FATHA && known.skills.has("fatha")) || (m === KASRA && known.skills.has("kasra")) || (m === DAMMA && known.skills.has("damma")));
    for (const l of shuffle(knownLetters.filter((x) => x !== "ا"), rnd).slice(0, 4)) {
      const answer = l + mark;
      const choices = [...new Set([answer, ...marks.map((m) => l + m)])];
      if (choices.length > 1) steps.push({ kind: "listen-pick", itemId: `s:${answer}`, answer, choices: shuffle(choices, rnd) });
      steps.push({ kind: "build", itemId: `s:${answer}`, target: answer, letters: letterChoices(l, knownLetters, rnd, 3), marks: [...new Set([mark, ...marks])] });
    }
  }
  if (lesson.skills.some((k) => k.startsWith("long-"))) {
    const v = lesson.skills.includes("long-a") ? [FATHA, "ا"] : lesson.skills.includes("long-i") ? [KASRA, "ي"] : [DAMMA, "و"];
    for (const l of shuffle(knownLetters.filter((x) => x !== "ا"), rnd).slice(0, 4)) {
      const short = l + v[0], long = l + v[0] + v[1];
      steps.push({ kind: "short-long", itemId: `s:${long}`, short, long, answer: rnd() < 0.5 ? short : long });
    }
  }
  for (const w of practiceWords(lesson, 6)) steps.push({ kind: "read-word", itemId: `w:${w.key}`, key: w.key, text: w.text });
  return withAudioFallback(steps);
}

/** "Which word has ب?": one Quran word with the letter, two without. */
function spotStep(letter: string, rnd: () => number): Step | null {
  const withIt = wordsWithLetter(letter, 6);
  if (!withIt.length) return null;
  const answer = withIt[Math.floor(rnd() * withIt.length)];
  const without = shuffle(practicePool().filter((w) => !needs(w.text).letters.has(letter) && !Array.from(w.text).includes(letter) && w.text.length <= 8), rnd).slice(0, 2);
  return { kind: "spot", itemId: `l:${letter}`, letter, choices: shuffle([answer, ...without], rnd), answer: answer.key };
}

/** The sound a listening step plays, if it has been recorded. */
export function stepAudio(step: Step): string | undefined {
  if (step.kind === "listen-pick") return step.answer.length === 1 ? letterSoundAudio(step.answer) : syllableAudio(step.answer);
  if (step.kind === "duel") return letterSoundAudio(step.answer);
  if (step.kind === "short-long") return syllableAudio(step.answer);
  if (step.kind === "build") return syllableAudio(step.target);
  return undefined;
}

/**
 * Until the letter and syllable clips are recorded, a listening step becomes a speaking step on the
 * same item (the learner reads it, the AI checks it), so lessons never stall on missing audio.
 */
export function withAudioFallback(steps: Step[]): Step[] {
  return steps.map((st) => {
    if (!["listen-pick", "duel", "short-long", "build"].includes(st.kind) || stepAudio(st)) return st;
    const text = st.kind === "listen-pick" ? (st.answer.length === 1 ? st.answer + FATHA : st.answer) : st.kind === "duel" ? st.answer + FATHA : st.kind === "short-long" ? st.answer : st.kind === "build" ? st.target : "";
    const strict = st.kind === "duel" || (st.kind === "listen-pick" && st.answer.length === 1);
    return { kind: "say", itemId: (st as { itemId: string }).itemId, text, strictLetters: strict, review: "review" in st ? st.review : undefined } as Step;
  });
}

/** Items that enter review once a reading lesson is passed. */
export function lessonItems(lesson: Lesson): string[] {
  const ids = [...lesson.letters.map((l) => `l:${l}`), ...lesson.skills.map((k) => `k:${k}`)];
  for (const t of lesson.say) ids.push(t.length <= 3 ? `s:${t}` : `w:${t}`);
  for (const w of practiceWords(lesson, 6)) ids.push(`w:${w.key}`);
  return [...new Set(ids)];
}

// ---------- vocabulary days ----------

let PLAN: VocabDay[] | null = null;
export const VOCAB_PLAN = (): VocabDay[] => (PLAN ??= vocabPlan());

/** Pick 3 wrong meanings from words of the same kind, so the choice is about meaning, not grammar. */
function meaningChoices(id: string, rnd: () => number): string[] {
  const w = VOCAB_BY_ID.get(id)!;
  const same = VOCAB.slice(0, 600).filter((x) => x.id !== id && x.kind === w.kind && x.en !== w.en);
  return shuffle([id, ...shuffle(same, rnd).slice(0, 3).map((x) => x.id)], rnd);
}
function pieceChoices(id: string, rnd: () => number): string[] {
  const all = [...AFFIX.keys(), ...PATTERNS.map((p) => p.id)];
  const at = AFFIX.get(id)?.at;
  const same = all.filter((x) => x !== id && (AFFIX.get(x)?.at ?? "pattern") === (at ?? "pattern"));
  return shuffle([id, ...shuffle(same, rnd).slice(0, 3)], rnd);
}

export function vocabSteps(day: VocabDay, s: ArabicState, today: string): Step[] {
  const rnd = seeded(`u${day.day}:${today}`);
  const steps: Step[] = [];
  for (const p of day.affixes) steps.push({ kind: "meet-piece", itemId: p, pieceId: p });
  for (const id of day.words) steps.push({ kind: "meet-word", itemId: `v:${id}`, wordId: id, family: rootFamily(id).map((w) => w.id).filter((x) => x !== id).slice(0, 4) });
  for (const id of shuffle(day.words, rnd)) steps.push({ kind: "meaning-pick", itemId: `v:${id}`, wordId: id, choices: meaningChoices(id, rnd) });
  for (const p of day.affixes) steps.push({ kind: "piece-pick", itemId: p, pieceId: p, choices: pieceChoices(p, rnd) });
  // finish inside a real ayah: one where today's words appear
  const ex = VOCAB_BY_ID.get(day.words[0])?.ex;
  if (ex) steps.push({ kind: "understand-ayah", key: ex.split(":").slice(0, 2).join(":") });
  return steps;
}

export function vocabItems(day: VocabDay): string[] {
  return [...day.words.map((id) => `v:${id}`), ...day.affixes];
}

// ---------- reviews ----------

/** A due item as a quick recall step (the learner produces the answer). */
export function reviewStep(id: string, s: ArabicState, today: string): Step | null {
  const rnd = seeded(`rev:${id}:${today}`);
  const known = LETTERS.map((l) => l.ar).filter((l) => s.memory[`l:${l}`]);
  const [type, rest] = [id.slice(0, id.indexOf(":")), id.slice(id.indexOf(":") + 1)];
  switch (type) {
    case "l": return rest === "ا" ? null : rnd() < 0.5
      ? { kind: "listen-pick", itemId: id, answer: rest, choices: letterChoices(rest, known.length >= 4 ? known : LETTERS.map((l) => l.ar), rnd), review: true }
      : { kind: "say", itemId: id, text: rest + FATHA, strictLetters: true, review: true };
    case "s": return { kind: "say", itemId: id, text: rest, review: true };
    case "w": return rest.includes(":") ? { kind: "read-word", itemId: id, key: rest, text: quranWordText(rest) ?? "", review: true } : { kind: "say", itemId: id, text: rest, review: true };
    case "v": return { kind: "meaning-pick", itemId: id, wordId: rest, choices: meaningChoices(rest, rnd), review: true };
    case "a": case "g": return { kind: "piece-pick", itemId: id, pieceId: id, choices: pieceChoices(id, rnd), review: true };
    case "k": return null; // skills are reviewed through their syllables and words
    default: return null;
  }
}

// ---------- the Today card ----------

/** The understanding track opens once any Quran word can be read (Uthmani spelling taught). */
export const UNDERSTAND_OPENS_AFTER = "r26";

export type LessonStatus = "passed" | "open" | "locked";
export function lessonStatus(s: ArabicState, lesson: Lesson): LessonStatus {
  if (s.passed[lesson.id]) return "passed";
  if (s.placement && lesson.day < s.placement.startDay) return "passed";
  const prev = LESSONS.find((l) => l.day === lesson.day - 1);
  return !prev || lessonStatus(s, prev) === "passed" ? "open" : "locked";
}
export function nextLesson(s: ArabicState): Lesson | undefined {
  return LESSONS.find((l) => lessonStatus(s, l) === "open");
}
export function understandOpen(s: ArabicState): boolean {
  return lessonStatus(s, LESSON.get(UNDERSTAND_OPENS_AFTER)!) === "passed";
}
export function nextVocabDay(s: ArabicState): VocabDay | undefined {
  if (!understandOpen(s)) return undefined;
  return VOCAB_PLAN().find((d) => !s.vocabDone[d.day]);
}

export interface TodayPlan {
  reviews: string[]; // due item ids
  reviewSteps: Step[];
  lesson?: Lesson; // next reading lesson
  vocabDay?: VocabDay;
  /** Rough minutes: ~10 s per review, lessons ~12 min, vocabulary days ~10 min. */
  minutes: number;
  doneToday: boolean; // practised at least once today
}

export function today(s: ArabicState, day: string): TodayPlan {
  const reviews = dueItems(s, day, 20);
  const reviewSteps = withAudioFallback(reviews.map((id) => reviewStep(id, s, day)).filter((x): x is Step => !!x));
  const lesson = nextLesson(s);
  const vocab = nextVocabDay(s);
  // one new thing a day: reading first; once reading is done, vocabulary
  const doneToday = (s.days[day] ?? 0) > 0;
  const lessonToday = lesson && !s.attempts.some((a) => a.on === day && a.lessonId === lesson.id && a.score >= lesson.mastery) ? lesson : undefined;
  const vocabToday = !lessonToday ? vocab : undefined;
  const minutes = Math.round(reviewSteps.length / 6) + (lessonToday ? 12 : 0) + (vocabToday ? 10 : 0);
  return { reviews, reviewSteps, lesson: lessonToday, vocabDay: vocabToday, minutes: Math.max(minutes, reviews.length ? 2 : 0), doneToday };
}

// ---------- finishing ----------

export interface Finish {
  passed: boolean;
  score: number;
  unlocked?: string; // next lesson id when passed
}

/** Save a finished reading lesson (score = share of steps right on the first try). */
export function finishLesson(s: ArabicState, lessonId: string, score: number, minutes: number, day: string): Finish {
  const lesson = LESSON.get(lessonId);
  if (!lesson) return { passed: false, score };
  s.attempts.push({ lessonId, on: day, score, minutes });
  s.days[day] = (s.days[day] ?? 0) + minutes;
  const passed = score >= lesson.mastery;
  if (passed && !s.passed[lessonId]) {
    s.passed[lessonId] = day;
    enterReview(s, lessonItems(lesson), day);
  }
  const next = LESSONS.find((l) => l.day === lesson.day + 1);
  return { passed, score, unlocked: passed ? next?.id : undefined };
}

/** Save a finished vocabulary day. Meanings need 80% to count as learned. */
export function finishVocabDay(s: ArabicState, dayNo: number, score: number, minutes: number, day: string): Finish {
  const d = VOCAB_PLAN().find((x) => x.day === dayNo);
  if (!d) return { passed: false, score };
  s.attempts.push({ lessonId: `u${dayNo}`, on: day, score, minutes });
  s.days[day] = (s.days[day] ?? 0) + minutes;
  const passed = score >= 0.8;
  if (passed && !s.vocabDone[dayNo]) {
    s.vocabDone[dayNo] = day;
    enterReview(s, vocabItems(d), day);
  }
  return { passed, score, unlocked: passed ? `u${dayNo + 1}` : undefined };
}

/** Save reviews: each answer moves its item's next review date. */
export { recordAnswer } from "./scheduler";
export { topConfusions };
export { LETTER };
