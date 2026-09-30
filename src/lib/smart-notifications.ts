// Prayer-aware adhkar reminders, Sunnah of the day, and Period Companion
// notifications. All local, rescheduled whenever the app opens.

import {
  ensureNotificationChannel,
  getNotificationPrefs,
  isNativePlatform,
  loadNotificationPlugin,
  NOTIFICATION_CHANNEL,
} from "@/lib/notifications";
import { addDays, dateKey, fetchDay, getPrayerSettings, slotsForDay } from "@/lib/prayer-times";
import { addK, getCycles, getStats, openCycle, parseK, todayK } from "@/lib/period";
import { getConsistency } from "@/lib/storage";

type N = Record<string, unknown>;
const MIN = 60_000;
const DAYS = 3;

const ready = async () => {
  if (!isNativePlatform()) return null;
  const plugin = await loadNotificationPlugin();
  if (!plugin) return null;
  try {
    const perm = await plugin.checkPermissions?.().catch(() => null);
    if (perm && perm.display !== "granted") return null;
  } catch {
    return null;
  }
  await ensureNotificationChannel(plugin);
  return plugin;
};

const cancel = async (plugin: any, ids: number[]) => {
  try {
    await plugin.cancel({ notifications: ids.map((id) => ({ id })) });
  } catch {
    // ignore
  }
};

const schedule = async (plugin: any, list: N[], tag: string) => {
  if (!list.length) return;
  try {
    await plugin.schedule({ notifications: list });
  } catch (e) {
    console.error(`[${tag}] schedule failed`, e);
  }
};

const note = (id: number, title: string, body: string, at: Date, route = "/app/more"): N => ({
  id,
  title,
  body,
  schedule: { at, allowWhileIdle: true },
  channelId: NOTIFICATION_CHANNEL,
  extra: { route },
});

/* ---------------- Prayer-aware adhkar reminders ---------------- */

export const SMART_BASE = { morning: 7100, morningLate: 7200, evening: 7300, eveningLate: 7400 };
const SMART_IDS = Object.values(SMART_BASE).flatMap((b) => Array.from({ length: DAYS }, (_, i) => b + i));
export const isSmartAdhkarId = (id: number) => SMART_IDS.includes(id);
export const smartAdhkarKind = (id: number): "morning" | "evening" =>
  id >= SMART_BASE.evening ? "evening" : "morning";

const K_OPENED = (kind: "morning" | "evening") => `adhkar:opened:${kind}`;

/** Morning/evening reminders (ids 1 and 2) follow prayer times once a location is known. */
export const usesPrayerTimes = (r: { id: number; customTime?: boolean }) =>
  (r.id === 1 || r.id === 2) && !r.customTime && !!getPrayerSettings().location;

/** Call when the user opens morning/evening adhkar; drops today's follow-up. */
export const markAdhkarOpened = (kind: "morning" | "evening") => {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(K_OPENED(kind)) === dateKey(new Date())) return;
  localStorage.setItem(K_OPENED(kind), dateKey(new Date()));
  void rescheduleSmartAdhkar();
};

const openedToday = (kind: "morning" | "evening") =>
  typeof window !== "undefined" && localStorage.getItem(K_OPENED(kind)) === dateKey(new Date());

export const rescheduleSmartAdhkar = async (): Promise<void> => {
  const plugin = await ready();
  if (!plugin) return;
  await cancel(plugin, SMART_IDS);
  const settings = getPrayerSettings();
  if (!settings.location) return;
  const prefs = getNotificationPrefs();
  const morning = prefs.reminders.find((r) => r.id === 1);
  const evening = prefs.reminders.find((r) => r.id === 2);
  const morningOn = morning?.enabled && !morning.customTime;
  const eveningOn = evening?.enabled && !evening.customTime;
  if (!morningOn && !eveningOn) return;

  const now = new Date();
  const out: N[] = [];
  for (let i = 0; i < DAYS; i++) {
    const day = await fetchDay(addDays(now, i), settings);
    if (!day) continue;
    const at = (id: string) => slotsForDay(day).find((s) => s.id === id)?.at;
    const fajr = at("fajr");
    const dhuhr = at("dhuhr");
    const asr = at("asr");
    const maghrib = at("maghrib");
    const add = (id: number, title: string, body: string, when?: Date) => {
      if (when && when.getTime() > now.getTime() + 30_000)
        out.push(note(id, title, body, when, smartAdhkarKind(id) === "evening" ? "/app/evening" : "/app/"));
    };
    if (morningOn) {
      if (fajr) add(SMART_BASE.morning + i, "Morning Adhkar", "Start your day with the morning adhkar.", new Date(fajr.getTime() + 5 * MIN));
      if (dhuhr && !(i === 0 && openedToday("morning")))
        add(SMART_BASE.morningLate + i, "Morning Adhkar", "There is still time to read your morning adhkar before Dhuhr.", new Date(dhuhr.getTime() - 60 * MIN));
    }
    if (eveningOn) {
      if (asr) add(SMART_BASE.evening + i, "Evening Adhkar", "It's time for your evening adhkar.", new Date(asr.getTime() + 5 * MIN));
      if (maghrib && !(i === 0 && openedToday("evening")))
        add(SMART_BASE.eveningLate + i, "Evening Adhkar", "Maghrib is in 30 minutes. Read your evening adhkar before it comes in.", new Date(maghrib.getTime() - 30 * MIN));
    }
  }
  await schedule(plugin, out, "smart-adhkar");
};

