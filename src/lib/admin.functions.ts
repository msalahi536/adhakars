import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CATEGORIES = [
  "quran_verse",
  "daily_dhikr",
  "morning_adhkar",
  "evening_adhkar",
  "daily_dua",
  "names_of_allah",
  "sunnah_of_day",
] as const;

function checkPassword(pw: string) {
  const expected = process.env["ADMIN_PASSWORD"] || "Mindcast645!";
  if (pw !== expected) throw new Error("Unauthorized");
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const pw = z.object({ password: z.string() });
const fields = z.object({
  arabic_text: z.string().min(1).max(5000),
  transliteration: z.string().max(5000).nullable().optional(),
  translation: z.string().min(1).max(5000),
  reference: z.string().max(500).nullable().optional(),
  reward_note: z.string().max(1000).nullable().optional(),
});
const clean = (f: z.infer<typeof fields>) => ({
  arabic_text: f.arabic_text.trim(),
  transliteration: f.transliteration?.trim() || null,
  translation: f.translation.trim(),
  reference: f.reference?.trim() || null,
  reward_note: f.reward_note?.trim() || null,
});

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => pw.parse(d))
  .handler(async ({ data }) => {
    try {
      checkPassword(data.password);
      return { ok: true };
    } catch {
      return { ok: false };
    }
  });

export const adminLoadAll = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => pw.parse(d))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const db = await admin();
    const [c, s] = await Promise.all([
      db
        .from("widget_content")
        .select("*")
        .order("display_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true }),
      db.from("widget_schedule").select("*").order("widget_type"),
    ]);
    if (c.error || s.error) throw new Error("Load failed");
    return { content: c.data, schedule: s.data };
  });

export const adminSaveItem = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    pw
      .extend({ id: z.string().uuid().optional(), category: z.enum(CATEGORIES), item: fields })
      .parse(d),
  )
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const db = await admin();
    if (data.id) {
      const { error } = await db.from("widget_content").update(clean(data.item)).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { data: last } = await db
        .from("widget_content")
        .select("display_order")
        .eq("category", data.category)
        .order("display_order", { ascending: false, nullsFirst: false })
        .limit(1);
      const next = (last?.[0]?.display_order ?? 0) + 1;
      const { error } = await db
        .from("widget_content")
        .insert({ ...clean(data.item), category: data.category, display_order: next });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminBulkImport = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    pw.extend({ category: z.enum(CATEGORIES), items: z.array(fields).min(1).max(500) }).parse(d),
  )
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const db = await admin();
    const { data: last } = await db
      .from("widget_content")
      .select("display_order")
      .eq("category", data.category)
      .order("display_order", { ascending: false, nullsFirst: false })
      .limit(1);
    let n = last?.[0]?.display_order ?? 0;
    const rows = data.items.map((i) => ({ ...clean(i), category: data.category, display_order: ++n }));
    const { error } = await db.from("widget_content").insert(rows);
    if (error) throw new Error(error.message);
    return { ok: true, count: rows.length };
  });

export const adminDeleteItem = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => pw.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const db = await admin();
    const { error } = await db.from("widget_content").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminToggleActive = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => pw.extend({ id: z.string().uuid(), is_active: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const db = await admin();
    const { error } = await db.from("widget_content").update({ is_active: data.is_active }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminReorder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => pw.extend({ ids: z.array(z.string().uuid()).max(1000) }).parse(d))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const db = await admin();
    await Promise.all(
      data.ids.map((id, i) => db.from("widget_content").update({ display_order: i + 1 }).eq("id", id)),
    );
    return { ok: true };
  });

export const adminSaveSchedule = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    pw
      .extend({
        widget_type: z.string().min(1).max(40),
        rotation_mode: z.enum(["sequential", "random", "manual"]),
        current_content_id: z.string().uuid().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const db = await admin();
    const { error } = await db
      .from("widget_schedule")
      .update({ rotation_mode: data.rotation_mode, current_content_id: data.current_content_id })
      .eq("widget_type", data.widget_type);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
