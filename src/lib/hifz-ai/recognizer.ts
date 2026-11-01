/**
 * Streaming Quran phoneme recognizer in the browser / Capacitor WebView.
 * Model: Quran-Lab zipformer_p-arabic-v3.2 (int8 ONNX), run with onnxruntime-web (WASM).
 *
 * Feed 16 kHz mono samples as they arrive; tokens come out every chunk (0.32 s with chunk16).
 * The model's memory is reset after a long pause, which keeps repeats and restarts detectable.
 *
 * Model license: Quran-Lab NPL-1.2. Free apps only, no paid features built on it, and the app must say
 * that automatic feedback can be wrong and does not replace a qualified teacher.
 */
import * as ort from "onnxruntime-web";
import { NMEL, SR, StreamingFbank } from "./fbank";
import { cachedAsset, MODEL_URL } from "./assets";
import runtimeAsset from "./runtime.wasm.asset.json";

export interface ModelConfig {
  file: string;
  T: number; // feature frames per call
  chunk: number; // frames to advance per call
  blank: number;
  states: { name: string; shape: number[]; type: "float32" | "int64" }[];
}

export interface Emission {
  token: string;
  time: number; // seconds from the start of the stream
  prob: number;
}

/** Keep in sync with package.json ("onnxruntime-web": "1.20.1"). */
export const ORT_VERSION = "1.20.1";
/** Default model location: served from the app's own public folder. */
export const DEFAULT_MODEL_URL = MODEL_URL;

/** Download the model once and keep it in Cache Storage (works offline afterwards). */
async function fetchModel(url: string, onProgress?: (p: number) => void): Promise<ArrayBuffer> {
  return (await cachedAsset(url, onProgress)).arrayBuffer();
}

export class QuranRecognizer {
  private session!: ort.InferenceSession;
  private cfg!: ModelConfig;
  private tokens = new Map<number, string>();
  private states = new Map<string, ort.Tensor>();
  private fb = new StreamingFbank();
  private feats: number[] = []; // feature rows (flattened) waiting to be fed
  private framesFed = 0; // output frames so far
  private samplesIn = 0; // real audio received (seconds = samplesIn / SR)
  private prev = -1;
  private silentSamples = 0;
  private level = -60;
  private heardSinceReset = false;

  /** Pause length (s) after which the model's memory is reset. */
  resetAfterPause = 0.35; // short ayah-end pauses: the model can drop the next word without a fresh start

  static async create(opts: {
    modelUrl: string; // the .onnx file (host it yourself; see README)
    configUrl?: string; // model-config.json
    tokensUrl?: string; // tokens.txt
    variant?: "chunk16" | "chunk24";
    onProgress?: (p: number) => void;
  }): Promise<QuranRecognizer> {
    const r = new QuranRecognizer();
    const variant = opts.variant ?? "chunk16";
    const [cfgAll, tokTxt, model] = await Promise.all([
      cachedAsset(opts.configUrl ?? "/hifz-ai/model/model-config.json").then((x) => x.json()),
      cachedAsset(opts.tokensUrl ?? "/hifz-ai/model/tokens.txt").then((x) => x.text()),
      fetchModel(opts.modelUrl, opts.onProgress),
    ]);
    r.cfg = cfgAll[variant];
    for (const line of tokTxt.split("\n")) {
      const i = line.lastIndexOf(" ");
      if (i > 0) r.tokens.set(Number(line.slice(i + 1)), line.slice(0, i));
    }
    // threads need cross-origin isolation (SharedArrayBuffer); one core is already ~15x faster than real time
    ort.env.wasm.numThreads = (globalThis as any).crossOriginIsolated ? Math.min(4, (navigator.hardwareConcurrency || 2) - 1) || 1 : 1;
    // Cache the matching runtime locally too: no CDN dependency on later offline use.
    ort.env.wasm.wasmBinary = await (await cachedAsset(runtimeAsset.url)).arrayBuffer();
    const runtime = await (await cachedAsset("/hifz-ai/runtime/ort-wasm-simd-threaded.mjs")).text();
    const runtimeUrl = URL.createObjectURL(new Blob([runtime], { type: "text/javascript" }));
    ort.env.wasm.wasmPaths = { mjs: runtimeUrl };
    r.session = await ort.InferenceSession.create(model, { executionProviders: ["wasm"], graphOptimizationLevel: "all" });
    r.restart();
    return r;
  }

