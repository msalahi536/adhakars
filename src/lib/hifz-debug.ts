import { zipSync, strToU8 } from "fflate";
import type { CheckResult } from "./hifz-ai/checker";
export type DebugRecording = { blob: Blob; mime: string };
export function captureDebug(stream: MediaStream) {
  const mime = ["audio/webm;codecs=opus", "audio/mp4"].find((m) => MediaRecorder.isTypeSupported(m));
  const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const done = new Promise<DebugRecording>((resolve, reject) => {
    recorder.onstop = () => resolve({ blob: new Blob(chunks, { type: recorder.mimeType }), mime: recorder.mimeType });
    recorder.onerror = () => reject(new Error("Recording unavailable"));
  });
  recorder.start(250);
  return { stop: () => { if (recorder.state !== "inactive") recorder.stop(); return done; } };
}
export async function debugZip(recording: DebugRecording, result: CheckResult, passages: { sura: number; first: number; last: number }[]) {
  const bytes = zipSync({
    [recording.mime.includes("mp4") ? "recording.m4a" : "recording.webm"]: new Uint8Array(await recording.blob.arrayBuffer()),
    "debug.json": strToU8(JSON.stringify({ result, passages, recordedAt: new Date().toISOString(), device: navigator.userAgent }, null, 2)),
  });
  return new Blob([new Uint8Array(bytes)], { type: "application/zip" });
}