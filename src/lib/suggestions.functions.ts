import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const submitSchema = z.object({
  kind: z.string().min(1).max(40).default("color"),
  body: z.string().min(1).max(2000),
  contact: z.string().max(200).optional().nullable(),
  meta: z.record(z.string(), z.any()).optional(),
});

export type SuggestionRow = {
  id: string;
  kind: string;
  body: string;
  contact: string | null;
  created_at: string;
};

export const submitSuggestion = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submitSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("suggestions").insert({
      kind: data.kind,
      body: data.body,
      contact: data.contact ?? null,
      meta: (data.meta ?? {}) as never,
    });
    if (error) return { ok: false as const, error: "Could not send suggestion." };
    return { ok: true as const };
  });

export const listSuggestions = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ password: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const expected = process.env["SUGGESTIONS_PASSWORD"];
    if (!expected || data.password !== expected) {
      return { ok: false as const, items: [] as SuggestionRow[] };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("suggestions")
      .select("id, kind, body, contact, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) return { ok: true as const, items: [] as SuggestionRow[] };
    return { ok: true as const, items: (rows ?? []) as SuggestionRow[] };
  });
