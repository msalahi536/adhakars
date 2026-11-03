import { supabase } from "@/integrations/supabase/client";
export async function sampleConsent() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, consent: null };
  const { data, error } = await supabase.from("hifz_sample_consents").select("consented_at,adult_confirmed").eq("user_id", user.id).maybeSingle();
  if (error) throw new Error("Your reporting preference couldn’t load.");
  return { user, consent: data?.adult_confirmed ? data.consented_at : null };
}
export async function consentSamples(adult: boolean) {
  if (!adult) throw new Error("Adult confirmation is required.");
  const { data: { user } } = await supabase.auth.getUser(); if (!user) throw new Error("Sign in first.");
  const { data, error } = await supabase.from("hifz_sample_consents").upsert({ user_id: user.id, adult_confirmed: true, consented_at: new Date().toISOString() }).select("consented_at").single();
  if (error) throw new Error("Consent couldn’t save. Please retry."); return data.consented_at;
}
export async function revokeSamples() {
  const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
  const { error } = await supabase.from("hifz_sample_consents").delete().eq("user_id", user.id); if (error) throw new Error("Reporting couldn’t turn off.");
}
