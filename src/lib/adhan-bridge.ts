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

export interface AdhanProgress {
  currentTime: number;
  duration: number;
  progress: number;
  isPlaying: boolean;
  hasSession: boolean;
  prayer: string;
  reciterId: string;
}

export interface AdhanStatus {
  playing: boolean;
  hasSession: boolean;
  prayer: string;
  reciterId: string;
}

export interface AdhanPlayingInfo {
  prayer: string;
  reciterId: string;
}

interface AdhanPlugin {
  stopAdhan?(): Promise<unknown>;
  pauseAdhan?(): Promise<unknown>;
  resumeAdhan?(): Promise<unknown>;
  seekAdhan?(opts: { progress: number }): Promise<unknown>;
  getAdhanProgress?(): Promise<unknown>;
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

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

const EMPTY_STATUS: AdhanStatus = { playing: false, hasSession: false, prayer: "", reciterId: "" };

/** Current native playback status. */
export const isAdhanPlaying = async (): Promise<AdhanStatus> => {
  const plugin = getPlugin();
  if (!plugin?.isAdhanPlaying) return EMPTY_STATUS;
  try {
    const r = await plugin.isAdhanPlaying();
    if (typeof r === "boolean") return { ...EMPTY_STATUS, playing: r, hasSession: r };
    const o = (r ?? {}) as Record<string, unknown>;
    const playing = !!o.playing;
    return {
      playing,
      hasSession: o.hasSession === undefined ? playing : !!o.hasSession,
      prayer: str(o.prayer),
      reciterId: str(o.reciterId),
    };
  } catch {
    return EMPTY_STATUS;
  }
};

/** Playback progress from the native side (null on web / failure). */
export const getAdhanProgress = async (): Promise<AdhanProgress | null> => {
  const plugin = getPlugin();
  if (!plugin?.getAdhanProgress) return null;
  try {
    const o = ((await plugin.getAdhanProgress()) ?? {}) as Record<string, unknown>;
    const duration = num(o.duration);
    const currentTime = num(o.currentTime);
    return {
      currentTime,
      duration,
      progress: o.progress !== undefined ? num(o.progress) : duration ? currentTime / duration : 0,
      isPlaying: !!o.isPlaying,
      hasSession: !!o.hasSession,
      prayer: str(o.prayer),
      reciterId: str(o.reciterId),
    };
  } catch {
    return null;
  }
};

const call = async (fn: keyof AdhanPlugin, arg?: unknown): Promise<void> => {
  const plugin = getPlugin();
  const f = plugin?.[fn] as ((a?: unknown) => Promise<unknown>) | undefined;
  if (!f) return;
  try {
    await f.call(plugin, arg);
  } catch {
    // ignore
  }
};

export const stopAdhan = () => call("stopAdhan");
export const pauseAdhan = () => call("pauseAdhan");
export const resumeAdhan = () => call("resumeAdhan");
export const seekAdhan = (progress: number) =>
  call("seekAdhan", { progress: Math.min(1, Math.max(0, progress)) });

const toInfo = (v: unknown): AdhanPlayingInfo => {
  if (typeof v === "string") return { prayer: v, reciterId: getAdhanPrefs().reciter };
  const o = (v ?? {}) as Record<string, unknown>;
  return { prayer: str(o.prayer), reciterId: str(o.reciterId) || getAdhanPrefs().reciter };
};

/**
 * Fires when the native side starts playing the adhan: listens for the
 * "adhan:playing" CustomEvent and the native plugin event.
 */
export const onAdhanPlaying = (handler: (info: AdhanPlayingInfo) => void): (() => void) => {
  if (typeof window === "undefined") return () => {};
  const onEvent = (event: Event) => handler(toInfo((event as CustomEvent).detail));
  window.addEventListener(ADHAN_PLAYING_EVENT, onEvent);

  let cancelled = false;
  const removers: Array<() => void> = [];
  const plugin = getPlugin();
  if (plugin?.addListener) {
    try {
      const handle = plugin.addListener("adhanPlaying", (info) => handler(toInfo(info)));
      if (handle && typeof (handle as Promise<unknown>).then === "function") {
        (handle as Promise<{ remove?: () => void }>)
          .then((h) => {
            if (cancelled) h?.remove?.();
            else removers.push(() => h?.remove?.());
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
