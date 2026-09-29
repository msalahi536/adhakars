import misharyAsset from "@/assets/adhan/mishary.mp3.asset.json";
import basitAsset from "@/assets/adhan/basit.mp3.asset.json";
import makkahAsset from "@/assets/adhan/makkah.mp3.asset.json";
import madinahAsset from "@/assets/adhan/madinah.mp3.asset.json";
import zailiAsset from "@/assets/adhan/zaili.mp3.asset.json";
import majaleAsset from "@/assets/adhan/majale.mp3.asset.json";
import qatamiAsset from "@/assets/adhan/qatami.mp3.asset.json";
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
const ADHAN_PREFS_KEY = "adhkar:adhan-prefs";
const DEFAULT_RECITER_ID = RECITERS[0].id;

export interface AdhanPrefs {
  soundMode: "adhan" | "silent" | "default";
  reciterId: string;
  reciterPerPrayer: Record<string, string>;
  enabledPrayers: Record<string, boolean>;
}

const DEFAULT_PREFS: AdhanPrefs = {
  soundMode: "adhan",
  reciterId: DEFAULT_RECITER_ID,
  reciterPerPrayer: {
    Fajr: DEFAULT_RECITER_ID,
    Dhuhr: DEFAULT_RECITER_ID,
    Asr: DEFAULT_RECITER_ID,
    Maghrib: DEFAULT_RECITER_ID,
    Isha: DEFAULT_RECITER_ID,
  },
  enabledPrayers: { Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false },
};

const validReciter = (id: unknown): string =>
  typeof id === "string" && RECITERS.some((r) => r.id === id) ? id : DEFAULT_RECITER_ID;

export function getAdhanPrefs(): AdhanPrefs {
  if (typeof window === "undefined") return { ...DEFAULT_PREFS };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ADHAN_PREFS_KEY) || "{}") as Partial<AdhanPrefs>;
    const legacy = validReciter(parsed.reciterId ?? window.localStorage.getItem(RECITER_KEY));
    const reciterPerPrayer = Object.fromEntries(
      Object.entries({ ...DEFAULT_PREFS.reciterPerPrayer, ...(parsed.reciterPerPrayer ?? {}) })
        .map(([prayer, id]) => [prayer, validReciter(id)]),
    );
    return {
      soundMode: parsed.soundMode ?? DEFAULT_PREFS.soundMode,
      reciterId: legacy,
      reciterPerPrayer,
      enabledPrayers: { ...DEFAULT_PREFS.enabledPrayers, ...(parsed.enabledPrayers ?? {}) },
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function setAdhanPrefs(prefs: AdhanPrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ADHAN_PREFS_KEY, JSON.stringify(prefs));
    window.localStorage.setItem(RECITER_KEY, prefs.reciterId);
  } catch {
    // ignore
  }
  void syncAdhanPrefsToNative(prefs);
}

/** Pushes reciter/enabled-prayer choices into the native plugin's preferences. */
export async function syncAdhanPrefsToNative(prefs: AdhanPrefs = getAdhanPrefs()): Promise<void> {
  const cap = typeof window !== "undefined" ? (window as any).Capacitor : null;
  if (!cap?.isNativePlatform?.()) return;
  const plugin = cap.Plugins?.AdhanNotifications;
  if (!plugin) return;
  try {
    await plugin.updatePreferences({
      soundMode: prefs.soundMode,
      reciterId: prefs.reciterId,
      reciterPerPrayer: prefs.reciterPerPrayer,
      enabledPrayers: prefs.enabledPrayers,
    });
  } catch (e) {
    console.error("[adhan] native prefs sync failed", e);
  }
}

export function getReciterForPrayer(prayer: string): string {
  const prefs = getAdhanPrefs();
  const label = `${prayer.charAt(0).toUpperCase()}${prayer.slice(1).toLowerCase()}`;
  return validReciter(prefs.reciterPerPrayer[label] ?? prefs.reciterId);
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
  playAdhanPreview?(opts: { reciterId: string; file: string }): Promise<unknown>;
  stopAdhanPreview?(): Promise<unknown>;
  schedulePrayerNotifications?(opts: { prayerTimes: NativePrayerTime[] }): Promise<unknown>;
  testPrayerNotification?(opts: { prayer: string }): Promise<unknown>;
  getDiagnostics?(): Promise<unknown>;
  addListener?(event: string, cb: (info: unknown) => void): Promise<unknown> | unknown;
}

/**
 * Capacitor plugins are Proxy objects: their methods aren't enumerable, so
 * never probe for methods — just check the plugin exists and call it.
 */
function getAdhanPlugin(): AdhanPlugin | null {
  if (typeof window === "undefined") return null;
  const cap = (window as any).Capacitor;
  if (!cap?.isNativePlatform?.()) return null;
  try {
    return (cap.Plugins?.AdhanNotifications as AdhanPlugin) ?? null;
  } catch {
    return null;
  }
}
const getPlugin = getAdhanPlugin;

/**
 * The native plugin expects exactly { name, time } per entry — it reads
 * reciter, sound mode and enabled prayers from its own native preferences
 * and assigns notification IDs internally (Fajr=100 … Isha=104, Test=199).
 */
