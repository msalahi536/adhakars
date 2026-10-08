/**
 * native-bridge.ts
 * Bridges the web app to native iOS widgets via Capacitor.
 * Auto-detects if running inside Capacitor and silently no-ops on web.
 *
 * Handles:
 *  - Passing user location to widgets (for prayer times)
 *  - Widget data sync (tasbih count, theme)
 */

import { registerPlugin } from "@capacitor/core";
import { getPrayerSettings, fetchDay } from "@/lib/prayer-times";

export interface AdhanPluginInterface {
  playFullAdhan(options: { reciterId: string; prayer: string }): Promise<void>;
  playShortAdhan(options: { reciterId: string; prayer: string }): Promise<void>;
  stopAdhan(): Promise<void>;
  pauseAdhan(): Promise<void>;
  resumeAdhan(): Promise<void>;
  seekAdhan(options: { position: number }): Promise<void>;
  getAdhanStatus(): Promise<{
    playing: boolean;
    paused: boolean;
    currentTime: number;
    duration: number;
  }>;
  isPlaying(): Promise<{ playing: boolean }>;
}

/** Native Android adhan player (foreground service). */
export const AdhanPlugin = registerPlugin<AdhanPluginInterface>("AdhanPlugin");

interface CapacitorPlugin {
  updateLocation(opts: { latitude: number; longitude: number; method: number; school: 0 | 1 }): Promise<void>;
  syncPrayerTimes(opts: { times: { id: string; hour: number; minute: number }[] }): Promise<void>;
  updateTasbih(opts: { count: number; target: number; phrase: string }): Promise<void>;
  updateTheme(opts: { theme: string }): Promise<void>;
  reloadWidgets(): Promise<void>;
}

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

// --------------- Location ---------------

let cachedLat = 0;
let cachedLon = 0;

async function getLocation(): Promise<{ lat: number; lon: number } | null> {
  if (cachedLat !== 0 && cachedLon !== 0) {
    return { lat: cachedLat, lon: cachedLon };
  }
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        cachedLat = pos.coords.latitude;
        cachedLon = pos.coords.longitude;
        resolve({ lat: cachedLat, lon: cachedLon });
      },
      () => resolve(null),
      { timeout: 10000, enableHighAccuracy: false },
    );
  });
}

// --------------- Widget Data Sync ---------------

let locationSyncVersion = 0;

export async function syncLocationToWidgets() {
  const plugin = getPlugin();
  if (!plugin) return;

  const version = ++locationSyncVersion;
  const settings = getPrayerSettings();
  const saved = settings.location;
  const location = saved
    ? { lat: saved.lat, lon: saved.lng }
    : await getLocation();
  // A settings change during a GPS request must not restore the older fix.
  if (!location || version !== locationSyncVersion) return;
  const { lat, lon } = location;

  try {
    await plugin.updateLocation({
      latitude: lat,
      longitude: lon,
      method: settings.method,
      school: settings.hanafi ? 1 : 0,
    });
    // Do NOT call reloadWidgets() here — updateLocation clears cached
    // times, so a reload now would force the widget into its API fallback.
    const today = await fetchDay(new Date(), settings);
    if (today) {
      await syncPrayerTimesToWidgets(today.times);
    } else {
      await plugin.reloadWidgets();
    }
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

/**
 * Syncs the exact prayer times the app calculated to the native widget layer.
 * Call this after prayer times are fetched so widgets show identical times.
 * Accepts times as minutes-from-midnight (the format fetchDay returns).
 */
export async function syncPrayerTimesToWidgets(times: Record<string, number>) {
  const plugin = getPlugin();
  if (!plugin) return;

  const entries = Object.entries(times)
    .filter(([id]) => id !== "sunrise") // widgets don't show sunrise
    .map(([id, mins]) => ({
      id: id.charAt(0).toUpperCase() + id.slice(1), // "fajr" → "Fajr"
      hour: Math.floor(mins / 60) % 24,
      minute: mins % 60,
    }));

  try {
    await plugin.syncPrayerTimes({ times: entries });
  } catch (err) {
    console.warn("[NativeBridge] Prayer times sync error:", err);
  }
}

export async function syncTasbihToWidget(count: number, target: number, phrase = "SubhanAllah") {
  const plugin = getPlugin();
  if (!plugin) return;
  try {
    await plugin.updateTasbih({ count, target, phrase });
  } catch {}
}

// --------------- Init ---------------

let initialized = false;

export function initNativeBridge() {
  if (initialized || !isCapacitor()) return;
  initialized = true;

  syncLocationToWidgets();
  syncThemeToWidgets();

  // setPrayerSettings emits this after persisting every Salah settings change.
  window.addEventListener("adhkar:prayer-settings", () => {
    void syncLocationToWidgets();
  });

  window.addEventListener("storage", (e) => {
    if (e.key === "theme") syncThemeToWidgets();
    if (e.key === "adhkar:prayer-settings" || e.key === null) {
      void syncLocationToWidgets();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") syncLocationToWidgets();
  });
}
