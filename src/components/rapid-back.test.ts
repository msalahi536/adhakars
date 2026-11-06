import { expect, test } from "bun:test";
import { nextBackBurst } from "./rapid-back";

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