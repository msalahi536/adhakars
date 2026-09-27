/**
 * native-bridge.ts
 * Bridges the web app to native iOS features via Capacitor.
 * Auto-detects if running inside Capacitor and silently no-ops on web.
 *
 * Handles:
 *  - Passing user location to widgets (for prayer times)
 *  - Optional Prayer Countdown Live Activity
 *  - Optional Tasbih Active Session Live Activity
 *  - Optional Fasting Timer Live Activity
 *  - Widget data sync (tasbih count, theme)
 *
 * All Live Activities are controlled by user preferences stored in localStorage.
 */

// --------------- Types ---------------

interface CapacitorPlugin {
  updateLocation(opts: { latitude: number; longitude: number; method: number }): Promise<void>;
  updateTasbih(opts: { count: number; target: number; phrase: string }): Promise<void>;
  updateTheme(opts: { theme: string }): Promise<void>;
  reloadWidgets(): Promise<void>;
  startPrayerCountdown(opts: {
    prayerName: string;
    prayerTime: number;
    nextPrayerName?: string;
    nextPrayerTime?: number;
  }): Promise<void>;
  updatePrayerCountdown(opts: {
    prayerName: string;
    prayerTime: number;
    nextPrayerName?: string;
    nextPrayerTime?: number;
  }): Promise<void>;
  endPrayerCountdown(): Promise<void>;
  startFastingTimer(opts: {
    phase: string;
    targetTime: number;
    targetLabel?: string;
    fajrTime?: number;
    maghribTime?: number;
  }): Promise<void>;
  endFastingTimer(): Promise<void>;
  startActiveSession(opts: {
    sessionType: string;
    phrase: string;
    count: number;
    target: number;
  }): Promise<void>;
  updateActiveSession(opts: {
    sessionType: string;
    phrase: string;
    count: number;
    target: number;
  }): Promise<void>;
  endActiveSession(): Promise<void>;
}

interface PrayerTimesResponse {
  data: {
    timings: Record<string, string>;
    date: { readable: string };
  };
}

const PRAYER_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;

// --------------- Live Activity Preferences ---------------

const LA_PREFS_KEY = "liveActivityPrefs";

export interface LiveActivityPrefs {
  prayerCountdown: boolean;
  tasbihSession: boolean;
  fastingTimer: boolean;
}

const DEFAULT_LA_PREFS: LiveActivityPrefs = {
  prayerCountdown: false,
  tasbihSession: false,
  fastingTimer: false,
};

export function getLiveActivityPrefs(): LiveActivityPrefs {
  if (typeof window === "undefined") return { ...DEFAULT_LA_PREFS };
  try {
    const raw = localStorage.getItem(LA_PREFS_KEY);
    if (!raw) return { ...DEFAULT_LA_PREFS };
    return { ...DEFAULT_LA_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_LA_PREFS };
  }
}

export function setLiveActivityPrefs(prefs: LiveActivityPrefs) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LA_PREFS_KEY, JSON.stringify(prefs));
  window.dispatchEvent(new Event("adhkar:la-prefs-update"));
}

export function onLiveActivityToggle(key: keyof LiveActivityPrefs, enabled: boolean) {
  const prefs = getLiveActivityPrefs();
  prefs[key] = enabled;
  setLiveActivityPrefs(prefs);

  if (key === "prayerCountdown") {
    if (enabled) {
      startPrayerCountdownLoop();
    } else {
      stopPrayerCountdownLoop();
    }
  }
}

// --------------- Helpers ---------------

function isCapacitor(): boolean {
  return typeof window !== "undefined" && !!(window as any).Capacitor?.isNativePlatform?.();
}

export function isNativeApp(): boolean {
  return isCapacitor();
}

function getPlugin(): CapacitorPlugin | null {
  if (!isCapacitor()) return null;
  try {
    return (window as any).Capacitor.Plugins.AdhkarWidgets as CapacitorPlugin;
  } catch {
    return null;
  }
}

