import { describe, expect, test } from "bun:test";
import { enterManzil, gradeAyah, gradePage, newAyah, nextAyahInterval, pageReady, pageStrength, pullForward } from "./scheduler";
import { emptyState, mergeHifz } from "./store";

const T = "2026-10-26", N = "2026-10-26T00:00:00Z";

describe("hifz rules", () => {
  test("new ayah starts at 1 day; perfect doubles 1→2→4→8", () => {
    let a = newAyah("1:1", 1, T, N);
    expect(a.interval).toBe(1);
    const seen = [];
    for (let i = 0; i < 3; i++) { a = gradeAyah(a, "perfect", T, N); seen.push(a.interval); }
    expect(seen).toEqual([2, 4, 8]);
  });
  test("blank resets, mistake halves (min 1), hesitation ×1.2 ceil", () => {
    expect(nextAyahInterval(8, "blank")).toBe(1);
    expect(nextAyahInterval(8, "mistake")).toBe(4);
    expect(nextAyahInterval(1, "mistake")).toBe(1);
    expect(nextAyahInterval(8, "hesitation")).toBe(10);
  });
  test("graduates at 14 days", () => {
    const a = gradeAyah({ ...newAyah("1:1", 1, T, N), interval: 7 }, "perfect", T, N);
    expect(a.graduated).toBe(true);
    expect(gradeAyah({ ...newAyah("1:1", 1, T, N), interval: 6 }, "perfect", T, N).graduated).toBe(false);
  });
  test("page enters manzil only when all ayahs graduated; strength is weakest", () => {
    const g = { ...newAyah("1:1", 1, T, N), interval: 16, graduated: true };
    const s = { ...newAyah("1:2", 1, T, N), interval: 4 };
    expect(pageReady([g, s])).toBe(false);
    expect(pageReady([g])).toBe(true);
    expect(pageStrength([g, s])).toBe(4);
  });
  test("manzil starts at 7 and caps at 30", () => {
    const p = enterManzil(1, T, N);
    expect(p.interval).toBe(7);
    expect(gradePage({ ...p, interval: 20 }, [], "perfect", [], T, N).page.interval).toBe(30);
  });
  test("page mistake sends tapped ayahs to sabqi at 1 day", () => {
    const g = { ...newAyah("1:1", 1, T, N), interval: 16, graduated: true, stage: "manzil" as const };
    const r = gradePage(enterManzil(1, T, N), [g, { ...g, key: "1:2" }], "mistake", ["1:2"], T, N);
    expect(r.ayahs[1]).toMatchObject({ stage: "sabqi", interval: 1, graduated: false });
    expect(r.ayahs[0].interval).toBe(16);
    expect(r.page.inManzil).toBe(false);
  });
  test("3 taps on a word pulls page review to today", () => {
    const p = enterManzil(1, T, N);
    expect(pullForward(p, 2, T, N).due).not.toBe(T);
    expect(pullForward(p, 3, T, N).due).toBe(T);
  });
  test("merge keeps newest item and unions reviews", () => {
    const a = { ...emptyState(), ayahs: { "1:1": { ...newAyah("1:1", 1, T, "2026-01-01"), interval: 2 } }, reviews: [{ id: "x" } as never] };
    const b = { ...emptyState(), ayahs: { "1:1": { ...newAyah("1:1", 1, T, "2026-02-01"), interval: 8 } }, reviews: [{ id: "y" } as never] };
    const m = mergeHifz(a, b);
    expect(m.ayahs["1:1"].interval).toBe(8);
    expect(m.reviews.length).toBe(2);
  });
});
