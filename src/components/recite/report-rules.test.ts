import { expect, test } from "bun:test";
import { reportAllowed, reportNote, reportPath } from "./report-rules";
import { DEFAULT_SETTINGS } from "@/lib/recite/model";
test("adult confirmation and consent are both required", () => { expect(reportAllowed(false, "2026-11-01")).toBe(false); expect(reportAllowed(true, null)).toBe(false); expect(reportAllowed(true, "2026-11-01")).toBe(true); });
test("reports use an owner folder and ZIP extension", () => expect(reportPath("owner", "2026-11-01", "random")).toBe("owner/2026-11-01-random.zip"));
test("report note is limited to 200 characters", () => expect(reportNote("x".repeat(201)).length).toBe(200));
test("tajweed tips default on", () => expect(DEFAULT_SETTINGS.tajweedTips).toBe(true));