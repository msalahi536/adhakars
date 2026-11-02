/**
 * Live "say it": one attempt from the microphone, judged with judge.ts.
 * The recitation model is shared with hifz (downloaded once, then cached).
 */
import { getRecognizer } from "@/lib/hifz-ai/listen";
import { openMic } from "@/lib/hifz-ai/mic";
import { SR } from "@/lib/hifz-ai/fbank";
import { loadSurah } from "@/lib/hifz-ai/checker";
import { judge, targetsFor, type SayResult } from "./judge";

/** The answer-key sounds for a Quran word "sura:aya:word" (also accepted when judging it). */
export async function wordKeyPhonemes(key: string): Promise<string | undefined> {
  const [s, a, w] = key.split(":").map(Number);
  const k = await loadSurah(s);
  return k[String(a)]?.find((x) => x[0] === w)?.[2];
}

/** The written words of an ayah, from the same answer key. */
export async function ayahWords(sura: number, aya: number): Promise<{ key: string; text: string }[]> {
  const k = await loadSurah(sura);
  return (k[String(aya)] ?? []).map(([w, text]) => ({ key: `${sura}:${aya}:${w}`, text }));
}

export interface SayOptions {
  /** What to say: a vowelled syllable / word, e.g. "بَ", "ٱلْحَمْدُ". */
  text: string;
  /** The answer-key sounds for a Quran word (from /hifz-ai/ayat), accepted too. */
  keyPhonemes?: string;
  /** Stop automatically this long after the learner goes quiet (s). */
  endSilence?: number;
  /** Letter-sound lessons: a heavy/light swap (ص said as س) needs another try. */
  strictLetters?: boolean;
  /** Hard stop (s). */
  maxSeconds?: number;
  onLevel?: (level: number) => void; // 0..1 for the mic animation
  onHeard?: (heard: string) => void; // live sounds as they come
  onProgress?: (p: number) => void; // first-time model download
  stream?: MediaStream;
}

export interface SaySession {
  stream: MediaStream;
  /** Resolves when the learner stops (auto) or stop() is called. */
  result: Promise<SayResult>;
  stop(): void;
  cancel(): void;
}

/** Listen to one attempt and judge it. The model is shared with hifz (downloaded once). */
export async function startSay(opts: SayOptions): Promise<SaySession> {
  const targets = targetsFor(opts.text, opts.keyPhonemes ? [opts.keyPhonemes] : []);
  const rec = await getRecognizer(undefined, opts.onProgress);
  rec.restart();
  const endSilence = opts.endSilence ?? 0.8;
  const maxSeconds = opts.maxSeconds ?? 6;
  let heard = "";
  let queue = Promise.resolve();
  let spoke = false;
  let quiet = 0;
  let total = 0;
  let level = -60;
  let done = false;
  let resolve!: (r: SayResult) => void;
  let reject!: (e: unknown) => void;
  const result = new Promise<SayResult>((a, b) => { resolve = a; reject = b; });

  const finish = async (cancelled = false) => {
    if (done) return;
    done = true;
    await mic.close();
    try {
      await queue;
      if (cancelled) return resolve({ verdict: "silent", score: 0, heard, issues: [] });
      for (const e of await rec.flush()) heard += e.token;
      opts.onHeard?.(heard);
      resolve(judge(targets, heard, { strictLetters: opts.strictLetters }));
    } catch (e) { reject(e); }
  };

  const mic = await openMic((samples) => {
    if (done) return;
    total += samples.length / SR;
    let e = 0;
    for (let i = 0; i < samples.length; i++) e += samples[i] * samples[i];
    const db = 10 * Math.log10(e / Math.max(1, samples.length) + 1e-12);
    level = db > level ? db : level - 0.5;
    opts.onLevel?.(Math.max(0, Math.min(1, (db + 60) / 50)));
    if (db > Math.max(-50, level - 25)) { spoke = spoke || db > -45; quiet = 0; } else quiet += samples.length / SR;
    queue = queue.then(async () => {
      for (const em of await rec.accept(samples)) heard += em.token;
      opts.onHeard?.(heard);
    });
    if ((spoke && quiet >= endSilence) || total >= maxSeconds) void finish();
  }, opts.stream);

  return { stream: mic.stream, result, stop: () => void finish(), cancel: () => void finish(true) };
}
