// Fasting Companion calendar engine + local storage.
// Rules follow Part 5 of the source document:
// - A Gregorian day's daytime belongs to the Hijri date that began at the
//   previous Maghrib. Intl's islamic-umalqura calendar maps civil days exactly
//   that way, so hijriOf(G) is the date being fasted on G.
// - Umm al-Qura is the default, with a per-user offset of −2..+2.
// - ‘Arafah always uses the Saudi (Umm al-Qura) date, never the user offset.
// - 13 Dhul-Hijjah is Tashriq: no white-day suggestion.
// - No imsak. Suhoor ends at Fajr, iftar at Maghrib.
import { isPeriodDay } from "@/lib/period";

export type FastType =
  | "ramadan" | "qada" | "voluntary" | "ashura" | "arafah" | "shawwal" | "monthu" | "beed" | "dawud";

export const FAST_TYPE_LABELS: Record<FastType, string> = {
  ramadan: "Ramadan",
  qada: "Qada’ (making up)",
  voluntary: "Voluntary",
  ashura: "‘Ashura",
  arafah: "‘Arafah",
  shawwal: "Shawwal",
  monthu: "Monday / Thursday",
  beed: "Ayyam al-Beed",
  dawud: "Dawud",
};

export type ExcuseReason = "illness" | "travel" | "menstruation";

export type FastLog =
  | { status: "fasted"; type: FastType }
  | { status: "excused"; reason: ExcuseReason };

export type FastingState = {
  offset: number;
  logs: Record<string, FastLog>;
  dawud: { on: boolean; start: string | null };
  onHajj: boolean;
  suhoorReminder: boolean;
  suhoorMins: number;
  iftarReminder: boolean;
  /** opt-in personal buffer in minutes, labelled — never a default */
  buffer: number;
  confirmed: string[];
};

const KEY = "adhkar:fasting:v1";
export const FASTING_EVENT = "adhkar:fasting-update";

const empty: FastingState = {
  offset: 0,
  logs: {},
  dawud: { on: false, start: null },
  onHajj: false,
  suhoorReminder: false,
  suhoorMins: 30,
  iftarReminder: false,
  buffer: 0,
  confirmed: [],
};

export function getFastingState(): FastingState {
  if (typeof window === "undefined") return empty;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    return { ...empty, ...raw, dawud: { ...empty.dawud, ...(raw.dawud ?? {}) } };
  } catch {
    return empty;
  }
}

export function setFastingState(patch: Partial<FastingState>): FastingState {
  const next = { ...getFastingState(), ...patch };
  next.offset = Math.max(-2, Math.min(2, Math.round(next.offset)));
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(FASTING_EVENT));
  window.dispatchEvent(new Event("adhkar:streak-update"));
  return next;
}

// ---------- dates ----------
export const keyOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const parseKey = (k: string) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
};
export const addDaysKey = (k: string, n: number) => {
  const d = parseKey(k);
  d.setDate(d.getDate() + n);
  return keyOf(d);
};
export const todayKey = () => keyOf(new Date());

export type Hijri = { d: number; m: number; y: number };

let fmt: Intl.DateTimeFormat | null = null;
const cache = new Map<string, Hijri>();
function umalqura(k: string): Hijri {
  const hit = cache.get(k);
  if (hit) return hit;
  fmt ??= new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { day: "numeric", month: "numeric", year: "numeric" });
  const parts = fmt.formatToParts(parseKey(k));
  const get = (t: string) => parseInt(parts.find((p) => p.type === t)?.value ?? "0", 10);
  const h = { d: get("day"), m: get("month"), y: get("year") };
  cache.set(k, h);
  return h;
}

/** Saudi / Umm al-Qura date for the daytime of this Gregorian day. */
export const saudiHijri = (k: string) => umalqura(k);
/** Local Hijri date after the user's sighting offset. */
export const localHijri = (k: string, offset: number) => umalqura(addDaysKey(k, offset));

// ---------- day classification ----------
export type DayKind = "forbidden" | "special" | "recommended" | "ramadan" | "none";
export type DayTag =
  | "eid-fitr" | "eid-adha" | "tashriq" | "ramadan" | "arafah" | "arafah-local" | "ashura" | "ashura-9"
  | "shawwal" | "muharram" | "beed" | "beed-suppressed" | "monthu" | "dawud" | "doubt";

export type DayInfo = {
  key: string;
  hijri: Hijri;
  saudi: Hijri;
  kind: DayKind;
  tags: DayTag[];
  blocked: boolean;
};

