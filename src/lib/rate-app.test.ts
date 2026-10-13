import { afterEach, describe, expect, test } from "bun:test";
import { requestAppReview, noteDhikrSessionComplete, shouldShowRatePrompt, markPromptDismissed } from "./rate-app";

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");

afterEach(() => {
  for (const [key, descriptor] of [["window", originalWindow], ["navigator", originalNavigator]] as const) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
});

function browser(platform: string, userAgent = "") {
  const opened: string[] = [];
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { userAgent, platform: "", maxTouchPoints: 0 } });
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    Capacitor: { getPlatform: () => platform },
    open: (url: string) => { opened.push(url); },
    dispatchEvent: () => true,
  } });
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  } });
  return { opened, restoreStorage: () => {
    if (originalStorage) Object.defineProperty(globalThis, "localStorage", originalStorage);
    else Reflect.deleteProperty(globalThis, "localStorage");
  } };
}

describe("explicit rating action", () => {
  test("iOS opens Apple's write-review destination immediately", () => {
    const env = browser("ios");
    try {
      requestAppReview();
      expect(env.opened).toEqual(["https://apps.apple.com/app/id6791834420?action=write-review"]);
    } finally { env.restoreStorage(); }
  });
  test("iPhone browser bypasses the no-op web review plugin", () => {
    const env = browser("web", "iPhone");
    try {
      requestAppReview();
      expect(env.opened[0]).toBe("https://apps.apple.com/app/id6791834420?action=write-review");
    } finally { env.restoreStorage(); }
  });
  test("Android opens the existing Google Play listing", () => {
    const env = browser("android");
    try {
      requestAppReview();
      expect(env.opened).toEqual(["https://play.google.com/store/apps/details?id=com.mindcastmedia.adhkar"]);
    } finally { env.restoreStorage(); }
  });
  test("prompt still starts after five completions, and returns ten after dismissal", () => {
    const env = browser("web");
    try {
      for (let i = 0; i < 4; i++) noteDhikrSessionComplete();
      expect(shouldShowRatePrompt()).toBe(false);
      noteDhikrSessionComplete();
      expect(shouldShowRatePrompt()).toBe(true);
      markPromptDismissed();
      for (let i = 0; i < 9; i++) noteDhikrSessionComplete();
      expect(shouldShowRatePrompt()).toBe(false);
      noteDhikrSessionComplete();
      expect(shouldShowRatePrompt()).toBe(true);
    } finally { env.restoreStorage(); }
  });
});