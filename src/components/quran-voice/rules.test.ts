import { expect, test } from "bun:test";
import { VOICE_SEARCH_MS, distinctMatches, englishByDefault, searchPresentation } from "./rules";
test("voice search is limited to fifteen seconds", () => { expect(VOICE_SEARCH_MS).toBe(15000); });
test("confident search shows one main answer and distinct other locations", () => {
  const matches = [{sura:112,aya:1,word:1,score:1},{sura:113,aya:1,word:1,score:.7}];
  expect(searchPresentation({confident:true,matches,samePhrase:[matches[0],matches[1],matches[1]]})).toEqual({matches:[matches[0]],samePhrase:[matches[1]]});
});
test("uncertain search shows at most two guesses", () => {
  const matches = [1,2,3].map((aya)=>({sura:2,aya,word:1,score:.6}));
  expect(searchPresentation({confident:false,matches,samePhrase:[]}).matches).toEqual(matches.slice(0,2));
});
test("English defaults on for non-Arabic languages and off for Arabic", () => {
  expect(englishByDefault("en-US")).toBe(true); expect(englishByDefault("ms")).toBe(true);
  expect(englishByDefault("ar-SA")).toBe(false); expect(englishByDefault("ar")).toBe(false);
});
test("top three voice results do not repeat the same ayah", () => {
  expect(distinctMatches([{sura:2,aya:25},{sura:2,aya:25},{sura:112,aya:1},{sura:1,aya:2},{sura:3,aya:1}])).toEqual([{sura:2,aya:25},{sura:112,aya:1},{sura:1,aya:2}]);
});