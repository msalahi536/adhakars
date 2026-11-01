import { afterEach, describe, expect, it } from "bun:test";
import { captureRecording } from "./recording";
const original = globalThis.MediaRecorder;
class FakeRecorder {
  static latest: FakeRecorder;
  state = "recording";
  mimeType = "audio/webm";
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor() { FakeRecorder.latest = this; }
  start() {}
  stop() { this.state = "inactive"; queueMicrotask(() => this.onstop?.()); }
}
afterEach(() => { globalThis.MediaRecorder = original; });
describe("memory-only recording", () => {
  it("settles a pending finish on discard without retaining audio", async () => {
    globalThis.MediaRecorder = FakeRecorder as unknown as typeof MediaRecorder;
    const recording = captureRecording({} as MediaStream);
    expect(recording).not.toBeNull();
    const pending = recording?.finish(); recording?.discard();
    expect(await pending).toBeNull();
    expect(FakeRecorder.latest.ondataavailable).toBeNull();
  });
  it("returns recorded audio once without stopping caller microphone tracks", async () => {
    globalThis.MediaRecorder = FakeRecorder as unknown as typeof MediaRecorder;
    let stopped = false;
    const recording = captureRecording({ getTracks: () => [{ stop: () => { stopped = true; } }] } as unknown as MediaStream);
    FakeRecorder.latest.ondataavailable?.({ data: new Blob(["voice"]) });
    const blob = await recording?.finish();
    expect(await blob?.text()).toBe("voice"); expect(stopped).toBe(false);
    expect(FakeRecorder.latest.ondataavailable).toBeNull();
  });
});