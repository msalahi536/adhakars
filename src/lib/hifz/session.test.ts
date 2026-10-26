process.env.TZ = "America/Los_Angeles";
import { describe, expect, test } from "bun:test";
import { buildQueue, drillEvent, forecast, pickDrills, sabaqProgress, salahEvents } from "./session";
import { pageStates } from "./progress";
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
  test("forecast bars apply the catch-up cap, matching Today's queue each day", () => {
    const pk = groupByPage(Array.from({ length: 40 }, (_, i) => ayahsOfPage(i + 2)).flat());
    const g = Object.fromEntries(Object.keys(pk).map((p) => [p, "perfect" as const]));
    const evs = seedPlan(pk, g).map((s) => ev({ kind: "seed", session: "seed", key: String(s.page), page: s.page, grade: s.grade, keys: s.keys, dueOffset: 1 }, "2026-09-01"));
    const day1 = buildQueue(derive(evs), "2026-10-27", juzAmma, 10);
    expect(day1.backlog.paused).toBe(true);
    const f = forecast(evs, D, juzAmma, 10, 7);
    expect(f[0].total).toBe(day1.manzil.length);
    expect(f[0].newLines).toBe(0);
    for (const d of f) expect(d.total).toBeLessThanOrEqual(day1.backlog.limit);
    expect(f.reduce((s, d) => s + d.manzil + d.hesitationSeed, 0)).toBeGreaterThanOrEqual(40);
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
    expect(q.backlog.due).toBe(40);
    expect(q.manzil.length).toBe(q.backlog.limit);
    expect(q.backlog.days).toBe(Math.ceil(40 / q.backlog.limit));
  });
  test("catch-up queue never exceeds the cap and takes the most overdue first", () => {
    for (const count of [10, 40, 120]) {
      const evs = Array.from({ length: count }, (_, i) => {
        const p = i + 2;
        // older seeds are more overdue
        return ev({ kind: "seed", session: "seed", key: String(p), page: p, grade: "perfect", keys: ayahsOfPage(p), dueOffset: 1 }, `2026-0${1 + (i % 9)}-01`);
      });
      const q = buildQueue(derive(evs), D, juzAmma, 10);
      expect(q.manzil.length + q.sabqi.length).toBeLessThanOrEqual(q.backlog.limit);
      if (q.backlog.paused) {
        const d = derive(evs);
        const kept = q.manzil.map((p) => d.pages[p].due).sort().pop()!;
        const dropped = Object.values(d.pages).filter((p) => !q.manzil.includes(p.page)).map((p) => p.due);
        for (const x of dropped) expect(x >= kept).toBe(true);
      }
    }
  });
  test("beginner at 10 lines/day completing every session is never paused in 30 days", () => {
    const f = forecast([], D, { type: "whole", direction: "forward" }, 10, 30);
    expect(f.every((d) => d.newLines > 0)).toBe(true); // chunks end on ayah boundaries, so a day is ~7–10 lines
  });
  test("skipping 5 days triggers the guard", () => {
    // 30 days of perfect sessions, then 5 days skipped.
    let evs: HifzEvent[] = [];
    let day = "2026-09-01";
    for (let i = 0; i < 30; i++) {
      const q = buildQueue(derive(evs), day, juzAmma, 10);
      for (const p of q.manzil) evs.push(ev({ kind: "page", session: "session", key: String(p), page: p, grade: "perfect" }, day));
      for (const g of q.sabqi) for (const k of g.keys) evs.push(ev({ kind: "ayah", session: "session", key: k, page: g.page, grade: "perfect" }, day));
      for (const k of q.sabaq) evs.push(ev({ kind: "learn", key: k, page: pageOfAyah(k) }, day));
      expect(q.backlog.paused).toBe(false);
      day = new Date(Date.parse(day + "T12:00:00Z") + 864e5).toISOString().slice(0, 10);
    }
    const back = new Date(Date.parse(day + "T12:00:00Z") + 5 * 864e5).toISOString().slice(0, 10);
    expect(buildQueue(derive(evs), back, juzAmma, 10).backlog.paused).toBe(true);
  });
  test("reviews due today on schedule never trip the guard", () => {
    const pk = groupByPage(Array.from({ length: 40 }, (_, i) => ayahsOfPage(i + 2)).flat());
    const g = Object.fromEntries(Object.keys(pk).map((p) => [p, "perfect" as const]));
    const evs = seedPlan(pk, g).map((s) => ev({ kind: "seed", session: "seed", key: String(s.page), page: s.page, grade: s.grade, keys: s.keys, dueOffset: 1 }, "2026-10-25"));
    const q = buildQueue(derive(evs), D, juzAmma, 10);
    expect(q.backlog.paused).toBe(false);
    expect(q.manzil.length).toBe(40);
  });
  test("normal day keeps new lines", () => {
    const q = buildQueue(derive([]), D, juzAmma, 10);
    expect(q.backlog.paused).toBe(false);
    expect(q.sabaq[0]).toBe("114:1");
  });
});

