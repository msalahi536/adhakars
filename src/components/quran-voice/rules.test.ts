import { expect, test } from "bun:test";
import { VOICE_SEARCH_MS, distinctMatches, englishByDefault } from "./rules";
test("voice search is limited to eight seconds", () => { expect(VOICE_SEARCH_MS).toBe(8000); });
test("English defaults on for non-Arabic languages and off for Arabic", () => {
  expect(englishByDefault("en-US")).toBe(true); expect(englishByDefault("ms")).toBe(true);
  expect(englishByDefault("ar-SA")).toBe(false); expect(englishByDefault("ar")).toBe(false);
});
test("top three voice results do not repeat the same ayah", () => {
  expect(distinctMatches([{sura:2,aya:25},{sura:2,aya:25},{sura:112,aya:1},{sura:1,aya:2},{sura:3,aya:1}])).toEqual([{sura:2,aya:25},{sura:112,aya:1},{sura:1,aya:2}]);
});