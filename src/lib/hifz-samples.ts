import { supabase } from "@/integrations/supabase/client";
import { canReport, readSampleConsent } from "./hifz-sample-consent";

export async function sampleUser() { const { data, error } = await supabase.auth.getUser(); return error ? null : data.user; }
export async function uploadSample(zip: Blob, passages: { sura: number; first: number; last: number }[], note: string) {
  const c = readSampleConsent();
  if (!canReport(c) || !c.date) throw new Error("Consent is required before reporting.");
  const user = await sampleUser();
  if (!user) throw new Error("Sign in to send a private report.");
  const { error: consentError } = await supabase.from("hifz_sample_consents").upsert({ user_id: user.id, adult_confirmed: true, consented_at: c.date });
  if (consentError) throw new Error("Couldn’t save consent. Please try again.");
  const path = `${user.id}/${new Date().toISOString().slice(0, 10)}-${crypto.randomUUID()}.zip`;
  const { error: fileError } = await supabase.storage.from("hifz-samples").upload(path, zip, { contentType: "application/zip", upsert: false });
  if (fileError) throw new Error("Couldn’t send the recording. Please try again.");
  const { error } = await supabase.from("hifz_samples").insert({ user_id: user.id, path, passages, note: note.trim().slice(0, 200), consented_at: c.date });
  if (error) { await supabase.storage.from("hifz-samples").remove([path]); throw new Error("Couldn’t save the report. Please try again."); }
}
export async function deleteMySamples() {
  const user = await sampleUser(); if (!user) throw new Error("Sign in to delete your samples.");
  // Always start at zero after removal; this also removes any interrupted-upload orphans.
  for (;;) {
    const { data, error } = await supabase.storage.from("hifz-samples").list(user.id, { limit: 100 });
    if (error) throw new Error("Couldn’t load your recordings. Please retry.");
    const paths = (data ?? []).filter((f) => f.id).map((f) => `${user.id}/${f.name}`);
    if (!paths.length) break;
    const { error: removalError } = await supabase.storage.from("hifz-samples").remove(paths);
    if (removalError) throw new Error("Couldn’t delete your recordings. Please retry.");
  }
  const { error } = await supabase.from("hifz_samples").delete().eq("user_id", user.id);
  if (error) throw new Error("Recordings deleted; report details couldn’t be removed. Please retry.");
}