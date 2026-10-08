import { afterEach, beforeEach, expect, mock, test } from "bun:test";
import { setPrayerSettings, type PrayerSettings } from "./prayer-times";

const store = new Map<string, string>();
const updateLocation = mock(async (_options: unknown) => {});
const reloadWidgets = mock(async () => {});
const gps = mock((success: PositionCallback) => {
  success({ coords: { latitude: 32.72, longitude: -117.16 } } as GeolocationPosition);
});
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
const settings: PrayerSettings = {
  method: 3,
  hanafi: false,
  adhanEnabled: false,
  perPrayer: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
  sound: "adhan",
  location: { lat: 51.5, lng: -0.12, label: "London", verified: true },
};

// native-bridge registers its plugin at import time, so the mock has to be
// installed before the module is loaded.
mock.module("@capacitor/core", () => ({
  registerPlugin: () => ({
    updateLocation,
    reloadWidgets,
    updateTheme: async () => {},
    syncPrayerTimes: async () => {},
    updateTasbih: async () => {},
  }),
}));

const { initNativeBridge, syncLocationToWidgets } = await import("./native-bridge");

beforeEach(() => {
  store.clear();
  updateLocation.mockClear();
  reloadWidgets.mockClear();
  gps.mockClear();
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
  };
  const browser = Object.assign(new EventTarget(), {
    localStorage: storage,
    Capacitor: {
      isNativePlatform: () => true,
      Plugins: { AdhkarWidgets: { updateLocation, reloadWidgets, updateTheme: async () => {} } },
    },
  });
  Object.defineProperty(globalThis, "window", { value: browser, configurable: true });
  Object.defineProperty(globalThis, "navigator", {
    value: { geolocation: { getCurrentPosition: gps } }, configurable: true,
  });
  Object.defineProperty(globalThis, "document", {
    value: Object.assign(new EventTarget(), { visibilityState: "visible" }), configurable: true,
  });
  store.set("adhkar:prayer-settings", JSON.stringify(settings));
});

afterEach(() => {
  for (const [key, descriptor] of [
    ["window", originalWindow], ["navigator", originalNavigator], ["document", originalDocument],
  ] as const) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
});

test("Hanafi sends school 1 and Shafi sends school 0", async () => {
  store.set("adhkar:prayer-settings", JSON.stringify({ ...settings, hanafi: true }));
  await syncLocationToWidgets();
  expect(updateLocation).toHaveBeenLastCalledWith({ latitude: 51.5, longitude: -0.12, method: 3, school: 1 });
  store.set("adhkar:prayer-settings", JSON.stringify(settings));
  await syncLocationToWidgets();
  expect(updateLocation).toHaveBeenLastCalledWith({ latitude: 51.5, longitude: -0.12, method: 3, school: 0 });
});

test("method comes from prayer settings JSON, not the legacy key", async () => {
  store.set("prayerCalcMethod", "2");
  await syncLocationToWidgets();
  expect(updateLocation).toHaveBeenCalledWith({ latitude: 51.5, longitude: -0.12, method: 3, school: 0 });
});

test("saved city coordinates take precedence over GPS", async () => {
  await syncLocationToWidgets();
  expect(gps).not.toHaveBeenCalled();
  expect(updateLocation).toHaveBeenCalledWith({ latitude: 51.5, longitude: -0.12, method: 3, school: 0 });
  expect(reloadWidgets).not.toHaveBeenCalled();
});

test("GPS is used when there is no saved prayer location", async () => {
  store.set("adhkar:prayer-settings", JSON.stringify({ ...settings, location: null }));
  await syncLocationToWidgets();
  expect(gps).toHaveBeenCalledTimes(1);
  expect(updateLocation).toHaveBeenCalledWith({ latitude: 32.72, longitude: -117.16, method: 3, school: 0 });
});

test("Salah settings changes immediately resync method, school, and location", async () => {
  initNativeBridge();
  await Promise.resolve();
  updateLocation.mockClear();
  setPrayerSettings({ ...settings, method: 5 });
  expect(updateLocation).toHaveBeenLastCalledWith({ latitude: 51.5, longitude: -0.12, method: 5, school: 0 });
  setPrayerSettings({ ...settings, hanafi: true });
  expect(updateLocation).toHaveBeenLastCalledWith({ latitude: 51.5, longitude: -0.12, method: 3, school: 1 });
  setPrayerSettings({ ...settings, location: { lat: 40.71, lng: -74.01, label: "New York" } });
  expect(updateLocation).toHaveBeenLastCalledWith({ latitude: 40.71, longitude: -74.01, method: 3, school: 0 });
});