import type { HifzState } from "./types";

const KEY = "hifz_state_v1";

/** Local date (the user's day, not UTC) as yyyy-mm-dd. */
export function todayISO(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function loadState(): HifzState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as HifzState;
    return s.version === 1 ? s : null;
  } catch {
    return null;
  }
}

export function saveState(s: HifzState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage full or blocked: keep working in memory */
  }
}
