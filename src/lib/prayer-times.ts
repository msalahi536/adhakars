// Prayer times via the Al-Adhan API, with localStorage caching per day.
// Everything here is browser safe and never throws.

import { getPosition, getCachedPosition, type Coords } from "@/lib/compass";

export type PrayerId = "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha";

export const PRAYER_ORDER: PrayerId[] = [
  "fajr",
  "sunrise",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];

/** Actual prayers (sunrise is a marker, not a prayer). */
export const SALAH_IDS: Exclude<PrayerId, "sunrise">[] = [
  "fajr",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];

export const PRAYER_LABELS: Record<PrayerId, string> = {
  fajr: "Fajr",
  sunrise: "Sunrise",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

export const CALC_METHODS: { id: number; name: string }[] = [
  { id: 2, name: "ISNA" },
  { id: 3, name: "Muslim World League" },
  { id: 5, name: "Egyptian General Authority" },
  { id: 4, name: "Umm al-Qura" },
  { id: 1, name: "University of Karachi" },
];

export type AdhanSound = "adhan" | "takbir" | "silent";

export type PrayerLocation = { lat: number; lng: number; label: string };

export type PrayerSettings = {
  method: number;
  hanafi: boolean;
  adhanEnabled: boolean;
  perPrayer: Record<Exclude<PrayerId, "sunrise">, boolean>;
  sound: AdhanSound;
  location: PrayerLocation | null;
};

const SETTINGS_KEY = "adhkar:prayer-settings";
const CACHE_PREFIX = "adhkar:prayer-cache:v2:";
const DISMISS_KEY = "adhkar:adhan-dismiss";
const MUTE_ALL_KEY = "adhkar:adhan-mute-all";

/** Device timezone, so the API returns times in the user's own clock. */
export const deviceTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
};

export const DEFAULT_PRAYER_SETTINGS: PrayerSettings = {
  method: 2,
  hanafi: false,
  adhanEnabled: false,
  perPrayer: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
  sound: "silent",
  location: null,
};

const readLS = (k: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(k);
  } catch {
    return null;
  }
};
const writeLS = (k: string, v: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(k, v);
  } catch {
    // ignore
  }
};

export const getPrayerSettings = (): PrayerSettings => {
  const raw = readLS(SETTINGS_KEY);
  if (!raw) return DEFAULT_PRAYER_SETTINGS;
  try {
    const parsed = JSON.parse(raw) as Partial<PrayerSettings>;
    return {
      ...DEFAULT_PRAYER_SETTINGS,
      ...parsed,
      perPrayer: { ...DEFAULT_PRAYER_SETTINGS.perPrayer, ...(parsed.perPrayer ?? {}) },
    };
  } catch {
    return DEFAULT_PRAYER_SETTINGS;
  }
};

export const setPrayerSettings = (s: PrayerSettings) => {
  writeLS(SETTINGS_KEY, JSON.stringify(s));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("adhkar:prayer-settings"));
  }
};

/** YYYY-MM-DD in local time. */
export const dateKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const apiDate = (d: Date): string =>
  `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;

export const addDays = (d: Date, n: number): Date => {
  const c = new Date(d.getTime());
  c.setDate(c.getDate() + n);
  c.setHours(0, 0, 0, 0);
  return c;
};

export type DayTimes = {
  /** local date key */
  key: string;
  /** minutes from midnight for each entry */
  times: Record<PrayerId, number>;
};

const parseHm = (raw: string): number | null => {
  const m = /(\d{1,2}):(\d{2})/.exec(raw ?? "");
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return null;
  return h * 60 + min;
};

const sig = (s: PrayerSettings): string => {
  const loc = s.location;
  const lat = loc ? loc.lat.toFixed(2) : "0";
  const lng = loc ? loc.lng.toFixed(2) : "0";
  return `${lat},${lng},${s.method},${s.hanafi ? 1 : 0},${deviceTimeZone()}`;
};

const readCache = (key: string, s: PrayerSettings): DayTimes | null => {
  const raw = readLS(`${CACHE_PREFIX}${key}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { sig: string; times: Record<PrayerId, number> };
    if (parsed.sig !== sig(s)) return null;
    if (!parsed.times || typeof parsed.times.fajr !== "number") return null;
    return { key, times: parsed.times };
  } catch {
    return null;
  }
};

const writeCache = (day: DayTimes, s: PrayerSettings) => {
  writeLS(`${CACHE_PREFIX}${day.key}`, JSON.stringify({ sig: sig(s), times: day.times }));
};

/** Removes cached days older than three days so storage never grows. */
export const prunePrayerCache = () => {
  if (typeof window === "undefined") return;
  const cutoff = dateKey(addDays(new Date(), -3));
  try {
    const drop: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k) continue;
      // legacy cache written before timezone handling
      if (k.startsWith("adhkar:prayer-cache:") && !k.startsWith(CACHE_PREFIX)) {
        drop.push(k);
        continue;
      }
      if (k.startsWith(CACHE_PREFIX) && k.slice(CACHE_PREFIX.length) < cutoff) drop.push(k);
    }
    drop.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // ignore
  }
};

