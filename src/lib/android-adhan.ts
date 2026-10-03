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
