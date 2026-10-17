import { describe, expect, test } from "bun:test";
import { locate, stripTags } from "./quran";

const timings = [
  { key: "1:1", from: 0, to: 6090, segments: [[1, 0, 580], [2, 580, 1409]] as [number, number, number][] },
  { key: "1:2", from: 6090, to: 11680, segments: [[1, 6025, 7025]] as [number, number, number][] },
];

describe("quran karaoke sync", () => {
  test("finds verse and word at a time", () => {
    expect(locate(timings, 700)).toEqual({ key: "1:1", word: 2 });
    expect(locate(timings, 6500)).toEqual({ key: "1:2", word: 1 });
  });
  test("returns nothing past the end", () => {
    expect(locate(timings, 20000)).toEqual({ key: null, word: null });
  });
  test("removes footnote markers from translations", () => {
    expect(stripTags("In the name of Allāh,<sup foot_note=1>1</sup> the Merciful")).toBe("In the name of Allāh, the Merciful");
  });
});

test("mp3quran reciters only add people Quran.com lacks and keep Quran.com first", async () => {
  const { RECITERS, reciterHasPhoto } = await import("./quran");
  const ids = RECITERS.map((r) => r.id);
  expect(new Set(ids).size).toBe(ids.length);
  const firstNoPhoto = RECITERS.findIndex((r) => !reciterHasPhoto(r));
  expect(RECITERS.slice(firstNoPhoto).every((r) => !reciterHasPhoto(r))).toBe(true);
  expect(RECITERS.some((r) => r.server && /alafas|minshawi|husary|sudaes|ghamdi/i.test(r.name))).toBe(false);
});

describe("Quran home reciter strip", () => {
  test("favorited reciters come first and no name repeats", async () => {
    const { homeReciterRow, RECITERS, reciterName } = await import("./quran");
    const row = homeReciterRow([2]);
    expect(reciterName(row[0])).toBe("AbdulBaset AbdulSamad");
    const names = row.map((r) => reciterName(r));
    expect(new Set(names).size).toBe(names.length);
    expect(row.length).toBeLessThanOrEqual(10);
    expect(row.every((r) => RECITERS.includes(r))).toBe(true);
  });
  test("an unknown favorite is skipped instead of repeating the first reciter", async () => {
    const { homeReciterRow, reciterName } = await import("./quran");
    const row = homeReciterRow([999999]);
    const names = row.map((r) => reciterName(r));
    expect(new Set(names).size).toBe(names.length);
    expect(names.length).toBeGreaterThan(0);
  });
});

