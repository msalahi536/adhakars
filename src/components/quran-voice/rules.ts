export const VOICE_SEARCH_MS = 8000;
export function englishByDefault(language: string) { return language.toLowerCase().split(/[-_]/)[0] !== "ar"; }
export function distinctMatches<T extends { sura: number; aya: number }>(matches: T[]) {
  return matches.filter((m, i) => matches.findIndex((other) => other.sura === m.sura && other.aya === m.aya) === i).slice(0, 3);
}
export function paintPosition(root: HTMLElement | null, key: string, locked: boolean) {
  const previous = root?.querySelector<HTMLElement>(".qv-current-word");
  const current = root?.querySelector<HTMLElement>(`[data-follow-word="${key}"]`);
  if (previous !== current) previous?.classList.remove("qv-current-word", "qv-word-dim");
  (current ?? previous)?.classList.add("qv-current-word");
  (current ?? previous)?.classList.toggle("qv-word-dim", !locked);
}