describe("sabaq", () => {
  test("is not done until every new ayah is graded", () => {
    const keys = ["114:1", "114:2", "114:3"];
    expect(sabaqProgress(keys, derive([])).done).toBe(false);
    const part = derive([ev({ kind: "learn", key: "114:1", page: 604 }), ev({ kind: "ayah", key: "114:1", page: 604, grade: "perfect" })]);
    const p = sabaqProgress(keys, part);
    expect(p.done).toBe(false);
    expect(p.remaining).toEqual(["114:2", "114:3"]);
    const all = derive(keys.flatMap((k) => [ev({ kind: "learn", key: k, page: 604 }), ev({ kind: "ayah", key: k, page: 604, grade: "hesitation" })]));
    expect(sabaqProgress(keys, all).done).toBe(true);
  });
});

describe("salah logger", () => {
  test("offers the memorized subset of a mixed range", () => {
    const d = derive(["2:1", "2:2", "2:3"].map((k) => ev({ kind: "learn", key: k, page: 2 })));
    const r = salahEvents(d, ["2:1", "2:2", "2:3", "2:4", "2:5"], "smooth", "isha");
    expect(r.ok).toBe(false);
    expect(!r.ok && r.memorized).toEqual(["2:1", "2:2", "2:3"]);
  });
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

describe("heatmap states", () => {
  test("gray, overdue, weak and strong", () => {
    const evs = [
      ev({ kind: "seed", session: "seed", key: "10", page: 10, grade: "perfect", keys: ayahsOfPage(10), dueOffset: 1 }, "2026-10-01"),
      ev({ kind: "learn", key: "114:1", page: 604 }, "2026-10-25"),
      ev({ kind: "seed", session: "seed", key: "20", page: 20, grade: "perfect", keys: ayahsOfPage(20), dueOffset: 30 }, "2026-10-20"),
    ];
    const s = pageStates(derive(evs), D);
    expect(s[1]).toBeUndefined();
    expect(s[10].state).toBe("overdue");
    expect(s[604].state).toBe("weak");
    expect(["strong", "good", "light"]).toContain(s[20].state);
  });
});

describe("hifz reminder", () => {
  test("plans at most 3 days and skips today once the session is done", async () => {
    const { hifzReminderNotes } = await import("./reminder");
    const st = { plan: { targets: [], dailyNewAyahs: 0, direction: "backward" as const, updatedAt: "", goal: juzAmma, paceLines: 5 }, events: [] };
    const now = new Date("2026-10-26T08:00:00");
    const all = hifzReminderNotes(st, now, 19, 0, false);
    expect(all.length).toBeLessThanOrEqual(3);
    expect(all[0].at.getDate()).toBe(26);
    const done = hifzReminderNotes(st, now, 19, 0, true);
    expect(done.every((n) => n.at.getDate() !== 26)).toBe(true);
  });
});
