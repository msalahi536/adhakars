import { afterEach, expect, test } from "bun:test";
import { requestNotificationPermission } from "./notifications";
import { getAdhanPrefs } from "./adhan-bridge";
import { getPrayerSettings } from "./prayer-times";

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const store = new Map<string, string>();
let permission = "prompt";
let notices = 0;
const browser = Object.assign(new EventTarget(), {
  localStorage: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
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
browser.addEventListener("adhkar:all-adhan-enabled", () => { notices++; });
afterEach(() => {
  if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
  else Reflect.deleteProperty(globalThis, "window");
});

test("granting notifications enables all five adhans and announces it without overwriting reciters", async () => {
  Object.defineProperty(globalThis, "window", { configurable: true, value: browser });
  store.set("adhkar:adhan-prefs", JSON.stringify({ fajrReciterId: "fajr-madinah", reciterPerPrayer: { Asr: "basit" } }));
  expect(await requestNotificationPermission()).toEqual({ granted: true, enabledAllPrayers: true });
  expect(getPrayerSettings().adhanEnabled).toBe(true);
  expect(getPrayerSettings().perPrayer).toEqual({ fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true });
  expect(getAdhanPrefs().enabledPrayers).toEqual({ Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true });
  expect(getAdhanPrefs().fajrReciterId).toBe("fajr-madinah");
  expect(getAdhanPrefs().reciterPerPrayer.Asr).toBe("basit");
  expect(notices).toBe(1);
});

test("already granted permission preserves manually disabled prayers and does not announce again", async () => {
  Object.defineProperty(globalThis, "window", { configurable: true, value: browser });
  permission = "granted";
  store.set("adhkar:prayer-settings", JSON.stringify({ perPrayer: { asr: false } }));
  const previousNotices = notices;
  expect(await requestNotificationPermission()).toEqual({ granted: true });
  expect(getPrayerSettings().perPrayer.asr).toBe(false);
  expect(notices).toBe(previousNotices);
});

test("denying notification permission leaves prayer choices unchanged", async () => {
  Object.defineProperty(globalThis, "window", { configurable: true, value: browser });
  permission = "denied";
  const saved = store.get("adhkar:prayer-settings");
  const previousNotices = notices;
  expect((await requestNotificationPermission()).granted).toBe(false);
  expect(store.get("adhkar:prayer-settings")).toBe(saved);
  expect(notices).toBe(previousNotices);
});