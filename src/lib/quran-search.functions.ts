import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Turns a loosely remembered description ("stay at home", "ayat al kursi")
 * into likely verse references. Only verse keys come back; the verse text
 * itself is always loaded from the Quran text source in the browser.
 */
export const guessVerses = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ q: z.string().min(3).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { keys: [] as string[] };
    try {
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You identify Quran verses from vague descriptions, paraphrases, themes or well-known names (e.g. 'stay at home' -> 33:33, 'ayat al kursi' -> 2:255). Return up to 5 verse keys 'surah:ayah', best match first. Only return verses you are confident relate. If none, return an empty list." },
            { role: "user", content: data.q },
          ],
          response_format: { type: "json_schema", json_schema: { name: "verses", strict: true, schema: {
            type: "object", additionalProperties: false, required: ["keys"],
            properties: { keys: { type: "array", items: { type: "string" } } },
          } } },
        }),
      });
      if (!r.ok) return { keys: [] };
      const j = await r.json();
      const parsed = JSON.parse(j.choices?.[0]?.message?.content ?? "{}");
      const keys = (Array.isArray(parsed.keys) ? parsed.keys : [])
        .filter((k: unknown): k is string => typeof k === "string" && /^\d{1,3}:\d{1,3}$/.test(k))
        .slice(0, 5);
      return { keys };
    } catch {
      return { keys: [] };
    }
  });
