export { startListening, getRecognizer, type ListenSession } from "./listen";
export { QuranRecognizer, DEFAULT_MODEL_URL, ORT_VERSION, type Emission } from "./recognizer";
export { check, buildReference, loadSurah, type CheckResult, type WordResult, type WordStatus, type ExtraSpeech } from "./checker";
export { fbank, StreamingFbank, SR } from "./fbank";

/** Must be shown wherever AI feedback appears (model license NPL-1.2). */
export const AI_DISCLAIMER =
  "Automatic recitation feedback can be wrong and does not replace a qualified teacher.";
export const AI_CREDIT =
  "Recitation checking uses the Quran-Lab zipformer_p-arabic-v3.2 model (NPL-1.2 license), offered free.";
