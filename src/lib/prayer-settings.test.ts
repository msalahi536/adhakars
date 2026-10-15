import { afterEach, beforeEach, expect, test } from "bun:test";
import { getPrayerSettings, setPrayerSettings } from "./prayer-times";

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
let saved: string | null = null;
beforeEach(() => {
  saved = null;
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    localStorage: { getItem: () => saved, setItem: (_key: string, value: string) => { saved = value; } },
    dispatchEvent: () => true,
  } });
});
afterEach(() => {
  if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
  else Reflect.deleteProperty(globalThis, "window");
});

test("calculation method edits read back through the shared settings", () => {
  setPrayerSettings({ ...getPrayerSettings(), source: "aladhan", method: 3 });
  expect(getPrayerSettings().method).toBe(3);
  expect(getPrayerSettings().source).toBe("aladhan");
});
test("Hanafi Asr edits read back without changing the calculation method", () => {
  setPrayerSettings({ ...getPrayerSettings(), method: 3, hanafi: true });
  expect(getPrayerSettings().hanafi).toBe(true);
  expect(getPrayerSettings().method).toBe(3);
});
test("location edits read back without changing existing prayer alert choices", () => {
  const settings = getPrayerSettings();
  setPrayerSettings({ ...settings, perPrayer: { ...settings.perPrayer, isha: false }, location: { lat: 51.5, lng: -0.12, label: "London, GB", verified: true } });
  expect(getPrayerSettings().location).toEqual({ lat: 51.5, lng: -0.12, label: "London, GB", verified: true });
  expect(getPrayerSettings().perPrayer.isha).toBe(false);
});