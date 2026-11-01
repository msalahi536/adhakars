import { zipSync, strToU8 } from "fflate";
import { readHifzBeta } from "@/lib/hifz-beta";
import type { CheckResult } from "@/lib/hifz-ai/checker";

export const RECITATION_DEBUG_KEY = "hifz_recitation_debug";
export function debugEnabled(storage?: Pick<Storage, "getItem">) {
  try { return readHifzBeta(storage) && (storage ?? window.localStorage).getItem(RECITATION_DEBUG_KEY) === "1"; }
  catch { return false; }
}
export type DebugRange = { sura: number; first: number; last: number };
export type DebugCapture = { finish: () => Promise<Blob>; discard: () => void };
export function recordDebug(stream: MediaStream): DebugCapture | null {
  if (!debugEnabled() || typeof MediaRecorder === "undefined") return null;
  try {
    const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find((type) => MediaRecorder.isTypeSupported(type));
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    let discarded = false;
    const finished = new Promise<Blob>((resolve, reject) => {
      recorder.ondataavailable = (event) => { if (!discarded && event.data.size) chunks.push(event.data); };
      recorder.onstop = () => { resolve(new Blob(discarded ? [] : chunks, { type: recorder.mimeType })); chunks.length = 0; };
      recorder.onerror = () => reject(new Error("Debug recording unavailable"));
    });
    // A recording failure must never interfere with recognition.
    void finished.catch(() => undefined);
    recorder.start(1000);
    return {
      finish: () => { if (recorder.state !== "inactive") recorder.stop(); return finished; },
      discard: () => { discarded = true; chunks.length = 0; if (recorder.state !== "inactive") recorder.stop(); },
    };
  } catch { return null; }
}
export function debugDocument(ranges: DebugRange[], result: CheckResult, device: string) {
  return {
    surah: ranges.length === 1 ? ranges[0]?.sura : ranges.map((range) => range.sura),
    ayahRange: ranges.map(({ sura, first, last }) => ({ surah: sura, first, last })),
    startKey: result.startKey, heard: result.heard ?? "", conf: result.conf ?? [],
    words: result.words.map(({ key, text, status, expected, heard }) => ({ key, text, status, expected, heard })),
    extras: result.extras, device, browser: device,
  };
}
export async function debugZip(audio: Blob, ranges: DebugRange[], result: CheckResult, device: string) {
  const extension = audio.type.includes("mp4") ? "m4a" : "webm";
  const bytes = zipSync({
    [`recording.${extension}`]: [new Uint8Array(await audio.arrayBuffer()), { level: 0 }],
    "debug.json": strToU8(JSON.stringify(debugDocument(ranges, result, device), null, 2)),
  });
  return new Blob([new Uint8Array(bytes)], { type: "application/zip" });
}
export async function shareDebug(blob: Blob) {
  const file = new File([blob], "recitation-debug.zip", { type: "application/zip" });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: "Recitation debug" }); return; }
    catch (error) { if (error instanceof Error && error.name === "AbortError") return; }
  }
  const url = URL.createObjectURL(file);
  const link = document.createElement("a"); link.href = url; link.download = file.name;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}