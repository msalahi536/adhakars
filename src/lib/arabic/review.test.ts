import { expect, test } from "bun:test";
import { addDays, FIRST_INTERVAL, reviewInterval } from "./review";

test("Arabic review rules remain unchanged after Hifz removal", () => {
  expect(FIRST_INTERVAL).toBe(1);
  expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
  expect(reviewInterval(10, "2026-11-10", "perfect", "2026-11-10")).toBe(20);
  expect(reviewInterval(10, "2026-11-10", "hesitation", "2026-11-10")).toBe(12);
  expect(reviewInterval(10, "2026-11-10", "perfect", "2026-11-01")).toBe(10);
  expect(reviewInterval(10, "2026-11-10", "hesitation", "2026-11-01")).toBe(10);
  expect(reviewInterval(10, "2026-11-10", "mistake", "2026-11-01")).toBe(5);
  expect(reviewInterval(10, "2026-11-10", "blank", "2026-11-01")).toBe(1);
});