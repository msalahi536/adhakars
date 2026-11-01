/**
 * Kaldi-compatible log-mel filterbank, the exact front end the recitation model was trained on:
 * 16 kHz mono, 80 bins, 25 ms window, 10 ms shift, povey window, dither 0, preemphasis 0.97,
 * DC removal, snip_edges = false, low 20 Hz, high 7600 Hz, log power. Input samples in [-1, 1].
 */
export const SR = 16000;
const FRAME_LEN = 400;
const FRAME_SHIFT = 160;
const NFFT = 512;
export const NMEL = 80;

const melOf = (f: number) => 1127 * Math.log(1 + f / 700);

function buildBanks(): Float64Array[] {
  const low = 20;
  const high = SR / 2 - 400;
  const fftBins = NFFT / 2;
  const mlow = melOf(low);
  const mhigh = melOf(high);
  const delta = (mhigh - mlow) / (NMEL + 1);
  const banks: Float64Array[] = [];
  for (let b = 0; b < NMEL; b++) {
    const left = mlow + b * delta;
    const center = left + delta;
    const right = center + delta;
    const row = new Float64Array(fftBins + 1);
    for (let k = 0; k < fftBins; k++) {
      const m = melOf((k * SR) / NFFT);
      const up = (m - left) / (center - left);
      const down = (right - m) / (right - center);
      row[k] = Math.max(0, Math.min(up, down));
    }
    banks.push(row);
  }
  return banks;
}

const BANKS = buildBanks();
const POVEY = Float64Array.from({ length: FRAME_LEN }, (_, i) =>
  Math.pow(0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (FRAME_LEN - 1)), 0.85),
);
const EPS = 1.1920928955078125e-7; // float32 epsilon, Kaldi's log floor

// radix-2 FFT tables
const BITREV = new Uint16Array(NFFT);
for (let i = 0, bits = Math.log2(NFFT); i < NFFT; i++) {
  let r = 0;
  for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b);
  BITREV[i] = r;
}
const COS = Float64Array.from({ length: NFFT / 2 }, (_, i) => Math.cos((-2 * Math.PI * i) / NFFT));
const SIN = Float64Array.from({ length: NFFT / 2 }, (_, i) => Math.sin((-2 * Math.PI * i) / NFFT));

function powerSpectrum(frame: Float64Array, re: Float64Array, im: Float64Array, out: Float64Array) {
  re.fill(0);
  im.fill(0);
  for (let i = 0; i < FRAME_LEN; i++) re[BITREV[i]] = frame[i];
  for (let size = 2; size <= NFFT; size <<= 1) {
    const half = size >> 1;
    const step = NFFT / size;
    for (let start = 0; start < NFFT; start += size) {
      for (let k = 0; k < half; k++) {
        const c = COS[k * step];
        const s = SIN[k * step];
        const a = start + k;
        const b = a + half;
        const tr = re[b] * c - im[b] * s;
        const ti = re[b] * s + im[b] * c;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
      }
    }
  }
  for (let k = 0; k <= NFFT / 2; k++) out[k] = re[k] * re[k] + im[k] * im[k];
}

const F = new Float64Array(FRAME_LEN);
const RE = new Float64Array(NFFT);
const IM = new Float64Array(NFFT);
const SPEC = new Float64Array(NFFT / 2 + 1);

/** One frame from F (already filled with the raw window) into out[off..off+80]. */
function finishFrame(out: Float32Array, off: number) {
  let mean = 0;
  for (let t = 0; t < FRAME_LEN; t++) mean += F[t];
  mean /= FRAME_LEN;
  for (let t = 0; t < FRAME_LEN; t++) F[t] -= mean;
  for (let t = FRAME_LEN - 1; t > 0; t--) F[t] -= 0.97 * F[t - 1];
  F[0] -= 0.97 * F[0];
  for (let t = 0; t < FRAME_LEN; t++) F[t] *= POVEY[t];
  powerSpectrum(F, RE, IM, SPEC);
  for (let b = 0; b < NMEL; b++) {
    const row = BANKS[b];
    let e = 0;
    for (let k = 0; k <= NFFT / 2; k++) e += row[k] * SPEC[k];
    out[off + b] = Math.log(Math.max(e, EPS));
  }
}

/** Features for a whole buffer. Returns frames x 80, row-major Float32Array, and the frame count. */
export function fbank(wave: Float32Array): { data: Float32Array; frames: number } {
  const n = wave.length;
  const frames = Math.floor((n + FRAME_SHIFT / 2) / FRAME_SHIFT);
  const data = new Float32Array(frames * NMEL);
  for (let i = 0; i < frames; i++) {
    const s = i * FRAME_SHIFT + FRAME_SHIFT / 2 - FRAME_LEN / 2;
    for (let t = 0; t < FRAME_LEN; t++) {
      let idx = s + t;
      if (idx < 0) idx = -idx - 1;
      if (idx >= n) idx = 2 * n - idx - 1;
      F[t] = wave[Math.min(Math.max(idx, 0), n - 1)];
    }
    finishFrame(data, i * NMEL);
  }
  return { data, frames };
}

/**
 * Same features, computed live as audio arrives. Frames are identical to `fbank()` on the whole
 * recording (except the last ~2 frames at the very end, which are silence anyway).
 */
export class StreamingFbank {
  private buf = new Float32Array(0);
  private base = 0; // absolute sample index of buf[0]
  private next = 0; // next frame index to compute

  /** Add samples; returns the new frames (rows of 80). */
  push(samples: Float32Array): Float32Array {
    const joined = new Float32Array(this.buf.length + samples.length);
    joined.set(this.buf);
    joined.set(samples, this.buf.length);
    this.buf = joined;
    const total = this.base + this.buf.length;
    // frame i needs samples up to i*160 + 280 (exclusive)
    let count = 0;
    while ((this.next + count) * FRAME_SHIFT + FRAME_SHIFT / 2 + FRAME_LEN / 2 <= total) count++;
    const out = new Float32Array(count * NMEL);
    for (let c = 0; c < count; c++) {
      const s = (this.next + c) * FRAME_SHIFT + FRAME_SHIFT / 2 - FRAME_LEN / 2;
      for (let t = 0; t < FRAME_LEN; t++) {
        let idx = s + t;
        if (idx < 0) idx = -idx - 1; // reflect only at the very start of the stream
        F[t] = this.buf[idx - this.base];
      }
      finishFrame(out, c * NMEL);
    }
    this.next += count;
    // keep only what the next frame still needs (and the first 120 samples for start reflection)
    const keepFrom = Math.max(0, this.next * FRAME_SHIFT + FRAME_SHIFT / 2 - FRAME_LEN / 2);
    if (keepFrom > this.base) {
      this.buf = this.buf.slice(keepFrom - this.base);
      this.base = keepFrom;
    }
    return out;
  }
}
