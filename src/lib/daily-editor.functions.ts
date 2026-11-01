import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { dateKey, dailyContent, dailyType, type DailyAssignment } from "./daily-editor";

export const editorLogin = createServerFn({ method: "POST" })
  .inputValidator(z.object({ username: z.string().max(100), password: z.string().max(200) }))
  .handler(async ({ data }) => {
    const { credentialsMatch, editorSession } = await import("./daily-editor.server");
    const username = process.env["DAILY_EDITOR_USERNAME"];
    const password = process.env["DAILY_EDITOR_PASSWORD"];
    const userMatch = credentialsMatch(data.username, username ?? "");
    const passMatch = credentialsMatch(data.password, password ?? "");
    if (!username || !password || !userMatch || !passMatch) {
      await new Promise((r) => setTimeout(r, 1000));
      return { ok: false };
    }
    await (await editorSession()).update({ editor: true });
    return { ok: true };
  });
export const editorStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { editorSession } = await import("./daily-editor.server");
  return { ok: !!(await editorSession()).data.editor, today: new Date().toISOString().slice(0, 10) };
});
export const editorLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { editorSession } = await import("./daily-editor.server");
  await (await editorSession()).clear();
  return { ok: true };
});
export const editorLoad = createServerFn({ method: "POST" })
  .inputValidator(z.object({ year: z.number().int().min(2020).max(2100) }))
  .handler(async ({ data }) => {
    const { requireEditor } = await import("./daily-editor.server"); await requireEditor();
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const [a, c] = await Promise.all([
      db.from("widget_daily_assignments").select("date,widget_type,content").gte("date", `${data.year}-01-01`).lte("date", `${data.year}-12-31`),
      db.from("widget_content").select("id,category,arabic_text,translation,reference,is_active,display_order").in("category", ["quran_verse", "sunnah_of_day"]).eq("is_active", true).order("display_order"),
    ]);
    if (a.error || c.error) throw new Error("Couldn't load selections. Please retry.");
    return { assignments: a.data as unknown as DailyAssignment[], library: c.data };
  });
export const editorSave = createServerFn({ method: "POST" })
  .inputValidator(z.object({ dates: z.array(dateKey).min(1).max(366), type: dailyType, content: dailyContent }))
  .handler(async ({ data }) => {
    const { requireEditor } = await import("./daily-editor.server"); await requireEditor();
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { error } = await db.from("widget_daily_assignments").upsert([...new Set(data.dates)].map((date) => ({ date, widget_type: data.type, content: data.content, updated_at: new Date().toISOString() })), { onConflict: "date,widget_type" });
    if (error) throw new Error("Couldn't save selections. Please retry.");
    return { ok: true };
  });
export const editorClear = createServerFn({ method: "POST" })
  .inputValidator(z.object({ date: dateKey, type: dailyType }))
  .handler(async ({ data }) => {
    const { requireEditor } = await import("./daily-editor.server"); await requireEditor();
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { error } = await db.from("widget_daily_assignments").delete().eq("date", data.date).eq("widget_type", data.type);
    if (error) throw new Error("Couldn't clear selection. Please retry.");
    return { ok: true };
  });

export const editorPreview = createServerFn({ method: "POST" })
  .inputValidator(z.object({ date: dateKey }))
  .handler(async ({ data }) => {
    const { requireEditor } = await import("./daily-editor.server"); await requireEditor();
    const { buildWidgetPayload } = await import("./widgets.server");
    const payload = await buildWidgetPayload(new Date(`${data.date}T12:00:00Z`));
    return { quran_verse: payload.quran_verse, sunnah: payload.sunnah_of_day };
  });