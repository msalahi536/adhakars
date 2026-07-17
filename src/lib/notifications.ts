// Local device notifications via @capacitor/local-notifications.

import { isDayComplete } from "@/lib/storage";

export type ReminderId = "morning" | "evening" | "nudge";

export type Reminder = {
  enabled: boolean;
  hour: number;
  minute: number;
};

export type NotificationPrefs = {
  morning: Reminder;
  evening: Reminder;
  nudge: Reminder;
};

const PREFS_KEY = "adhkar:notifications";

const NOTIF_IDS: Record<ReminderId, number> = {
  morning: 1,
  evening: 2,
  nudge: 3,
};

const NOTIF_COPY: Record<ReminderId, { title: string; body: string }> = {
  morning: { title: "Morning Adhkar", body: "Time for your morning adhkar." },
  evening: { title: "Evening Adhkar", body: "Time for your evening adhkar." },
  nudge: { title: "Sahih Al-Adhkar", body: "Your adhkar are still waiting. There is still time today." },
};

const defaults: NotificationPrefs = {
  morning: { enabled: false, hour: 6, minute: 0 },
  evening: { enabled: false, hour: 16, minute: 30 },
  nudge: { enabled: false, hour: 20, minute: 0 },
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
      nudge: { ...defaults.nudge, ...(parsed.nudge ?? {}) },
    };
  } catch {
    return defaults;
  }
};

export const setNotificationPrefs = (p: NotificationPrefs) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(p));
};

type CapWindow = {
  Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string };
};

export const isNativePlatform = (): boolean => {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as CapWindow).Capacitor;
  return cap?.isNativePlatform?.() === true;
};

const loadPlugin = async (): Promise<any> => {
  if (!isNativePlatform()) return null;
  try {
    const mod = await import("@capacitor/local-notifications");
    return mod?.LocalNotifications ?? null;
  } catch {
    return null;
  }
};

export type PermissionResult =
  | { granted: true }
  | { granted: false; reason: "unavailable" | "denied" | "error"; error?: string };

export const requestNotificationPermission = async (): Promise<PermissionResult> => {
  if (!isNativePlatform()) {
    return { granted: false, reason: "unavailable", error: "Not running in native app" };
  }
  let plugin: any;
  try {
    const mod = await import("@capacitor/local-notifications");
    plugin = mod?.LocalNotifications;
  } catch (e) {
    console.error("Notification permission error:", e);
    return { granted: false, reason: "unavailable", error: (e as Error)?.message ?? "Plugin unavailable" };
  }
  if (!plugin) {
    return { granted: false, reason: "unavailable", error: "LocalNotifications plugin missing" };
  }
  try {
    const res = await plugin.requestPermissions();
    if (res?.display === "granted") return { granted: true };
    return { granted: false, reason: "denied", error: `Permission ${res?.display ?? "unknown"}` };
  } catch (e) {
    console.error("Notification permission error:", e);
    return { granted: false, reason: "error", error: (e as Error)?.message ?? "Unknown error" };
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

export const applyReminders = async (prefs: NotificationPrefs): Promise<void> => {
  if (!isNativePlatform()) return;
  for (const key of ["morning", "evening", "nudge"] as ReminderId[]) {
    const r = prefs[key];
    if (r.enabled) {
      // For nudge: only keep scheduled while day is incomplete.
      if (key === "nudge" && isDayComplete()) {
        await cancelReminder(key);
        continue;
      }
      await scheduleReminder(key, r.hour, r.minute);
    } else {
      await cancelReminder(key);
    }
  }
};
