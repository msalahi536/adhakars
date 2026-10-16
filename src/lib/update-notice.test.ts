import { expect, test } from "bun:test";
import { shouldShowUpdateNotice, UPDATE_NOTICE_KEY } from "./update-notice";

test("Quran release notice is available for seven days from October 16, 2026", () => {
  expect(shouldShowUpdateNotice(Date.UTC(2026, 9, 15, 23, 59), null)).toBe(false);
  expect(shouldShowUpdateNotice(Date.UTC(2026, 9, 16), null)).toBe(true);
  expect(shouldShowUpdateNotice(Date.UTC(2026, 9, 22, 23, 59, 59), null)).toBe(true);
  expect(shouldShowUpdateNotice(Date.UTC(2026, 9, 23), null)).toBe(false);
});

test("everyone sees it once, including people who dismissed the previous notice", () => {
  expect(UPDATE_NOTICE_KEY).not.toBe("adhkar:update-notice:2026-10-13");
  const now = Date.UTC(2026, 9, 17);
  expect(shouldShowUpdateNotice(now, null)).toBe(true);
  expect(shouldShowUpdateNotice(now, "seen")).toBe(false);
});
