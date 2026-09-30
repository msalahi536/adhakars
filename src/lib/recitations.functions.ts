import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { checkAdminPassword } from "./admin-auth.server";

const BUCKET = "recitations";
const DAY = 60 * 60 * 24;

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function signMany(paths: string[], expires: number) {
  if (!paths.length) return new Map<string, string>();
  const s = await db();
  const { data } = await s.storage.from(BUCKET).createSignedUrls(paths, expires);
  const m = new Map<string, string>();
  (data ?? []).forEach((d) => { if (d.path && d.signedUrl) m.set(d.path, d.signedUrl); });
  return m;
}

/** Public: dhikr id -> playable url + file name. */
export const getRecitations = createServerFn({ method: "GET" }).handler(async () => {
  const s = await db();
  const { data, error } = await s
    .from("dhikr_recitations")
    .select("dhikr_id, recitation_files(name, path)");
  if (error) return {} as Record<string, { url: string; name: string }>;
  const rows = (data ?? []).filter((r) => r.recitation_files) as unknown as {
    dhikr_id: string; recitation_files: { name: string; path: string };
  }[];
  const urls = await signMany(rows.map((r) => r.recitation_files.path), DAY);
  const out: Record<string, { url: string; name: string }> = {};
  rows.forEach((r) => {
    const url = urls.get(r.recitation_files.path);
    if (url) out[r.dhikr_id] = { url, name: r.recitation_files.name };
  });
  return out;
});

const pw = z.object({ password: z.string() });

export const adminRecitationsLoad = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => pw.parse(d))
  .handler(async ({ data }) => {
    await checkAdminPassword(data.password);
    const s = await db();
    const [f, a] = await Promise.all([
      s.from("recitation_files").select("*").order("created_at", { ascending: false }),
      s.from("dhikr_recitations").select("dhikr_id, file_id"),
    ]);
    if (f.error || a.error) throw new Error("Load failed");
    const urls = await signMany(f.data.map((x) => x.path), 60 * 60 * 6);
    return {
      files: f.data.map((x) => ({ id: x.id, name: x.name, size: x.size, url: urls.get(x.path) ?? "" })),
      assignments: Object.fromEntries(a.data.map((r) => [r.dhikr_id, r.file_id])) as Record<string, string>,
    };
  });

export const adminCreateUpload = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => pw.extend({ filename: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    await checkAdminPassword(data.password);
    const safe = data.filename.toLowerCase().replace(/[^a-z0-9.\-_]+/g, "-").slice(-80);
    const path = `${crypto.randomUUID()}-${safe}`;
    const s = await db();
    const { data: up, error } = await s.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !up) throw new Error(error?.message ?? "Upload failed");
    return { path, token: up.token };
  });

export const adminRegisterFile = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    pw.extend({ path: z.string().min(1).max(300), name: z.string().min(1).max(200), size: z.number().int().nonnegative() }).parse(d),
  )
  .handler(async ({ data }) => {
    await checkAdminPassword(data.password);
    const s = await db();
    const { error } = await s.from("recitation_files").insert({ path: data.path, url: data.path, name: data.name, size: data.size });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteFile = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => pw.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await checkAdminPassword(data.password);
    const s = await db();
    const { data: row } = await s.from("recitation_files").select("path").eq("id", data.id).maybeSingle();
    if (row?.path) await s.storage.from(BUCKET).remove([row.path]);
    const { error } = await s.from("recitation_files").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminAssignRecitation = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    pw.extend({ dhikr_id: z.string().min(1).max(200), file_id: z.string().uuid().nullable() }).parse(d),
  )
  .handler(async ({ data }) => {
    await checkAdminPassword(data.password);
    const s = await db();
    const { error } = data.file_id
      ? await s.from("dhikr_recitations").upsert({ dhikr_id: data.dhikr_id, file_id: data.file_id, updated_at: new Date().toISOString() })
      : await s.from("dhikr_recitations").delete().eq("dhikr_id", data.dhikr_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
