// Local-first Arabic Companion log (append-only, UUID events), same approach as Hifz.
import { localDay } from "@/lib/hifz/scheduler";
import type { ArabicEvent } from "./engine";

const KEY = "arabic:log:v1";

export function loadLog(): ArabicEvent[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function record(es: Omit<ArabicEvent, "id" | "at" | "day">[], now = new Date()): ArabicEvent[] {
  const made = es.map((e, i) => ({
    ...e,
    id: crypto.randomUUID(),
    at: new Date(now.getTime() + i).toISOString(),
    day: localDay(now),
  }));
  localStorage.setItem(KEY, JSON.stringify([...loadLog(), ...made]));
  return made;
}
