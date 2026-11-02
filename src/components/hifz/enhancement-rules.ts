export const ECHO_DEFAULTS = { repeats: 3, joined: 2, gap: 1, speed: 1, hide: false, check: false };
/** Device reader state must finish hydrating before a session can claim its page. */
export function sessionPageReady(hydrated: boolean, loadedPage: number, targetPage: number | null) {
  return hydrated && (!targetPage || loadedPage === targetPage);
}
export function echoSequence(keys: string[], repeats: number, joined: number) {
  const single = keys.flatMap((key) => Array.from({ length: Math.max(1, Math.min(10, repeats)) }, (_, n) => ({ keys: [key], round: n + 1, total: repeats })));
  const together = Array.from({ length: Math.max(0, Math.min(5, joined)) }, (_, n) => ({ keys, round: n + 1, total: joined }));
  return [...single, ...together];
}
export const milestoneKey = (m: { kind: string; id: number }) => `${m.kind}:${m.id}`;
export function pageReached(result: { reachedIndex: number; words: { status: string }[] }, silence: number) {
  return result.words.length > 0 && result.reachedIndex >= result.words.length - 1 && !["pending", "in_progress"].includes(result.words.at(-1)?.status ?? "pending") && silence >= 1500;
}