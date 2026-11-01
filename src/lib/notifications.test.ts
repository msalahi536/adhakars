import { afterEach, beforeEach, expect, test } from "bun:test";
import { checkNotificationPermission, clearRetiredHifz, getNotificationPrefs, requestNotificationPermission } from "./notifications";
import { enableAllPrayerAlerts, getAdhanPrefs } from "./adhan-bridge";
import { getPrayerSettings } from "./prayer-times";

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const store = new Map<string, string>();
let permission = "prompt";
let asks = 0;
let canceled: number[] = [];
const browser = Object.assign(new EventTarget(), {
  localStorage: {
    get length() { return store.size; },
    key: (index: number) => [...store.keys()][index] ?? null,
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
        getPending: async () => ({ notifications: [900, 900000, 900002, 900006, 1000, 880001, 900007].map((id) => ({ id })) }),
        cancel: async ({ notifications }: { notifications: { id: number }[] }) => { canceled.push(...notifications.map((n) => n.id)); },
      },
    },
  },
});
browser.addEventListener("adhkar:ask-enable-adhan", () => { asks++; });
beforeEach(() => {
  store.clear();
  permission = "prompt";
  asks = 0;
  canceled = [];
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

test("saving a Salah location offers the adhan prompt once", async () => {
  const { offerAdhanPrompt } = await import("./notifications");
  await offerAdhanPrompt();
  await offerAdhanPrompt();
  expect(asks).toBe(1);
  expect(store.get("adhkar:adhan-prompt-pending")).toBe("1");
});

test("removing Hifz keeps all other reminders, progress and notification permissions unchanged", async () => {
  const morning = { id: 1, label: "Morning Adhkar", hour: 6, minute: 0, enabled: true };
  const custom = { id: 5, label: "My reminder", hour: 12, minute: 30, enabled: true };
  store.set("adhkar:notifications", JSON.stringify({ reminders: [morning, { id: 900, label: "Hifz review", hour: 19, minute: 0, enabled: true }, custom], nextId: 901 }));
  store.set("hifz:state:v2", "old log");
  store.set("hifz:page:1", "cached page");
  store.set("hifz:today", "old session");
  store.set("arabic:log:v1", "arabic progress");
  store.set("adhkar:display", "tajweed preference");
  await clearRetiredHifz();
  expect(getNotificationPrefs()).toEqual({ reminders: [morning, custom], nextId: 901 });
  expect([...store.keys()].some((key) => key.startsWith("hifz:"))).toBe(false);
  expect(store.get("arabic:log:v1")).toBe("arabic progress");
  expect(store.get("adhkar:display")).toBe("tajweed preference");
  expect(canceled).toEqual([900, 900000, 900002, 900006]);
  expect(permission).toBe("prompt");
  expect(asks).toBe(0);
});
