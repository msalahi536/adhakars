import { expect, test } from "bun:test";
import { buildQuranIndex, createState, defaultPlan, stats } from "./index";

const q = buildQuranIndex([{ id: 114, pages: [604, 604] }]);
const today = "2026-11-01";

test("a partially learned Juz Amma page with memory is not a fully memorized page", () => {
  const state = createState(defaultPlan(today), q);
  state.pages[604] = { page: 604, stage: "learning", linesLearned: 3, history: [], memory: { stability: 4, difficulty: 5, lastReview: today, due: today, reps: 1, lapses: 0 } };
  const result = stats(state, q, today);
  expect(result.pagesMemorized).toBe(0);
  expect(result.byJuz[29].memorized).toBe(0);
  state.pages[604].stage = "sabqi";
  expect(stats(state, q, today).byJuz[29].memorized).toBe(1);
});

test("one known page fills only one of Juz Amma's 23 pages", () => {
  const state = createState({ ...defaultPlan(today), alreadyMemorized: [604] }, q);
  const juz = stats(state, q, today).byJuz[29];
  expect(juz.pages).toBe(23);
  expect(juz.memorized).toBe(1);
  expect(juz.memorized / juz.pages).toBeCloseTo(1 / 23);
});