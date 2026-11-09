export { startListening, getRecognizer, prepareChecker, type ListenSession } from "./listen";
export { QuranRecognizer, DEFAULT_MODEL_URL, ORT_VERSION, type Emission } from "./recognizer";
export { check, buildReference, loadSurah, harakahIssue, strictLetterIssue, type CheckResult, type WordResult, type WordStatus, type ExtraSpeech } from "./checker";
export { fbank, StreamingFbank, SR } from "./fbank";

export { AI_DISCLAIMER, AI_CREDIT } from "./notices";
export { checkerDownloaded } from "./assets";

// Whole-Quran voice features
export { loadQuranIndex, findInQuran, judgeSearch, skel, type Hit, type WordRef, type SearchAnswer } from "./quran-index";
export { startFollowing, startVoiceSearch, Follower, type FollowPosition, type FollowSession } from "./follow";
export { findDrifts, diffAyat, type Drift } from "./mutashabih";
export { findHesitations, masteryScore, type Hesitation, type Mastery } from "./fluency";
export { openMic, type Mic } from "./mic";
export { tajweedHints, type TajweedHint, type TajweedKind } from "./tajweed";
export { wordTimeline, clipFor, wordAt, mergeResults, REPORT_DELAY, WORD_TAIL, MAX_WORD, type WordSpan } from "./replay";
export { startSmartRecite, detectElsewhere, type Elsewhere, type Passage } from "./smart";
export { RecitationTracker, TRACKER } from "./tracker";
