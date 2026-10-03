// Android only: when an adhan notification fires, play the full adhan through
// the native AdhanPlugin foreground service; on tap, show the in-app player
// (without starting a second audio stream). iOS is untouched.

/** App reciter ids → native Android AdhanPlugin ids. */
const NATIVE_RECITER_IDS: Record<string, string> = {
  mishary: "mishary",
  afasy: "mishary",
  "fajr-mishary": "mishary",
  basit: "abdulbasit",
  abdulbasit: "abdulbasit",
  makkah: "makkah",
  madinah: "madinah",
  "fajr-madinah": "madinah",
  zaili: "abdullahzaili",
  abdullahzaili: "abdullahzaili",
  majale: "hamzamajale",
  hamzamajale: "hamzamajale",
  qatami: "nasirqatami",
  nasirqatami: "nasirqatami",
  silent: "silent",
};

/** Native id → app id, for showing the reciter name. */
export const fromNativeReciterId = (id: string): string =>
  ({ abdulbasit: "basit", abdullahzaili: "zaili", hamzamajale: "majale", nasirqatami: "qatami" } as Record<string, string>)[id] ?? id;

export const toNativeReciterId = (id: string): string => {
  const normalized = id.trim().toLowerCase();
  return NATIVE_RECITER_IDS[normalized] ?? normalized;
};

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
      const storedReciter = typeof extra.reciterId === "string" ? extra.reciterId : "";
      const reciterId = toNativeReciterId(storedReciter);
      console.log("[adhan-debug] Stored reciter:", storedReciter, "→ Android ID:", reciterId);
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
    const o = ((await AdhanPlugin.getAdhanStatus()) ?? null) as Record<string, unknown> | null;
    if (o) {
      const duration = n(o.duration);
      const currentTime = n(o.currentTime);
      const playing = !!o.playing;
      const paused = !!o.paused;
      return {
        currentTime,
        duration,
        progress: duration ? currentTime / duration : 0,
        isPlaying: playing,
        hasSession: playing || paused,
        prayer: "",
        reciterId: "",
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

const callAndroid = async (
  method: "pauseAdhan" | "resumeAdhan" | "seekAdhan" | "stopAdhan",
  arg?: { position: number },
) => {
  console.log("[adhan-player] button pressed:", method);
  try {
    const { AdhanPlugin } = await import("./native-bridge");
    if (method === "pauseAdhan") await AdhanPlugin.pauseAdhan();
    else if (method === "resumeAdhan") await AdhanPlugin.resumeAdhan();
    else if (method === "stopAdhan") await AdhanPlugin.stopAdhan();
    else if (arg) await AdhanPlugin.seekAdhan(arg);
  } catch (e) {
    console.error(`[android-adhan] ${method} failed`, e);
  }
};
export const androidPauseAdhan = () => callAndroid("pauseAdhan");
export const androidResumeAdhan = () => callAndroid("resumeAdhan");
export const androidStopAdhan = () => callAndroid("stopAdhan");
export const androidSeekAdhan = (position: number) =>
  callAndroid("seekAdhan", { position: Math.max(0, position) });