export interface NativePrayerTime {
  name: string;
  time: number;
}

/** True when the custom AdhanNotifications plugin is registered. */
export const hasNativeAdhanScheduler = (): boolean => !!getAdhanPlugin();

/**
 * Schedules prayer notifications through the custom native plugin so iOS
 * AppDelegate receives the tap and continues the full adhan. An empty list
 * clears them. Never falls back to the standard notification plugin.
 */
export const scheduleNativeAdhan = async (prayerTimes: NativePrayerTime[]): Promise<boolean> => {
  const plugin = getAdhanPlugin() as any;
  if (!plugin) return false;
  try {
    await plugin.schedulePrayerNotifications({
      prayerTimes: prayerTimes.map(({ name, time }) => ({ name, time })),
    });
    return true;
  } catch (e) {
    console.error("[adhan] native schedule failed", e);
    return false;
  }
};

/**
 * Fires a real prayer notification in 5 seconds through the native plugin
 * (bypasses its enabled-prayers check) so tests behave exactly like a real
 * prayer: correct title, reciter and sound, and a tap that continues the
 * full adhan. Only { prayer } is sent — the plugin fills in everything else.
 */
export const testPrayerNotification = async (prayer: string): Promise<boolean> => {
  const plugin = getPlugin() as any;
  if (!plugin) return false;
  await syncAdhanPrefsToNative();
  try {
    await plugin.testPrayerNotification({ prayer });
    return true;
  } catch (e) {
    console.error("[adhan] test notification failed", e);
    return false;
  }
};

/** Native diagnostics: enabled prayers, pending notifications, permissions. */
export const getDiagnostics = async (): Promise<unknown> => {
  const plugin = getPlugin() as any;
  if (!plugin) return null;
  try {
    return await plugin.getDiagnostics();
  } catch (e) {
    console.error("[adhan] diagnostics failed", e);
    return null;
  }
};

export const buildNativePrayerTime = (prayer: string, at: Date): NativePrayerTime => ({
  name: `${prayer.charAt(0).toUpperCase()}${prayer.slice(1).toLowerCase()}`,
  time: at.getTime(),
});

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

const EMPTY_STATUS: AdhanStatus = { playing: false, hasSession: false, prayer: "", reciterId: "" };

/** Current native playback status. */
export const isAdhanPlaying = async (): Promise<AdhanStatus> => {
  const plugin = getPlugin() as any;
  if (!plugin) return EMPTY_STATUS;
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
  const plugin = getPlugin() as any;
  if (!plugin) return null;
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
  const plugin = getPlugin() as any;
  if (!plugin) return;
  try {
    await plugin[fn](arg);
  } catch {
    // ignore
  }
};

export const stopAdhan = () => call("stopAdhan");
export const pauseAdhan = () => call("pauseAdhan");
export const resumeAdhan = () => call("resumeAdhan");
export const seekAdhan = (progress: number) =>
  call("seekAdhan", { progress: Math.min(1, Math.max(0, progress)) });


const PREVIEW_URLS: Record<string, string> = {
  mishary: misharyAsset.url,
  basit: basitAsset.url,
  makkah: makkahAsset.url,
  madinah: madinahAsset.url,
  zaili: zailiAsset.url,
  majale: majaleAsset.url,
  qatami: qatamiAsset.url,
};

let previewAudio: HTMLAudioElement | null = null;
const preloaded: Record<string, HTMLAudioElement> = {};

/** Starts buffering every preview so taps play instantly. */
export const preloadAdhanPreviews = () => {
  if (typeof Audio === "undefined") return;
  for (const [id, url] of Object.entries(PREVIEW_URLS)) {
    if (preloaded[id]) continue;
    const a = new Audio();
    a.preload = "auto";
    a.src = url;
    a.load();
    preloaded[id] = a;
  }
};

/** Plays the reciter's full recording as an in-app preview (web + native). */
export const playAdhanPreview = async (reciterId: string, onEnded?: () => void): Promise<boolean> => {
  stopAdhanPreview();
  const url = PREVIEW_URLS[validReciter(reciterId)];
  if (!url || typeof Audio === "undefined") return false;
  try {
    const id = validReciter(reciterId);
    const audio = preloaded[id] ?? new Audio(url);
    preloaded[id] = audio;
    audio.currentTime = 0;
    audio.onended = () => {
      if (previewAudio === audio) previewAudio = null;
      onEnded?.();
    };
    previewAudio = audio;
    await audio.play();
    return true;
  } catch {
    previewAudio = null;
    return false;
  }
};

export const stopAdhanPreview = () => {
  if (previewAudio) {
    previewAudio.pause();
    previewAudio.currentTime = 0;
    previewAudio = null;
  }
};

const toInfo = (v: unknown): AdhanPlayingInfo => {
  if (typeof v === "string") return { prayer: v, reciterId: getReciterForPrayer(v) };
  const o = (v ?? {}) as Record<string, unknown>;
  const prayer = str(o.prayer);
  return { prayer, reciterId: str(o.reciterId) || getReciterForPrayer(prayer) };
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
  const plugin = getPlugin() as any;
  if (plugin) {
    try {
      const handle = plugin.addListener("adhanPlaying", (info: unknown) => handler(toInfo(info)));
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
