import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { toPhonemes, lengthClass } from "./phonetic";
import { judge, targetsFor, units } from "./judge";
import { canRead, needs } from "./readable";
import { LESSONS, knownAfter, fatihaMeter, practiceWords } from "./curriculum";
import { analyzeWord, coverageOfTop, understood, vocabPlan, VOCAB } from "./vocab";
import { newState } from "./state";
import { finishLesson, finishVocabDay, lessonSteps, lessonStatus, nextLesson, today, understandOpen, VOCAB_PLAN } from "./session";
import { applyPlacement, startDay, nextPart } from "./placement";
import { dueItems, recordAnswer } from "./scheduler";
import { newMilestones, overview } from "./progress";
import { recordingList, syllableAudio, quranWordAudio } from "./audio";

describe("phonetic", () => {
  test("primer syllables", () => {
    expect(toPhonemes("بَ")).toBe("بَ");
    expect(toPhonemes("بِي")).toBe("بِۦۦ");
    expect(toPhonemes("بُو")).toBe("بُۥۥ");
    expect(toPhonemes("بَا")).toBe("بَاا");
    expect(toPhonemes("أَبْ")).toBe("ءَب");
    expect(toPhonemes("بَّ")).toBe("ببَ");
    expect(toPhonemes("بٌ")).toBe("بُن");
  });
  test("Quran words on their own and when stopping", () => {
    expect(toPhonemes("ٱلْحَمْدُ")).toBe("ءَلحَمدُ");
    expect(toPhonemes("ٱلْحَمْدُ", { pause: true })).toBe("ءَلحَمد");
    expect(toPhonemes("ٱلشَّمْسُ")).toBe("ءَششَمسُ");
    expect(toPhonemes("ٱللَّهُ")).toBe("ءَللَااهُ");
    expect(toPhonemes("مَـٰلِكِ")).toBe("مَاالِكِ");
    expect(lengthClass(toPhonemes("ٱلضَّآلِّينَ", { pause: true }))).toBe("ءَضضَااللِۦۦن");
    expect(toPhonemes("عَلِيمًا", { pause: true })).toBe("عَلِۦۦمَاا");
  });
  test("matches the whole-Quran answer key (mid-ayah words, context effects ignored)", () => {
    const dir = join(import.meta.dir, "../../../public/hifz-ai/ayat");
    const norm = (s: string) => s.replace(/ں/g, "ن").replace(/۾/g, "م").replace(/ڇ/g, "").replace(/(.)\1+/g, "$1");
    let n = 0, ok = 0;
    for (const f of readdirSync(dir)) {
      const d = JSON.parse(readFileSync(join(dir, f), "utf8")) as Record<string, [number, string, string][]>;
      for (const ws of Object.values(d)) for (let i = 1; i < ws.length - 1; i++) {
        const [, t, p] = ws[i];
        if (t.includes(" ")) continue;
        n++;
        const a = norm(toPhonemes(t, { standalone: false })), b = norm(p);
        if (a === b || a.slice(0, -1) === b || a === b.slice(0, -1) || a.slice(0, -1) === b.slice(0, -1)) ok++;
      }
    }
    expect(ok / n).toBeGreaterThan(0.975);
  });
});

describe("judge", () => {
  // heard strings come from the real model on clipped recordings (Al-Mulk 67:1)
  test("a syllable said right", () => expect(judge(targetsFor("تَ"), "تَ").verdict).toBe("correct"));
  test("wrong vowel fails", () => {
    const r = judge(targetsFor("تِ"), "تَ");
    expect(r.verdict).toBe("wrong");
    expect(r.issues[0].kind).toBe("vowel");
  });
  test("heavy/light swap is close, but a retry in letter lessons", () => {
    expect(judge(targetsFor("طَ"), "تَ").verdict).toBe("close");
    expect(judge(targetsFor("طَ"), "تَ", { strictLetters: true }).verdict).toBe("wrong");
  });
  test("length and shadda are named", () => {
    expect(judge(targetsFor("تَبَ"), "تَبَاا").issues.map((i) => i.kind)).toEqual(["too-long"]);
    expect(judge(targetsFor("تَبَا"), "تَبَاا").verdict).toBe("correct");
    expect(judge(targetsFor("رَبِّ"), "رَبِ").issues[0].kind).toBe("shadda");
  });
  test("stopping on a word is fine, a different letter is not", () => {
    expect(judge(targetsFor("ٱلْحَمْدُ"), "ءَلحَمد").verdict).toBe("correct");
    expect(judge(targetsFor("قُلْ"), "بُل").verdict).toBe("wrong");
    expect(judge(targetsFor("بَ"), "").verdict).toBe("silent");
  });
  test("two words, as recited", () => expect(judge(targetsFor("تَبَـٰرَكَ ٱلَّذِى"), "تَبَاارَكَللَذِۦۦ").verdict).toBe("correct"));
  test("units", () => expect(units("رَببِ")).toEqual([{ c: "ر", v: "a", long: false, double: false }, { c: "ب", v: "i", long: false, double: true }]));
});

