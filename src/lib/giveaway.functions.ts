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
    // One entry per completed goal, plus one extra entry for every 5 downloads.
    const tickets = Math.max(
      1,
      goals.filter((g) => g !== "referrals").length + Math.floor(referrals / 5),
    );
    const { error } = await supabaseAdmin.from("giveaway_entries").upsert(
      {
        device_id: data.code,
        email: data.email,
        goals,
        tickets,
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

export type PendingReferrer = { code: string; referrals: number; last: string };

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

    // Live referral counts (entries only store a snapshot from submission time).
    const counts = new Map<string, { n: number; last: string }>();
    for (let from = 0; ; from += 1000) {
      const { data: refs, error: rErr } = await supabaseAdmin
        .from("giveaway_referrals")
        .select("ref_code, created_at")
        .range(from, from + 999);
      if (rErr) throw new Error(rErr.message);
      for (const r of refs ?? []) {
        const c = counts.get(r.ref_code) ?? { n: 0, last: r.created_at };
        c.n += 1;
        if (r.created_at > c.last) c.last = r.created_at;
        counts.set(r.ref_code, c);
      }
      if (!refs || refs.length < 1000) break;
    }

    const items = (rows ?? []) as GiveawayEntry[];
    const updated: GiveawayEntry[] = [];
    for (const e of items) {
      const referrals = Math.max(e.referrals, counts.get(e.device_id)?.n ?? 0);
      const goals = e.goals.filter((g) => g !== "referrals");
      if (referrals >= 5) goals.push("referrals");
      const next = { ...e, referrals, goals, tickets: Math.max(1, goals.length) };
      if (next.referrals !== e.referrals || next.tickets !== e.tickets) {
        await supabaseAdmin
          .from("giveaway_entries")
          .update({ referrals: next.referrals, goals: next.goals, tickets: next.tickets })
          .eq("id", e.id);
      }
      updated.push(next);
    }

    const entered = new Set(items.map((e) => e.device_id));
    const pending: PendingReferrer[] = [...counts]
      .filter(([code]) => !entered.has(code))
      .map(([code, c]) => ({ code, referrals: c.n, last: c.last }))
      .sort((a, b) => b.referrals - a.referrals);

    return { items: updated, pending };
  });
