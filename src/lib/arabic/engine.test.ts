import { describe, expect, test } from "bun:test";
import { derive, lessonStatus, buildLesson, type ArabicEvent } from "./engine";
import { HEAVY, LESSONS, THROAT } from "./content";

let n = 0;
const ev = (day: string, e: Partial<ArabicEvent>): ArabicEvent =>
  ({ id: `e${n++}`, at: `${day}T10:00:${String(n).padStart(2, "0")}Z`, day, lessonId: "1.1.1", kind: "answer", ...e }) as ArabicEvent;

describe("mastery gate", () => {
  test("next lesson stays locked below 90%", () => {
    const d = derive([ev("2026-10-01", { kind: "lesson", score: 0.85 })]);
    expect(lessonStatus(d, "1.1.2", "2026-10-01")).toBe("locked");
    expect(lessonStatus(d, "1.1.1", "2026-10-01")).toBe("retry-tomorrow");
    expect(lessonStatus(d, "1.1.1", "2026-10-02")).toBe("open");
  });
  test("90% unlocks the next lesson", () => {
    const d = derive([ev("2026-10-01", { kind: "lesson", score: 0.9 })]);
    expect(lessonStatus(d, "1.1.1", "2026-10-01")).toBe("passed");
    expect(lessonStatus(d, "1.1.2", "2026-10-01")).toBe("open");
  });
});

describe("review scheduling", () => {
  test("mastered items are due tomorrow, a correct review doubles the interval", () => {
    const pass = ev("2026-10-01", { kind: "lesson", score: 1 });
    let d = derive([pass]);
    expect(d.items["l:ب"].due).toBe("2026-10-02");
    d = derive([pass, ev("2026-10-02", { itemId: "l:ب", correct: true })]);
    expect(d.items["l:ب"]).toMatchObject({ interval: 2, due: "2026-10-04" });
  });
  test("failed lesson schedules nothing", () => {
    expect(Object.keys(derive([ev("2026-10-01", { kind: "lesson", score: 0.5 })]).items)).toHaveLength(0);
  });
});

describe("error log", () => {
  test("counts which letter was confused with which", () => {
    const d = derive([
      ev("2026-10-01", { itemId: "l:ح", correct: false, picked: "l:ه" }),
      ev("2026-10-01", { itemId: "l:ح", correct: false, picked: "l:ه" }),
    ]);
    expect(d.confusions["l:ح>l:ه"]).toBe(2);
  });
});

test("throat and heavy letter sets", () => {
  expect(THROAT.sort()).toEqual(["ء", "ه", "ع", "ح", "غ", "خ"].sort());
  expect(HEAVY.sort()).toEqual(["خ", "ص", "ض", "غ", "ط", "ق", "ظ"].sort());
});

test("lesson loop order: model before practice, apply last", () => {
  const steps = buildLesson(LESSONS[0], derive([]), "2026-10-01", () => 0.3);
  const kinds = steps.map((s) => s.kind);
  expect(kinds[0]).toBe("model");
  expect(kinds.indexOf("pick")).toBeGreaterThan(kinds.lastIndexOf("repeat"));
  expect(kinds.at(-1)).toBe("apply");
});
