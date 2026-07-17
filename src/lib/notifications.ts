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

export const cancelReminder = async (id: number): Promise<void> => {
  const plugin = await loadPlugin();
  if (!plugin) return;
  try {
    await plugin.cancel({ notifications: [{ id }] });
  } catch {
    // ignore
  }
};

export const scheduleReminder = async (r: Reminder): Promise<boolean> => {
  const plugin = await loadPlugin();
  if (!plugin) return false;
  try {
    await plugin.cancel({ notifications: [{ id: r.id }] }).catch(() => {});
    await plugin.schedule({
      notifications: [
        {
          id: r.id,
          title: r.label || "Adhkar reminder",
          body: `Time for ${r.label || "your adhkar"}.`,
          schedule: {
            on: { hour: r.hour, minute: r.minute },
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
  for (const r of prefs.reminders) {
    if (r.enabled) {
      await scheduleReminder(r);
    } else {
      await cancelReminder(r.id);
    }
  }
};
