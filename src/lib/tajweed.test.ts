import { expect, test } from "bun:test";
import { parseTajweed, RULE_GROUP } from "./tajweed";

test("parses Quran.com word tajweed markup into colored segments", () => {
  expect(parseTajweed("أَحَ<rule class=qalaqah>د</rule>ٌ")).toEqual([{ text: "أَحَ" }, { text: "د", group: "qalqalah" }, { text: "ٌ" }]);
  expect(parseTajweed("<tajweed class=ham_wasl>ٱ</tajweed>للَّهُ")).toEqual([{ text: "ٱ", group: "silent" }, { text: "للَّهُ" }]);
});
test("plain words and unknown rules stay uncolored; stray tags are stripped", () => {
  expect(parseTajweed("قُلۡ")).toEqual([{ text: "قُلۡ" }]);
  expect(parseTajweed("<rule class=nope>ب</rule><span class=end>١</span>")).toEqual([{ text: "ب", group: undefined }, { text: "١" }]);
});
test("Dar al-Ma'rifah grouping of madd and ghunnah rules", () => {
  expect(RULE_GROUP.madda_necessary).toBe("necessary");
  expect(RULE_GROUP.madda_normal).toBe("normal");
  expect(RULE_GROUP.ikhafa).toBe("ghunnah");
  expect(RULE_GROUP.idgham_wo_ghunnah).toBe("silent");
});
