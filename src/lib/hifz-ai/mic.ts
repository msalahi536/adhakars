/** Microphone -> 16 kHz mono Float32 chunks (about every 85 ms). Shared by follow-along and other live modes. */
import { SR } from "./fbank";

export interface Mic {
  stream: MediaStream;
  close(): Promise<void>;
}

export async function openMic(onSamples: (samples: Float32Array) => void, stream?: MediaStream): Promise<Mic> {
  const s = stream ?? (await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: false, noiseSuppression: true, autoGainControl: true },
  }));
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  let ctx: AudioContext;
  try {
    ctx = new Ctx({ sampleRate: SR });
  } catch {
    ctx = new Ctx();
  }
  await ctx.resume(); // iOS starts contexts suspended
  const src = ctx.createMediaStreamSource(s);
  const node = ctx.createScriptProcessor(4096, 1, 1);
  const ratio = ctx.sampleRate / SR;
  node.onaudioprocess = (ev) => {
    const input = ev.inputBuffer.getChannelData(0);
    if (ratio === 1) return onSamples(input.slice());
    const n = Math.floor(input.length / ratio);
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const a = Math.floor(i * ratio);
      const b = Math.min(input.length, Math.floor((i + 1) * ratio));
      let sum = 0;
      for (let j = a; j < b; j++) sum += input[j];
      out[i] = sum / Math.max(1, b - a);
    }
    onSamples(out);
  };
  src.connect(node);
  node.connect(ctx.destination);
  return {
    stream: s,
    async close() {
      node.disconnect();
      src.disconnect();
      s.getTracks().forEach((t) => t.stop());
      await ctx.close().catch(() => undefined);
    },
  };
}
