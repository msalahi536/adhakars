import { expect, test } from "bun:test";
import { addDays, weekDates, dateKey, assignedContent, type DailyAssignment } from "./daily-editor";
import { credentialsMatch } from "./daily-editor.server";

test("week selection includes seven Monday–Sunday dates across a year boundary", () => {
  expect(weekDates("2026-12-31")).toEqual(["2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02", "2027-01-03"]);
});
test("tomorrow handles leap days and rejects nonexistent dates", () => {
  expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  expect(dateKey.safeParse("2026-02-29").success).toBe(false);
});
test("Quran and Sunnah are independent and apply only on their assigned day", () => {
  const content = { arabic_text: "ع", translation: "Verse", reference: "1:1" };
  const rows: DailyAssignment[] = [{ date: "2026-11-02", widget_type: "quran_verse", content }];
  expect(assignedContent(rows, "quran_verse", "2026-11-02")).toEqual(content);
  expect(assignedContent(rows, "sunnah", "2026-11-02")).toBeNull();
  expect(assignedContent(rows, "quran_verse", "2026-11-01")).toBeNull();
});
test("credential comparison rejects wrong and unequal-length input", () => {
  expect(credentialsMatch("test-only-value", "test-only-value")).toBe(true);
  expect(credentialsMatch("test-only-valuE", "test-only-value")).toBe(false);
  expect(credentialsMatch("", "test-only-value")).toBe(false);
});