  /** Fresh memory (start of a new recitation, or after a long pause). */
  reset() {
    this.states.clear();
    for (const s of this.cfg.states) {
      const size = s.shape.reduce((a, b) => a * b, 1);
      this.states.set(
        s.name,
        s.type === "int64" ? new ort.Tensor("int64", new BigInt64Array(size), s.shape) : new ort.Tensor("float32", new Float32Array(size), s.shape),
      );
    }
    this.prev = -1;
    this.feats = [];
    this.heardSinceReset = false;
  }

  /** New recitation: fresh memory and a fresh audio clock. */
  restart() {
    this.reset();
    this.fb = new StreamingFbank();
    this.framesFed = 0;
    this.samplesIn = 0;
    this.silentSamples = 0;
    this.level = -60;
  }

  /**
   * Feed 16 kHz mono samples in [-1, 1]. Returns any new emissions.
   * Call `flush()` when the user stops so the last word comes out.
   */
  async accept(samples: Float32Array): Promise<Emission[]> {
    this.samplesIn += samples.length;
    // pause tracking for memory resets, in 20 ms steps, relative to this speaker's loudness
    const hop = 320;
    for (let a = 0; a + hop <= samples.length; a += hop) {
      let e = 0;
      for (let i = a; i < a + hop; i++) e += samples[i] * samples[i];
      const db = 10 * Math.log10(e / hop + 1e-12);
      this.level = db > this.level ? db : this.level - 0.01; // slow decay of the speech level
      if (db < Math.max(-55, this.level - 30)) this.silentSamples += hop;
      else this.silentSamples = 0;
    }

    const rows = this.fb.push(samples);
    for (let i = 0; i < rows.length; i++) this.feats.push(rows[i]);

    const out = await this.run();
    if (this.heardSinceReset && this.silentSamples > this.resetAfterPause * SR) {
      // the model lags ~1 s: push silence through so the last sounds before the pause come out, then forget
      out.push(...(await this.drain()));
      this.reset();
      this.silentSamples = 0;
    }
    return out;
  }

  private async drain(): Promise<Emission[]> {
    const rows = this.fb.push(new Float32Array(Math.round(1.05 * SR)));
    for (let i = 0; i < rows.length; i++) this.feats.push(rows[i]);
    return this.run();
  }

  /** Push ~1 s of silence through so the final sounds are emitted. */
  async flush(): Promise<Emission[]> {
    // the pushed silence isn't real audio: the last sounds happened when the user stopped
    const now = this.samplesIn;
    const out = await this.accept(new Float32Array(Math.round(1.05 * SR)));
    this.samplesIn = now;
    for (const e of out) e.time = now / SR;
    return out;
  }

  private async run(): Promise<Emission[]> {
    const out: Emission[] = [];
    const { T, chunk, blank } = this.cfg;
    while (this.feats.length >= T * NMEL) {
      const x = new ort.Tensor("float32", Float32Array.from(this.feats.slice(0, T * NMEL)), [1, T, NMEL]);
      const feeds: Record<string, ort.Tensor> = { x };
      for (const [k, v] of this.states) feeds[k] = v;
      const res = await this.session.run(feeds);
      for (const k of this.states.keys()) this.states.set(k, res["new_" + k]);
      const lp = res["log_probs"];
      const [, frames, vocab] = lp.dims as number[];
      const d = lp.data as Float32Array;
      for (let t = 0; t < frames; t++) {
        let best = 0;
        for (let v = 1; v < vocab; v++) if (d[t * vocab + v] > d[t * vocab + best]) best = v;
        if (best !== blank && best !== this.prev) {
          out.push({ token: this.tokens.get(best) ?? "", time: this.samplesIn / SR, prob: Math.exp(d[t * vocab + best]) });
          this.heardSinceReset = true;
        }
        this.prev = best;
      }
      this.framesFed += frames;
      this.feats.splice(0, chunk * NMEL);
    }
    return out;
  }
}
