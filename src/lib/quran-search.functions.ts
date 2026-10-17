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
      const r = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
        method: "POST",
        headers: { "Lovable-API-Key": key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
        body: JSON.stringify({
          model: "openai/gpt-6-astra",
          stream: true,
          store: false,
          reasoning: { effort: "low" },
          instructions: "You identify Quran verses from vague descriptions, paraphrases, themes or well-known names (e.g. 'stay at home' -> 33:33, 'ayat al kursi' -> 2:255). Return up to 5 verse keys as 'surah:ayah', best match first. Only include verses you are confident relate. If none, return an empty list.",
          input: data.q,
          text: { format: { type: "json_schema", name: "verses", strict: true, schema: {
            type: "object", additionalProperties: false, required: ["keys"],
            properties: { keys: { type: "array", items: { type: "string" } } },
          } } },
        }),
      });
      if (!r.ok || !r.body) return { keys: [] };
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let buf = "", txt = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const ln of lines) {
          if (!ln.startsWith("data:")) continue;
          try { const ev = JSON.parse(ln.slice(5)); if (ev.type === "response.output_text.delta") txt += ev.delta; } catch { /* skip */ }
        }
      }
      const parsed = JSON.parse(txt || "{}");
      const keys = (Array.isArray(parsed.keys) ? parsed.keys : [])
        .filter((k: unknown): k is string => typeof k === "string" && /^\d{1,3}:\d{1,3}$/.test(k))
        .slice(0, 5);
      return { keys: keys as string[] };
    } catch {
      return { keys: [] as string[] };
    }
  });
