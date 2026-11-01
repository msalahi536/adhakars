import type { CheckResult } from "./checker";

export type TajweedHint = { key: string; word: string; label: "Heavy letter" | "Qalqalah" | "Madd" | "Shadda"; tip: string };
export const TAJWEED_TIPS_DISCLAIMER = "Tajweed tips are automatic and can be wrong. Learn tajweed with a qualified teacher.";
/** Conservative practice cues, not acoustic tajweed diagnoses. Only uncertain pronunciation differences qualify. */
export function tajweedHints(result: CheckResult, passages: { sura: number; first: number; last: number }[]): TajweedHint[] {
  const hints: TajweedHint[] = [];
  for (const w of result.words) {
    const [sura, aya] = w.key.split(":").map(Number);
    if (w.status !== "unsure" || !w.heard || w.heard === w.expected || !passages.some((p) => p.sura === sura && aya >= p.first && aya <= p.last)) continue;
    const base = { key: w.key, word: w.text };
    if (/[قطبجد]ْ/u.test(w.text)) hints.push({ ...base, label: "Qalqalah", tip: "Practise a light echo on the still letter without adding a vowel. Compare with the recording." });
    else if (/ّ/u.test(w.text)) hints.push({ ...base, label: "Shadda", tip: "Give the doubled letter its full articulation. Listen and repeat with a teacher’s guidance." });
    else if (/ٓ/u.test(w.text)) hints.push({ ...base, label: "Madd", tip: "Listen to how the reciter holds the vowel. Its length depends on the tajweed rule and where you stop." });
    else if (/[خصضغطظق]/u.test(w.text)) hints.push({ ...base, label: "Heavy letter", tip: "Practise the full sound of the heavy letter without forcing it. Compare with the correct word audio." });
    if (hints.length === 3) break;
  }
  return hints;
}