/**
 * Live mistakes are only shown once they are sure.
 * While reciting, the AI hears ~0.5 s late and the alignment can briefly call a word wrong or
 * skipped (around repeats and restarts) before more audio sets it right. Measured on real
 * recordings: a real skip (nothing heard for the word) holds from its first update, while false
 * alarms are "wrong" calls on half-heard audio that flicker for up to ~5 updates (1.6 s). So:
 *   skipped -> shown after 3 steady updates with the reciter 3+ words past it (~1 s),
 *   wrong   -> shown after 6 steady updates with the reciter 2+ words past it.
 * Until then the word shows as "unsure".
 * Final results (stop) are never held.
 */
import type { CheckResult, WordStatus } from "./checker";

export class MistakeStabilizer {
  private streak = new Map<string, { status: WordStatus; n: number }>();
  constructor(private rules = { skipped: { updates: 3, past: 3 }, wrong: { updates: 6, past: 2 } }) {}

  reset() { this.streak.clear(); }

  apply<T extends CheckResult>(r: T): T {
    let frontier = -1;
    r.words.forEach((w, i) => { if (w.status !== "pending") frontier = i; });
    const words = r.words.map((w, i) => {
      const bad = w.status === "wrong" || w.status === "skipped";
      const prev = this.streak.get(w.key);
      const n = bad && prev?.status === w.status ? prev.n + 1 : bad ? 1 : 0;
      if (bad) this.streak.set(w.key, { status: w.status, n });
      else this.streak.delete(w.key);
      const rule = w.status === "skipped" ? this.rules.skipped : this.rules.wrong;
      const sure = bad && n >= rule.updates && frontier - i >= rule.past;
      return bad && !sure ? { ...w, status: "unsure" as WordStatus } : w;
    });
    return { ...r, words };
  }
}
