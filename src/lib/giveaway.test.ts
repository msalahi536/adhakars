import { expect, test } from "bun:test";
import { completedGoals, drawWinner } from "./giveaway";

test("each completed goal is one entry", () => {
  expect(completedGoals({ surahs: 5, dhikr: 499, referrals: 0 })).toEqual(["surahs"]);
  expect(completedGoals({ surahs: 5, dhikr: 500, referrals: 5 })).toHaveLength(3);
});
test("draw is weighted by tickets", () => {
  const e = [{ id: "a", tickets: 1 }, { id: "b", tickets: 3 }];
  expect(drawWinner(e, () => 0.2)?.id).toBe("b");
  expect(drawWinner(e, () => 0.1)?.id).toBe("a");
  expect(drawWinner([{ tickets: 0 }])).toBeNull();
});
