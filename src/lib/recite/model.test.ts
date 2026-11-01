import { expect, test } from "bun:test";
import { freshRecite, isOpeningWord, markedWords, revealAyah, revealNext, restartPage, WORD_STATES, type ReciteWord } from "./model";
const words: ReciteWord[] = ["67:1:1", "67:1:2", "67:2:1"].map((key, index) => ({ key, verse: key.slice(0, -2), position: index + 1, line: 3, page: 562, text: "كلمة", glyph: "", end: false, audio: null, translation: "", transliteration: "" }));
test("self check reveals precisely the next word and preserves previous marks", () => {
  expect(revealNext(words, { "67:1:1": "wrong" })).toEqual({ "67:1:1": "wrong", "67:1:2": "correct" });
});
test("long press reveals the current ayah only", () => {
  expect(revealAyah(words, {})).toEqual({ "67:1:1": "correct", "67:1:2": "correct" });
});
test("restarting a page preserves marks on other pages", () => {
  expect(restartPage(words, { "67:1:1": "wrong", "68:1:1": "unsure" })).toEqual({ "68:1:1": "unsure" });
});
test("six word states and marks exclude correct or pending words", () => {
  expect(WORD_STATES).toEqual(["pending", "in_progress", "correct", "wrong", "skipped", "unsure"]);
  expect(markedWords(words, { "67:1:1": "wrong", "67:1:2": "correct", "67:2:1": "unsure" }).map((w) => w.key)).toEqual(["67:1:1", "67:2:1"]);
});
test("fresh recitation starts on page 562 without retired Hifz data", () => {
  expect(freshRecite().page).toBe(562);
  expect(freshRecite().marks).toEqual({});
});
test("default hide style is faint, whole page; tajweed is off", () => {
  expect(freshRecite().settings.hideStyle).toBe("faint");
  expect(freshRecite().settings.hideAmount).toBe("page");
  expect(freshRecite().settings.tajweed).toBe(false);
});
test("first word hints respect ayah boundaries without revealing the next word", () => {
  expect(words.map((w) => isOpeningWord(w, words, "ayah"))).toEqual([true, false, true]);
  expect(revealNext(words, {})).toEqual({ "67:1:1": "correct" });
});
test("first line hints reveal only the first word in a printed line", () => {
  expect(words.map((w) => isOpeningWord(w, words, "line"))).toEqual([true, false, false]);
  expect(words.map((w) => isOpeningWord(w, words, "page"))).toEqual([false, false, false]);
});