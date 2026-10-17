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
    try {
      const { geminiJson } = await import("./gemini.server");
      const parsed = (await geminiJson<{ keys: unknown[] }>(
        "You identify Quran verses from vague descriptions, paraphrases, themes or well-known names (e.g. 'stay at home' -> 33:33, 'ayat al kursi' -> 2:255). Return up to 5 verse keys as 'surah:ayah', best match first. Only include verses you are confident relate. If none, return an empty list.",
        data.q,
        { type: "object", properties: { keys: { type: "array", items: { type: "string" } } }, required: ["keys"] },
      )) ?? { keys: [] };
      const keys = (Array.isArray(parsed.keys) ? parsed.keys : [])
        .filter((k: unknown): k is string => typeof k === "string" && /^\d{1,3}:\d{1,3}$/.test(k))
        .slice(0, 5);
      return { keys: keys as string[] };
    } catch {
      return { keys: [] as string[] };
    }
  });
