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
  test("the reciter just chosen from See All leads the strip", async () => {
    const { homeReciterRow, reciterName } = await import("./quran");
    const row = homeReciterRow([2], 200001);
    expect(row[0].id).toBe(200001);
    expect(reciterName(row[0])).toBe("Muhammad Aba Al-Hasan");
    expect(row.filter((r) => r.id === 200001).length).toBe(1);
    const names = row.map((r) => reciterName(r));
    expect(new Set(names).size).toBe(names.length);
  });
  test("an unknown favorite is skipped instead of repeating the first reciter", async () => {
    const { homeReciterRow, reciterName } = await import("./quran");
    const row = homeReciterRow([999999]);
    const names = row.map((r) => reciterName(r));
    expect(new Set(names).size).toBe(names.length);
    expect(names.length).toBeGreaterThan(0);
  });
});

describe("reciter list order", () => {
  test("an owner reciter sits among the first 15 of the See All list", async () => {
    const { POPULAR_RECITERS, RECITERS, findReciter } = await import("./quran");
    const popIds = new Set(POPULAR_RECITERS);
    const all = [...POPULAR_RECITERS.map(findReciter), ...RECITERS.filter((r) => r.group === 1 && !popIds.has(r.id))];
    const pos = all.findIndex((r) => r.id === 200001);
    expect(pos).toBeGreaterThanOrEqual(0);
    expect(pos + 1).toBeLessThanOrEqual(15);
  });
});

describe("reciter labels", () => {
  test("no reciter is labelled Streaming", async () => {
    const { RECITERS, reciterName, reciterSubtitle } = await import("./quran");
    const labelled = RECITERS.filter((r) => /streaming/i.test(`${reciterName(r)} ${reciterSubtitle(r)}`));
    expect(labelled.map((r) => r.id)).toEqual([]);
  });
  test("highlighting labels say what they light up", async () => {
    const { RECITERS, reciterSubtitle } = await import("./quran");
    const word = RECITERS.find((r) => r.group === 1 && r.sync === "word" && !/\(/.test(r.name))!;
    const verse = RECITERS.find((r) => r.group === 1 && r.sync === "verse" && !/\(/.test(r.name))!;
    expect(reciterSubtitle(word)).toBe("Word-by-word highlighting");
    expect(reciterSubtitle(verse)).toBe("Verse-by-verse highlighting");
  });
  test("no label is so long the row clips it", async () => {
    const { RECITERS, reciterSubtitle } = await import("./quran");
    const long = RECITERS.map((r) => [r.id, reciterSubtitle(r)] as const).filter(([, s]) => s.length > 30);
    expect(long).toEqual([]);
  });
});

