// Local device notifications via @capacitor/local-notifications.
// Uses a dynamic import so the app still builds on web where the plugin
// is not installed / not available. All native calls are wrapped in
// try/catch and gated behind a platform check.

export type ReminderId = "morning" | "evening";

export type Reminder = {
  enabled: boolean;
  hour: number; // 0-23
  minute: number; // 0-59
};

export type NotificationPrefs = {
  morning: Reminder;
  evening: Reminder;
};

const PREFS_KEY = "adhkar:notifications";

const NOTIF_IDS: Record<ReminderId, number> = {
  morning: 1,
  evening: 2,
};

const NOTIF_COPY: Record<ReminderId, { title: string; body: string }> = {
  morning: { title: "Morning Adhkar", body: "Time for your morning adhkar." },
  evening: { title: "Evening Adhkar", body: "Time for your evening adhkar." },
};

const defaults: NotificationPrefs = {
  morning: { enabled: false, hour: 6, minute: 0 },
  evening: { enabled: false, hour: 16, minute: 30 },
};

export const getNotificationPrefs = (): NotificationPrefs => {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;
    return {
      morning: { ...defaults.morning, ...(parsed.morning ?? {}) },
      evening: { ...defaults.evening, ...(parsed.evening ?? {}) },
    };
  } catch {
    return defaults;
  }
};

export const setNotificationPrefs = (p: NotificationPrefs) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(p));
};

// Native detection --------------------------------------------------

type CapWindow = {
  Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string };
};

export const isNativePlatform = (): boolean => {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as CapWindow).Capacitor;
  return cap?.isNativePlatform?.() === true;
};

// Load the plugin at runtime only. Using a variable module name +
// @vite-ignore prevents Vite from trying to bundle it on web.
const loadPlugin = async (): Promise<any> => {
  if (!isNativePlatform()) return null;
  try {
    const modName = "@capacitor/local-notifications";
    const mod: any = await import(/* @vite-ignore */ modName).catch(() => null);
    return mod?.LocalNotifications ?? null;
  } catch {
    return null;
  }
};

// Permissions -------------------------------------------------------

export const requestNotificationPermission = async (): Promise<boolean> => {
  const plugin = await loadPlugin();
  if (!plugin) return false;
  try {
    const res = await plugin.requestPermissions();
    return res?.display === "granted";
  } catch {
    return false;
  }
};

export const checkNotificationPermission = async (): Promise<boolean> => {
  const plugin = await loadPlugin();
  if (!plugin) return false;
  try {
    const res = await plugin.checkPermissions();
    return res?.display === "granted";
  } catch {
    return false;
  }
};

// Scheduling --------------------------------------------------------

export const cancelReminder = async (id: ReminderId): Promise<void> => {
  const plugin = await loadPlugin();
  if (!plugin) return;
  try {
    await plugin.cancel({ notifications: [{ id: NOTIF_IDS[id] }] });
  } catch {
    // ignore
  }
};

export const scheduleReminder = async (
  id: ReminderId,
  hour: number,
  minute: number,
): Promise<boolean> => {
  const plugin = await loadPlugin();
  if (!plugin) return false;
  try {
    // Cancel any existing schedule with this ID before re-scheduling so
    // there are never duplicates.
    await plugin.cancel({ notifications: [{ id: NOTIF_IDS[id] }] }).catch(() => {});
    const copy = NOTIF_COPY[id];
    await plugin.schedule({
      notifications: [
        {
          id: NOTIF_IDS[id],
          title: copy.title,
          body: copy.body,
          schedule: {
            on: { hour, minute },
            repeats: true,
            allowWhileIdle: true,
          },
          smallIcon: "ic_stat_icon_config_sample",
        },
      ],
    });
    return true;
  } catch (e) {
    console.error("scheduleReminder failed", e);
    return false;
  }
};

// Apply the whole prefs object: schedule what's enabled, cancel what isn't.
export const applyReminders = async (prefs: NotificationPrefs): Promise<void> => {
  if (!isNativePlatform()) return;
  for (const key of ["morning", "evening"] as ReminderId[]) {
    const r = prefs[key];
    if (r.enabled) {
      await scheduleReminder(key, r.hour, r.minute);
    } else {
      await cancelReminder(key);
    }
  }
};
