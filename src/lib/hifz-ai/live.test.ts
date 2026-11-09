import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import { buildReference, check, checkReached, type CheckResult, type Reference, type WordResult } from "./checker";
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

import { RecitationTracker } from "./tracker";
describe("start anywhere, go back and repeat", () => {
  const k = key(67);
  const ref = buildReference(k, 67, 1, 12);
  const words: [string, string][] = [];
  for (let a = 1; a <= 12; a++) for (const [w, , ph] of k[String(a)]) words.push([`67:${a}:${w}`, ph]);
  const from = (start: string, n: number) => { const i = words.findIndex((w) => w[0] === start); return words.slice(i, i + n).map((w) => w[1]).join(""); };
  const run = (heard: string, mode: "all" | "reached" = "reached") => {
    const at = new RecitationTracker(ref, mode); const ch = Array.from(heard); const conf = ch.map(() => 1);
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

describe("the tracker only judges what was really recited", () => {
  const k = key(67);
  const ref = buildReference(k, 67, 1, 12);
  const words: [string, string][] = [];
  for (let a = 1; a <= 12; a++) for (const [w, , ph] of k[String(a)]) words.push([`67:${a}:${w}`, ph]);
  const from = (start: string, n: number) => { const i = words.findIndex((w) => w[0] === start); return words.slice(i, i + n).map((w) => w[1]).join(""); };
  const live = (heard: string, mode: "all" | "reached" = "all") => {
    const t = new RecitationTracker(ref, mode); const ch = Array.from(heard); const conf = ch.map(() => 1);
    const ups: CheckResult[] = [];
    for (let i = 6; i <= ch.length + 5; i += 6) ups.push(t.update(ch.slice(0, i).join(""), conf.slice(0, i)));
    return { ups, fin: t.finish(heard, conf) };
  };
  const bad = (r: CheckResult) => r.words.filter((w) => w.status === "wrong" || w.status === "skipped").map((w) => w.key);
  test("mic on, then off, nothing said: no mistakes at all", () => {
    for (const mode of ["all", "reached"] as const) {
      const r = new RecitationTracker(ref, mode).finish("", []);
      expect(bad(r)).toEqual([]);
      expect(r.extras).toEqual([]);
    }
  });
  test("a cough / a stray sound only: no mistakes", () => expect(bad(new RecitationTracker(ref, "all").finish("ءَه", [1, 1, 1]))).toEqual([]));
  test("clean recitation: no mistakes, and the live position never runs ahead", () => {
    const heard = from("67:1:1", 30);
    const { ups, fin } = live(heard, "reached");
    expect(bad(fin)).toEqual([]);
    const order = new Map(ref.words.map((w, i) => [w.key, i]));
    for (const u of ups) {
      const said = u.words.filter((w) => w.status !== "pending").map((w) => order.get(w.key)!);
      expect(Math.max(-1, ...said)).toBeLessThan(30);
    }
  });
  test("a dropped word is skipped", () => {
    const heard = from("67:2:1", 5) + from("67:2:7", 12);
    expect(bad(live(heard, "reached").fin)).toEqual(["67:2:6"]);
  });
  test("an added word shows as extra speech", () => {
    const heard = from("67:2:1", 3) + from("67:4:5", 1) + from("67:2:4", 14);
    const { fin } = live(heard, "reached");
    expect(bad(fin)).toEqual([]);
    expect(fin.extras.length).toBeGreaterThan(0);
  });
  test("breath, then re-reading the last words: no mistakes, no running ahead", () => {
    const heard = from("67:1:1", 6) + from("67:1:4", 3) + from("67:1:7", 12);
    expect(bad(live(heard, "reached").fin)).toEqual([]);
  });
});

describe("reported cases (Al-Fatiha, Al-A'la, going back)", () => {
  const surah = (s: number, first: number, last: number) => {
    const k = key(s); const ref = buildReference(k, s, first, last);
    const words: [string, string][] = [];
    for (let a = first; a <= last; a++) for (const [w, , ph] of k[String(a)]) words.push([`${s}:${a}:${w}`, ph]);
    const w = (start: string, n = 1) => { const i = words.findIndex((x) => x[0] === start); return words.slice(i, i + n).map((x) => x[1]).join(""); };
    return { ref, w };
  };
  const live = (ref: Reference, heard: string, mode: "all" | "reached" = "reached") => {
    const t = new RecitationTracker(ref, mode); const ch = Array.from(heard); const conf = ch.map(() => 1);
    const ups: CheckResult[] = [];
    for (let i = 4; i <= ch.length + 3; i += 4) ups.push(t.update(ch.slice(0, i).join(""), conf.slice(0, i)));
    return { ups, fin: t.finish(heard, conf) };
  };
  const flags = (r: CheckResult) => r.words.filter((x) => x.status === "wrong" || x.status === "skipped").map((x) => x.key);
  const AUDHU = "ءَعُۥۥذُبِللَااهِمِنَششَيطَاانِررَجِۦۦۦۦم";
  const BASMALA = "بِسمِللَااهِررَحمَاانِررَحِۦۦۦۦم";
  test("Al-Fatiha: a wrong word for غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ is caught, the rest still followed, آمين ignored", () => {
    const { ref, w } = surah(1, 1, 7);
    const { fin } = live(ref, w("1:6:1", 3) + w("1:7:1", 4) + "صَدَقَ" + w("1:7:8", 2) + "ءَاامِۦۦن");
    expect(flags(fin)).toEqual(["1:7:5", "1:7:6", "1:7:7"]);
    expect(fin.words.find((x) => x.key === "1:7:9")!.status).toBe("correct");
  });
  test("Al-Fatiha then آمين: no mistakes", () => {
    const { ref, w } = surah(1, 1, 7);
    expect(flags(live(ref, w("1:5:1", 4) + w("1:6:1", 3) + w("1:7:1", 9) + "ءَاامِۦۦن").fin)).toEqual([]);
  });
  test("Al-A'la after a'udhu billah and the basmala: starts at ayah 1, never jumps to ayah 7", () => {
    const { ref, w } = surah(87, 1, 15);
    const { ups, fin } = live(ref, AUDHU + BASMALA + w("87:1:1", 4) + w("87:2:1", 3) + w("87:3:1", 3));
    for (const u of ups) for (const x of u.words) if (x.status !== "pending") expect(Number(x.key.split(":")[1])).toBeLessThanOrEqual(3);
    expect(flags(fin)).toEqual([]);
    expect(fin.words.slice(0, 10).every((x) => x.status === "correct")).toBe(true);
  });
  test("Al-Fatiha's own basmala is recited, not cut", () => {
    const { ref, w } = surah(1, 1, 7);
    const { fin } = live(ref, w("1:1:1", 4) + w("1:2:1", 4));
    expect(fin.words.slice(0, 8).every((x) => x.status === "correct")).toBe(true);
  });
  test("going back rewinds the highlight to where the reciter is", () => {
    const { ref, w } = surah(67, 1, 12);
    const { ups, fin } = live(ref, w("67:1:1", 9) + w("67:1:5", 5) + w("67:2:1", 3));
    const shownTo = (r: CheckResult) => r.words.reduce((m, x, i) => (x.status !== "pending" ? i : m), -1);
    // reached the end of ayah 1 (word 9), then on re-reading from 1:5 the highlight went back there
    const done = ups.findIndex((u) => shownTo(u) === 8);
    expect(done).toBeGreaterThan(0);
    expect(ups.slice(done).some((u) => shownTo(u) <= 5)).toBe(true);
    expect(flags(fin)).toEqual([]);
  });
});

describe("whole-Quran sweep findings", () => {
  const ayahs = (s: number, first: number, last: number) => {
    const k = key(s); const ref = buildReference(k, s, first, last);
    const ph = (a: number) => k[String(a)].map((w: [number, string, string]) => w[2]);
    return { ref, ph };
  };
  const run = (ref: Reference, heard: string, opts: { strictHarakat?: boolean } = {}) => {
    const t = new RecitationTracker(ref, "reached", opts); const ch = Array.from(heard); const conf = ch.map(() => 0.95);
    for (let i = 4; i <= ch.length + 3; i += 4) t.update(ch.slice(0, i).join(""), conf.slice(0, i));
    return t.finish(heard, conf);
  };
  const flags = (r: CheckResult) => r.words.filter((x) => x.status === "wrong" || x.status === "skipped").map((x) => x.key + (x.issue ? `(${x.issue})` : ""));
  test("strict harakat: Hamzah's مَلِكِ and عَلَيهُم in Al-Fatiha are flagged against Hafs; off by default", () => {
    const { ref, ph } = ayahs(1, 1, 7);
    const fat = [1, 2, 3, 4, 5, 6, 7].map(ph);
    fat[3][0] = "مَلِكِ"; fat[6][3] = "عَلَيهُم"; fat[6][6] = "عَلَيهُم";
    const heard = fat.map((a) => a.join("")).join(" ");
    expect(flags(run(ref, heard))).toEqual([]);
    expect(flags(run(ref, heard, { strictHarakat: true }))).toEqual(["1:4:1(length)", "1:7:4(harakah)", "1:7:7(harakah)"]);
  });
  test("strict harakat: a correct recitation stays clean", () => {
    const { ref, ph } = ayahs(1, 1, 7);
    expect(flags(run(ref, [1, 2, 3, 4, 5, 6, 7].map((a) => ph(a).join("")).join(" "), { strictHarakat: true }))).toEqual([]);
  });
  test("a whole ayah left out, next ayah with the same opening (82:3 skipped, 82:4 also starts وَإِذَا)", () => {
    const { ref, ph } = ayahs(82, 1, 8);
    const heard = [1, 2, 4, 5].map((a) => ph(a).join("")).join(" ");
    expect(flags(run(ref, heard))).toEqual(["82:3:1", "82:3:2", "82:3:3"]);
  });
  test("a wrong word sharing one letter with the right one is wrong, not unsure (رَبَّهُم said as مِنَ)", () => {
    const { ref, ph } = ayahs(67, 12, 13);
    const a = ph(12); const heard = [...a.slice(0, 3), "مِنَ", ...a.slice(4)].join("") + " " + ph(13).join("");
    expect(flags(run(ref, heard))).toContain("67:12:4");
  });
  test("went into a similar ayah from elsewhere, then restarted correctly: still reported", () => {
    const { ref, ph } = ayahs(79, 39, 46);
    const other = key(84)["10"].map((w: [number, string, string]) => w[2]).slice(2).join(""); // مَنْ أُوتِيَ كِتَابَهُ وَرَاءَ ظَهْرِهِ
    const heard = ph(39).join("") + " " + ph(40).slice(0, 2).join("") + other + " " + ph(40).join("") + " " + ph(41).join("");
    const r = run(ref, heard);
    expect(flags(r)).toEqual([]);
    expect(r.extras.some((x) => x.kind === "extra")).toBe(true);
  });
});

describe("long surahs (whole-Quran sweep)", () => {
  const page = (s: number, first: number, last: number) => {
    const k = key(s); const ref = buildReference(k, s, first, last);
    const ayah = (a: number) => k[String(a)].map((w: [number, string, string]) => w[2]).join("");
    return { ref, ayah };
  };
  const run = (ref: Reference, heard: string) => {
    const t = new RecitationTracker(ref, "reached"); const ch = Array.from(heard); const conf = ch.map(() => 0.95);
    for (let i = 4; i <= ch.length + 3; i += 4) t.update(ch.slice(0, i).join(""), conf.slice(0, i));
    return t.finish(heard, conf);
  };
  const flags = (r: CheckResult) => r.words.filter((x) => x.status === "wrong" || x.status === "skipped").map((x) => x.key);
  test("starting at 2:69, whose opening is shared with 2:68 and 2:70: placed right, no mistakes", () => {
    const { ref, ayah } = page(2, 65, 72);
    const r = run(ref, [69, 70, 71].map(ayah).join(" "));
    expect(flags(r)).toEqual([]);
    expect(r.words.filter((x) => x.status !== "pending").every((x) => ["2:69", "2:70", "2:71"].some((p) => x.key.startsWith(p + ":")))).toBe(true);
  });
  test("redoing two very long ayat (Al-Baqarah 2:25 + 2:26, ~110 words): no mistakes", () => {
    const { ref, ayah } = page(2, 24, 29);
    expect(flags(run(ref, [24, 25, 26, 25, 26, 27].map(ayah).join(" ")))).toEqual([]);
  });
});

describe("single clear letter swap", () => {
  test("صِرَاطَ said with ز in Al-Fatiha is a mistake when the model is sure", () => {
    const k = key(1); const ref = buildReference(k, 1, 1, 7);
    const fat = [1, 2, 3, 4, 5, 6, 7].map((a) => k[String(a)].map((w: [number, string, string]) => w[2]));
    fat[6][0] = fat[6][0].replace("صِ", "زِ");
    const heard = fat.map((a) => a.join("")).join(" ");
    const sure = new RecitationTracker(ref, "reached").finish(heard, Array.from(heard).map(() => 0.97));
    expect(sure.words.find((w) => w.key === "1:7:1")!.status).toBe("wrong");
    const unsure = new RecitationTracker(ref, "reached").finish(heard, Array.from(heard).map(() => 0.7));
    expect(unsure.words.find((w) => w.key === "1:7:1")!.status).toBe("unsure");
  });
});

describe("strict mode: other riwayat read against Hafs", () => {
  const one = (s: number, a: number, wi: number, change: (p: string) => string, strict = true) => {
    const k = key(s); const ref = buildReference(k, s, a, a); const ph = k[String(a)].map((w: [number, string, string]) => w[2]);
    ph[wi - 1] = change(ph[wi - 1]); const heard = ph.join("");
    const w = new RecitationTracker(ref, "all", { strictHarakat: strict }).finish(heard, Array.from(heard).map(() => 0.96)).words[wi - 1];
    return `${w.status}${w.issue ? ":" + w.issue : ""}`;
  };
  test("Qunbul's ٱلسِّرَاطَ (light س for heavy ص)", () => expect(one(1, 6, 2, (p) => p.replace(/ص/g, "س"))).toBe("wrong:letter"));
  test("a light letter made heavy: ذَٰلِكَ with ظ", () => expect(one(2, 2, 1, (p) => p.replace("ذ", "ظ"))).toBe("wrong:letter"));
  test("Warsh's tas-hil in ءَأَنذَرْتَهُمْ", () => expect(one(2, 6, 6, (p) => p.replace("ءَءَ", "ءَٲ"))).toBe("wrong:tashil"));
  test("heavy/light swaps are forgiven when strict mode is off", () => expect(one(2, 2, 1, (p) => p.replace("ذ", "ظ"), false)).toBe("correct"));
});