describe("readable", () => {
  test("needs", () => {
    expect([...needs("خَلَقَ").skills].sort()).toEqual(["fatha", "join"]);
    expect(needs("مِن").skills.has("sukun")).toBe(true); // Uthmani leaves the sukoon unwritten
    expect(needs("ٱلشَّمْسِ").skills.has("sun")).toBe(true);
    expect(needs("ٱلْحَمْدُ").skills.has("al")).toBe(true);
    expect(needs("يَوْمِ").skills.has("leen")).toBe(true);
  });
  test("lessons unlock real words in order", () => {
    expect(canRead("خَلَقَ", knownAfter(8))).toBe(false);
    expect(canRead("خَلَقَ", knownAfter(9))).toBe(true);
    expect(canRead("ٱلْحَمْدُ", knownAfter(23))).toBe(false);
    expect(canRead("ٱلْحَمْدُ", knownAfter(24))).toBe(true);
  });
  test("Al-Fatiha meter climbs to all 29 words by lesson 26", () => {
    expect(fatihaMeter(knownAfter(8)).readable).toBe(0);
    const mid = fatihaMeter(knownAfter(22)).readable;
    expect(mid).toBeGreaterThan(5);
    expect(fatihaMeter(knownAfter(26)).readable).toBe(29);
  });
  test("every vowel lesson has real Quran practice words", () => {
    for (const l of LESSONS.filter((x) => x.day >= 9 && x.day <= 27)) expect(practiceWords(l).length).toBeGreaterThan(0);
  });
});

describe("vocabulary", () => {
  test("coverage of the top families", () => {
    expect(coverageOfTop(100)).toBeGreaterThan(0.55);
    expect(coverageOfTop(500)).toBeGreaterThan(0.75);
  });
  test("word analysis", () => {
    expect(analyzeWord("وَقَالُوا۟").word?.ar).toBe("قَالَ");
    expect(analyzeWord("وَقَالُوا۟").front).toEqual(["a:wa"]);
    expect(analyzeWord("رَبِّهِمْ").word?.ar).toBe("رَبّ");
    expect(analyzeWord("رَبِّهِمْ").end).toBe("a:hum");
    expect(analyzeWord("ٱللَّهِ").word?.ar).toBe("ٱللَّه");
    expect(analyzeWord("مَنْ").word?.ar).toBe("مَنْ");
    expect(analyzeWord("مِنْ").word?.ar).toBe("مِنْ");
    expect(analyzeWord("إِن").word?.ar).toBe("إِنْ");
    expect(analyzeWord("بِٱلْحَقِّ").word?.ar).toBe("حَقّ");
    expect(analyzeWord("سَبَإٍۭ").word).toBeUndefined(); // not the preposition بِ
  });
  test("understood counts only fully known words", () => {
    const rabb = VOCAB.find((w) => w.ar === "رَبّ")!.id;
    const r = understood(["رَبِّ", "رَبِّهِمْ"], new Set([rabb]), new Set());
    expect(r.each).toEqual([true, false]);
  });
  test("the 60-day plan: tiny words first, ~8 a day, no repeats, root siblings close together", () => {
    const plan = vocabPlan();
    expect(plan.length).toBe(60);
    expect(plan[0].words.map((id) => VOCAB.find((w) => w.id === id)!.ar)).toContain("مِنْ");
    const all = plan.flatMap((d) => d.words);
    expect(new Set(all).size).toBe(all.length);
    expect(all.length).toBeGreaterThan(450);
  });
});

