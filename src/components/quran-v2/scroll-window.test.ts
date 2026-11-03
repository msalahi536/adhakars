import { expect, test } from "bun:test";
import { extendWindow, openingWindow, preservedScrollOffset } from "./scroll-window";

test("an opened passage has its previous page above and next page below", () => {
  expect(openingWindow(50)).toEqual({first:49,last:51});
  expect(openingWindow(592)).toEqual({first:591,last:593});
});
test("earlier pages load two at a time down to page 1", () => {
  expect(extendWindow({first:49,last:51}, "before")).toEqual({first:47,last:51});
  expect(extendWindow({first:2,last:51}, "before")).toEqual({first:1,last:51});
  expect(extendWindow({first:1,last:51}, "before")).toEqual({first:1,last:51});
});
test("forward loading and opening stop at the real 1–604 boundaries", () => {
  expect(openingWindow(1)).toEqual({first:1,last:2});
  expect(openingWindow(604)).toEqual({first:603,last:604});
  expect(extendWindow({first:1,last:603}, "after")).toEqual({first:1,last:604});
});
test("adding content above preserves the exact reading position", () => {
  expect(preservedScrollOffset(130, 220, 1820)).toBe(1730);
  expect(preservedScrollOffset(1730, 220, 220)).toBe(1730);
});