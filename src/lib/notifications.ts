import { enforceNotificationBudget, REMINDER_DAYS_AHEAD } from "@/lib/notification-budget";
// Local device notifications via @capacitor/local-notifications.

export type Reminder = {
  id: number;
  label: string;
  hour: number;
  minute: number;
  enabled: boolean;
  /** Morning/evening only: use a fixed clock time instead of following Fajr/Asr. */
  customTime?: boolean;
};

export type NotificationPrefs = {
  reminders: Reminder[];
  nextId: number;
};

const PREFS_KEY = "adhkar:notifications";
/** Fixed Hifz review reminder: lives in the same list as the other reminders, off until turned on. */
export const HIFZ_REMINDER_ID = 900;
const HIFZ_DEFAULT: Reminder = { id: HIFZ_REMINDER_ID, label: "Hifz review", hour: 19, minute: 0, enabled: false };
const withHifz = (p: NotificationPrefs): NotificationPrefs =>
  p.reminders.some((r) => r.id === HIFZ_REMINDER_ID) ? p : { ...p, reminders: [...p.reminders, HIFZ_DEFAULT] };

const defaults: NotificationPrefs = {
  reminders: [
    { id: 1, label: "Morning Adhkar", hour: 6, minute: 0, enabled: true },
    { id: 2, label: "Evening Adhkar", hour: 16, minute: 30, enabled: true },
  ],
  nextId: 3,
};

type LegacyReminder = { enabled?: boolean; hour?: number; minute?: number };
type LegacyPrefs = {
  morning?: LegacyReminder;
  evening?: LegacyReminder;
  nudge?: LegacyReminder;
  reminders?: Reminder[];
  nextId?: number;
};

const migrate = (parsed: LegacyPrefs): NotificationPrefs => {
  if (Array.isArray(parsed.reminders)) {
    const reminders = parsed.reminders.filter(
      (r) => r && typeof r.id === "number" && typeof r.hour === "number",
    );
    const maxId = reminders.reduce((m, r) => Math.max(m, r.id), 0);
    return {
      reminders,
      nextId: Math.max(parsed.nextId ?? 0, maxId + 1, 1),
    };
  }
  // Migrate legacy morning/evening/nudge shape.
  const legacy: Array<[string, LegacyReminder | undefined, number, number]> = [
    ["Morning Adhkar", parsed.morning, 6, 0],
    ["Evening Adhkar", parsed.evening, 16, 30],
    ["Gentle nudge", parsed.nudge, 20, 0],
  ];
  const reminders: Reminder[] = [];
  let idCounter = 1;
  for (const [label, r, defH, defM] of legacy) {
    if (!r) continue;
    reminders.push({
      id: idCounter++,
      label,
      hour: typeof r.hour === "number" ? r.hour : defH,
      minute: typeof r.minute === "number" ? r.minute : defM,
      enabled: r.enabled === true,
    });
  }
  if (reminders.length === 0) return defaults;
  return { reminders, nextId: idCounter };
};

export const getNotificationPrefs = (): NotificationPrefs => {
  if (typeof window === "undefined") return withHifz(defaults);
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return withHifz(defaults);
    return withHifz(migrate(JSON.parse(raw) as LegacyPrefs));
  } catch {
    return withHifz(defaults);
  }
};

export const setNotificationPrefs = (p: NotificationPrefs) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(p));
};

type CapPlugins = { LocalNotifications?: any };
type CapWindow = {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    getPlatform?: () => string;
    Plugins?: CapPlugins;
  };
};

const cap = () => (typeof window === "undefined" ? undefined : (window as unknown as CapWindow).Capacitor);

export const getPlatform = (): string => {
  try {
    return cap()?.getPlatform?.() ?? "web";
  } catch {
    return "web";
  }
};

export const isNativePlatform = (): boolean => {
  const c = cap();
  if (!c) return false;
  try {
    if (c.isNativePlatform?.() === true) return true;
  } catch {
    // ignore
  }
  const p = getPlatform();
  return p === "ios" || p === "android";
};

