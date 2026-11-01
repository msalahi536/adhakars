/**
 * Imam follow-along: track where a reciter is in the Quran, word by word, live.
 *
 *   const f = await startFollowing({ onPosition: (p) => highlight(p.sura, p.aya, p.word) })
 *   ...
 *   await f.stop()
 *
 * Locks on after ~1 s of recitation, follows locally, and relocates when the reciter jumps
 * (Al-Fatiha each rakah, then back to where he left off, or on to a new surah).
 * Repeated phrases resolve toward where he just was. Never highlights ahead of the reciter.
 */
import { fit, judgeSearch, loadQuranIndex, skel, type Hit, type QuranIndex, type SearchAnswer } from "./quran-index";
import { getRecognizer } from "./listen";
import { openMic } from "./mic";

export interface FollowPosition {
  key: string; // "sura:aya:word" just recited
  sura: number;
  aya: number;
  word: number;
  locked: boolean; // false while relocating after a jump
  confidence: number; // 0..1
}

export class Follower {
  static LOCAL_Q = 14;
  static LOST_AFTER = 9;
  static SEARCH_Q = 22;
  static MIN_SEARCH = 12;

  private buf: string[] = [];
  private pos: number | null = null;
  private resume: number | null = null;
  private lost = 0;
  private conf = 0;
  private afterBasmala = false;
  private readonly fatihaEnd: number;
  private readonly basmala: string[];

  constructor(private ix: QuranIndex) {
    this.fatihaEnd = ix.ayaStart(2, 1);
    this.basmala = ix.S.slice(0, ix.ayaStart(1, 2)); // 1:1, said before most surahs
  }

  reset() {
    this.buf = [];
    this.pos = null;
    this.resume = null;
    this.lost = 0;
    this.conf = 0;
    this.afterBasmala = false;
  }

  private inFatiha(p: number) {
    return p <= this.fatihaEnd;
  }

  /** Feed recognizer phonemes as they stream in. Returns the current position (or null before lock). */
  feed(phonemes: string): FollowPosition | null {
    let add = Array.from(skel(phonemes));
    if (!add.length) return this.position();
    if (this.buf.length && add[0] === this.buf[this.buf.length - 1]) add = add.slice(1);
    this.buf = [...this.buf, ...add].slice(-64);
    if (add.length && this.basmalaJustSaid()) {
      // "Bismillah" opens almost every surah: it is not Al-Fatiha. Drop it, keep the place,
      // and wait for the first ayah of whatever comes next.
      this.buf = [];
      this.lost = 0;
      this.afterBasmala = true;
      return this.position();
    }
    if (this.pos !== null && add.length) this.track(add.length);
    else if (this.pos === null && this.buf.length >= Follower.MIN_SEARCH) this.relocate(false);
    return this.position();
  }

  private basmalaJustSaid(): boolean {
    const b = this.basmala;
    const tail = this.buf.slice(-(b.length + 3));
    if (tail.length < b.length - 1) return false;
    const [cost, , end] = fit(b, tail);
    return cost <= 2 && end >= tail.length - 1;
  }

  static BACK_Q = 8; // recent letters used to spot a reciter going back to repeat
  static BACK_RANGE = 160; // how far back to look (a few ayat)

  /** Did the reciter go back to repeat? Jump back if the stretch just behind clearly fits better. */
  private wentBack(nNew: number): boolean {
    const S = this.ix.S;
    const r = this.buf.slice(-Follower.BACK_Q);
    if (r.length < Follower.BACK_Q) return false;
    const pos = this.pos as number;
    const loC = Math.max(0, pos - r.length - 2);
    const hiC = Math.min(S.length, pos + nNew * 3 + 12);
    const [costC] = fit(r, S.slice(loC, hiC), true);
    const loB = Math.max(0, pos - Follower.BACK_RANGE);
    const hiB = pos - 4;
    if (hiB - loB < r.length) return false;
    const [costB, , bB] = fit(r, S.slice(loB, hiB)); // ties: the latest spot (closest to where he was)
    if (costB + 2 <= costC && costB / r.length <= 0.25) {
      this.pos = loB + bB;
      this.lost = 0;
      this.conf = 1 - costB / r.length;
      if (!this.inFatiha(this.pos)) this.resume = this.pos;
      return true;
    }
    return false;
  }

  private track(nNew: number) {
    if (this.wentBack(nNew)) return;
    const S = this.ix.S;
    const pos = this.pos as number;
    const q = this.buf.slice(-Follower.LOCAL_Q);
    const lo = Math.max(0, pos - q.length - 4);
    const hi = Math.min(S.length, pos + nNew * 3 + 12);
    const [cost, , b] = fit(q, S.slice(lo, hi), true); // ties to the earlier word: never run ahead
    const ratio = cost / Math.max(1, q.length);
    if (ratio <= 0.34 && lo + b >= pos - 6) {
      this.pos = lo + b;
      this.lost = 0;
      this.conf = 1 - ratio;
      if (!this.inFatiha(this.pos)) this.resume = this.pos;
      return;
    }
    this.lost += nNew;
    const endOfFatiha = this.inFatiha(pos) && pos >= this.fatihaEnd - 4;
    if (this.lost >= (endOfFatiha ? 4 : Follower.LOST_AFTER)) this.relocate(true);
  }

  private *probes(near: number | null, qlen: number): Generator<[number, number]> {
    const S = this.ix.S;
    yield [0, Math.min(S.length, this.fatihaEnd + 8)]; // Al-Fatiha
    if (near !== null) yield [Math.max(0, near - qlen - 8), Math.min(S.length, near + qlen * 3 + 40)]; // where he left off
  }

