import { expect, test } from "bun:test";
import { createReciteFeedbackAudio } from "./recite-feedback-audio";

test("mic-stop and mistake clips finish sequentially instead of interrupting each other", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () => new Response(new Uint8Array([1]))) as typeof fetch;
  const starts: number[] = [];
  let stops = 0;
  const ctx = {
    currentTime: 4, destination: {}, resume: async () => {},
    decodeAudioData: async () => ({ duration: 0.6 }),
    createGain: () => ({ gain: { value: 1 }, connect() {}, disconnect() {} }),
    createBufferSource: () => ({ buffer: null, onended: null, connect() {}, disconnect() {},
      start(at: number) { starts.push(at); }, stop() { stops++; } }),
  } as unknown as AudioContext;
  try {
    const output = createReciteFeedbackAudio({micStop: "/stop", wrong: "/wrong"}, () => ctx);
    output.unlock(); output.play("micStop"); output.play("wrong");
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(starts).toEqual([4, 4.6]);
    expect(stops).toBe(0);
    output.stop(); expect(stops).toBe(2);
  } finally { globalThis.fetch = original; }
});

test("failed sound downloads are retried instead of cached forever", async () => {
  const original = globalThis.fetch;
  let attempts = 0;
  globalThis.fetch = (async () => { attempts++; return attempts === 1 ? new Response(null, {status: 503}) : new Response(new Uint8Array([1])); }) as typeof fetch;
  let starts = 0;
  const ctx = {currentTime: 0, destination: {}, resume: async () => {}, decodeAudioData: async () => ({duration: 1}),
    createGain: () => ({gain: {value: 1}, connect() {}}),
    createBufferSource: () => ({connect() {}, start() { starts++; }})} as unknown as AudioContext;
  try {
    const output = createReciteFeedbackAudio({micStop: "/stop"}, () => ctx);
    output.unlock(); await new Promise(resolve => setTimeout(resolve, 10));
    output.play("micStop"); await new Promise(resolve => setTimeout(resolve, 10));
    expect(attempts).toBe(2); expect(starts).toBe(1);
  } finally { globalThis.fetch = original; }
});