let pluginCache: any = null;

/**
 * Resolve the LocalNotifications plugin.
 * Prefer the runtime bridge injected by the native wrapper (window.Capacitor.Plugins),
 * which exists even when the npm module was not bundled into this build.
 */
const loadPlugin = async (): Promise<any> => {
  if (pluginCache) return pluginCache;
  if (!isNativePlatform()) return null;
  const bridge = cap()?.Plugins?.LocalNotifications;
  if (bridge) {
    pluginCache = bridge;
    return bridge;
  }
  try {
    const mod = await import("@capacitor/local-notifications");
    pluginCache = mod?.LocalNotifications ?? null;
    return pluginCache;
  } catch (e) {
    console.error("[notifications] plugin import failed", e);
    return null;
  }
};

const ANDROID_CHANNEL = "adhkar-reminders";

let channelReady = false;
const ensureChannel = async (plugin: any) => {
  if (channelReady || getPlatform() !== "android") return;
  try {
    await plugin.createChannel?.({
      id: ANDROID_CHANNEL,
      name: "Adhkar reminders",
      description: "Daily adhkar reminders",
      importance: 5,
      visibility: 1,

    });
  } catch (e) {
    console.warn("[notifications] createChannel failed", e);
  }
  channelReady = true;
};

/** Shared with the adhan scheduler so both use the same plugin resolution. */
export const loadNotificationPlugin = loadPlugin;
export const ensureNotificationChannel = ensureChannel;
export const NOTIFICATION_CHANNEL = ANDROID_CHANNEL;


export type PermissionResult =
  | { granted: true; adhanPrompted?: boolean }
  | { granted: false; reason: "unavailable" | "denied" | "error"; error?: string };

const ADHAN_PERMISSION_SYNC_KEY = "adhkar:notification-adhan-prompted:v2";
export const ADHAN_PROMPT_PENDING_KEY = "adhkar:adhan-prompt-pending";
export const ADHAN_PROMPT_EVENT = "adhkar:ask-enable-adhan";

/** Offered once as soon as a prayer location is saved on Salah. */
export const offerAdhanPrompt = async (): Promise<void> => {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(ADHAN_PERMISSION_SYNC_KEY) === "1") return;
  window.localStorage.setItem(ADHAN_PERMISSION_SYNC_KEY, "1");
  const { getAdhanPrefs } = await import("@/lib/adhan-bridge");
  if (Object.values(getAdhanPrefs().enabledPrayers).every(Boolean)) return;
  window.localStorage.setItem(ADHAN_PROMPT_PENDING_KEY, "1");
  window.dispatchEvent(new Event(ADHAN_PROMPT_EVENT));
};

/** First observed grant asks once whether to turn on adhan; nothing is auto-enabled. */
const syncGrantedPrayerAlerts = async (): Promise<boolean> => {
  if (window.localStorage.getItem(ADHAN_PERMISSION_SYNC_KEY) === "1") return false;
  window.localStorage.setItem(ADHAN_PERMISSION_SYNC_KEY, "1");
  const { getAdhanPrefs } = await import("@/lib/adhan-bridge");
  if (Object.values(getAdhanPrefs().enabledPrayers).every(Boolean)) return false;
  window.localStorage.setItem(ADHAN_PROMPT_PENDING_KEY, "1");
  window.dispatchEvent(new Event(ADHAN_PROMPT_EVENT));
  return true;
};

