import { describe, expect, test } from "bun:test";
import { IOS_PENDING_LIMIT, NOTIFICATION_BUDGET, REMINDER_DAYS_AHEAD, SOURCE_MAX, trimToBudget, type PendingNote } from "./notification-budget";

const DAY = 86_400_000;
const now = Date.parse("2026-10-26T08:00:00Z");

/** Every source at its maximum, plus the given number of user reminders. */
function worstCase(userReminders: number): PendingNote[] {
  const out: PendingNote[] = [];
  let id = 1;
  for (const [src, n] of Object.entries(SOURCE_MAX))
    for (let i = 0; i < n; i++) out.push({ id: id++, at: src === "jumuah" ? null : now + (i % 3) * DAY + i * 60_000, critical: src === "adhan" });
  for (let r = 0; r < userReminders; r++) for (let d = 0; d < REMINDER_DAYS_AHEAD; d++) out.push({ id: id++, at: now + d * DAY + r * 1000 });
  return out;
}

describe("notification budget", () => {
  test("whole app stays under iOS's 64 pending limit, even with everything on", () => {
    for (const reminders of [2, 5, 20]) {
      const all = worstCase(reminders);
      const cut = new Set(trimToBudget(all));
      const kept = all.filter((n) => !cut.has(n.id));
      expect(kept.length).toBeLessThanOrEqual(NOTIFICATION_BUDGET);
      expect(kept.length).toBeLessThan(IOS_PENDING_LIMIT);
      // prayer alerts are never cut
      expect(kept.filter((n) => n.critical).length).toBe(SOURCE_MAX.adhan);
    }
  });
  test("cuts the furthest-away notifications first", () => {
    const all = worstCase(10);
    const cut = new Set(trimToBudget(all));
    const latestKept = Math.max(...all.filter((n) => !cut.has(n.id) && !n.critical && n.at !== null).map((n) => n.at!));
    for (const n of all.filter((x) => cut.has(x.id))) expect(n.at!).toBeGreaterThanOrEqual(latestKept);
  });
  test("nothing is cut when under budget", () => {
    expect(trimToBudget(worstCase(0).slice(0, 40))).toEqual([]);
  });
  test("reminders are planned only a few days ahead", () => {
    expect(REMINDER_DAYS_AHEAD).toBeLessThanOrEqual(3);
  });
});
