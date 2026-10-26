process.env.TZ = "America/Los_Angeles";
import { describe, expect, test } from "bun:test";
import { enterManzil, gradeAyah, gradePage, isDue, localDay, newAyah, nextAyahInterval, pageReady, pageStrength, reviewInterval } from "./scheduler";
import { derive, mergeHifz, type HifzEvent } from "./store";

const D = "2026-10-26";
let n = 0;
const ev = (e: Partial<HifzEvent> & Pick<HifzEvent, "kind" | "key" | "page">, day: string, id?: string): HifzEvent => ({
  id: id ?? `id-${++n}`,
  at: `${day}T12:00:${String(n % 60).padStart(2, "0")}Z`,
  day,
  ...e,
});
const days = (start: string, i: number) => {
  const d = new Date(start + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + i);
  return d.toISOString().slice(0, 10);
};

// Reviews on each due date: 1 → 2 → 4 → 8 → 16 (graduated).
const ON_TIME = [1, 3, 7, 15];

describe("ayah intervals", () => {
  test("new ayah starts at 1; perfect 1→2→4→8", () => {
    let a = newAyah("1:1", 1, D);
    const seen = [a.interval];
    for (let i = 0; i < 3; i++) seen.push((a = gradeAyah(a, "perfect", a.due)).interval);
    expect(seen).toEqual([1, 2, 4, 8]);
  });
  test("mistake at 1 stays 1", () => expect(nextAyahInterval(1, "mistake")).toBe(1));
  test("hesitation at 1 becomes 2", () => expect(nextAyahInterval(1, "hesitation")).toBe(2));
  test("blank resets to 1", () => expect(nextAyahInterval(8, "blank")).toBe(1));
  test("exactly 14 graduates", () => expect(gradeAyah({ ...newAyah("1:1", 1, D), interval: 7, due: D }, "perfect", D)).toMatchObject({ interval: 14, graduated: true }));
  test("13 × 1.2 → 16 graduates", () => expect(gradeAyah({ ...newAyah("1:1", 1, D), interval: 13, due: D }, "hesitation", D)).toMatchObject({ interval: 16, graduated: true }));
});

describe("pages", () => {
  const grad = (key: string) => ({ ...newAyah(key, 1, D), interval: 16, graduated: true });
  test("never exceeds 30 days", () => {
    let p = enterManzil(1, D);
    for (let i = 0; i < 10; i++) p = gradePage(p, [grad("1:1")], "perfect", [], p.due).page;
    expect(p.interval).toBe(30);
  });
  test("non-graduated ayah keeps page out of manzil", () => expect(pageReady([grad("1:1"), newAyah("1:2", 1, D)])).toBe(false));
  test("only memorized ayahs are judged", () => {
    // Page 1 has ayahs 1:1–1:7; only 1:1 and 1:2 are memorized and both graduated.
    const evs: HifzEvent[] = [];
    for (const k of ["1:1", "1:2"]) {
      evs.push(ev({ kind: "learn", key: k, page: 1 }, D));
      for (const o of ON_TIME) evs.push(ev({ kind: "ayah", key: k, page: 1, grade: "perfect" }, days(D, o)));
    }
    expect(derive(evs).pages[1]?.inManzil).toBe(true);
  });
  test("strength drops for overdue items", () => {
    const a = { ...newAyah("1:1", 1, D), interval: 10, due: D };
    expect(pageStrength([a], D)).toBe(10);
    expect(pageStrength([a], days(D, 4))).toBe(6);
  });
  test("page mistake sends tapped ayahs to sabqi at 1 day", () => {
    const r = gradePage(enterManzil(1, D), [grad("1:1"), grad("1:2")], "mistake", ["1:2"], D);
    expect(r.ayahs[1]).toMatchObject({ stage: "sabqi", interval: 1 });
    expect(r.page.inManzil).toBe(false);
  });
});

describe("due today", () => {
  test("flips at local midnight, not UTC", () => {
    const item = { due: "2026-10-26" };
    // 05:00 UTC Oct 26 is still 22:00 Oct 25 in Los Angeles.
    expect(localDay(new Date("2026-10-26T05:00:00Z"))).toBe("2026-10-25");
    expect(isDue(item, new Date("2026-10-26T05:00:00Z"))).toBe(false);
    expect(isDue(item, new Date("2026-10-26T07:00:00Z"))).toBe(true);
  });
});