export const requestNotificationPermission = async (): Promise<PermissionResult> => {
  if (!isNativePlatform()) {
    return { granted: false, reason: "unavailable", error: "Not running in the native app" };
  }
  const plugin = await loadPlugin();
  if (!plugin) {
    return { granted: false, reason: "unavailable", error: "LocalNotifications plugin missing from this build" };
  }
  try {
    const current = await plugin.checkPermissions?.().catch(() => null);
    if (current?.display === "granted") {
      const adhanPrompted = await syncGrantedPrayerAlerts();
      return adhanPrompted ? { granted: true, adhanPrompted: true } : { granted: true };
    }
    if (current?.display) window.localStorage.removeItem(ADHAN_PERMISSION_SYNC_KEY);
    const res = await plugin.requestPermissions();
    if (res?.display === "granted") {
      const adhanPrompted = await syncGrantedPrayerAlerts();
      return adhanPrompted ? { granted: true, adhanPrompted: true } : { granted: true };
    }
    return { granted: false, reason: "denied", error: `Permission ${res?.display ?? "unknown"}` };
  } catch (e) {
    console.error("[notifications] requestPermissions failed", e);
    return { granted: false, reason: "error", error: (e as Error)?.message ?? "Unknown error" };
  }
};

const withTimeout = <T,>(p: Promise<T>, ms: number, fallback: T): Promise<T> =>
  new Promise<T>((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        resolve(fallback);
      }
    }, ms);
    p.then((v) => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve(v);
      }
    }).catch(() => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve(fallback);
      }
    });
  });

export const checkNotificationPermission = async (): Promise<boolean> => {
  const plugin = await withTimeout(loadPlugin(), 4000, null);
  if (!plugin) return false;
  try {
    const res = await withTimeout<any>(plugin.checkPermissions(), 4000, null);
    if (res?.display === "granted") await syncGrantedPrayerAlerts();
    else if (res?.display) window.localStorage.removeItem(ADHAN_PERMISSION_SYNC_KEY);
    return res?.display === "granted";
  } catch {
    return false;
  }
};

/** Next occurrence of hour:minute, today if still ahead, otherwise tomorrow. */
const nextOccurrence = (hour: number, minute: number): Date => {
  const now = new Date();
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  if (d.getTime() <= now.getTime() + 1000) d.setDate(d.getDate() + 1);
  return d;
};

export type ActionResult = { ok: true } | { ok: false; error: string };

/** How many future days each reminder is pre-scheduled for. */
const DAYS_AHEAD = REMINDER_DAYS_AHEAD;
/** Derived notification ids for a reminder: id*1000 + dayOffset. */
const idsFor = (reminderId: number) =>
  Array.from({ length: DAYS_AHEAD }, (_, i) => reminderId * 1000 + i);

/** Last schedule payload passed to the plugin, for diagnostics. */
let lastSchedule: { at: string; count: number; ids: number[]; label: string } | null = null;
export const getLastSchedule = () => lastSchedule;


/** Notification ids that are currently scheduled on the device. */
export const getScheduledIds = async (): Promise<number[]> => {
  const plugin = await loadPlugin();
  if (!plugin) return [];
  try {
    const res = await plugin.getPending();
    return (res?.notifications ?? []).map((n: { id: number }) => n.id);
  } catch {
    return [];
  }
};

export const getDiagnostics = async (): Promise<string> => {
  const platform = getPlatform();
  if (!isNativePlatform()) return `Platform: ${platform} (reminders need the installed app)`;
  const plugin = await loadPlugin();
  if (!plugin) return `Platform: ${platform}, plugin: missing`;
  let perm = "unknown";
  try {
    perm = (await plugin.checkPermissions())?.display ?? "unknown";
  } catch {
    // ignore
  }
  const pending = await getScheduledIds();
  const last = lastSchedule
    ? ` | last: "${lastSchedule.label}" at ${lastSchedule.at} (${lastSchedule.count} slots, ids ${lastSchedule.ids[0]}..${lastSchedule.ids[lastSchedule.ids.length - 1]})`
    : "";
  return `Platform: ${platform}, permission: ${perm}, pending: ${pending.length}${last}`;
};

export const cancelReminder = async (id: number): Promise<void> => {
  const plugin = await loadPlugin();
  if (!plugin) return;
  try {
    await plugin.cancel({
      notifications: [{ id }, ...idsFor(id).map((n) => ({ id: n }))],
    });
  } catch {
    // ignore
  }
};

