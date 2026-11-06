/**
 * Replay your recitation: where each word sits in your own recording, so the app can
 *  - highlight words as the recording plays back, and
 *  - play "your version" of a mistake: a short clip around the word, next to the qari's correct word.
 *
 * Needs result.times (added by the live session) and a recording that started with the mic.
 * result.times are frame-accurate: the moment each sound was detected in the audio. Measured on real
 * recitation, a word starts ~0.2 s before its first detected sound and ends ~0.05 s after its last.
 */
import type { CheckResult } from "./checker";

/** How long before its first detected sound a word starts (s), measured on real recitation. */
export const REPORT_DELAY = 0.2;
/** How long after its last detected sound a word ends (s). */
export const WORD_TAIL = 0.05;
/** Extra time a word before a pause may run on (its held ending vowel) (s). */
export const AYAH_END_HOLD = 0.7;
/** A gap between two heard words at least this long is a pause (s). */
export const PAUSE = 0.3;
/** Longest stretch of the recording replayed for one word (s). */
export const MAX_WORD = 2.2;

export interface WordSpan {
  key: string;
  start: number; // seconds into the recording
  end: number;
}

/** Start/end of every heard word in the recording (words never heard are left out). */
export function wordTimeline(result: CheckResult & { times?: number[] }, opts: { delay?: number; offset?: number } = {}): WordSpan[] {
  const t = result.times;
  if (!t?.length) return [];
  const shift = (opts.delay ?? REPORT_DELAY) - (opts.offset ?? 0); // offset: seconds the recorder started BEFORE the AI
  const spans: WordSpan[] = [];
  for (const w of result.words) {
    if (w.at === undefined || w.end === undefined) continue;
    const start = Math.max(0, (t[w.at] ?? 0) - shift);
    const end = Math.max(start + 0.2, (t[w.end] ?? 0) + (opts.offset ?? 0) + WORD_TAIL);
    spans.push({ key: w.key, start, end });
  }
  // before a stop (end of an ayah, or any pause) the held ending vowel makes no new sound for the AI,
  // so the word's last detected sound comes early: let it run on into the pause. After a pause the
  // word's opening (often a soft hamza) is caught late: start it a little earlier.
  for (let i = 0; i < spans.length; i++) {
    const next = spans[i + 1];
    const gap = next ? next.start - spans[i].end : Infinity;
    if (gap < PAUSE) continue;
    spans[i].end = next ? Math.min(spans[i].end + AYAH_END_HOLD, next.start - 0.2) : spans[i].end + AYAH_END_HOLD;
    if (next) next.start = Math.max(spans[i].end + 0.05, next.start - 0.15);
  }
  // keep spans in order and non-overlapping
  for (let i = 1; i < spans.length; i++) if (spans[i].start < spans[i - 1].start) spans[i].start = spans[i - 1].start;
  for (let i = 0; i + 1 < spans.length; i++) spans[i].end = Math.min(spans[i].end, Math.max(spans[i].start + 0.2, spans[i + 1].start));
  return spans;
}

/**
 * Clip of the user's own recording around a word ("hear where you slipped"). For a skipped word (never
 * heard) the clip covers the gap between its neighbours.
 */
export function clipFor(timeline: WordSpan[], result: CheckResult, key: string, opts: { before?: number; after?: number } = {}): { from: number; to: number } | null {
  // just the word, with a sliver of air either side (not the words around it)
  const before = opts.before ?? 0.05;
  const after = opts.after ?? 0.08;
  const own = timeline.find((s) => s.key === key);
  // a word said completely differently can soak up a long stretch: play only its start
  if (own) return { from: Math.max(0, own.start - before), to: Math.min(own.end, own.start + MAX_WORD) + after };
  const order = result.words.map((w) => w.key);
  const i = order.indexOf(key);
  if (i < 0) return null;
  const prev = [...timeline].reverse().find((s) => order.indexOf(s.key) < i);
  const next = timeline.find((s) => order.indexOf(s.key) > i);
  if (!prev && !next) return null;
  // a skipped word was never said: play the moment it should have been, i.e. the join between
  // the last word before it and the first word after it (a little of each)
  const from = Math.max(0, (prev?.end ?? next!.start) - 0.45);
  const to = Math.min((next?.start ?? prev!.end) + 0.45, from + MAX_WORD);
  return { from, to };
}

/** The word being said at playback time `t` (for highlighting during replay). */
export function wordAt(timeline: WordSpan[], t: number): string | null {
  let lo = 0;
  let hi = timeline.length - 1;
  let found: string | null = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (timeline[mid].start <= t) { found = t <= timeline[mid].end + 0.15 ? timeline[mid].key : found; lo = mid + 1; }
    else hi = mid - 1;
  }
  return found;
}

type Timed = CheckResult & { heard?: string; conf?: number[]; times?: number[] };

/**
 * Join the result of one page with the pages recited before it in the same mic session.
 * Each page restarts the AI (its clock starts again at 0), while the recording keeps running:
 * `offset` = seconds into the recording when this page's AI started. Words already in `prev`
 * that are recited again on this page are replaced by the new attempt.
 */
export function mergeResults(prev: Timed | null, cur: Timed, offset: number): Timed {
  const times = (cur.times ?? []).map((t) => t + offset);
  if (!prev) return { ...cur, times };
  const shift = (prev.heard ?? "").length;
  const mine = new Set(cur.words.map((w) => w.key));
  const move = (n?: number) => (n === undefined ? undefined : n + shift);
  return {
    ...cur,
    words: [...prev.words.filter((w) => !mine.has(w.key)), ...cur.words.map((w) => ({ ...w, at: move(w.at), end: move(w.end) }))],
    extras: [...prev.extras.filter((x) => !mine.has(x.atKey)), ...cur.extras],
    heard: (prev.heard ?? "") + (cur.heard ?? ""),
    conf: [...(prev.conf ?? []), ...(cur.conf ?? [])],
    times: [...(prev.times ?? []), ...times],
  };
}