describe("course flow", () => {
  const D = "2026-11-02";
  test("lesson 1 builds see / say / trace / spot steps; listening becomes speaking until clips are recorded", () => {
    const s = newState(D);
    const steps = lessonSteps(LESSONS[0], s, D);
    const kinds = new Set(steps.map((x) => x.kind));
    for (const k of ["meet-letter", "say", "trace", "spot"]) expect(kinds.has(k as never)).toBe(true);
    expect(kinds.has("listen-pick")).toBe(false); // no recordings yet
    const spot = steps.find((x) => x.kind === "spot")!;
    if (spot.kind === "spot") expect(spot.choices.filter((c) => Array.from(c.text).includes(spot.letter)).map((c) => c.key)).toEqual([spot.answer]);
  });
  test("speakers skip the sound drills", () => {
    const beginner = newState(D);
    const speaker = newState(D);
    speaker.learner = "speaker";
    const says = (st: ReturnType<typeof newState>) => lessonSteps(LESSONS[0], st, D).filter((x) => x.kind === "say").length;
    expect(says(speaker)).toBeLessThan(says(beginner));
  });
  test("mastery gate and reviews", () => {
    const s = newState(D);
    expect(nextLesson(s)?.id).toBe("r1");
    expect(finishLesson(s, "r1", 0.7, 10, D).passed).toBe(false);
    expect(lessonStatus(s, LESSONS[1])).toBe("locked");
    expect(finishLesson(s, "r1", 0.9, 10, D).passed).toBe(true);
    expect(nextLesson(s)?.id).toBe("r2");
    expect(s.memory["l:ب"]).toBeDefined();
    const later = "2026-11-10";
    expect(dueItems(s, later)).toContain("l:ب");
    recordAnswer(s, "l:ب", { correct: true }, later);
    expect(s.memory["l:ب"].due > later).toBe(true);
  });
  test("a wrong pick is remembered as a confusion", () => {
    const s = newState(D);
    recordAnswer(s, "l:ح", { correct: false }, D, "l:ه");
    expect(s.confusions["l:ح>l:ه"]).toBe(1);
  });
  test("today: one new thing, reviews first", () => {
    const s = newState(D);
    const t = today(s, D);
    expect(t.lesson?.id).toBe("r1");
    expect(t.vocabDay).toBeUndefined();
  });
  test("understanding opens after Quran spelling; vocabulary days pass at 80%", () => {
    const s = newState(D);
    applyPlacement(s, { learner: "some-reading", letters: 6, syllables: 5, words: 4 }, D);
    expect(s.placement?.startDay).toBe(28);
    expect(understandOpen(s)).toBe(true);
    expect(finishVocabDay(s, 1, 0.9, 8, D).passed).toBe(true);
    expect(s.memory[`v:${VOCAB_PLAN()[0].words[0]}`]).toBeDefined();
  });
  test("placement", () => {
    expect(nextPart({ learner: "beginner" })).toBe("done");
    expect(startDay({ learner: "beginner" })).toBe(1);
    expect(startDay({ learner: "speaker", letters: 3 })).toBe(1);
    expect(startDay({ learner: "speaker", letters: 6, syllables: 2 })).toBe(6);
    expect(startDay({ learner: "some-reading", letters: 6, syllables: 5, words: 1 })).toBe(16);
  });
  test("milestones and overview", () => {
    const s = newState(D);
    for (const l of LESSONS.slice(0, 9)) finishLesson(s, l.id, 1, 10, D);
    const got = newMilestones(s, D).map((m) => m.id);
    expect(got).toEqual(expect.arrayContaining(["first-letter", "all-letters", "first-word"]));
    expect(newMilestones(s, D)).toEqual([]);
    expect(overview(s, D).readingDay).toBe(9);
  });
});

describe("audio", () => {
  test("recording list and paths", () => {
    const list = recordingList();
    expect(list.filter((c) => c.priority === 1).length).toBe(29 + 28 * 3);
    expect(syllableAudio("بَ")).toBeUndefined(); // nothing recorded yet -> "audio coming"
    expect(quranWordAudio("1:2:1")).toBe("https://audio.qurancdn.com/wbw/001_002_001.mp3");
  });
});
