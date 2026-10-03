// Android only: when an adhan notification fires, play the full adhan through
// the native AdhanPlugin foreground service. iOS is untouched.

let registered = false;

export async function registerAndroidAdhanListener(): Promise<void> {
  if (registered || typeof window === "undefined") return;
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.getPlatform() !== "android") return;
    registered = true;
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.addListener("localNotificationReceived", async (notification) => {
      const extra = (notification.extra ?? {}) as Record<string, unknown>;
      if (extra.soundMode === "adhan" && typeof extra.reciterId === "string" && extra.reciterId) {
        try {
          const { AdhanPlugin } = await import("./native-bridge");
          await AdhanPlugin.playFullAdhan({
            reciterId: extra.reciterId,
            prayer: typeof extra.prayer === "string" ? extra.prayer : "",
          });
        } catch (e) {
          console.error("Failed to play adhan via native plugin:", e);
        }
      }
    });
  } catch (e) {
    console.warn("[android-adhan] listener setup failed", e);
  }
}
