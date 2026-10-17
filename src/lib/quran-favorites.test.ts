import { expect, test } from "bun:test";
import { favoritesFirst } from "./quran-favorites";

test("hearted reciters move to the front, newest heart first", () => {
  const list = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
  expect(favoritesFirst(list, [4, 2]).map((r) => r.id)).toEqual([4, 2, 1, 3]);
});