export const scheduleReminder = async (r: Reminder, firstAt?: Date): Promise<ActionResult> => {
  if (!isNativePlatform()) return { ok: false, error: "Not running in the native app" };
  const plugin = await loadPlugin();
  if (!plugin) return { ok: false, error: "Notifications plugin is missing from this build." };
  if (r.id === HIFZ_REMINDER_ID) {
    await rescheduleHifzReminder();
    return { ok: true };
  }
  if (!firstAt) {
    const smart = await import("@/lib/smart-notifications");
    if (smart.usesPrayerTimes(r)) {
      // Morning/evening follow Fajr and Asr once a location is known.
      await cancelReminder(r.id);
      await smart.rescheduleSmartAdhkar();
      return { ok: true };
    }
  }
  try {
    await ensureChannel(plugin);
    await cancelReminder(r.id);
    if (r.id === 1 || r.id === 2) {
      // Clear or rebuild the prayer-time-based schedule for this reminder.
      const smart = await import("@/lib/smart-notifications");
      await smart.rescheduleSmartAdhkar();
    }

    const first = firstAt ?? nextOccurrence(r.hour, r.minute);
    const ids = idsFor(r.id);
    const notifications = ids.map((id, i) => {
      const at = new Date(first.getTime());
      at.setDate(at.getDate() + i);
      return {
        id,
        title: r.label || "Adhkar reminder",
        body: `Time for ${r.label || "your adhkar"}.`,
        schedule: { at, allowWhileIdle: true },
        channelId: ANDROID_CHANNEL,
        extra: { route: r.id === 1 ? "/app/" : r.id === 2 ? "/app/evening" : "/app/more" },
      };
    });

    lastSchedule = {
      at: first.toLocaleString(),
      count: notifications.length,
      ids,
      label: r.label || "Adhkar reminder",
    };
    console.log(
      "[notifications] schedule payload",
      JSON.stringify(
        notifications.map((n) => ({ ...n, schedule: { ...n.schedule, at: n.schedule.at.toISOString() } })),
        null,
        2,
      ),
    );

    await plugin.schedule({ notifications });
    const pending = await getScheduledIds();
    console.log("[notifications] pending after schedule:", pending.length, pending);
    return { ok: true };
  } catch (e) {
    console.error("[notifications] scheduleReminder failed", e);
    return { ok: false, error: (e as Error)?.message ?? "Could not schedule this reminder." };
  }
};

/** Debug helper: schedules through the exact reminder code path, 60s from now. */
export const scheduleOneMinuteTest = async (): Promise<ActionResult> => {
  const t = new Date(Date.now() + 60_000);
  return scheduleReminder(
    { id: 995, label: "1 minute test", hour: t.getHours(), minute: t.getMinutes(), enabled: true },
    t,
  );
};

export const applyReminders = async (prefs: NotificationPrefs): Promise<void> => {
  if (!isNativePlatform()) return;
  for (const r of prefs.reminders) {
    if (r.enabled) {
      await scheduleReminder(r);
    } else {
      await cancelReminder(r.id);
    }
  }
  const smart = await import("@/lib/smart-notifications");
  await smart.rescheduleSmartAdhkar();
  await enforceBudget();
};

/** Keep the whole app under iOS's 64 pending notifications; prayer alerts are never cut. */
export const enforceBudget = async (): Promise<void> => {
  const plugin = await loadPlugin();
  if (!plugin) return;
  const { isPrayerNotifId } = await import("@/lib/adhan-notifications");
  await enforceNotificationBudget(plugin, (id) => isPrayerNotifId(id) || id === JUMUAH_NOTIF_ID);
};

