import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import { buildReference, check, checkReached, type CheckResult, type WordResult } from "./checker";
import { MistakeStabilizer } from "./stabilize";
import { QuranIndex } from "./quran-index";
import { detectElsewhere, withoutOpeners } from "./smart";

const dir = join(import.meta.dir, "../../../public/hifz-ai");
const key = (s: number) => JSON.parse(readFileSync(join(dir, `ayat/${String(s).padStart(3, "0")}.json`), "utf8"));
const recite = (s: number, a: number, b: number) => { let t = ""; const k = key(s); for (let x = a; x <= b; x++) for (const [, , ph] of k[String(x)]) t += ph; return t; };
const ISTIADHA = "ءَعُۥۥذُبِللَااهِمِنَششَيطَاانِررَجِۦۦمِ";

describe("stopping mid-page (free reading)", () => {
  const ref = buildReference(key(67), 67, 1, 12);
  const heard = recite(67, 1, 4);
  test("final check of the whole page calls the unread rest 'skipped'", () => {
    expect(check(ref, heard, true).words.filter((w) => w.status === "skipped").length).toBeGreaterThan(50);
  });
  test("checkReached judges only what was reached", () => {
    const r = checkReached(ref, heard);
    expect(r.words.filter((w) => w.status === "skipped" || w.status === "wrong")).toEqual([]);
    expect(r.words.find((w) => w.key === "67:4:10")!.status).toBe("correct");
    expect(r.words.find((w) => w.key === "67:5:1")!.status).toBe("pending");
  });
});

describe("live mistakes wait until sure", () => {
  const w = (key: string, status: WordResult["status"]): WordResult => ({ key, text: key, status, expected: "", heard: "" });
  const res = (statuses: WordResult["status"][]): CheckResult => ({ words: statuses.map((s, i) => w(`1:1:${i + 1}`, s)), extras: [], reachedIndex: 0, startIndex: 0, startKey: "1:1:1" });
  test("a flicker of 'wrong' never shows", () => {
    const st = new MistakeStabilizer();
    for (let i = 0; i < 5; i++) expect(st.apply(res(["correct", "wrong", "correct", "correct", "in_progress"])).words[1].status).toBe("unsure");
    expect(st.apply(res(["correct", "correct", "correct", "correct", "in_progress"])).words[1].status).toBe("correct");
  });
  test("a steady skip shows after 3 updates once the reciter is 3 words past", () => {
    const st = new MistakeStabilizer();
    const seq = [st.apply(res(["correct", "skipped", "correct", "correct", "correct", "in_progress"])), st.apply(res(["correct", "skipped", "correct", "correct", "correct", "in_progress"])), st.apply(res(["correct", "skipped", "correct", "correct", "correct", "in_progress"]))];
    expect(seq.map((r) => r.words[1].status)).toEqual(["unsure", "unsure", "skipped"]);
  });
  test("a steady wrong word shows after 6 updates", () => {
    const st = new MistakeStabilizer();
    const out = Array.from({ length: 6 }, () => st.apply(res(["correct", "wrong", "correct", "correct", "in_progress"])).words[1].status);
    expect(out).toEqual(["unsure", "unsure", "unsure", "unsure", "unsure", "wrong"]);
  });
});

describe("isti'adha and basmala never jump the reader", () => {
  const ix = new QuranIndex(JSON.parse(readFileSync(join(dir, "quran-index.json"), "utf8")));
  const page = { sura: 2, first: 6, last: 16 };
  const ref = buildReference(key(2), 2, 6, 16);
  const live = (heard: string) => detectElsewhere(ix, { ...check(ref, heard, false), heard }, [page]);
  test("withoutOpeners removes them", () => {
    expect(withoutOpeners(ISTIADHA + recite(2, 6, 6))).toBe(recite(2, 6, 6));
  });
  test("a'udhu billah before reciting the page: no jump to An-Nahl", () => {
    const heard = ISTIADHA + recite(2, 6, 7);
    for (let i = 10; i <= heard.length; i += 5) expect(live(heard.slice(0, i))).toBeNull();
  });
  test("really reciting another page is still found", () => {
    const heard = recite(67, 1, 2);
    let found = null;
    for (let i = 10; i <= heard.length && !found; i += 5) found = live(heard.slice(0, i));
    expect(found?.sura).toBe(67);
  });
});

import { Attempts } from "./attempts";
describe("start anywhere, go back and repeat", () => {
  const k = key(67);
  const ref = buildReference(k, 67, 1, 12);
  const words: [string, string][] = [];
  for (let a = 1; a <= 12; a++) for (const [w, , ph] of k[String(a)]) words.push([`67:${a}:${w}`, ph]);
  const from = (start: string, n: number) => { const i = words.findIndex((w) => w[0] === start); return words.slice(i, i + n).map((w) => w[1]).join(""); };
  const run = (heard: string, mode: "all" | "reached" = "reached") => {
    const at = new Attempts(ref, mode); const ch = Array.from(heard); const conf = ch.map(() => 1);
    for (let i = 6; i <= ch.length + 5; i += 6) at.update(ch.slice(0, i).join(""), conf.slice(0, i));
    return at.finish(heard, conf);
  };
  const bad = (r: CheckResult) => r.words.filter((w) => w.status === "wrong" || w.status === "skipped").map((w) => w.key);
  test("starting in the middle of an ayah", () => {
    const r = run(from("67:3:6", 20));
    expect(r.startKey).toBe("67:3:6");
    expect(bad(r)).toEqual([]);
  });
  test("reciting an ayah twice", () => expect(bad(run(from("67:3:1", 18) + from("67:3:1", 18)))).toEqual([]));
  test("going back two ayat and carrying on", () => expect(bad(run(from("67:3:1", 28) + from("67:3:1", 10)))).toEqual([]));
  test("going back to an ayah that starts like the next one (ٱلَّذِى)", () => expect(bad(run(from("67:1:1", 19) + from("67:2:1", 18)))).toEqual([]));
  test("a mistake, then the redo done right, clears the mistake", () => {
    const r = run(from("67:1:1", 5) + from("67:1:7", 3) + from("67:1:1", 9));
    expect(bad(r)).toEqual([]);
  });
  test("a real skip inside the redo still counts", () => {
    const r = run(from("67:3:1", 18) + from("67:3:1", 4) + from("67:3:6", 13));
    expect(bad(r)).toContain("67:3:5");
  });
  test("lessons: words never reached in any attempt are skipped", () => {
    const r = run(from("67:1:1", 9) + from("67:1:1", 9), "all");
    expect(r.words.find((w) => w.key === "67:2:1")!.status).toBe("skipped");
  });
});
