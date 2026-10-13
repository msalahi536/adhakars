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
import { getPrayerSettings } from "@/lib/prayer-times";

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
  updateLocation(opts: { latitude: number; longitude: number; method: number; school: 0 | 1; source: "aladhan" | "jakim" }): Promise<void>;
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

const AdhkarWidgetsPlugin = registerPlugin<CapacitorPlugin>("AdhkarWidgets");

function getPlugin(): CapacitorPlugin | null {
  if (!isCapacitor()) return null;
  return AdhkarWidgetsPlugin;
}

// --------------- Widget Data Sync ---------------

let locationSyncVersion = 0;

export async function syncLocationToWidgets() {
  const plugin = getPlugin();
  if (!plugin) return;

  const version = ++locationSyncVersion;
  const settings = getPrayerSettings();
  const saved = settings.location;
  // Never acquire GPS here: Salah owns permission and persists its fix.
  if (!saved || version !== locationSyncVersion) return;
  const { lat, lng: lon } = saved;

  try {
    await plugin.updateLocation({
      latitude: lat,
      longitude: lon,
      method: settings.method,
      school: settings.hanafi ? 1 : 0,
      source: settings.source ?? "aladhan",
    });
    // Widgets fetch their own times from the selected API for the location
    // just handed over, so they only need a refresh nudge here.
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
