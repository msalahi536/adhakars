import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const code = z.string().regex(/^[A-Z0-9]{6,12}$/);
const END = Date.parse("2026-10-24T06:59:59Z");

export const recordReferral = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ code, visitor: z.string().min(8).max(64) }).parse(d))
  .handler(async ({ data }) => {
    if (Date.now() > END) return { ok: false };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("giveaway_referrals")
      .upsert({ ref_code: data.code, visitor_id: data.visitor }, { onConflict: "ref_code,visitor_id", ignoreDuplicates: true });
    return { ok: true };
  });

export const getReferralCount = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ code }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("giveaway_referrals")
      .select("id", { count: "exact", head: true })
      .eq("ref_code", data.code);
    return { count: count ?? 0 };
  });

export const submitGiveawayEntry = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        code,
        email: z.string().trim().email().max(255),
        surahs: z.number().int().min(0).max(114),
        dhikr: z.number().int().min(0).max(1_000_000),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    if (Date.now() > END) return { ok: false as const, error: "The giveaway has ended." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("giveaway_referrals")
      .select("id", { count: "exact", head: true })
      .eq("ref_code", data.code);
    const referrals = count ?? 0;
    const goals: string[] = [];
    if (data.surahs >= 5) goals.push("surahs");
    if (data.dhikr >= 500) goals.push("dhikr");
    if (referrals >= 5) goals.push("referrals");
    if (!goals.length) return { ok: false as const, error: "Complete a goal first." };
    const { error } = await supabaseAdmin.from("giveaway_entries").upsert(
      {
        device_id: data.code,
        email: data.email,
        goals,
        tickets: goals.length,
        surahs: data.surahs,
        dhikr: data.dhikr,
        referrals,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "device_id" },
    );
    if (error) return { ok: false as const, error: "Could not submit. Please try again." };
    return { ok: true as const, goals };
  });

export type GiveawayEntry = {
  id: string;
  device_id: string;
  email: string;
  goals: string[];
  tickets: number;
  surahs: number;
  dhikr: number;
  referrals: number;
  created_at: string;
  updated_at: string;
};

export const adminListGiveaway = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ password: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { checkAdminPassword } = await import("@/lib/admin-auth.server");
    await checkAdminPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("giveaway_entries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw new Error(error.message);
    return { items: (rows ?? []) as GiveawayEntry[] };
  });