export function dayInfo(k: string, s: FastingState): DayInfo {
  const h = localHijri(k, s.offset);
  const saudi = saudiHijri(k);
  const tags: DayTag[] = [];
  const dow = parseKey(k).getDay();
  let kind: DayKind = "none";
  let blocked = false;

  if (h.m === 10 && h.d === 1) { tags.push("eid-fitr"); blocked = true; }
  if (h.m === 12 && h.d === 10) { tags.push("eid-adha"); blocked = true; }
  if (h.m === 12 && h.d >= 11 && h.d <= 13) { tags.push("tashriq"); blocked = true; }
  if (h.m === 12 && h.d === 13) tags.push("beed-suppressed");

  if (blocked) return { key: k, hijri: h, saudi, kind: "forbidden", tags, blocked };

  if (h.m === 9) { tags.push("ramadan"); kind = "ramadan"; }

  const special = () => { if (kind !== "ramadan") kind = "special"; };
  const recommend = () => { if (kind === "none") kind = "recommended"; };

  // ‘Arafah: Saudi date only, offset ignored.
  if (saudi.m === 12 && saudi.d === 9) { tags.push("arafah"); special(); }
  else if (h.m === 12 && h.d === 9) { tags.push("arafah-local"); recommend(); }

  if (h.m === 1 && h.d === 10) { tags.push("ashura"); special(); }
  if (h.m === 1 && h.d === 9) { tags.push("ashura-9"); special(); }
  if (h.m === 10 && h.d >= 2) { tags.push("shawwal"); special(); }
  if (h.m === 1) { tags.push("muharram"); recommend(); }
  if (h.m !== 12 && h.d >= 13 && h.d <= 15) { tags.push("beed"); recommend(); }
  if (dow === 1 || dow === 4) { tags.push("monthu"); recommend(); }
  if (s.dawud.on && s.dawud.start && k >= s.dawud.start) {
    const diff = Math.round((parseKey(k).getTime() - parseKey(s.dawud.start).getTime()) / 86400000);
    if (diff % 2 === 0) { tags.push("dawud"); recommend(); }
  }
  if (h.m === 8 && h.d === 30) tags.push("doubt");

  return { key: k, hijri: h, saudi, kind, tags, blocked };
}

/** Warnings when logging a voluntary fast. */
export function logWarnings(k: string, s: FastingState): ("friday" | "doubt")[] {
  const info = dayInfo(k, s);
  const out: ("friday" | "doubt")[] = [];
  const dow = parseKey(k).getDay();
  if (dow === 5) {
    const notSingled = info.tags.some((t) => t === "beed" || t === "arafah" || t === "arafah-local" || t === "ashura" || t === "ashura-9" || t === "ramadan");
    const adjacent = [addDaysKey(k, -1), addDaysKey(k, 1)].some((a) => s.logs[a]?.status === "fasted");
    if (!notSingled && !adjacent) out.push("friday");
  }
  if (info.tags.includes("doubt")) {
    // Someone with an existing Monday/Thursday habit continues normally.
    const habit = (dow === 1 || dow === 4) && Object.values(s.logs).filter((l) => l.status === "fasted" && l.type === "monthu").length >= 2;
    if (!habit) out.push("doubt");
  }
  return out;
}

/** Suggested log type for a day. */
export function suggestedType(info: DayInfo): FastType {
  if (info.tags.includes("ramadan")) return "ramadan";
  if (info.tags.includes("arafah")) return "arafah";
  if (info.tags.includes("ashura") || info.tags.includes("ashura-9")) return "ashura";
  if (info.tags.includes("shawwal")) return "shawwal";
  if (info.tags.includes("beed")) return "beed";
  if (info.tags.includes("monthu")) return "monthu";
  if (info.tags.includes("dawud")) return "dawud";
  return "voluntary";
}

// ---------- logging ----------
export function logFast(k: string, type: FastType) {
  const s = getFastingState();
  if (dayInfo(k, s).blocked) return s;
  return setFastingState({ logs: { ...s.logs, [k]: { status: "fasted", type } } });
}
export function excuseDay(k: string, reason: ExcuseReason) {
  const s = getFastingState();
  return setFastingState({ logs: { ...s.logs, [k]: { status: "excused", reason } } });
}
export function clearLog(k: string) {
  const s = getFastingState();
  const logs = { ...s.logs };
  delete logs[k];
  return setFastingState({ logs });
}

/** Ramadan days on a period day count as excused automatically. */
export function effectiveLog(k: string, s: FastingState): FastLog | undefined {
  const l = s.logs[k];
  if (l) return l;
  if (k <= todayKey() && localHijri(k, s.offset).m === 9 && isPeriodDay(k)) return { status: "excused", reason: "menstruation" };
  return undefined;
}

