// adhan-bridge.ts
// Bridges the web app to native adhan playback (Capacitor).
// Native iOS plays the full adhan when a prayer notification is tapped
// (notification sounds are capped at 30 seconds) and dispatches the
// "adhan:playing" event so the app can show the floating player.
// Silently no-ops on web.

import { isNativeApp } from "@/lib/native-bridge";

export const ADHAN_PLAYING_EVENT = "adhan:playing";

export interface Reciter {
  id: string;
  name: string;
  origin: string;
}

export const RECITERS: Reciter[] = [
  { id: "mishary", name: "Mishary Rashid Al Afasy", origin: "Kuwait" },
  { id: "basit", name: "Abdul Basit Abdul Samad", origin: "Egypt" },
  { id: "makkah", name: "Makkah Adhan", origin: "Masjid al-Haram" },
  { id: "madinah", name: "Madinah Adhan", origin: "Masjid an-Nabawi" },
  { id: "zaili", name: "Abdullah Al Zaili", origin: "Saudi Arabia" },
  { id: "majale", name: "Hamza Al Majale", origin: "Saudi Arabia" },
  { id: "qatami", name: "Nasir Al-Qatami", origin: "Saudi Arabia" },
];

/**
 * Native audio file naming:
 * - notification (30s) sound: `adhan-{reciterId}-30.caf`
 * - full playback file:       `adhan-{reciterId}-full.mp3`
 */
export const notificationSoundFile = (reciterId: string): string =>
  `adhan-${reciterId}-30.caf`;

export const fullAdhanFile = (reciterId: string): string =>
  `adhan-${reciterId}-full.mp3`;

const RECITER_KEY = "adhkar:adhan-reciter";
const DEFAULT_RECITER_ID = RECITERS[0].id;

export interface AdhanPrefs {
  reciter: string;
}

export function getAdhanPrefs(): AdhanPrefs {
  let reciter = DEFAULT_RECITER_ID;
  if (typeof window !== "undefined") {
    try {
      reciter = window.localStorage.getItem(RECITER_KEY) || DEFAULT_RECITER_ID;
    } catch {
      // ignore
    }
  }
  if (!RECITERS.some((r) => r.id === reciter)) reciter = DEFAULT_RECITER_ID;
  return { reciter };
}

export function setAdhanPrefs(prefs: Partial<AdhanPrefs>): void {
  if (typeof window === "undefined" || !prefs.reciter) return;
  try {
    window.localStorage.setItem(RECITER_KEY, prefs.reciter);
  } catch {
    // ignore
  }
}

export const reciterNameFor = (id: string): string =>
  RECITERS.find((r) => r.id === id)?.name ?? RECITERS[0].name;

interface AdhanPlugin {
  stopAdhan?(): Promise<unknown>;
  isAdhanPlaying?(): Promise<unknown>;
  addListener?(event: string, cb: (info: unknown) => void): Promise<unknown> | unknown;
}

function getPlugin(): AdhanPlugin | null {
  if (!isNativeApp()) return null;
  try {
    const plugins = (window as any).Capacitor?.Plugins;
    if (!plugins) return null;
    for (const name of ["AdhanNotifications", "AdhkarAdhan", "AdhkarPlayer", "AdhkarWidgets"]) {
      const plugin = plugins[name];
      if (plugin && (plugin.stopAdhan || plugin.isAdhanPlaying)) return plugin as AdhanPlugin;
    }
  } catch {
    // ignore
  }
  return null;
}

const normalizePlaying = (result: unknown): boolean => {
  if (typeof result === "boolean") return result;
  return !!(result as { playing?: unknown } | null)?.playing;
};

/** True while the native side is still playing the adhan audio. */
export const isAdhanPlaying = async (): Promise<boolean> => {
  const plugin = getPlugin();
  if (!plugin?.isAdhanPlaying) return false;
  try {
    return normalizePlaying(await plugin.isAdhanPlaying());
  } catch {
    return false;
  }
};

/** Stops the native adhan audio. No-ops when nothing is playing or on web. */
export const stopAdhan = async (): Promise<void> => {
  const plugin = getPlugin();
  if (!plugin?.stopAdhan) return;
  try {
    await plugin.stopAdhan();
  } catch {
    // ignore
  }
};

/**
 * Fires when the user taps an adhan notification and the native side starts
 * playing: listens for the "adhan:playing" CustomEvent (detail.prayer) and
 * the native plugin event. Returns an unsubscribe function.
 */
export const onAdhanPlaying = (handler: (prayer: string) => void): (() => void) => {
  if (typeof window === "undefined") return () => {};

  const onEvent = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    const prayer =
      typeof detail === "string" ? detail : ((detail as { prayer?: unknown } | null)?.prayer ?? "");
    handler(typeof prayer === "string" ? prayer : "");
  };
  window.addEventListener(ADHAN_PLAYING_EVENT, onEvent);

  let cancelled = false;
  const removers: Array<() => void> = [];
  const plugin = getPlugin();
  if (plugin?.addListener) {
    try {
      const handle = plugin.addListener("adhanPlaying", (info) => {
        const prayer = typeof info === "string" ? info : ((info as { prayer?: unknown } | null)?.prayer ?? "");
        handler(typeof prayer === "string" ? prayer : "");
      });
      if (handle && typeof (handle as Promise<unknown>).then === "function") {
        (handle as Promise<{ remove?: () => void }>)
          .then((h) => {
            removers.push(() => h?.remove?.());
          })
          .catch(() => {});
      }
    } catch {
      // ignore
    }
  }

  return () => {
    if (cancelled) return;
    cancelled = true;
    window.removeEventListener(ADHAN_PLAYING_EVENT, onEvent);
    for (const off of removers) off();
  };
};
