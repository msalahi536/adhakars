import { describe, expect, it } from "vitest";
import { clockChangeLabel, findClockChange } from "./clock-change";

// Run with TZ=America/Los_Angeles for meaningful results.
const isLA = Intl.DateTimeFormat().resolvedOptions().timeZone === "America/Los_Angeles";

describe.runIf(isLA)("clock change near Fajr (Los Angeles, Nov 1 2026)", () => {
  it("finds the 2:00 AM fall-back between 12:54 AM PDT and Fajr 4:57 AM PST", () => {
    const now = new Date("2026-11-01T00:54:00-07:00");
    const fajr = new Date("2026-11-01T04:57:00-08:00");
    const change = findClockChange(now, fajr);
    expect(change?.shiftMinutes).toBe(60);
    expect(clockChangeLabel(change!)).toBe("2:00 AM");
    // The real time left is 5h03m, one hour more than clock math suggests.
    expect((fajr.getTime() - now.getTime()) / 60_000).toBe(303);
  });

  it("finds nothing on a normal night", () => {
    const now = new Date("2026-11-02T00:54:00-08:00");
    const fajr = new Date("2026-11-02T04:58:00-08:00");
    expect(findClockChange(now, fajr)).toBeNull();
  });
});
