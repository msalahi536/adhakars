/**
 * adhan-bridge.ts
 * Bridges the web app to the native AdhanPlugin (Capacitor) for iOS.
 * Handles per-salah adhan notifications: scheduling, preferences, audio control.
 * Auto-detects Capacitor and silently no-ops on web.
 */

// --------------- Types ---------------

export interface AdhanPrefs {
  soundMode: "adhan" | "silent" | "default";
  reciterId: string;
  fajrReciterId: string;
  enabledPrayers: Record<string, boolean>;
}

export interface AdhanDiagnostics {
  enabledPrayers: Record<string, boolean>;
  soundMode: string;
  reciterId: string;
  pendingNotifications: Array<{
    id: string;
    title: string;
    prayer: string;
    triggerType?: string;
    triggerDate?: string;
    triggerInterval?: number;
  }>;
  pendingCount: number;
  authorizationStatus: string;
  alertSetting: string;
  soundSetting: string;
  notificationCenterSetting: string;
  lockScreenSetting: string;
}

interface AdhanPluginInterface {
  schedulePrayerNotifications(opts: {
    prayerTimes: { name: string; time: number; test?: boolean }[];
  }): Promise<{ scheduled: string[]; skipped?: Array<{ prayer: string; reason: string }> }>;
  cancelAllPrayerNotifications(): Promise<void>;
  updatePreferences(opts: Partial<AdhanPrefs>): Promise<AdhanPrefs>;
  getPreferences(): Promise<AdhanPrefs>;
  stopAdhan(): Promise<void>;
  isAdhanPlaying(): Promise<{ playing: boolean }>;
}

export interface Reciter {
  id: string;
  name: string;
  origin: string;
}

// --------------- Available Reciters ---------------

export const RECITERS: Reciter[] = [
  { id: "mishary", name: "Mishary Rashid Al Afasy", origin: "Kuwait" },
  { id: "basit", name: "Abdul Basit Abdul Samad", origin: "Egypt" },
  { id: "makkah", name: "Makkah Adhan", origin: "Masjid al-Haram" },
  { id: "madinah", name: "Madinah Adhan", origin: "Masjid an-Nabawi" },
  { id: "zaili", name: "Abdullah Al Zaili", origin: "Saudi Arabia" },
  { id: "majale", name: "Hamza Al Majale", origin: "Saudi Arabia" },
  { id: "qatami", name: "Nasir Al-Qatami", origin: "Saudi Arabia" },
];

export const FAJR_RECITERS: Reciter[] = [
  { id: "fajr-mishary", name: "Mishary Rashid Alafasy", origin: "Kuwait" },
  { id: "fajr-madinah", name: "Madinah Fajr Adhan", origin: "Masjid an-Nabawi" },
];

const PRAYER_NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;

// --------------- Local Storage ---------------

const ADHAN_PREFS_KEY = "adhkar:adhanPrefs";

const DEFAULT_PREFS: AdhanPrefs = {
  soundMode: "adhan",
  reciterId: "mishary",
  fajrReciterId: "fajr-mishary",
  enabledPrayers: {
    Fajr: false,
    Dhuhr: false,
    Asr: false,
    Maghrib: false,
    Isha: false,
  },
};

