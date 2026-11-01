import { expect, test } from "bun:test";
import { mushafThemeId } from "./mushaf-theme";
import { getMushafTheme } from "../mushaf/MushafPage";

for (const [preset, artwork] of [["original", "original"], ["rose", "rose"], ["lavender", "twilight"], ["ocean", "ocean"], ["emerald", "emerald"], ["sand", "sand"], ["midnight", "midnight"], ["dark-red", "darkred"]]) {
  test(`${preset} selects its supplied morning and evening artwork`, () => {
    expect(mushafThemeId(preset)).toBe(artwork);
    expect(getMushafTheme(mushafThemeId(preset), "morning").base).toBe(`/mushaf/${artwork}-morning`);
    expect(getMushafTheme(mushafThemeId(preset), "evening").base).toBe(`/mushaf/${artwork}-evening`);
  });
}