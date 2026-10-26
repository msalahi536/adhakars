process.env.TZ = "America/Los_Angeles";
import { describe, expect, test } from "bun:test";
import { buildQueue, drillEvent, forecast, pickDrills, salahEvents } from "./session";
import { derive, type HifzEvent } from "./store";
import { ayahsOfPage, pageOfAyah } from "./layout";
import { groupByPage, seedPlan } from "./placement";

const D = "2026-10-26";
let n = 0;
const ev = (e: Omit<HifzEvent, "id" | "at" | "day">, day = D): HifzEvent => ({ ...e, id: `e${++n}`, at: `${day}T10:00:00.${String(n % 1000).padStart(3, "0")}Z`, day });
const juzAmma = { type: "juz-amma" } as const;

describe("forecast", () => {
  test("10 new lines/day for 7 days gives review load on days 2–7", () => {
    const f = forecast([], D, juzAmma, 10, 7);
    expect(f[0].total).toBe(0);
    for (const d of f.slice(1)) expect(d.total).toBeGreaterThan(0);
    expect(f.every((d) => d.newLines >= 9)).toBe(true);
  });
  test("perfect seeds are spread across 30 days", () => {
    const pk: Record<number, string[]> = {};
    for (let p = 2; p < 32; p++) pk[p] = ayahsOfPage(p);
    const g = Object.fromEntries(Object.keys(pk).map((p) => [p, "perfect" as const]));
    const evs = seedPlan(pk, g).map((s) => ev({ kind: "seed", session: "seed", key: String(s.page), page: s.page, grade: s.grade, keys: s.keys, dueOffset: s.dueOffset }));
    const dues = new Set(Object.values(derive(evs).pages).map((p) => p.due));
    expect(dues.size).toBe(30);
  });
});

describe("backlog guard", () => {
  test("pauses new lines when due reviews exceed 2× normal load", () => {
    // 40 manzil pages at a 30-day interval, all overdue.
    const pk = groupByPage(Array.from({ length: 40 }, (_, i) => ayahsOfPage(i + 2)).flat());
    const g = Object.fromEntries(Object.keys(pk).map((p) => [p, "perfect" as const]));
    const evs = seedPlan(pk, g).map((s) => ev({ kind: "seed", session: "seed", key: String(s.page), page: s.page, grade: s.grade, keys: s.keys, dueOffset: 1 }, "2026-09-01"));
    const q = buildQueue(derive(evs), D, juzAmma, 10);
    expect(q.backlog.paused).toBe(true);
    expect(q.sabaq).toEqual([]);
    expect(q.manzil.length).toBe(40);
  });
  test("normal day keeps new lines", () => {
    const q = buildQueue(derive([]), D, juzAmma, 10);
    expect(q.backlog.paused).toBe(false);
    expect(q.sabaq[0]).toBe("114:1");
  });
});

describe("salah logger", () => {
  test("rejects unmemorized ayahs", () => {
    const d = derive([ev({ kind: "learn", key: "112:1", page: 604 })]);
    expect(salahEvents(d, ["112:1", "112:2"], "smooth", "fajr").ok).toBe(false);
    const ok = salahEvents(d, ["112:1"], "stumbled", "fajr");
    expect(ok.ok && ok.events[0]).toMatchObject({ key: "112:1", session: "salah", grade: "hesitation", prayer: "fajr" });
  });
});

describe("transition drills", () => {
  test("a drill logs against the next ayah", () => {
    const e = drillEvent({ prev: "2:5", next: "2:6" }, "perfect");
    expect(e).toMatchObject({ kind: "ayah", session: "drill", key: "2:6", page: pageOfAyah("2:6"), grade: "perfect" });
    expect(drillEvent({ prev: "2:5", next: "2:6" }, "perfect", ["2:6:1"]).grade).toBe("hesitation");
  });
  test("3–5 drills, error boundaries first", () => {
    const evs = ayahsOfPage(604).map((k) => ev({ kind: "learn", key: k, page: 604 }));
    evs.push(ev({ kind: "ayah", key: "113:3", page: 604, grade: "mistake", errorWords: ["113:3:1"] }));
    const ds = pickDrills(derive(evs), () => 0.5);
    expect(ds.length).toBeGreaterThanOrEqual(3);
    expect(ds.length).toBeLessThanOrEqual(5);
    expect(ds[0]).toEqual({ prev: "113:2", next: "113:3" });
  });
});
