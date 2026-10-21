// Ilm Guide giveaway: device-local progress (no accounts). Entries and
// referral visits are stored server-side via giveaway.functions.ts.

export const GIVEAWAY_END = Date.parse("2026-10-24T06:59:59Z"); // end of Fri Oct 23, Pacific
export const GOALS = { surahs: 5, dhikr: 500, referrals: 5 } as const;

const K = {
  status: "giveaway:status", // "joined" | "declined"
  surahs: "giveaway:surahs",
  dhikr: "giveaway:dhikr",
  code: "giveaway:code",
  entered: "giveaway:entered",
};

const EVT = "giveaway-change";
const ls = () => (typeof window === "undefined" ? null : window.localStorage);

export function giveawayActive(now = Date.now()) {
  return now <= GIVEAWAY_END;
}

export function getStatus(): "joined" | "declined" | null {
  const v = ls()?.getItem(K.status);
  return v === "joined" || v === "declined" ? v : null;
}
export function setStatus(v: "joined" | "declined") {
  ls()?.setItem(K.status, v);
  emit();
}

// Bump to re-ask everyone who hasn't joined yet (joined users keep their progress).
const ASK_KEY = "giveaway:asked:v3";
export function shouldAskGiveaway() {
  return giveawayActive() && getStatus() !== "joined" && !ls()?.getItem(ASK_KEY);
}
export function markGiveawayAsked(choice: "yes" | "no") {
  const s = ls();
  if (!s) return;
  s.setItem(ASK_KEY, choice);
  if (choice === "yes") { s.removeItem(K.status); emit(); }
  else setStatus("declined");
}

export function getDeviceCode(): string {
  const s = ls();
  if (!s) return "";
  let c = s.getItem(K.code);
  if (!c) {
    const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const b = crypto.getRandomValues(new Uint8Array(8));
    c = Array.from(b, (x) => abc[x % abc.length]).join("");
    s.setItem(K.code, c);
  }
  return c;
}

export function referralLink(code = getDeviceCode()) {
  return `https://sahihaladhkar.com/download?ref=${code}`;
}

function tracking() {
  return getStatus() === "joined" && giveawayActive();
}

export function getSurahs(): number[] {
  try {
    return JSON.parse(ls()?.getItem(K.surahs) || "[]");
  } catch {
    return [];
  }
}
export function markSurahComplete(chapter: number | null | undefined) {
  if (!chapter || !tracking()) return;
  const list = getSurahs();
  if (list.includes(chapter)) return;
  ls()?.setItem(K.surahs, JSON.stringify([...list, chapter]));
  emit();
  if (list.length + 1 === GOALS.surahs) celebrate("surahs");
}

export function getDhikr(): number {
  return Number(ls()?.getItem(K.dhikr) || 0) || 0;
}
export function addGiveawayDhikr(n = 1) {
  if (!tracking()) return;
  const before = getDhikr();
  ls()?.setItem(K.dhikr, String(before + n));
  emit();
  if (before < GOALS.dhikr && before + n >= GOALS.dhikr) celebrate("dhikr");
}

export function getEntered(): string[] {
  try {
    return JSON.parse(ls()?.getItem(K.entered) || "[]");
  } catch {
    return [];
  }
}
export function setEntered(goals: string[]) {
  ls()?.setItem(K.entered, JSON.stringify(goals));
  emit();
}

/** Completed goals — one entry each, except referrals which grant one entry per 5 downloads. */
export function completedGoals(p: { surahs: number; dhikr: number; referrals: number }) {
  const g: string[] = [];
  if (p.surahs >= GOALS.surahs) g.push("surahs");
  if (p.dhikr >= GOALS.dhikr) g.push("dhikr");
  if (p.referrals >= GOALS.referrals) g.push("referrals");
  return g;
}

/** Total entries: one per completed goal, plus one extra entry for every 5 downloads. */
export function countEntries(p: { surahs: number; dhikr: number; referrals: number }) {
  let t = 0;
  if (p.surahs >= GOALS.surahs) t += 1;
  if (p.dhikr >= GOALS.dhikr) t += 1;
  t += Math.floor(p.referrals / GOALS.referrals);
  return t;
}

/** Weighted pick: each entry appears once per ticket. */
export function drawWinner<T extends { tickets: number }>(entries: T[], rand = Math.random): T | null {
  const total = entries.reduce((s, e) => s + Math.max(0, e.tickets), 0);
  if (!total) return null;
  let r = rand() * total;
  for (const e of entries) {
    r -= Math.max(0, e.tickets);
    if (r < 0) return e;
  }
  return entries[entries.length - 1];
}

export const GOAL_EVT = "giveaway-goal";
function celebrate(goal: string) {
  window.dispatchEvent(new CustomEvent(GOAL_EVT, { detail: goal }));
}

function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVT));
}
export function onGiveawayChange(fn: () => void) {
  window.addEventListener(EVT, fn);
  return () => window.removeEventListener(EVT, fn);
}
