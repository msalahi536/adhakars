import { expect, test } from "bun:test";
import { nextArrowBurst, nextBackBurst } from "./rapid-back";

test("more than two rapid back taps bypass animation", () => {
  const first = nextBackBurst({ last: -Infinity, count: 0 }, 1000);
  const second = nextBackBurst(first, 1100);
  const third = nextBackBurst(second, 1200);
  expect(first.count > 2).toBe(false);
  expect(second.count > 2).toBe(false);
  expect(third.count > 2).toBe(true);
});
test("normal paced back taps restore animation", () => {
  expect(nextBackBurst({ last: 1200, count: 3 }, 1600).count).toBe(1);
});
test("three rapid forward taps bypass animation too", () => {
  const first = nextArrowBurst({ last: -Infinity, count: 0, direction: 1 }, 1000, 1);
  const second = nextArrowBurst(first, 1100, 1);
  const third = nextArrowBurst(second, 1200, 1);
  expect(first.count).toBe(1);
  expect(second.count).toBe(2);
  expect(third.count).toBe(3);
  expect(nextArrowBurst(third, 1600, 1).count).toBe(1);
  expect(nextArrowBurst(third, 1250, -1).count).toBe(1);
});