import { expect, test } from "bun:test";
import { shouldShowUpdateNotice } from "./update-notice";

test("release notice is available for seven days from October 13, 2026", () => {
  expect(shouldShowUpdateNotice(Date.UTC(2026, 9, 12, 23, 59), null)).toBe(false);
  expect(shouldShowUpdateNotice(Date.UTC(2026, 9, 13), null)).toBe(true);
  expect(shouldShowUpdateNotice(Date.UTC(2026, 9, 19, 23, 59, 59), null)).toBe(true);
  expect(shouldShowUpdateNotice(Date.UTC(2026, 9, 20), null)).toBe(false);
});

test("new and existing users see the release once, not again after acknowledgment", () => {
  const now = Date.UTC(2026, 9, 14);
  expect(shouldShowUpdateNotice(now, null)).toBe(true);
  expect(shouldShowUpdateNotice(now, "seen")).toBe(false);
});