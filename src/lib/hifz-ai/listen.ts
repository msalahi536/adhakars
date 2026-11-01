/**
 * Live hifz checking: microphone -> recognizer -> checker -> word states for the mushaf.
 *
 *   const session = await startListening({ sura: 67, first: 1, last: 4, modelUrl, onUpdate })
 *   ... onUpdate(result) fires every ~0.3 s with every word's status
 *   const final = await session.stop()
 */
import { SR } from "./fbank";
import { buildReference, check, loadSurah, type CheckResult } from "./checker";
import { DEFAULT_MODEL_URL, QuranRecognizer } from "./recognizer";
import { cachedAsset } from "./assets";

let shared: Promise<QuranRecognizer> | null = null;

/** Load the model once per app session (first time downloads ~73 MB, then cached). */
export function getRecognizer(modelUrl = DEFAULT_MODEL_URL, onProgress?: (p: number) => void) {
  shared ??= QuranRecognizer.create({ modelUrl, variant: "chunk16", onProgress }).catch((e) => {
    shared = null; // let the user retry (e.g. after reconnecting)
    throw e;
  });
  return shared;
}

export async function prepareChecker(onProgress?: (p: number) => void) {
  await getRecognizer(DEFAULT_MODEL_URL, onProgress);
  // Cache answer keys before confirming the one-time download is ready offline.
  for (let start = 1; start <= 114; start += 8) {
    await Promise.all(Array.from({ length: Math.min(8, 115 - start) }, (_, i) =>
      cachedAsset(`/hifz-ai/ayat/${String(start + i).padStart(3, "0")}.json`)));
  }
}

export interface ListenSession {
  stream: MediaStream; // pass to <ReciteStrip stream> for live waveform bars
  stop(): Promise<CheckResult>;
}

export async function startListening(opts: {
  sura: number;
  first: number;
  last: number;
  modelUrl?: string;
  onUpdate: (r: CheckResult) => void;
  onProgress?: (p: number) => void;
  onError?: (error: unknown) => void;
}): Promise<ListenSession> {
  const [rec, key] = await Promise.all([getRecognizer(opts.modelUrl, opts.onProgress), loadSurah(opts.sura)]);
  const reference = buildReference(key, opts.sura, opts.first, opts.last);
  rec.restart();

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: false, noiseSuppression: true, autoGainControl: true },
  });
  try {
  const Ctx = window.AudioContext || (window as any).webkitAudioContext;
  let ctx: AudioContext;
  try {
    ctx = new Ctx({ sampleRate: SR }); // ask for 16 kHz; resample below if refused
  } catch {
    ctx = new Ctx();
  }
  await ctx.resume(); // iOS starts contexts suspended
  const src = ctx.createMediaStreamSource(stream);
  const node = ctx.createScriptProcessor(4096, 1, 1);
  const ratio = ctx.sampleRate / SR;

  let heard = "";
  let conf: number[] = [];
  let queue = Promise.resolve();
  let failure: unknown;
  let stopped: Promise<CheckResult> | undefined;
  let last: CheckResult = check(reference, "", false);

  const toMono16k = (input: Float32Array): Float32Array => {
    if (ratio === 1) return input.slice();
    const n = Math.floor(input.length / ratio);
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      // simple averaging resampler (fine for speech at 44.1/48 kHz -> 16 kHz)
      const a = Math.floor(i * ratio);
      const b = Math.min(input.length, Math.floor((i + 1) * ratio));
      let s = 0;
      for (let j = a; j < b; j++) s += input[j];
      out[i] = s / Math.max(1, b - a);
    }
    return out;
  };

  node.onaudioprocess = (ev) => {
    const samples = toMono16k(ev.inputBuffer.getChannelData(0));
    // keep order: each chunk waits for the previous one
    if (failure || stopped) return;
    queue = queue.then(async () => {
      const em = await rec.accept(samples);
      if (!em.length) return;
      for (const e of em) {
        heard += e.token;
        for (let k = 0; k < e.token.length; k++) conf.push(e.prob);
      }
      last = check(reference, heard, false, conf);
      opts.onUpdate(last);
    }).catch((error) => {
      failure = error;
      node.disconnect(); src.disconnect(); stream.getTracks().forEach((t) => t.stop());
      void ctx.close().catch(() => undefined);
      opts.onError?.(error);
    });
  };
  src.connect(node);
  node.connect(ctx.destination);

  return {
    stream,
    stop() {
      stopped ??= (async () => {
      node.disconnect();
      src.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      await queue;
      if (failure) throw failure;
      for (const e of await rec.flush()) {
        heard += e.token;
        for (let k = 0; k < e.token.length; k++) conf.push(e.prob);
      }
      await ctx.close();
      last = check(reference, heard, true, conf);
      opts.onUpdate(last);
      return last;
      })().finally(() => { if (ctx.state !== "closed") void ctx.close().catch(() => undefined); });
      return stopped;
    },
  };
  } catch (error) {
    stream.getTracks().forEach((t) => t.stop());
    throw error;
  }
}
