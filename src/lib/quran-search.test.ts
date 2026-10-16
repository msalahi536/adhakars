import { describe, expect, test } from "bun:test";
import { searchChapters, searchReciters } from "./quran";

const ch = [
  { id: 1, name_simple: "Al-Fatihah", name_arabic: "الفاتحة", translated_name: { name: "The Opener" } },
  { id: 2, name_simple: "Al-Baqarah", name_arabic: "البقرة", translated_name: { name: "The Cow" } },
  { id: 36, name_simple: "Ya-Sin", name_arabic: "يس", translated_name: { name: "Ya Sin" } },
  { id: 112, name_simple: "Al-Ikhlas", name_arabic: "الإخلاص", translated_name: { name: "The Sincerity" } },
];
const ids = (q: string) => searchChapters(ch, q).map((c) => c.id);

describe("quran smart search", () => {
  test("number and verse key", () => { expect(ids("2")).toEqual([2]); expect(ids("2:255")).toEqual([2]); });
  test("ignores al- and spelling", () => { expect(ids("baqara")).toEqual([2]); expect(ids("fatiha")).toEqual([1]); expect(ids("yasin")).toEqual([36]); });
  test("meaning", () => { expect(ids("cow")).toEqual([2]); });
  test("one-letter typo", () => { expect(ids("ikhlaz")).toEqual([112]); });
  test("arabic", () => { expect(ids("البقرة")).toEqual([2]); });
  test("reciters", () => {
    expect(searchReciters("mishary")[0].id).toBe(7);
    expect(searchReciters("ghamdi")[0].id).toBe(13);
    expect(searchReciters("dosari")[0].name).toContain("Yasser");
  });
});

test("reciter spelling variants find each other", () => {
  const names = (q: string) => searchReciters(q, 10).map((r) => r.name);
  expect(names("lohaidan").some((n) => /Luhaidan/.test(n))).toBe(true);
  expect(names("luhaidan").some((n) => /Lohaidan/.test(n))).toBe(true);
  expect(names("luhaydan").some((n) => /Lohaidan/.test(n))).toBe(true);
});

test("Mohammed Al-Lohaidan is fifth among popular reciters", async () => {
  const { POPULAR_RECITERS, findReciter } = await import("./quran");
  expect(findReciter(POPULAR_RECITERS[4]).name).toBe("Mohammed Al-Lohaidan");
});
