/**
 * Replay your recitation: where each word sits in your own recording, so the app can
 *  - highlight words as the recording plays back, and
 *  - play "your version" of a mistake: a short clip around the word, next to the qari's correct word.
 *
 * Needs result.times (added by the live session) and a recording that started with the mic
 * (the debug MediaRecorder). The AI reports a word ~0.5 s after it is said; that is corrected here.
 */
import type { CheckResult } from "./checker";

/** Median delay between saying a sound and the AI reporting it, measured on real recordings. */
export const REPORT_DELAY = 0.5;

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
    const end = Math.max(start + 0.25, (t[w.end] ?? 0) - shift + 0.25);
    spans.push({ key: w.key, start, end });
  }
  // keep spans in order and non-overlapping (the AI reports in 0.3 s steps)
  for (let i = 1; i < spans.length; i++) if (spans[i].start < spans[i - 1].start) spans[i].start = spans[i - 1].start;
  for (let i = 0; i + 1 < spans.length; i++) spans[i].end = Math.min(spans[i].end, Math.max(spans[i].start + 0.2, spans[i + 1].start));
  return spans;
}

/**
 * Clip of the user's own recording around a word ("hear where you slipped"). For a skipped word (never
 * heard) the clip covers the gap between its neighbours.
 */
export function clipFor(timeline: WordSpan[], result: CheckResult, key: string, opts: { before?: number; after?: number } = {}): { from: number; to: number } | null {
  const before = opts.before ?? 1.2;
  const after = opts.after ?? 0.6;
  const own = timeline.find((s) => s.key === key);
  if (own) return { from: Math.max(0, own.start - before), to: own.end + after };
  const order = result.words.map((w) => w.key);
  const i = order.indexOf(key);
  if (i < 0) return null;
  const prev = [...timeline].reverse().find((s) => order.indexOf(s.key) < i);
  const next = timeline.find((s) => order.indexOf(s.key) > i);
  if (!prev && !next) return null;
  const from = Math.max(0, (prev?.end ?? next!.start) - before);
  const to = (next?.start ?? prev!.end) + after;
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