/** Get adhan prefs from localStorage (mirrors native UserDefaults) */
export function getAdhanPrefs(): AdhanPrefs {
  if (typeof window === "undefined") return { ...DEFAULT_PREFS };
  try {
    const raw = localStorage.getItem(ADHAN_PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw);
    return {
      soundMode: parsed.soundMode ?? DEFAULT_PREFS.soundMode,
      reciterId: parsed.reciterId ?? DEFAULT_PREFS.reciterId,
      fajrReciterId: parsed.fajrReciterId ?? DEFAULT_PREFS.fajrReciterId,
      enabledPrayers: { ...DEFAULT_PREFS.enabledPrayers, ...(parsed.enabledPrayers ?? {}) },
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

/** Save adhan prefs to localStorage and sync to native plugin */
export async function setAdhanPrefs(prefs: AdhanPrefs): Promise<void> {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADHAN_PREFS_KEY, JSON.stringify(prefs));
  window.dispatchEvent(new Event("adhkar:adhan-prefs-update"));

  // Sync to native
  const plugin = getAdhanPlugin();
  if (plugin) {
    try {
      await plugin.updatePreferences(prefs);
    } catch (err) {
      console.warn("[AdhanBridge] Failed to sync prefs to native:", err);
    }
  }
}

// --------------- Capacitor Plugin Access ---------------

function isCapacitor(): boolean {
  return typeof window !== "undefined" && !!(window as any).Capacitor?.isNativePlatform?.();
}

function getAdhanPlugin(): AdhanPluginInterface | null {
  if (!isCapacitor()) return null;
  try {
    return (window as any).Capacitor.Plugins.AdhanNotifications as AdhanPluginInterface;
  } catch {
    return null;
  }
}

// --------------- Prayer Time Fetching ---------------

/** Parse "HH:mm" or "HH:mm (TZName)" into a Date for a given base date */
function parseTimeForDate(timeStr: string, baseDate: Date): Date {
  const clean = timeStr.replace(/\s*\(.*?\)/, "").trim();
  const [h, m] = clean.split(":").map(Number);
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  return d;
}

interface PrayerTimesResponse {
  data: {
    timings: Record<string, string>;
  };
}

/**
 * Fetch prayer times for a specific date from Al-Adhan API and return as
 * { name, time } with `time` as ms-since-epoch timestamps.
 */
async function fetchPrayerTimesForDate(
  date: Date,
  lat: number,
  lon: number,
  method = 2,
): Promise<{ name: string; time: number }[]> {
  try {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    const url = `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${lat}&longitude=${lon}&method=${method}`;
    const res = await fetch(url);
    const json: PrayerTimesResponse = await res.json();
    const timings = json.data.timings;

    return PRAYER_NAMES.map((name) => ({
      name,
      time: parseTimeForDate(timings[name], date).getTime(), // ms since epoch
    }));
  } catch (err) {
    console.warn("[AdhanBridge] Failed to fetch prayer times:", err);
    return [];
  }
}

/**
 * Fetch today's AND tomorrow's prayer times.
 * The native plugin skips times that already passed, so including tomorrow
 * ensures prayers like Fajr get scheduled even if the app opens in the afternoon.
 */
async function fetchPrayerTimestamps(
  lat: number,
  lon: number,
  method = 2,
): Promise<{ name: string; time: number }[]> {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayTimes, tomorrowTimes] = await Promise.all([
    fetchPrayerTimesForDate(today, lat, lon, method),
    fetchPrayerTimesForDate(tomorrow, lat, lon, method),
  ]);

  // Combine: today's future prayers + all of tomorrow's prayers.
  // The native plugin filters out past times, so duplicates are safe.
  const now = Date.now();
  const futureTodayTimes = todayTimes.filter((p) => p.time > now);

  console.log(`[AdhanBridge] Today future prayers: ${futureTodayTimes.map(p => p.name).join(", ") || "none"}`);
  console.log(`[AdhanBridge] Tomorrow prayers: ${tomorrowTimes.map(p => p.name).join(", ")}`);

  return [...futureTodayTimes, ...tomorrowTimes];
}

// --------------- Public API ---------------

/**
 * Schedule today's adhan notifications based on current prefs and location.
 * Call this after prefs change, on app init, and when the app returns to foreground.
 */
export async function scheduleAdhanNotifications(): Promise<string[]> {
  const plugin = getAdhanPlugin();
  if (!plugin) return [];

  const prefs = getAdhanPrefs();

  // Check if any prayer is enabled
  const anyEnabled = Object.values(prefs.enabledPrayers).some((v) => v);
  if (!anyEnabled) {
    // Cancel any existing ones
    try {
      await plugin.cancelAllPrayerNotifications();
    } catch {}
    return [];
  }

  // Get location
  const { lat, lon } = await getLocation();

  // Get calculation method
  let method = 2;
  try {
    const stored = localStorage.getItem("prayerCalcMethod");
    if (stored) method = parseInt(stored, 10) || 2;
  } catch {}

  // Fetch prayer times
  const prayerTimes = await fetchPrayerTimestamps(lat, lon, method);
  if (prayerTimes.length === 0) return [];

  try {
    const result = await plugin.schedulePrayerNotifications({ prayerTimes });
    console.log("[AdhanBridge] Scheduled:", result.scheduled);
    return result.scheduled;
  } catch (err) {
    console.warn("[AdhanBridge] Schedule error:", err);
    return [];
  }
}

/** Cancel all prayer notifications */
export async function cancelAdhanNotifications(): Promise<void> {
  const plugin = getAdhanPlugin();
  if (!plugin) return;
  try {
    await plugin.cancelAllPrayerNotifications();
  } catch (err) {
    console.warn("[AdhanBridge] Cancel error:", err);
  }
}

/** Stop currently playing adhan audio */
export async function stopAdhan(): Promise<void> {
  const plugin = getAdhanPlugin();
  if (!plugin) return;
  try {
    await plugin.stopAdhan();
  } catch (err) {
    console.warn("[AdhanBridge] Stop adhan error:", err);
  }
}

/** Check if adhan is currently playing */
export async function isAdhanPlaying(): Promise<boolean> {
  const plugin = getAdhanPlugin();
  if (!plugin) return false;
  try {
    const result = await plugin.isAdhanPlaying();
    return result.playing;
  } catch {
    return false;
  }
}

/**
 * Toggle a specific prayer's notification on/off.
 * Saves prefs and reschedules.
 */
export async function togglePrayerNotification(prayer: string, enabled: boolean): Promise<void> {
  const prefs = getAdhanPrefs();
  prefs.enabledPrayers[prayer] = enabled;
  await setAdhanPrefs(prefs);
  await scheduleAdhanNotifications();
}

/** Change the sound mode and reschedule */
export async function setSoundMode(mode: "adhan" | "silent" | "default"): Promise<void> {
  const prefs = getAdhanPrefs();
  prefs.soundMode = mode;
  await setAdhanPrefs(prefs);
  await scheduleAdhanNotifications();
}

/** Change the reciter and reschedule */
export async function setReciter(reciterId: string): Promise<void> {
  const prefs = getAdhanPrefs();
  prefs.reciterId = reciterId;
  await setAdhanPrefs(prefs);
  await scheduleAdhanNotifications();
}

// --------------- Location Helper ---------------

async function getLocation(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ lat: 21.4225, lon: 39.8262 }); // Makkah fallback
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve({ lat: 21.4225, lon: 39.8262 }),
      { timeout: 10000, enableHighAccuracy: false },
    );
  });
}