export const fastingDayCounts = (k: string) => {
  const s = getFastingState();
  const l = effectiveLog(k, s);
  return !!l;
};

// ---------- stats ----------
export function ramadanInfo(s: FastingState, today = todayKey()) {
  const h = localHijri(today, s.offset);
  // Find the start of the current (or most recent) Ramadan by walking back.
  let start: string | null = null;
  if (h.m === 9) start = addDaysKey(today, -(h.d - 1));
  let days: string[] = [];
  if (start) {
    for (let i = 0; i < 30; i++) {
      const k = addDaysKey(start, i);
      if (localHijri(k, s.offset).m !== 9) break;
      days.push(k);
    }
  }
  const upTo = days.filter((k) => k <= today);
  const fasted = upTo.filter((k) => effectiveLog(k, s)?.status === "fasted").length;
  const excused = upTo.filter((k) => effectiveLog(k, s)?.status === "excused").length;
  return {
    active: h.m === 9,
    day: h.m === 9 ? h.d : 0,
    total: days.length || 30,
    fasted,
    excused,
    remaining: Math.max(0, days.length - upTo.length),
    lastTen: h.m === 9 && h.d >= 20,
  };
}

/** Qada’ owed = excused Ramadan days (logged or from period) minus qada’ fasts. */
export function qadaOwed(s: FastingState) {
  const today = todayKey();
  const keys = new Set(Object.keys(s.logs));
  // include automatic period-excused days in the last 400 days
  for (let i = 0; i < 400; i++) {
    const k = addDaysKey(today, -i);
    if (localHijri(k, s.offset).m === 9) keys.add(k);
  }
  let owed = 0;
  let madeUp = 0;
  keys.forEach((k) => {
    const l = effectiveLog(k, s);
    if (!l) return;
    if (l.status === "excused" && localHijri(k, s.offset).m === 9) owed++;
    if (l.status === "fasted" && l.type === "qada") madeUp++;
  });
  return Math.max(0, owed - madeUp);
}

export function shawwalProgress(s: FastingState) {
  const today = todayKey();
  const h = localHijri(today, s.offset);
  let n = 0;
  for (let i = -40; i <= 0; i++) {
    const k = addDaysKey(today, i);
    const kh = localHijri(k, s.offset);
    if (kh.m === 10 && kh.y === (h.m >= 10 ? h.y : h.y - 1) && kh.d >= 2 && s.logs[k]?.status === "fasted") n++;
  }
  return Math.min(6, n);
}

export function stats(s: FastingState) {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = keyOf(now).slice(0, 7);
  const fasted = Object.entries(s.logs).filter(([, l]) => l.status === "fasted");
  const totalYear = fasted.filter(([k]) => k.startsWith(year)).length;
  const voluntaryMonth = fasted.filter(([k, l]) => k.startsWith(month) && l.status === "fasted" && l.type !== "ramadan" && l.type !== "qada").length;

  // Streak over days that had a fast *expected*: logged days in a row where
  // gaps between them are allowed only if the gap day was excused.
  let streak = 0;
  let k = todayKey();
  if (!effectiveLog(k, s)) k = addDaysKey(k, -1);
  for (let i = 0; i < 400; i++) {
    const l = effectiveLog(k, s);
    if (!l) break;
    if (l.status === "fasted") streak++;
    k = addDaysKey(k, -1);
  }

  // Every Monday in the current calendar month. Use the same effective log
  // source as the calendar so the summary cannot disagree with a marked day.
  const y = now.getFullYear(), m = now.getMonth();
  const mondays: string[] = [];
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(y, m, d, 12);
    if (dt.getDay() === 1) mondays.push(keyOf(dt));
  }
  const mondaysFasted = mondays.filter((mk) => effectiveLog(mk, s)?.status === "fasted").length;

  return { totalYear, voluntaryMonth, streak, mondays: mondays.length, mondaysFasted };
}

/** Next recommended day from tomorrow. */
export function nextRecommended(s: FastingState, from = todayKey()) {
  for (let i = 1; i <= 60; i++) {
    const k = addDaysKey(from, i);
    const info = dayInfo(k, s);
    if (info.kind === "recommended" || info.kind === "special") return info;
  }
  return null;
}

/** A special fast (‘Arafah, ‘Ashura) within the next five days. */
export function upcomingSpecial(s: FastingState, from = todayKey()) {
  for (let i = 1; i <= 5; i++) {
    const k = addDaysKey(from, i);
    const info = dayInfo(k, s);
    if (info.tags.includes("arafah") || info.tags.includes("ashura")) return { info, inDays: i };
  }
  return null;
}
