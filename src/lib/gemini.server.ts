/** Calls Google Gemini (fast, low-cost Flash-Lite) with the owner's own key; returns parsed JSON or null. */
export const GEMINI_MODEL = "gemini-flash-lite-latest";

export async function geminiJson<T>(system: string, input: string, schema: object): Promise<T | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: input }] }],
      generationConfig: { responseMimeType: "application/json", responseSchema: schema },
    }),
  });
  if (!r.ok) return null;
  const d = await r.json();
  const txt = (d?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
  try { return JSON.parse(txt) as T; } catch { return null; }
}
