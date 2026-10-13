import { afterEach, beforeEach, expect, mock, test } from "bun:test";
import { fetchDay, slotsForDay, DEFAULT_PRAYER_SETTINGS } from "./prayer-times";
import { parseJakimMonth } from "./jakim-prayer-times";

const originalFetch = globalThis.fetch;
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const store = new Map<string, string>();
const row = { day: 13, fajr: 1791841620, syuruk: 1791845640, dhuhr: 1791867840, asr: 1791879360, maghrib: 1791889620, isha: 1791893760 };
const month = { zone: "WLY01", year: 2026, month_number: 10, prayers: [row] };
const settings = { ...DEFAULT_PRAYER_SETTINGS, source: "jakim" as const, location: { lat: 3.139, lng: 101.6869, label: "Kuala Lumpur", verified: true } };

beforeEach(() => {
  store.clear();
  Object.defineProperty(globalThis, "window", { configurable: true, value: Object.assign(new EventTarget(), {
    localStorage: { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value) },
  }) });
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
  else Reflect.deleteProperty(globalThis, "window");
});

test("JAKIM requests the saved Malaysian coordinates and selected month", async () => {
  const request = mock(async () => Response.json(month));
  globalThis.fetch = request as unknown as typeof fetch;
  const day = await fetchDay(new Date(2026, 9, 13), settings);
  expect(request.mock.calls.length).toBe(1);
  expect(request).toHaveBeenCalledWith("https://api.waktusolat.app/v2/solat/gps/3.139/101.6869?year=2026&month=10", expect.anything());
  expect(day?.timestamps?.sunrise).toBe(1791845640000);
  expect(day && slotsForDay(day).find((slot) => slot.id === "asr")?.at.getTime()).toBe(1791879360000);
});

test("JAKIM ignores calculation method and Hanafi overrides to retain official Asr", async () => {
  globalThis.fetch = mock(async () => Response.json(month)) as unknown as typeof fetch;
  const day = await fetchDay(new Date(2026, 9, 13), { ...settings, method: 1, hanafi: true });
  expect(day?.timestamps?.asr).toBe(1791879360000);
});

test("JAKIM caches official times and never falls back to Aladhan on failure", async () => {
  const request = mock(async () => Response.json(month));
  globalThis.fetch = request as unknown as typeof fetch;
  await fetchDay(new Date(2026, 9, 13), settings);
  await fetchDay(new Date(2026, 9, 13), settings);
  expect(request).toHaveBeenCalledTimes(1);
  const failed = mock(async () => new Response("Unavailable", { status: 503 }));
  globalThis.fetch = failed as unknown as typeof fetch;
  expect(await fetchDay(new Date(2026, 9, 14), settings)).toBeNull();
  expect(failed).toHaveBeenCalledTimes(1);
});

test("JAKIM rejects incomplete or wrong-month responses", () => {
  expect(parseJakimMonth({ ...month, month_number: 9 }, 2026, 10)).toBeNull();
  expect(parseJakimMonth({ ...month, prayers: [{ ...row, asr: null }] }, 2026, 10)).toBeNull();
});