import { useSession, setResponseHeader } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

export function credentialsMatch(input: string, expected: string) {
  return timingSafeEqual(createHash("sha256").update(input).digest(), createHash("sha256").update(expected).digest());
}
export async function editorSession() {
  const password = process.env["DAILY_EDITOR_SESSION_SECRET"];
  if (!password) throw new Error("Daily editor is not configured");
  setResponseHeader("Cache-Control", "no-store");
  return useSession<{ editor?: boolean }>({ password, name: "daily-editor", maxAge: 60 * 60 * 12,
    cookie: { httpOnly: true, secure: true, sameSite: "strict", path: "/" } });
}
export async function requireEditor() {
  const session = await editorSession();
  if (!session.data.editor) throw new Error("Please sign in again");
}