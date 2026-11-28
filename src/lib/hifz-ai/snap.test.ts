import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import { buildReference, check } from "./checker";
import { QuranIndex } from "./quran-index";
import { detectElsewhere } from "./smart";

const dir = join(import.meta.dir, "../../../public/hifz-ai");
const key = (s: number) => JSON.parse(readFileSync(join(dir, `ayat/${String(s).padStart(3, "0")}.json`), "utf8"));
const words = (s: number, a: number) => key(s)[String(a)].map((w: [number, string, string]) => w[2]) as string[];
const ix = new QuranIndex(JSON.parse(readFileSync(join(dir, "quran-index.json"), "utf8")));
/** How many words into the recitation the reader first offers to jump (or -1 = never). */
function snapsAfter(page: { sura: number; first: number; last: number }, said: string[]): [number, string] {
  const ref = buildReference(key(page.sura), page.sura, page.first, page.last);
  let heard = "";
  for (let k = 0; k < said.length; k++) {
    heard += said[k];
    for (let i = 1; i <= 2; i++) { // two updates per word, like the live app
      const e = detectElsewhere(ix, { ...check(ref, heard, false), heard }, [page]);
      if (e) return [k + 1, `${e.sura}:${e.aya}`];
    }
  }
  return [-1, ""];
}

describe("snap to where the reciter is", () => {
  const page = { sura: 2, first: 6, last: 16 };
  test("Al-Asr is placed within its first three words (of 14)", () => {
    const [n, at] = snapsAfter(page, [...words(103, 1), ...words(103, 2)]);
    expect(at.split(":")[0]).toBe("103");
    expect(n).toBeLessThanOrEqual(3); // وَالْعَصْرِ alone sounds like a few places (ع~ء, ص~س)
  });
  test("reciting the page itself never jumps", () => {
    for (let a = 6; a <= 16; a++) expect(snapsAfter(page, words(2, a))[0]).toBe(-1);
  });
  test("a common opening (إِنَّ ٱلَّذِينَ) waits for more words", () => {
    const [n] = snapsAfter({ sura: 67, first: 1, last: 12 }, words(2, 6).slice(0, 2));
    expect(n).toBe(-1);
  });
  test("every surah of Juz 'Amma is placed within its first 6 words", () => {
    for (let s = 78; s <= 114; s++) {
      const [n, at] = snapsAfter(page, [...words(s, 1), ...words(s, 2), ...(key(s)["3"] ? words(s, 3) : [])]);
      expect([s, at.split(":")[0], n >= 1 && n <= 6]).toEqual([s, String(s), true]);
    }
  });
});

import { withheldUntilPlaced } from "./smart";
test("mistakes are held back until the page is confirmed (a reciter somewhere else)", () => {
  const r = {
    words: [
      { key: "18:9:1", text: "", status: "wrong", expected: "", heard: "" },
      { key: "18:9:2", text: "", status: "correct", expected: "", heard: "" },
      { key: "18:9:3", text: "", status: "skipped", expected: "", heard: "" },
      { key: "18:9:4", text: "", status: "wrong", expected: "", heard: "", issue: "harakah" },
    ],
    extras: [{ kind: "extra" }],
    reachedIndex: 3, startIndex: 0, startKey: "18:9:1",
  } as any;
  const w = withheldUntilPlaced(r);
  expect(w.words.map((x: any) => x.status)).toEqual(["pending", "correct", "pending", "pending"]);
  expect(w.words[3].issue).toBeUndefined();
  expect(w.extras).toEqual([]);
  expect(r.words[0].status).toBe("wrong"); // the original is untouched (elsewhere detection reads it)
});
