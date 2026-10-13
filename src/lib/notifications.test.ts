import { afterEach, beforeEach, expect, test } from "bun:test";
import { checkNotificationPermission, requestNotificationPermission } from "./notifications";
import { enableAllPrayerAlerts, getAdhanPrefs } from "./adhan-bridge";
import { getPrayerSettings } from "./prayer-times";

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const store = new Map<string, string>();
let permission = "prompt";
let asks = 0;
const browser = Object.assign(new EventTarget(), {
  localStorage: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
  },
  Capacitor: {
    isNativePlatform: () => true,
    getPlatform: () => "ios",
    Plugins: {
      LocalNotifications: {
        checkPermissions: async () => ({ display: permission }),
        requestPermissions: async () => ({ display: permission === "denied" ? "denied" : (permission = "granted") }),
        cancel: async () => {},
      },
    },
  },
});
browser.addEventListener("adhkar:ask-enable-adhan", () => { asks++; });
beforeEach(() => {
  store.clear();
  permission = "prompt";
  asks = 0;
  Object.defineProperty(globalThis, "window", { configurable: true, value: browser });
});
afterEach(() => {
  if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
  else Reflect.deleteProperty(globalThis, "window");
});

test("granting notifications asks once to turn on adhan without changing prayers", async () => {
  store.set("adhkar:prayer-settings", JSON.stringify({ perPrayer: { asr: false } }));
  expect(await requestNotificationPermission()).toEqual({ granted: true, adhanPrompted: true });
  expect(store.get("adhkar:adhan-prompt-pending")).toBe("1");
  expect(getPrayerSettings().perPrayer.asr).toBe(false);
  expect(asks).toBe(1);
  expect(await checkNotificationPermission()).toBe(true);
  expect(asks).toBe(1);
});

test("saying yes enables all five adhans and keeps reciters", async () => {
  store.set("adhkar:adhan-prefs", JSON.stringify({ fajrReciterId: "fajr-madinah", reciterPerPrayer: { Asr: "basit" } }));
  await enableAllPrayerAlerts();
  expect(getPrayerSettings().perPrayer).toEqual({ fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true });
  expect(getAdhanPrefs().enabledPrayers).toEqual({ Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true });
  expect(getAdhanPrefs().fajrReciterId).toBe("fajr-madinah");
  expect(getAdhanPrefs().reciterPerPrayer.Asr).toBe("basit");
});

test("denying notification permission does not ask about adhan", async () => {
  permission = "denied";
  expect((await requestNotificationPermission()).granted).toBe(false);
  expect(asks).toBe(0);
});
