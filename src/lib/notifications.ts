// Local device notifications via @capacitor/local-notifications.

export type Reminder = {
  id: number;
  label: string;
  hour: number;
  minute: number;
  enabled: boolean;
};

export type NotificationPrefs = {
  reminders: Reminder[];
  nextId: number;
};

const PREFS_KEY = "adhkar:notifications";

const defaults: NotificationPrefs = {
  reminders: [
    { id: 1, label: "Morning Adhkar", hour: 6, minute: 0, enabled: false },
    { id: 2, label: "Evening Adhkar", hour: 16, minute: 30, enabled: false },
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
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return defaults;
    return migrate(JSON.parse(raw) as LegacyPrefs);
  } catch {
    return defaults;
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

export type PermissionResult =
  | { granted: true }
  | { granted: false; reason: "unavailable" | "denied" | "error"; error?: string };

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
    if (current?.display === "granted") return { granted: true };
    const res = await plugin.requestPermissions();
    if (res?.display === "granted") return { granted: true };
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

/** Fires a notification a few seconds from now so the user can verify setup. */
export const sendTestNotification = async (): Promise<ActionResult> => {
  if (!isNativePlatform()) {
    return { ok: false, error: "Test notifications only work in the installed app." };
  }
  const plugin = await loadPlugin();
  if (!plugin) return { ok: false, error: "Notifications plugin is missing from this build." };
  try {
    const perm = await plugin.checkPermissions?.().catch(() => null);
    if (perm && perm.display !== "granted") {
      const asked = await plugin.requestPermissions();
      if (asked?.display !== "granted") {
        return { ok: false, error: "Notification permission is not granted." };
      }
    }
    await ensureChannel(plugin);
    await plugin.schedule({
      notifications: [
        {
          id: 999,
          title: "Sahih Al-Adhkar",
          body: "Test reminder. Notifications are working.",
          schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true },
          channelId: ANDROID_CHANNEL,
        },
      ],
    });
    return { ok: true };
  } catch (e) {
    console.error("[notifications] test failed", e);
    return { ok: false, error: (e as Error)?.message ?? "Could not schedule the test notification." };
  }
};

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
  return `Platform: ${platform}, permission: ${perm}, scheduled: ${pending.length}`;
};

export const cancelReminder = async (id: number): Promise<void> => {
  const plugin = await loadPlugin();
  if (!plugin) return;
  try {
    await plugin.cancel({ notifications: [{ id }] });
  } catch {
    // ignore
  }
};

export const scheduleReminder = async (r: Reminder): Promise<ActionResult> => {
  if (!isNativePlatform()) return { ok: false, error: "Not running in the native app" };
  const plugin = await loadPlugin();
  if (!plugin) return { ok: false, error: "Notifications plugin is missing from this build." };
  try {
    await ensureChannel(plugin);
    try {
      await plugin.cancel({ notifications: [{ id: r.id }] });
    } catch {
      // ignore
    }
    await plugin.schedule({
      notifications: [
        {
          id: r.id,
          title: r.label || "Adhkar reminder",
          body: `Time for ${r.label || "your adhkar"}.`,
          schedule: {
            at: nextOccurrence(r.hour, r.minute),
            repeats: true,
            every: "day",
            allowWhileIdle: true,
          },
          channelId: ANDROID_CHANNEL,
        },
      ],
    });
    return { ok: true };
  } catch (e) {
    console.error("[notifications] scheduleReminder failed", e);
    return { ok: false, error: (e as Error)?.message ?? "Could not schedule this reminder." };
  }
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
};