function parseTimeToday(timeStr: string): Date {
  const clean = timeStr.replace(/\s*\(.*?\)/, "").trim();
  const [h, m] = clean.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

// --------------- Location ---------------

let cachedLat = 0;
let cachedLon = 0;

async function getLocation(): Promise<{ lat: number; lon: number }> {
  if (cachedLat !== 0 && cachedLon !== 0) {
    return { lat: cachedLat, lon: cachedLon };
  }
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: 21.4225, lon: 39.8262 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        cachedLat = pos.coords.latitude;
        cachedLon = pos.coords.longitude;
        resolve({ lat: cachedLat, lon: cachedLon });
      },
      () => {
        resolve({ lat: 21.4225, lon: 39.8262 });
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  });
}

// --------------- Prayer Times ---------------

let prayerTimesCache: { name: string; time: Date }[] = [];
let prayerTimesFetchedDate = "";

async function fetchPrayerTimes(lat: number, lon: number): Promise<{ name: string; time: Date }[]> {
  const today = new Date().toDateString();
  if (prayerTimesFetchedDate === today && prayerTimesCache.length > 0) {
    return prayerTimesCache;
  }

  try {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const url = `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${lat}&longitude=${lon}&method=2`;
    const res = await fetch(url);
    const json: PrayerTimesResponse = await res.json();
    const timings = json.data.timings;

    prayerTimesCache = PRAYER_ORDER.map((name) => ({
      name,
      time: parseTimeToday(timings[name]),
    }));
    prayerTimesFetchedDate = today;
    return prayerTimesCache;
  } catch (err) {
    console.warn("[NativeBridge] Failed to fetch prayer times:", err);
    return [];
  }
}

// --------------- Prayer Countdown Live Activity ---------------

let prayerCountdownActive = false;
let prayerCheckInterval: ReturnType<typeof setInterval> | null = null;

async function startPrayerCountdown() {
  const prefs = getLiveActivityPrefs();
  if (!prefs.prayerCountdown) return;

  const plugin = getPlugin();
  if (!plugin) return;

  const { lat, lon } = await getLocation();
  const prayers = await fetchPrayerTimes(lat, lon);
  if (prayers.length === 0) return;

  const now = new Date();
  const nextIdx = prayers.findIndex((p) => p.time > now);

  if (nextIdx === -1) {
    if (prayerCountdownActive) {
      plugin.endPrayerCountdown().catch(() => {});
      prayerCountdownActive = false;
    }
    return;
  }

  const current = prayers[nextIdx];
  const after = nextIdx + 1 < prayers.length ? prayers[nextIdx + 1] : undefined;

  const opts: any = {
    prayerName: current.name,
    prayerTime: current.time.getTime(),
  };
  if (after) {
    opts.nextPrayerName = after.name;
    opts.nextPrayerTime = after.time.getTime();
  }

  try {
    if (prayerCountdownActive) {
      await plugin.updatePrayerCountdown(opts);
    } else {
      await plugin.startPrayerCountdown(opts);
      prayerCountdownActive = true;
    }
  } catch (err) {
    console.warn("[NativeBridge] Prayer countdown error:", err);
  }
}

function startPrayerCountdownLoop() {
  const prefs = getLiveActivityPrefs();
  if (!prefs.prayerCountdown) return;

  startPrayerCountdown();
  if (prayerCheckInterval) clearInterval(prayerCheckInterval);
  prayerCheckInterval = setInterval(startPrayerCountdown, 60_000);
}

function stopPrayerCountdownLoop() {
  if (prayerCheckInterval) {
    clearInterval(prayerCheckInterval);
    prayerCheckInterval = null;
  }
  const plugin = getPlugin();
  if (plugin && prayerCountdownActive) {
    plugin.endPrayerCountdown().catch(() => {});
    prayerCountdownActive = false;
  }
}

// --------------- Widget Data Sync ---------------