/* ---------------- Sunnah of the day ---------------- */

export const SUNNAH_NOTIF_ID = 881001;
const K_SUNNAH_NOTIF = "adhkar:sunnah-notification";

export const getSunnahNotificationEnabled = () =>
  typeof window === "undefined" || localStorage.getItem(K_SUNNAH_NOTIF) !== "0";

export const setSunnahNotificationEnabled = (on: boolean) => {
  localStorage.setItem(K_SUNNAH_NOTIF, on ? "1" : "0");
  void rescheduleSunnahNotification();
};

export const rescheduleSunnahNotification = async (): Promise<void> => {
  const plugin = await ready();
  if (!plugin) return;
  await cancel(plugin, [SUNNAH_NOTIF_ID]);
  if (!getSunnahNotificationEnabled()) return;
  await schedule(
    plugin,
    [
      {
        id: SUNNAH_NOTIF_ID,
        title: "Sunnah of the day",
        body: "Today's Sunnah is ready. Revive it and earn its reward.",
        schedule: { on: { hour: 9, minute: 0 }, repeats: true, allowWhileIdle: true },
        channelId: NOTIFICATION_CHANNEL,
        extra: { route: "/app/more?open=sunnah-of-the-day" },
      },
    ],
    "sunnah",
  );
};

/* ---------------- Period Companion ---------------- */

export const PERIOD_IDS = Array.from({ length: 20 }, (_, i) => 9500 + i);
export const isPeriodNotifId = (id: number) => id >= 9500 && id < 9520;
const K_PERIOD_NOTIF = "period:notifications";
const K_START_TARGET = "period:notification-start-target";
const K_END_SENT = "period:notified-end";

export const getPeriodNotificationsEnabled = () =>
  typeof window === "undefined" || localStorage.getItem(K_PERIOD_NOTIF) !== "0";

export const setPeriodNotificationsEnabled = (on: boolean) => {
  localStorage.setItem(K_PERIOD_NOTIF, on ? "1" : "0");
  void reschedulePeriodNotifications();
};

const DURING = [
  "You can't pray today, but you can talk to Allah anytime. He's always listening.",
  "SubhanAllah, Alhamdulillah, La ilaha illAllah, Allahu Akbar. No wudu needed, no restrictions.",
  "Aisha (RA) used to recline in the Prophet's ﷺ lap and recite dhikr during her period. Closeness to Allah doesn't pause.",
  "Dua is worship. Pour your heart out today.",
];
const PMS = [
  "Feeling off? The Prophet ﷺ said: \"No fatigue, nor disease, nor anxiety... afflicts a Muslim, even the prick of a thorn, but Allah expiates some of his sins for that.\" (Bukhari 5641)",
  "Be gentle with yourself today. Rest is not laziness.",
];

const atHour = (k: string, h: number) => {
  const d = parseK(k);
  d.setHours(h, 0, 0, 0);
  return d;
};

