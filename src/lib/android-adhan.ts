// Android only: when an adhan notification fires, play the full adhan through
// the native AdhanPlugin foreground service; on tap, show the in-app player
// (without starting a second audio stream). iOS is untouched.

/** App reciter ids → native Android AdhanPlugin ids. */
const NATIVE_RECITER_IDS: Record<string, string> = {
  mishary: "mishary",
  "fajr-mishary": "mishary",
  basit: "abdulbasit",
  makkah: "makkah",
  madinah: "madinah",
  "fajr-madinah": "madinah",
  zaili: "abdullahzaili",
  majale: "hamzamajale",
  qatami: "nasirqatami",
  silent: "silent",
};

/** Native id → app id, for showing the reciter name. */
export const fromNativeReciterId = (id: string): string =>
  ({ abdulbasit: "basit", abdullahzaili: "zaili", hamzamajale: "majale", nasirqatami: "qatami" } as Record<string, string>)[id] ?? id;

export const toNativeReciterId = (id: string): string => NATIVE_RECITER_IDS[id] ?? id;

export const ANDROID_ADHAN_CHANNEL = "adhan_silent";

export const isAndroidPlatform = (): boolean =>
  typeof window !== "undefined" && (window as any).Capacitor?.getPlatform?.() === "android";

let channelReady = false;
export async function ensureAndroidAdhanChannel(plugin: any): Promise<void> {
  if (channelReady || !isAndroidPlatform() || !plugin?.createChannel) return;
  try {
    await plugin.createChannel({
      id: ANDROID_ADHAN_CHANNEL,
      name: "Adhan Notifications",
      description: "Prayer time adhan notifications",
      importance: 4,
      sound: "",
      vibration: true,
    });
    channelReady = true;
  } catch (e) {
    console.warn("[android-adhan] channel create failed", e);
  }
}

type TapHandler = (info: { prayer: string; reciterId: string }) => void;
let registered = false;

export async function registerAndroidAdhanListener(onTap?: TapHandler): Promise<void> {
  if (registered || !isAndroidPlatform()) return;
  registered = true;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.addListener("localNotificationReceived", async (notification) => {
      const extra = (notification.extra ?? {}) as Record<string, unknown>;
      const reciterId = typeof extra.reciterId === "string" ? extra.reciterId : "";
      if (extra.soundMode !== "adhan" || !reciterId || reciterId === "silent") return;
      try {
        const { AdhanPlugin } = await import("./native-bridge");
        await AdhanPlugin.playFullAdhan({
          reciterId,
          prayer: typeof extra.prayer === "string" ? extra.prayer : "",
        });
        console.log("[android-adhan] playFullAdhan reciterId =", reciterId);
      } catch (e) {
        console.error("Failed to play adhan via native plugin:", e);
      }
    });
    await LocalNotifications.addListener("localNotificationActionPerformed", (e) => {
      const extra = (e?.notification?.extra ?? {}) as Record<string, unknown>;
      if (extra.soundMode !== "adhan") return;
      const prayer = typeof extra.prayer === "string" ? extra.prayer : "fajr";
      const reciterId = typeof extra.reciterId === "string" ? extra.reciterId : "";
      onTap?.({ prayer, reciterId });
    });
  } catch (e) {
    console.warn("[android-adhan] listener setup failed", e);
  }
}

// ---- Player controls (Android native AdhanPlugin, iOS-identical contract) ----
const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0);

export async function androidGetAdhanProgress() {
  const { AdhanPlugin } = await import("./native-bridge");
  try {
    const o = ((await AdhanPlugin.getAdhanProgress?.()) ?? null) as Record<string, unknown> | null;
    if (o) {
      const duration = n(o.duration);
      const currentTime = n(o.currentTime);
      return {
        currentTime,
        duration,
        progress: o.progress !== undefined ? n(o.progress) : duration ? currentTime / duration : 0,
        isPlaying: !!o.isPlaying,
        hasSession: o.hasSession !== undefined ? !!o.hasSession : !!o.isPlaying,
        prayer: typeof o.prayer === "string" ? o.prayer : "",
        reciterId: typeof o.reciterId === "string" ? o.reciterId : "",
      };
    }
  } catch {
    // fall through to isPlaying
  }
  try {
    const { playing } = await AdhanPlugin.isPlaying();
    return { currentTime: 0, duration: 0, progress: 0, isPlaying: playing, hasSession: playing, prayer: "", reciterId: "" };
  } catch {
    return null;
  }
}

const callAndroid = async (method: "pauseAdhan" | "resumeAdhan" | "seekAdhan", arg?: { progress: number }) => {
  try {
    const { AdhanPlugin } = await import("./native-bridge");
    const fn = (AdhanPlugin as any)[method];
    if (typeof fn === "function") await fn.call(AdhanPlugin, arg);
    else if (method === "pauseAdhan") await AdhanPlugin.stopAdhan();
  } catch (e) {
    console.error(`[android-adhan] ${method} failed`, e);
  }
};
export const androidPauseAdhan = () => callAndroid("pauseAdhan");
export const androidResumeAdhan = () => callAndroid("resumeAdhan");
export const androidSeekAdhan = (progress: number) =>
  callAndroid("seekAdhan", { progress: Math.min(1, Math.max(0, progress)) });