/** Hifz reminder: dynamic "X reviews due" bodies, re-planned on every app open and after each Hifz session change. */
export const rescheduleHifzReminder = async (): Promise<void> => {
  if (typeof window === "undefined" || !isNativePlatform()) return;
  const plugin = await loadPlugin();
  if (!plugin) return;
  await cancelReminder(HIFZ_REMINDER_ID);
  const r = getNotificationPrefs().reminders.find((x) => x.id === HIFZ_REMINDER_ID);
  if (!r?.enabled) return;
  const perm = await plugin.checkPermissions?.().catch(() => null);
  if (perm && perm.display !== "granted") return;
  await ensureChannel(plugin);
  const [{ hifzReminderNotes, hifzTodayDone }, { loadHifz }] = await Promise.all([import("@/lib/hifz/reminder"), import("@/lib/hifz/store")]);
  const notes = hifzReminderNotes(loadHifz(), new Date(), r.hour, r.minute, hifzTodayDone());
  const notifications = notes.map((n, i) => ({
    id: HIFZ_REMINDER_ID * 1000 + i,
    title: "Hifz",
    body: n.body,
    schedule: { at: n.at, allowWhileIdle: true },
    channelId: ANDROID_CHANNEL,
    extra: { route: "/app/hifz/today" },
  }));
  if (notifications.length) {
    try { await plugin.schedule({ notifications }); } catch (e) { console.error("[hifz] reminder schedule failed", e); }
  }
  await enforceBudget();
};


/* ---- Jumu'ah (Friday) notification ---- */

export const JUMUAH_NOTIF_ID = 880001;
const K_JUMUAH_ENABLED = "adhkar:jumuah-notification";
/** Friday in the Capacitor Weekday enum (Sunday = 1). */
const WEEKDAY_FRIDAY = 6;
const JUMUAH_HOUR = 7;
const JUMUAH_MINUTE = 0;

export const getJumuahNotificationEnabled = (): boolean => {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(K_JUMUAH_ENABLED) !== "0";
};

export const setJumuahNotificationEnabled = (on: boolean) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(K_JUMUAH_ENABLED, on ? "1" : "0");
};

export const cancelJumuahNotification = async (): Promise<void> => {
  const plugin = await loadPlugin();
  if (!plugin) return;
  try {
    await plugin.cancel({ notifications: [{ id: JUMUAH_NOTIF_ID }] });
  } catch {
    // ignore
  }
};

/** Weekly repeating notification on Friday at 07:00 local time. */
export const scheduleJumuahNotification = async (): Promise<ActionResult> => {
  if (!isNativePlatform()) return { ok: false, error: "Not running in the native app" };
  const plugin = await loadPlugin();
  if (!plugin) return { ok: false, error: "Notifications plugin is missing from this build." };
  try {
    await ensureChannel(plugin);
    await cancelJumuahNotification();
    await plugin.schedule({
      notifications: [
        {
          id: JUMUAH_NOTIF_ID,
          title: "Sahih Al-Adhkar",
          body: "It's Jumu'ah — come learn the sunnahs of Jumu'ah.",
          schedule: {
            on: { weekday: WEEKDAY_FRIDAY, hour: JUMUAH_HOUR, minute: JUMUAH_MINUTE },
            every: "week",
            repeats: true,
            allowWhileIdle: true,
          },
          channelId: ANDROID_CHANNEL,
          extra: { route: "/app/more?open=dua-library&section=jumuah" },
        },
      ],
    });
    return { ok: true };
  } catch (e) {
    console.error("[notifications] jumuah schedule failed", e);
    return { ok: false, error: (e as Error)?.message ?? "Could not schedule the Friday reminder." };
  }
};


/** Fires whenever the user taps a delivered local notification. */
export const registerNotificationTapHandler = (
  onAction: (id: number | undefined, route: string | undefined) => void,
): void => {
  void (async () => {
    const plugin = await loadPlugin();
    if (!plugin?.addListener) return;
    try {
      await plugin.addListener("localNotificationActionPerformed", (e: any) => {
        const id = Number(e?.notification?.id);
        const route = e?.notification?.extra?.route;
        onAction(Number.isFinite(id) ? id : undefined, typeof route === "string" ? route : undefined);
      });
    } catch (e) {
      console.warn("[notifications] tap listener failed", e);
    }
  })();
};
