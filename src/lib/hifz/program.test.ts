import { describe, expect, test } from "bun:test";
import {
  createTracker,
  flattenSession,
  knownPages,
  morningReminderBody,
  hasSabaq,
  SLEEP_REMINDER_BODY,
  drillPages,
  pageVersesFrom,
  TRY_FIRST_MS,
  HESITATION_WINDOW_MS,
} from "./program";
import { buildQuranIndex, defaultPlan, createState, buildSession, juzPages, type Session } from "./index";
import type { ReciteWord } from "@/lib/recite/model";

const chapters = [
  { id: 1, pages: [1, 1] as [number, number] },
  { id: 2, pages: [2, 48] as [number, number] },
  { id: 114, pages: [604, 604] as [number, number] },
];
const q = buildQuranIndex(chapters);

const word = (verse: string, position: number): ReciteWord => ({
  key: `${verse}:${position}`,
  verse,
  position,
  line: 1,
  page: 1,
  text: "w",
  glyph: "w",
  end: false,
  audio: null,
  translation: "",
  transliteration: "",
});

describe("knownPages", () => {
  test("whole juz selection adds exactly the juz page range", () => {
    const [a, b] = juzPages(30);
    const pages = knownPages(q, [30], []);
    expect(pages[0]).toBe(a);
    expect(pages[pages.length - 1]).toBe(b);
    expect(pages.length).toBe(b - a + 1);
  });
  test("surah selection uses the chapter page range and dedupes with juz picks", () => {
    const pages = knownPages(q, [1], [2]);
    expect(pages).toContain(2);
    expect(pages).toContain(48);
    expect(new Set(pages).size).toBe(pages.length);
  });
  test("nothing yet means no known pages", () => {
    expect(knownPages(q, [], [])).toEqual([]);
  });
});

describe("flattenSession", () => {
  test("one item per review page, drills grouped, sabaq and link kept", () => {
    const session: Session = {
      date: "2026-11-01",
      totalMinutes: 20,
      dueCount: 3,
      carriedOver: 0,
      steps: [
        { type: "manzil", pages: [100, 200], minutes: 4 },
        { type: "sabqi", pages: [560], minutes: 2 },
        { type: "weakSpots", spots: [], minutes: 1 },
        { type: "sabaq", page: 562, fromLine: 0, lines: 7, minutes: 10 },
        { type: "link", pages: [562, 561], minutes: 2 },
      ],
    };
    const items = flattenSession(session);
    expect(items.map((i) => i.kind)).toEqual(["review", "review", "review", "drills", "sabaq", "link"]);
    expect(items[0]).toMatchObject({ stage: "manzil", page: 100 });
    expect(items[2]).toMatchObject({ stage: "sabqi", page: 560 });
    expect(items[4]).toMatchObject({ page: 562, fromLine: 0, lines: 7 });
  });
  test("a real beginner session starts with sabaq and link only", () => {
    const s = createState({ ...defaultPlan("2026-11-01"), alreadyMemorized: [] });
    const session = buildSession(s, q, "2026-11-01");
    const kinds = flattenSession(session).map((i) => i.kind);
    expect(kinds).toEqual(["sabaq", "link"]);
  });
});

describe("tracker", () => {
  test("reveals within 2s of the previous word count as hesitations", () => {
    const t = createTracker();
    t.recordReveal(1000);
    t.recordReveal(1000 + HESITATION_WINDOW_MS - 1);
    t.recordReveal(9000);
    const p = t.toPerformance([word("1:1", 1)], 30);
    expect(p.hesitations).toBe(1);
  });
  test("peeks and unsure marks count as hesitations and small marks", () => {
    const t = createTracker();
    t.recordPeek();
    t.recordMark("1:1:2", "unsure");
    const p = t.toPerformance([word("1:1", 1), word("1:1", 2)], 30);
    expect(p.hesitations).toBe(1);
    expect(p.small).toBe(1);
  });
  test("wrong and skipped words become failed keys; correcting removes them", () => {
    const t = createTracker();
    t.recordMark("1:1:1", "wrong");
    t.recordMark("1:2:1", "skipped");
    t.recordMark("1:1:1", "correct");
    const words = [word("1:1", 1), word("1:1", 2), word("1:2", 1)];
    const p = t.toPerformance(words, 45);
    expect(p.wrong).toBe(0);
    expect(p.skipped).toBe(1);
    expect(p.failedKeys).toEqual(["1:2:1"]);
    expect(p.failedTransitions).toEqual(["1:2"]); // first word of 1:2 failed
  });
  test("blank and self grade pass through; evidence lists mistakes and hints", () => {
    const t = createTracker();
    t.recordBlank();
    t.recordMark("1:1:1", "wrong");
    t.recordPeek();
    const p = t.toPerformance([word("1:1", 1)], 60, 2);
    expect(p.blank).toBe(true);
    expect(p.selfGrade).toBe(2);
    expect(t.evidence([word("1:1", 1)])).toBe("1 mistake, 1 hint");
  });
  test("desirable difficulty constants match the brief", () => {
    expect(TRY_FIRST_MS).toBe(3000);
    expect(HESITATION_WINDOW_MS).toBe(2000);
  });
});

describe("reminders", () => {
  test("morning body names the review pages and minutes", () => {
    const session: Session = {
      date: "2026-11-01",
      totalMinutes: 12,
      dueCount: 2,
      carriedOver: 0,
      steps: [
        { type: "manzil", pages: [100, 200], minutes: 4 },
        { type: "sabaq", page: 562, fromLine: 0, lines: 7, minutes: 8 },
      ],
    };
    expect(morningReminderBody(session)).toBe("Review is ready: 2 pages, about 12 min");
    expect(hasSabaq(session)).toBe(true);
  });
  test("sleep body is the fixed line and only matters with sabaq", () => {
    expect(SLEEP_REMINDER_BODY).toBe("Recite today's new lines once more before you sleep");
    expect(hasSabaq({ date: "", steps: [], totalMinutes: 0, dueCount: 0, carriedOver: 0 })).toBe(false);
  });
});

describe("drills", () => {
  test("drill pages prefer weak-spot pages and stay in range", () => {
    const s = createState({ ...defaultPlan("2026-11-01"), alreadyMemorized: [100, 101] });
    s.weakSpots["1:1:2"] = { key: "1:1:2", kind: "word", page: 1, fails: 2, passes: 0, lastFailed: "2026-11-01" };
    const pages = drillPages(s, q, "2026-11-01");
    expect(pages[0]).toBe(1);
    expect(pages).toContain(100);
    expect(pages.every((p) => p >= 1 && p <= 604)).toBe(true);
  });
  test("pageVersesFrom strips end markers", () => {
    const pv = pageVersesFrom({
      page: 1,
      verses: [
        { key: "1:1", number: 1, chapter: 1, juz: 1, translation: "", words: [word("1:1", 1), { ...word("1:1", 2), end: true }] },
      ],
    });
    expect(pv.verses[0].words.length).toBe(1);
  });
});
