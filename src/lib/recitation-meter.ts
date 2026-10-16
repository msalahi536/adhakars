import FFT from "fft.js";

export type MeterLevels = [number, number, number, number, number, number];

export const restingLevels = (): MeterLevels => [0.12, 0.12, 0.12, 0.12, 0.12, 0.12];

// Separate bass, vocal fundamental, harmonics and sibilance bands.
const edges = [65, 180, 400, 850, 1700, 3400, 8000];
export const METER_FFT_SIZE = 2048;

export function spectrumBands(spectrum: ArrayLike<number>, sampleRate: number, fftSize: number): MeterLevels {
  return edges.slice(0, 6).map((low, band) => {
    const start = Math.max(1, Math.ceil(low * fftSize / sampleRate));
    const end = Math.min(spectrum.length, Math.ceil(edges[band + 1] * fftSize / sampleRate));
    let power = 0;
    for (let bin = start; bin < end; bin++) power += 10 ** (spectrum[bin] / 10);
    const db = 10 * Math.log10(power / Math.max(1, end - start) + 1e-12);
    return Math.max(0, Math.min(1, (db + 75) / 50));
  }) as MeterLevels;
}

// The decoded phone recording uses the same spectral bands as live analysis.
export function createBandSampler(sampleRate: number) {
  const fft = new FFT(METER_FFT_SIZE);
  const input = new Float32Array(METER_FFT_SIZE);
  const output = fft.createComplexArray();
  const spectrum = new Float32Array(METER_FFT_SIZE / 2);
  return (samples: Float32Array, offset: number): MeterLevels => {
    for (let i = 0; i < input.length; i++) {
      input[i] = (samples[offset + i] ?? 0) * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (input.length - 1)));
    }
    fft.realTransform(output, input);
    for (let bin = 0; bin < spectrum.length; bin++) {
      const amplitude = Math.hypot(output[bin * 2], output[bin * 2 + 1]) * 4 / METER_FFT_SIZE;
      spectrum[bin] = 20 * Math.log10(amplitude + 1e-12);
    }
    return spectrumBands(spectrum, sampleRate, METER_FFT_SIZE);
  };
}

export function shapeMeter(bands: MeterLevels, previous: MeterLevels, elapsedMs: number): MeterLevels {
  const weights: MeterLevels = [0.18, 0.56, 1, 1, 0.56, 0.18];
  return weights.map((weight, index) => {
    const energy = Math.pow(Math.max(0, Math.min(1, bands[index])), 1.25);
    const target = 0.12 + energy * 0.88 * weight;
    const current = previous[index];
    const responseMs = target > current ? 35 : 95;
    const blend = 1 - Math.exp(-Math.max(0, elapsedMs) / responseMs);
    return current + (target - current) * blend;
  }) as MeterLevels;
}