// --------------- Test & Diagnostics ---------------

/**
 * Test a SPECIFIC prayer's adhan notification (e.g., "Fajr", "Dhuhr").
 * Fires in 5 seconds, bypasses the enabledPrayers check.
 * Uses the current reciter and sound mode settings.
 */
export async function testPrayerNotification(prayer: string): Promise<{
  success: boolean;
  prayer?: string;
  error?: string;
}> {
  const plugin = getAdhanPlugin();
  if (!plugin) return { success: false, error: "Plugin not available" };
  try {
    const result = await plugin.testPrayerNotification({ prayer });
    console.log(`[AdhanBridge] Test ${prayer} result:`, result);
    return result;
  } catch (err) {
    console.warn(`[AdhanBridge] Test ${prayer} error:`, err);
    return { success: false, error: String(err) };
  }
}

/**
 * Get full diagnostics from the native plugin.
 */
export async function getDiagnostics(): Promise<AdhanDiagnostics | null> {
  const plugin = getAdhanPlugin();
  if (!plugin) return null;
  try {
    const diag = await plugin.getDiagnostics();
    console.log("[AdhanBridge] Diagnostics:", JSON.stringify(diag, null, 2));
    return diag;
  } catch (err) {
    console.warn("[AdhanBridge] Diagnostics error:", err);
    return null;
  }
}

// --------------- Adhan Playing Listener ---------------

/**
 * Listen for the native 'adhan:playing' event dispatched by AppDelegate
 * when the user taps a notification and the full adhan starts playing.
 */
export function onAdhanPlaying(callback: (prayer: string) => void): () => void {
  const handler = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    callback(detail?.prayer ?? "");
  };
  window.addEventListener("adhan:playing", handler);
  return () => window.removeEventListener("adhan:playing", handler);
}

// --------------- Init ---------------

/**
 * Initialize adhan notifications. Call from initNativeBridge() or app init.
 * Schedules today's notifications if any prayers are enabled.
 */
export function initAdhanBridge(): void {
  if (!isCapacitor()) return;

  console.log("[AdhanBridge] Initializing");

  // Schedule on init
  scheduleAdhanNotifications();

  // Re-schedule when app comes back to foreground (prayer times may have changed)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      scheduleAdhanNotifications();
    }
  });

  // Listen for pref changes from other parts of the app
  window.addEventListener("adhkar:adhan-prefs-update", () => {
    scheduleAdhanNotifications();
  });
}
