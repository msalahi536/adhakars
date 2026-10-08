export type HajjMode = "umrah" | "hajj" | "learn";
const KEY = "adhkar:hajj:v1";

type State = { mode: HajjMode | null; checks: string[]; station: number; counters: Record<string, number> };
const empty: State = { mode: null, checks: [], station: 0, counters: {} };

export function getHajjState(): State {
  if (typeof window === "undefined") return empty;
  try { return { ...empty, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return empty; }
}

export function setHajjState(patch: Partial<State>): State {
  const next = { ...getHajjState(), ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