async function syncLocationToWidgets() {
  const plugin = getPlugin();
  if (!plugin) return;

  const { lat, lon } = await getLocation();

  let method = 2;
  try {
    const stored = localStorage.getItem("prayerCalcMethod");
    if (stored) method = parseInt(stored, 10) || 2;
  } catch {}

  try {
    await plugin.updateLocation({ latitude: lat, longitude: lon, method });
    await plugin.reloadWidgets();
  } catch (err) {
    console.warn("[NativeBridge] Location sync error:", err);
  }
}

async function syncThemeToWidgets() {
  const plugin = getPlugin();
  if (!plugin) return;

  let theme = "system";
  try {
    theme = localStorage.getItem("theme") || "system";
  } catch {}

  try {
    await plugin.updateTheme({ theme });
  } catch (err) {
    console.warn("[NativeBridge] Theme sync error:", err);
  }
}

// --------------- Tasbih Active Session ---------------

let activeSessionRunning = false;

export async function startTasbihSession(count: number, target: number, phrase = "SubhanAllah") {
  const prefs = getLiveActivityPrefs();
  if (!prefs.tasbihSession) return;

  const plugin = getPlugin();
  if (!plugin) return;

  try {
    await plugin.startActiveSession({
      sessionType: "tasbih",
      phrase,
      count,
      target,
    });
    activeSessionRunning = true;
  } catch (err) {
    console.warn("[NativeBridge] Start tasbih session error:", err);
  }
}

export async function updateTasbihSession(count: number, target: number, phrase = "SubhanAllah") {
  const prefs = getLiveActivityPrefs();
  const plugin = getPlugin();
  if (!plugin) return;

  try {
    await plugin.updateTasbih({ count, target, phrase });
  } catch {}

  if (!prefs.tasbihSession) return;

  try {
    if (activeSessionRunning) {
      await plugin.updateActiveSession({
        sessionType: "tasbih",
        phrase,
        count,
        target,
      });
    } else {
      await startTasbihSession(count, target, phrase);
    }
  } catch (err) {
    console.warn("[NativeBridge] Update tasbih session error:", err);
  }
}

export async function endTasbihSession() {
  const plugin = getPlugin();
  if (!plugin || !activeSessionRunning) return;

  try {
    await plugin.endActiveSession();
    activeSessionRunning = false;
  } catch (err) {
    console.warn("[NativeBridge] End tasbih session error:", err);
  }
}

// --------------- Fasting Timer ---------------

export async function startFastingLiveActivity(opts: {
  phase: string;
  targetTime: number;
  targetLabel?: string;
  fajrTime?: number;
  maghribTime?: number;
}) {
  const prefs = getLiveActivityPrefs();
  if (!prefs.fastingTimer) return;

  const plugin = getPlugin();
  if (!plugin) return;

  try {
    await plugin.startFastingTimer(opts);
  } catch (err) {
    console.warn("[NativeBridge] Start fasting timer error:", err);
  }
}

export async function endFastingLiveActivity() {
  const plugin = getPlugin();
  if (!plugin) return;

  try {
    await plugin.endFastingTimer();
  } catch (err) {
    console.warn("[NativeBridge] End fasting timer error:", err);
  }
}

// --------------- Init ---------------

let initialized = false;

export function initNativeBridge() {
  if (initialized || !isCapacitor()) return;
  initialized = true;

  console.log("[NativeBridge] Initializing on native platform");

  syncLocationToWidgets();
  syncThemeToWidgets();

  const prefs = getLiveActivityPrefs();
  if (prefs.prayerCountdown) {
    startPrayerCountdownLoop();
  }

  window.addEventListener("storage", (e) => {
    if (e.key === "theme") syncThemeToWidgets();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      syncLocationToWidgets();
      const currentPrefs = getLiveActivityPrefs();
      if (currentPrefs.prayerCountdown) {
        startPrayerCountdown();
      }
    }
  });
}

