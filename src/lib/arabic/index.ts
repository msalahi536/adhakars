/**
 * Arabic Companion (v2): from not knowing a single letter to reading the Quran (Track 1, 30 lessons),
 * then recognising its most frequent words (Track 2, 60 days). Pure logic here; screens call it.
 *
 * Free forever: the "say it" checking uses the hifz recitation model (NPL-1.2, free use only).
 * Show AI_DISCLAIMER and AI_CREDIT from @/lib/hifz-ai wherever the mic checks speech.
 */
export { toPhonemes, lengthClass } from "./phonetic";
export { LETTERS, LETTER, LOOKALIKES, SOUNDALIKES, HAMZA_SEATS, MAKHRAJ_LABEL, shapes, type Letter, type Makhraj, type Position } from "./letters";
export { needs, canRead, missingFor, type Skill, type Known, type Needs } from "./readable";
export { LESSONS, LESSON, knownAfter, practiceWords, practicePool, fatihaMeter, wordsWithLetter, quranWordText, type Lesson, type Drill } from "./curriculum";
export { VOCAB, VOCAB_BY_ID, QURAN_WORDS, AFFIXES, AFFIX, PATTERNS, analyzeWord, understood, vocabPlan, rootFamily, coverageOf, coverageOfTop, bareLetters, type VocabWord, type Affix, type VocabDay, type WordAnalysis } from "./vocab";
export { units, compare, judge, targetsFor, type SayResult, type Issue, type IssueKind, type Verdict } from "./judge";
export { startSay, wordKeyPhonemes, ayahWords, type SayOptions, type SaySession } from "./speech";
export { gradeFor, enterReview, recordAnswer, dueItems, topConfusions, itemStrength, COURSE_SCHEDULE, type Answer } from "./scheduler";
export { lessonSteps, lessonItems, stepAudio, withAudioFallback, vocabSteps, vocabItems, reviewStep, lessonStatus, nextLesson, nextVocabDay, understandOpen, today, finishLesson, finishVocabDay, VOCAB_PLAN, UNDERSTAND_OPENS_AFTER, type Step, type TodayPlan, type LessonStatus, type Finish } from "./session";
export { PLACEMENT_INTRO, PLACEMENT_LETTERS, PLACEMENT_SYLLABLES, PLACEMENT_WORDS, nextPart, startDay, applyPlacement, type PlacementAnswers } from "./placement";
export { overview, streak, newMilestones, MILESTONES, readingDay, knownWords, knownPieces, type Overview, type Milestone } from "./progress";
export { loadState, saveState, newState, localDay, STORAGE_KEY, type ArabicState, type LearnerType, type LessonAttempt } from "./state";
export { recordingList, letterNameAudio, letterSoundAudio, syllableAudio, quranWordAudio, type Clip } from "./audio";
