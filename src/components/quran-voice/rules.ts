import type { SearchAnswer } from "@/lib/hifz-ai";
export const VOICE_SEARCH_MS = 15000;
export function searchPresentation(answer: SearchAnswer) {
  const matches = distinctMatches(answer.matches).slice(0, answer.confident ? 1 : 2);
  const main = matches[0];
  const samePhrase = distinctMatches(answer.samePhrase, Infinity).filter((m) => m.sura !== main?.sura || m.aya !== main?.aya);
  return { matches, samePhrase };
}
export function englishByDefault(language: string) { return language.toLowerCase().split(/[-_]/)[0] !== "ar"; }
export function distinctMatches<T extends { sura: number; aya: number }>(matches: T[], limit = 3) {
  return matches.filter((m, i) => matches.findIndex((other) => other.sura === m.sura && other.aya === m.aya) === i).slice(0, limit);
}
export function paintPosition(root: HTMLElement | null, key: string, locked: boolean) {
  const previous = root?.querySelector<HTMLElement>(".qv-current-word");
  if (!locked) { previous?.classList.add("qv-word-dim"); return; }
  const current = root?.querySelector<HTMLElement>(`[data-follow-word="${key}"]`);
  if (previous !== current) previous?.classList.remove("qv-current-word", "qv-word-dim");
  (current ?? previous)?.classList.add("qv-current-word");
  (current ?? previous)?.classList.toggle("qv-word-dim", !locked);
}