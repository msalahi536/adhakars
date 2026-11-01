import { expect, test } from "bun:test";
import { NO_SAMPLE_CONSENT, makeSampleConsent, canReport } from "./hifz-sample-consent";
test("Collection is off by default", () => expect(canReport(NO_SAMPLE_CONSENT)).toBe(false));
test("Unchecked 18-or-older confirmation cannot enable collection", () => expect(makeSampleConsent(false).enabled).toBe(false));
test("Adult consent stores date and allows explicit reporting", () => { const c = makeSampleConsent(true, "2026-11-01T22:56:00.000Z"); expect(c.date).toBe("2026-11-01T22:56:00.000Z"); expect(canReport(c)).toBe(true); });