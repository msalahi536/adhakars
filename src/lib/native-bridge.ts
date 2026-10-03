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
  updateLocation(opts: { latitude: number; longitude: number; method: number }): Promise<void>;
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
      () => resolve({ lat: 21.4225, lon: 39.8262 }),
      { timeout: 10000, enableHighAccuracy: false },
    );
  });
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

  window.addEventListener("storage", (e) => {
    if (e.key === "theme") syncThemeToWidgets();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") syncLocationToWidgets();
  });
}
