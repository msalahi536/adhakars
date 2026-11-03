import { zipSync, strToU8 } from "fflate";
import { readHifzBeta } from "./hifz-beta";
import type { CheckResult } from "./hifz-ai";
import type { Passage } from "@/components/recite/ai-performance";

export const RECITATION_DEBUG_KEY = "hifz_recitation_debug";
const recordingUpdates = new WeakMap<Blob, { elapsed: number; result: CheckResult }[]>();
export function rememberDebugUpdates(blob: Blob, updates: { elapsed: number; result: CheckResult }[]) { if (debugEnabled()) recordingUpdates.set(blob, updates); }
export function debugEnabled(storage?: Pick<Storage, "getItem">) {
  try { return readHifzBeta(storage) && (storage ?? window.localStorage).getItem(RECITATION_DEBUG_KEY) === "1"; }
  catch { return false; }
}
export function debugDocument(result: CheckResult, passages: Passage[], updates: { elapsed: number; result: CheckResult }[] = []) {
  return { version: 2, passages, result, heard: result.heard ?? "", conf: result.conf ?? [], times: result.times ?? [], updates };
}
export async function debugZip(recording: Blob, result: CheckResult, passages: Passage[], updates: { elapsed: number; result: CheckResult }[] = []) {
  const bytes = zipSync({
    [recording.type.includes("mp4") ? "recording.m4a" : "recording.webm"]: [new Uint8Array(await recording.arrayBuffer()), { level: 0 }],
    "debug.json": strToU8(JSON.stringify(debugDocument(result, passages, updates), null, 2)),
  });
  return new Blob([new Uint8Array(bytes)], { type: "application/zip" });
}
export async function exportDebug(recording: Blob, result: CheckResult, passages: Passage[], updates: { elapsed: number; result: CheckResult }[] = []) {
  if (!debugEnabled()) throw new Error("Enable test recording in hidden Settings first.");
  const zip = await debugZip(recording, result, passages, updates.length ? updates : recordingUpdates.get(recording) ?? []);
  const url = URL.createObjectURL(zip);
  const link = document.createElement("a"); link.href = url; link.download = "recitation-debug.zip";
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}