type ApiResponse = {
  data?: {
    timings?: Record<string, string>;
    meta?: { latitude?: number; longitude?: number; timezone?: string };
  };
};

const buildTimes = (t: Record<string, string>): Record<PrayerId, number> | null => {
  const out = {} as Record<PrayerId, number>;
  const map: Record<PrayerId, string> = {
    fajr: "Fajr",
    sunrise: "Sunrise",
    dhuhr: "Dhuhr",
    asr: "Asr",
    maghrib: "Maghrib",
    isha: "Isha",
  };
  for (const id of PRAYER_ORDER) {
    const v = parseHm(t[map[id]] ?? "");
    if (v === null) return null;
    out[id] = v;
  }
  return out;
};

/** Fetch one day. Cached results are returned without a network call. */
export const fetchDay = async (
  date: Date,
  settings: PrayerSettings,
): Promise<DayTimes | null> => {
  const key = dateKey(date);
  const cached = readCache(key, settings);
  if (cached) return cached;
  const loc = settings.location;
  if (!loc) return null;
  const tz = deviceTimeZone();
  const url =
    `https://api.aladhan.com/v1/timings/${apiDate(date)}` +
    `?latitude=${loc.lat}&longitude=${loc.lng}` +
    `&method=${settings.method}&school=${settings.hanafi ? 1 : 0}` +
    (tz ? `&timezonestring=${encodeURIComponent(tz)}` : "");
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = (await res.json()) as ApiResponse;
    const timings = json.data?.timings;
    if (!timings) return null;
    const times = buildTimes(timings);
    if (!times) return null;
    const day: DayTimes = { key, times };
    writeCache(day, settings);
    return day;
  } catch {
    return null;
  }
};

/** Look a city up by name through the Al-Adhan address endpoint. */
export const lookupCity = async (
  query: string,
  settings: PrayerSettings,
): Promise<PrayerLocation | null> => {
  const q = query.trim();
  if (!q) return null;
  const url =
    `https://api.aladhan.com/v1/timingsByAddress/${apiDate(new Date())}` +
    `?address=${encodeURIComponent(q)}&method=${settings.method}&school=${settings.hanafi ? 1 : 0}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = (await res.json()) as ApiResponse;
    const lat = json.data?.meta?.latitude;
    const lng = json.data?.meta?.longitude;
    if (typeof lat !== "number" || typeof lng !== "number") return null;
    return { lat, lng, label: q };
  } catch {
    return null;
  }
};

/** Resolve a device location, reusing the cached Qibla fix when possible. */
export const resolveLocation = async (force = false): Promise<PrayerLocation | null> => {
  const cached: Coords | null = force ? null : getCachedPosition();
  if (cached) return { ...cached, label: formatCoords(cached) };
  const pos = await getPosition({ force });
  if (!pos.ok) return null;
  return { ...pos.coords, label: formatCoords(pos.coords) };
};

export const formatCoords = (c: Coords) =>
  `${c.lat.toFixed(2)}, ${c.lng.toFixed(2)}`;

/** "8:57 PM" */
export const formatMinutes = (mins: number): string => {
  const h24 = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
};

export type Slot = {
  id: PrayerId;
  label: string;
  /** absolute time */
  at: Date;
  dayKey: string;
  minutes: number;
};

export const slotsForDay = (day: DayTimes): Slot[] => {
  const [y, m, d] = day.key.split("-").map((n) => parseInt(n, 10));
  return PRAYER_ORDER.map((id) => {
    const at = new Date(y, m - 1, d, 0, 0, 0, 0);
    at.setMinutes(day.times[id]);
    return { id, label: PRAYER_LABELS[id], at, dayKey: day.key, minutes: day.times[id] };
  });
};

export const nextSlot = (slots: Slot[], now: Date = new Date()): Slot | null =>
  slots.find((s) => s.at.getTime() > now.getTime()) ?? null;

/** Most recent prayer (ignores sunrise) that has already started. */
export const currentPrayer = (
  slots: Slot[],
  now: Date = new Date(),
): Exclude<PrayerId, "sunrise"> | null => {
  const past = slots.filter((s) => s.id !== "sunrise" && s.at.getTime() <= now.getTime());
  const last = past[past.length - 1];
  return last ? (last.id as Exclude<PrayerId, "sunrise">) : null;
};

export const formatCountdown = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

/* ---- mute state ---- */

export type DismissState = { dayKey: string; prayer: PrayerId } | null;

export const getDismissed = (): DismissState => {
  const raw = readLS(DISMISS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DismissState;
  } catch {
    return null;
  }
};

export const setDismissed = (v: DismissState) => {
  if (v === null) writeLS(DISMISS_KEY, "");
  else writeLS(DISMISS_KEY, JSON.stringify(v));
};

export const isMutedAllToday = (): boolean => readLS(MUTE_ALL_KEY) === dateKey(new Date());

export const setMuteAllToday = (on: boolean) => writeLS(MUTE_ALL_KEY, on ? dateKey(new Date()) : "");