export const reschedulePeriodNotifications = async (): Promise<void> => {
  void rescheduleFertilityNotifications();
  const plugin = await ready();
  if (!plugin) return;
  await cancel(plugin, PERIOD_IDS);
  if (!getPeriodNotificationsEnabled() || getCycles().length === 0) return;

  const now = new Date();
  const today = todayK();
  const stats = getStats();
  const open = openCycle();
  const out: N[] = [];
  let n = 0;
  const add = (body: string, at: Date) => {
    if (n >= PERIOD_IDS.length || at.getTime() <= now.getTime() + 2000) return;
    out.push(note(PERIOD_IDS[n++], "Period Companion", body, at, "/app/more?open=period-companion"));
  };

  // Day 1: keep a durable target so an app refresh cannot cancel and lose the
  // reminder before it is delivered. Seven minutes stays within the promised
  // 5–10 minute window.
  if (open && open.start === today) {
    let target: { start: string; at: number } | null = null;
    try {
      target = JSON.parse(localStorage.getItem(K_START_TARGET) || "null") as { start: string; at: number } | null;
    } catch {
      target = null;
    }
    if (!target || target.start !== open.start) {
      target = { start: open.start, at: now.getTime() + 7 * MIN };
      localStorage.setItem(K_START_TARGET, JSON.stringify(target));
    }
    add(
      "Your period has started. Salah and fasting are paused, but dhikr, dua, and reciting Quran are all open to you.",
      new Date(target.at),
    );
  }

  if (open) {
    const day = Math.round((parseK(today).getTime() - parseK(open.start).getTime()) / 86400000);
    // Gentle daily messages for the rest of the expected period.
    for (let d = Math.max(day + 1, 1); d < stats.avgPeriod - 1; d++) {
      add(DURING[d % DURING.length], atHour(addK(open.start, d), 10));
    }
    add("Your period may be ending soon. Watch for your sign of purity so you can perform ghusl and resume prayer.", atHour(addK(open.start, stats.avgPeriod - 1), 10));
  } else {
    const last = getCycles().at(-1);
    if (last?.end && last.end >= addK(today, -1) && localStorage.getItem(K_END_SENT) !== last.end) {
      localStorage.setItem(K_END_SENT, last.end);
      add("Welcome back to salah. If you missed fasts during Ramadan, you can start making them up when you're ready.", atHour(addK(last.end, 1), 8));
    }
    if (stats.nextStart) {
      const ns = stats.nextStart;
      add(PMS[0], atHour(addK(ns, -4), 11));
      add(PMS[1], atHour(addK(ns, -3), 11));
      add("Your period may start soon. A good time to make up any missed fasts before it begins.", atHour(addK(ns, -2), 10));
      add("Period expected tomorrow. Remember, this is from Allah's decree for the daughters of Adam (Bukhari 294).", atHour(addK(ns, -1), 10));
    }
  }
  await schedule(plugin, out, "period");
};

/* ---------------- Streak reminders ---------------- */

export const STREAK_RISK_ID = 882001;
export const STREAK_MILESTONE_ID = 882002;
const K_STREAK_NOTIF = "adhkar:streak-notification";
const K_STREAK_CELEBRATED = "adhkar:streak-celebrated";
const MILESTONES = [7, 30, 100, 365];

export const getStreakNotificationsEnabled = () =>
  typeof window === "undefined" || localStorage.getItem(K_STREAK_NOTIF) !== "0";

export const setStreakNotificationsEnabled = (on: boolean) => {
  localStorage.setItem(K_STREAK_NOTIF, on ? "1" : "0");
  void rescheduleStreakNotifications();
};

export const rescheduleStreakNotifications = async (): Promise<void> => {
  const plugin = await ready();
  if (!plugin) return;
  await cancel(plugin, [STREAK_RISK_ID, STREAK_MILESTONE_ID]);
  if (!getStreakNotificationsEnabled()) return;

  const c = getConsistency();
  const now = new Date();
  const out: N[] = [];

  // Milestone celebration, once per milestone.
  const celebrated = new Set(
    (localStorage.getItem(K_STREAK_CELEBRATED) || "").split(",").filter(Boolean),
  );
  const hit = MILESTONES.find((m) => c.current >= m && !celebrated.has(String(m)));
  if (hit) {
    celebrated.add(String(hit));
    localStorage.setItem(K_STREAK_CELEBRATED, [...celebrated].join(","));
    out.push(
      note(
        STREAK_MILESTONE_ID,
        "MashaAllah!",
        `${hit} days of remembrance in a row. May Allah keep you steadfast.`,
        new Date(now.getTime() + 3000),
      ),
    );
  }

  // Streak at risk: a streak is going but today isn't complete yet.
  const today = c.days[c.days.length - 1];
  if (c.current > 0 && today?.status !== "complete") {
    const at = new Date(now);
    at.setHours(20, 0, 0, 0);
    if (at.getTime() <= now.getTime() + MIN) at.setDate(at.getDate() + 1);
    out.push(
      note(
        STREAK_RISK_ID,
        "Don't break your streak",
        `You're on a ${c.current}-day streak. A few minutes of dhikr keeps it going.`,
        at,
      ),
    );
  }
  await schedule(plugin, out, "streak");
};

