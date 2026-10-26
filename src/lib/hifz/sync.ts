// Optional cloud backup. Only runs when the person has chosen to sign in from Hifz Companion.
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { emptyState, loadHifz, mergeHifz, saveHifz, type HifzState } from "./store";

/** Pull the cloud copy, merge with this device, save locally and push the merged result. */
export async function syncHifz(): Promise<HifzState | null> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return null;
  const { data, error } = await supabase.from("hifz_backups").select("state").eq("user_id", user.id).maybeSingle();
  if (error) throw error;
  const remote = (data?.state as unknown as HifzState) ?? emptyState();
  const merged = mergeHifz(loadHifz(), { ...emptyState(), ...remote });
  saveHifz(merged);
  const { error: upErr } = await supabase
    .from("hifz_backups")
    .upsert({ user_id: user.id, state: merged as unknown as Json, updated_at: new Date().toISOString() });
  if (upErr) throw upErr;
  return merged;
}
