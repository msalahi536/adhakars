import { expect, test } from "bun:test";
import { moveSurah, toggleSurahOrder } from "./surah-order";

test("memorization order follows selection order rather than surah number", () => {
  const order = [67, 114, 36, 18, 55].reduce(toggleSurahOrder, [] as number[]);
  expect(order).toEqual([67, 114, 36, 18, 55]);
});
test("moving a surah changes its position without dropping other selections", () => {
  expect(moveSurah([67, 114, 36], 36, -1)).toEqual([67, 36, 114]);
  expect(moveSurah([67, 114, 36], 67, 1)).toEqual([114, 67, 36]);
});
test("removing then selecting again adds the surah to the end", () => {
  expect(toggleSurahOrder(toggleSurahOrder([67, 114, 36], 114), 114)).toEqual([67, 36, 114]);
});
test("moving beyond the start or end preserves the order", () => {
  expect(moveSurah([67, 114], 67, -1)).toEqual([67, 114]);
  expect(moveSurah([67, 114], 114, 1)).toEqual([67, 114]);
});