/** Everything in this file, for app open. */
export const rescheduleSmartNotifications = async () => {
  await rescheduleSmartAdhkar();
  await rescheduleSunnahNotification();
  await reschedulePeriodNotifications();
  await rescheduleStreakNotifications();
};

/* ---------------- 5-second test notifications ---------------- */

const TEST_SUNNAH_ID = 889001;

/** Fires the Sunnah-of-the-day notification 5 seconds from now, for testing. */
export const sendTestSunnahNotification = async (): Promise<boolean> => {
  const plugin = await ready();
  if (!plugin) return false;
  await schedule(
    plugin,
    [note(TEST_SUNNAH_ID, "Sunnah of the day", "Today's Sunnah is ready. Revive it and earn its reward.", new Date(Date.now() + 5000), "/app/more?open=sunnah-of-the-day")],
    "sunnah-test",
  );
  return true;
};

/** Fires a morning or evening adhkar reminder 5 seconds from now, for testing. */
export const sendTestAdhkarNotification = async (kind: "morning" | "evening"): Promise<boolean> => {
  const plugin = await ready();
  if (!plugin) return false;
  const title = kind === "morning" ? "Morning Adhkar" : "Evening Adhkar";
  const body =
    kind === "morning"
      ? "Start your day with the morning adhkar."
      : "It's time for your evening adhkar.";
  await schedule(
    plugin,
    [note(kind === "morning" ? 889003 : 889004, title, body, new Date(Date.now() + 5000), kind === "evening" ? "/app/evening" : "/app/")],
    "adhkar-test",
  );
  return true;
};

/** Fires a Period Companion notification 5 seconds from now, for testing. */
export const sendTestPeriodNotification = async (): Promise<boolean> => {
  const plugin = await ready();
  if (!plugin) return false;
  await schedule(
    plugin,
    [note(889005, "Period Companion", DURING[0], new Date(Date.now() + 5000), "/app/more?open=period-companion")],
    "period-test",
  );
  return true;
};

/** Fires a streak reminder notification 5 seconds from now, for testing. */
export const sendTestStreakNotification = async (): Promise<boolean> => {
  const plugin = await ready();
  if (!plugin) return false;
  const c = getConsistency();
  await schedule(
    plugin,
    [
      note(
        889006,
        "Don't break your streak",
        `You're on a ${c.current}-day streak. A few minutes of dhikr keeps it going.`,
        new Date(Date.now() + 5000),
      ),
    ],
    "streak-test",
  );
  return true;
};

/* ---------------- Fertility alerts (opt-in) ---------------- */
export const FERTILITY_IDS = Array.from({ length: 12 }, (_, i) => 9530 + i);
export const rescheduleFertilityNotifications = async (): Promise<void> => {
  const plugin = await ready();
  if (!plugin) return;
  await cancel(plugin, FERTILITY_IDS);
  const { getFertilitySettings, getFertility } = await import("@/lib/period");
  const s = getFertilitySettings();
  const info = getFertility();
  if (!s.enabled || !s.alerts || info.status !== "ok") return;
  const now = Date.now();
  const today = todayK();
  const out: N[] = [];
  let n = 0;
  for (const ov of info.ovulations) {
    if (ov < today) continue;
    const items: [string, string, string][] = [
      [addK(ov, -5), "A Reminder", "Your fertile window is estimated to begin today based on your cycle history."],
      [addK(ov, -2), "Gentle Reminder", "You are entering your estimated peak fertility days."],
      [ov, "Today's Note", "Estimated ovulation day. Remember the dua before intimacy."],
    ];
    for (const [day, title, body] of items) {
      const at = atHour(day, 9);
      if (at.getTime() > now + 2000 && n < FERTILITY_IDS.length) out.push(note(FERTILITY_IDS[n++], title, body, at, "/app/more?open=period-companion"));
    }
    if (n >= 6) break;
  }
  await schedule(plugin, out, "fertility");
};
