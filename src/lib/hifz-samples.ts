import { supabase } from "@/integrations/supabase/client";
import { zipSync, strToU8 } from "fflate";
import type { CheckResult } from "@/lib/hifz-ai";
import { REPORT_LIMIT, reportNote, reportPath } from "@/components/recite/report-rules";
import type { Passage } from "@/components/recite/ai-performance";
import { sampleConsent } from "./hifz-sample-consent";
export async function sendSample(recording: Blob, result: CheckResult, passages: Passage[], note: string) {
  const { user, consent } = await sampleConsent(); if (!user || !consent) throw new Error("Sign in and give adult consent first.");
  const first = passages[0]; if (!first) throw new Error("No passage to report.");
  const path = reportPath(user.id, new Date().toISOString().slice(0, 10), crypto.randomUUID());
  const debug = { version: 1, result, passages, note: reportNote(note), userId: user.id, consentAt: consent, createdAt: new Date().toISOString(), recordingType: recording.type, device: { userAgent: navigator.userAgent, language: navigator.language } };
  const bytes = zipSync({ "debug.json": strToU8(JSON.stringify(debug)), [recording.type.includes("mp4") ? "recording.mp4" : "recording.webm"]: new Uint8Array(await recording.arrayBuffer()) });
  if (bytes.byteLength > REPORT_LIMIT) throw new Error("This recording is too large to report (50 MB maximum).");
  const { error: upload } = await supabase.storage.from("hifz-samples").upload(path, bytes, { contentType: "application/zip", upsert: false });
  if (upload) throw new Error("The recording couldn’t upload. Please retry.");
  const { error } = await supabase.from("hifz_samples").insert({ user_id: user.id, path, file_path: path, passages, note: reportNote(note), consented_at: consent, consent_at: consent, sura: first.sura, first_ayah: first.first, last_ayah: first.last });
  if (error) { await supabase.storage.from("hifz-samples").remove([path]); throw new Error("The report couldn’t save. Please retry."); }
}
export async function deleteSamples() {
  const { data: { user } } = await supabase.auth.getUser(); if (!user) throw new Error("Sign in first.");
  // Include uploads whose metadata insert was interrupted, not just registered rows.
  while (true) {
    const { data: files, error } = await supabase.storage.from("hifz-samples").list(user.id, { limit: 100 });
    if (error) throw new Error("Your recordings couldn’t load.");
    if (!files?.length) break;
    const removed = await supabase.storage.from("hifz-samples").remove(files.map((f) => `${user.id}/${f.name}`)); if (removed.error) throw new Error("Some recordings couldn’t delete. Please retry.");
  }
  const { error } = await supabase.from("hifz_samples").delete().eq("user_id", user.id); if (error) throw new Error("Report records couldn’t delete. Please retry.");
}