  private relocate(sinceLost: boolean) {
    const n = sinceLost ? Math.min(Follower.SEARCH_Q, this.lost + 2) : Follower.SEARCH_Q;
    const q = this.buf.slice(-n);
    if (q.length < 6) return;
    const near = this.resume ?? this.pos;
    const hits: Hit[] = q.length >= Follower.MIN_SEARCH ? this.ix.search(q, 6, near ?? undefined) : [];
    for (const [lo, hi] of this.probes(near, q.length)) {
      const [cost, a, b] = fit(q, this.ix.S.slice(lo, hi), true);
      hits.push({ start: lo + a, end: lo + b, cost, score: 1 - cost / q.length });
    }
    hits.sort((x, y) => x.cost - y.cost);
    const need = q.length >= Follower.MIN_SEARCH ? 0.66 : 0.8;
    if (!hits.length || hits[0].score < need) return;
    let best = hits[0];
    const ties = hits.filter((h) => h.cost <= best.cost + 1);
    if (ties.length > 1) {
      const pref = (h: Hit): [number, number] => {
        if (this.afterBasmala) {
          const w = this.ix.where(h.start);
          if (w.aya === 1 && w.word === 1) return [-1, near !== null && h.start >= near ? h.start - near : 1e6];
        }
        if (near !== null && h.start - near >= 0 && h.start - near < 400) return [0, h.start - near];
        if (this.inFatiha(h.start)) return [1, 0];
        return [2, near !== null ? Math.abs(h.start - near) : 0];
      };
      ties.sort((x, y) => x.cost - y.cost || pref(x)[0] - pref(y)[0] || pref(x)[1] - pref(y)[1]);
      best = ties[0];
      if (pref(best)[0] === 2 && q.length < Follower.SEARCH_Q) return; // still ambiguous: wait for more words
    }
    this.pos = best.end;
    this.lost = 0;
    this.conf = best.score;
    this.afterBasmala = false;
    if (!this.inFatiha(this.pos)) this.resume = this.pos;
  }

  position(): FollowPosition | null {
    if (this.pos === null) return null;
    const w = this.ix.where(this.pos - 1);
    return { key: `${w.sura}:${w.aya}:${w.word}`, ...w, locked: this.lost < Follower.LOST_AFTER, confidence: this.conf };
  }
}

export interface FollowSession {
  stream: MediaStream;
  stop(): Promise<void>;
}

/** Listen to a reciter (imam, halaqa, recording) and report where he is, live. */
export async function startFollowing(opts: {
  onPosition: (p: FollowPosition) => void;
  onError?: (e: unknown) => void;
  onProgress?: (p: number) => void;
}): Promise<FollowSession> {
  const [rec, ix] = await Promise.all([getRecognizer(undefined, opts.onProgress), loadQuranIndex()]);
  rec.restart();
  const follower = new Follower(ix);
  let queue = Promise.resolve();
  let stopped = false;
  let lastKey = "";
  const mic = await openMic((samples) => {
    if (stopped) return;
    queue = queue
      .then(async () => {
        const em = await rec.accept(samples);
        if (!em.length) return;
        const p = follower.feed(em.map((e) => e.token).join(""));
        if (p && (p.key !== lastKey || !p.locked)) {
          lastKey = p.key;
          opts.onPosition(p);
        }
      })
      .catch((e) => {
        stopped = true;
        void mic.close();
        opts.onError?.(e);
      });
  });
  return {
    stream: mic.stream,
    async stop() {
      stopped = true;
      await queue;
      await mic.close();
    },
  };
}

/**
 * Voice search, Shazam-style: listens and answers as soon as it is sure (usually 2-4 s of recitation),
 * then stops the mic by itself. Gives up after `maxSeconds` with its best guess (confident = false).
 *
 *   const s = await startVoiceSearch({ onAnswer: (a) => show(a), onListening: (heard) => ... })
 *   s.stop() // optional: stop early (answers with the best guess so far)
 */
export async function startVoiceSearch(opts: {
  onAnswer: (a: SearchAnswer) => void;
  onError?: (e: unknown) => void;
  onProgress?: (p: number) => void;
  maxSeconds?: number;
}): Promise<{ stream: MediaStream; stop(): Promise<void> }> {
  const [rec, ix] = await Promise.all([getRecognizer(undefined, opts.onProgress), loadQuranIndex()]);
  rec.restart();
  let heard = "";
  let queue = Promise.resolve();
  let done = false;
  let sure = 0;
  let mic: Awaited<ReturnType<typeof openMic>>;
  const finish = async (a: SearchAnswer) => {
    if (done) return;
    done = true;
    await mic.close();
    opts.onAnswer(a);
  };
  const timer = setTimeout(() => void queue.then(() => finish(judgeSearch(ix, heard))), (opts.maxSeconds ?? 15) * 1000);
  mic = await openMic((samples) => {
    if (done) return;
    queue = queue
      .then(async () => {
        const em = await rec.accept(samples);
        if (!em.length || done) return;
        heard += em.map((e) => e.token).join("");
        const a = judgeSearch(ix, heard);
        sure = a.confident ? sure + 1 : 0;
        if (sure >= 2) { clearTimeout(timer); await finish(a); } // sure twice in a row
      })
      .catch((e) => {
        clearTimeout(timer);
        done = true;
        void mic.close();
        opts.onError?.(e);
      });
  });
  return {
    stream: mic.stream,
    async stop() {
      clearTimeout(timer);
      await queue;
      for (const e of await rec.flush()) heard += e.token;
      await finish(judgeSearch(ix, heard));
    },
  };
}
