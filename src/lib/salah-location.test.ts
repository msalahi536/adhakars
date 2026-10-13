import { afterEach, beforeEach, expect, test } from "bun:test";
import { claimSalahLocationRequest } from "./prayer-times";

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
    },
  } });
});
afterEach(() => {
  if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
  else Reflect.deleteProperty(globalThis, "window");
});
test("Salah claims the automatic location request only once, including after reopening", () => {
  expect(claimSalahLocationRequest()).toBe(true);
  expect(store.get("adhkar:salah-location-requested")).toBe("1");
  expect(claimSalahLocationRequest()).toBe(false);
});
test("a saved location prevents Salah from requesting permission", () => {
  store.set("adhkar:prayer-settings", JSON.stringify({ location: { lat: 51.5, lng: -0.12, label: "London" } }));
  expect(claimSalahLocationRequest()).toBe(false);
  expect(store.has("adhkar:salah-location-requested")).toBe(false);
});