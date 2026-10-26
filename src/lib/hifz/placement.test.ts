process.env.TZ = "America/Los_Angeles";
import { describe, expect, test } from "bun:test";
import { dailyLoad, groupByPage, inheritGrades, samplePages, seedPlan } from "./placement";
import { derive, mergeHifz, type HifzEvent } from "./store";
import { addDays, capGrade } from "./scheduler";
import { ayahsOfPage, countLines, daysToFinish, goalAyahs, pageOfAyah, remainingGoal, surahAyahs } from "./layout";
import type { Grade } from "./scheduler";

const D = "2026-10-26";
const seedEvents = (plan: ReturnType<typeof seedPlan>): HifzEvent[] =>
  plan.map((s, i) => ({ id: `seed-${s.page}`, kind: "seed", session: "seed", key: String(s.page), page: s.page, grade: s.grade, keys: s.keys, dueOffset: s.dueOffset, at: `${D}T12:00:00.${String(i).padStart(3, "0")}Z`, day: D }));

describe("layout", () => {
  test("Al-Baqarah 6 starts on page 3", () => expect(pageOfAyah("2:6")).toBe(3));
  test("page 604 holds Al-Ikhlas through An-Nas", () => expect(ayahsOfPage(604)[0]).toBe("112:1"));
  test("Juz 'Amma goal starts at An-Nas", () => expect(goalAyahs({ type: "juz-amma" })[0]).toBe("114:1"));
  test("full page pace finishes a 15-line page in one day", () => {
    const keys = ayahsOfPage(3);
    expect(countLines(keys)).toBe(15);
    expect(daysToFinish(keys, new Set(), 15)).toBe(1);
    expect(daysToFinish(keys, new Set(), 5)).toBe(4); // ends at ayah boundaries: 4, 5, 5, 3 lines
  });
});

describe("sampling", () => {
  test("about one prompt per two pages, min 3, max 20", () => {
    expect(samplePages([1, 2, 3, 4])).toHaveLength(3);
    expect(samplePages(Array.from({ length: 20 }, (_, i) => i + 1))).toHaveLength(10);
    expect(samplePages(Array.from({ length: 100 }, (_, i) => i + 1))).toHaveLength(20);
  });
  test("spread across everything checked", () => {
    const s = samplePages(Array.from({ length: 100 }, (_, i) => i + 1));
    expect(s[0]).toBeLessThan(10);
    expect(s[s.length - 1]).toBeGreaterThan(90);
  });
});

describe("seeding", () => {
  test("an untested page never seeds as Perfect", () => {
    const pk = groupByPage([...surahAyahs(2, 1, 40)]);
    const g = inheritGrades(pk, { 3: "perfect" });
    for (const p of Object.keys(pk).map(Number)) if (p !== 3) expect(g[p]).not.toBe("perfect");
    expect(g[3]).toBe("perfect");
  });

  test("perfect → manzil 7d; hesitation → due within 3 days; mistake → sabqi 1 day", () => {
    const pk = { 3: ayahsOfPage(3), 4: ayahsOfPage(4), 5: ayahsOfPage(5) };
    const d = derive(seedEvents(seedPlan(pk, { 3: "perfect", 4: "hesitation", 5: "mistake" })));
    expect(d.pages[3]).toMatchObject({ inManzil: true, interval: 7 });
    expect(d.pages[4].inManzil).toBe(true);
    expect(d.pages[4].due <= addDays(D, 3)).toBe(true);
    expect(d.pages[5]?.inManzil ?? false).toBe(false);
    for (const k of pk[5]) expect(d.ayahs[k]).toMatchObject({ stage: "sabqi", interval: 1, due: addDays(D, 1) });
  });

  test("seed survives a sync replay", () => {
    const pk = groupByPage(surahAyahs(2, 1, 60));
    const evs = seedEvents(seedPlan(pk, inheritGrades(pk, { 3: "perfect", 6: "mistake" })));
    const local = { plan: null, events: evs };
    const once = derive(local.events);
    const merged = mergeHifz(mergeHifz(local, { plan: null, events: [] }), local); // synced twice
    expect(merged.events).toHaveLength(evs.length);
    expect(derive(merged.events)).toEqual(once);
  });

  test("100 checked pages give a roughly even daily manzil load", () => {
    const pk: Record<number, string[]> = {};
    const grades: Record<number, Grade> = {};
    for (let p = 2; p < 102; p++) { pk[p] = ayahsOfPage(p); grades[p] = "perfect"; }
    const d = derive(seedEvents(seedPlan(pk, grades)));
    const load: Record<string, number> = {};
    for (const p of Object.values(d.pages)) load[p.due] = (load[p.due] ?? 0) + 1;
    const counts = Object.values(load);
    expect(Object.keys(load)).toHaveLength(30);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
    expect(Object.keys(load).every((day) => day > D && day <= addDays(D, 30))).toBe(true);
  });
});

describe("step 4 fixes", () => {
  test("goal excludes known ayahs", () => {
    const goal = goalAyahs({ type: "juz-amma" });
    const known = new Set(ayahsOfPage(604));
    const left = remainingGoal(goal, known);
    expect(left.some((k) => known.has(k))).toBe(false);
    expect(left[0]).toBe("111:1"); // An-Nas, Al-Falaq, Al-Ikhlas known → next is Al-Masad
    expect(daysToFinish(goal, known, 5)).toBe(daysToFinish(left, new Set(), 5)); // known ayahs add no days
    expect(daysToFinish(goal, new Set(goal), 5)).toBe(0);
  });

  test("a tapped word blocks Perfect", () => {
    expect(capGrade("perfect", false, 1)).toBe("hesitation");
    expect(capGrade("perfect", true, 0)).toBe("hesitation");
    expect(capGrade("perfect", false, 0)).toBe("perfect");
    expect(capGrade("mistake", false, 3)).toBe("mistake");
  });

  test("need-work seeds are spread over 5 days", () => {
    const pk: Record<number, string[]> = {};
    const grades: Record<number, "mistake"> = {};
    for (let p = 2; p < 12; p++) { pk[p] = ayahsOfPage(p); grades[p] = "mistake"; }
    const d = derive(seedEvents(seedPlan(pk, grades)));
    const week = dailyLoad(d, D, 7).map((w) => w.pages);
    expect(week).toEqual([2, 2, 2, 2, 2, 0, 0]);
  });
});