describe("repeated word errors", () => {
  const setup = () => {
    const evs: HifzEvent[] = [];
    evs.push(ev({ kind: "learn", key: "1:1", page: 1 }, D));
    for (const o of ON_TIME) evs.push(ev({ kind: "ayah", key: "1:1", page: 1, grade: "perfect" }, days(D, o)));
    return evs; // page 1 in manzil from D+15, due D+22
  };
  const tap = (day: string) => ev({ kind: "page", key: "1", page: 1, grade: "hesitation", errorWords: ["1:1:2"] }, day);
  test("3 taps within 30 days pull the page to today", () => {
    const evs = [...setup(), tap(days(D, 16)), tap(days(D, 17)), tap(days(D, 18))];
    expect(derive(evs).pages[1].due).toBe(days(D, 18));
  });
  test("taps older than 30 days don't count", () => {
    const evs = [...setup(), tap(days(D, 16)), tap(days(D, 51)), tap(days(D, 52))];
    expect(derive(evs).pages[1].due).not.toBe(days(D, 52));
  });
  test("a Perfect review of the ayah resets its count", () => {
    const evs = [...setup(), tap(days(D, 16)), tap(days(D, 17)), ev({ kind: "ayah", key: "1:1", page: 1, grade: "perfect" }, days(D, 17)), tap(days(D, 18))];
    expect(derive(evs).wordErrors["1:1:2"]).toHaveLength(1);
  });
});

describe("sync merge", () => {
  test("two devices' offline reviews recompute in order", () => {
    const learn = ev({ kind: "learn", key: "2:255", page: 42 }, D, "learn");
    const phone = { plan: null, events: [learn, ev({ kind: "ayah", key: "2:255", page: 42, grade: "perfect" }, days(D, 1), "a")] };
    const tablet = { plan: null, events: [learn, ev({ kind: "ayah", key: "2:255", page: 42, grade: "perfect" }, days(D, 3), "b")] };
    // 1 → perfect 2 → perfect 4
    expect(derive(mergeHifz(phone, tablet).events).ayahs["2:255"].interval).toBe(4);
  });
  test("same log synced twice doesn't double-count", () => {
    const s = { plan: null, events: [ev({ kind: "learn", key: "1:1", page: 1 }, D, "l"), ev({ kind: "ayah", key: "1:1", page: 1, grade: "perfect" }, days(D, 1), "r")] };
    const twice = mergeHifz(mergeHifz(s, s), s);
    expect(twice.events).toHaveLength(2);
    expect(derive(twice.events).ayahs["1:1"].interval).toBe(2);
  });
});

describe("early reviews", () => {
  test("practicing a page Perfect 5 times in one day doesn't raise its interval", () => {
    const evs: HifzEvent[] = [];
    let i = 0;
    const e = (x: Omit<HifzEvent, "id" | "at" | "day">, day: string): HifzEvent => ({ ...x, id: `er${++i}`, at: `${day}T1${i % 10}:00:00.${String(i).padStart(3, "0")}Z`, day });
    evs.push(e({ kind: "seed", session: "seed", key: "50", page: 50, grade: "perfect", keys: ["3:1"], dueOffset: 7 }, "2026-10-01"));
    const before = derive(evs).pages[50];
    for (let n = 0; n < 5; n++) evs.push(e({ kind: "page", session: "session", key: "50", page: 50, grade: "perfect" }, "2026-10-03"));
    const after = derive(evs).pages[50];
    expect(after.interval).toBe(before.interval);
  });
  test("early Perfect earns elapsed × 2, early Hesitation elapsed × 1.2; on-time unchanged", () => {
    expect(reviewInterval(10, "2026-10-20", "perfect", "2026-10-18")).toBe(16); // 8 days elapsed
    expect(reviewInterval(10, "2026-10-20", "perfect", "2026-10-12")).toBe(10); // 2 days → max(10, 4)
    expect(reviewInterval(10, "2026-10-20", "hesitation", "2026-10-15")).toBe(6); // 5 × 1.2
    expect(reviewInterval(10, "2026-10-20", "mistake", "2026-10-12")).toBe(5);
    expect(reviewInterval(10, "2026-10-20", "perfect", "2026-10-20")).toBe(20);
  });
});
