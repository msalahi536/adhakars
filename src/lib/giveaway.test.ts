import { expect, test } from "bun:test";
import { completedGoals, countEntries, drawWinner } from "./giveaway";

test("each completed goal is one entry", () => {
  expect(completedGoals({ surahs: 5, dhikr: 499, referrals: 0 })).toEqual(["surahs"]);
  expect(completedGoals({ surahs: 5, dhikr: 500, referrals: 5 })).toHaveLength(3);
});
test("every 5 downloads adds one extra entry", () => {
  expect(countEntries({ surahs: 0, dhikr: 0, referrals: 0 })).toBe(0);
  expect(countEntries({ surahs: 0, dhikr: 0, referrals: 4 })).toBe(0);
  expect(countEntries({ surahs: 0, dhikr: 0, referrals: 5 })).toBe(1);
  expect(countEntries({ surahs: 0, dhikr: 0, referrals: 10 })).toBe(2);
  expect(countEntries({ surahs: 5, dhikr: 500, referrals: 10 })).toBe(4);
  expect(countEntries({ surahs: 5, dhikr: 500, referrals: 14 })).toBe(4);
});
test("draw is weighted by tickets", () => {
  const e = [{ id: "a", tickets: 1 }, { id: "b", tickets: 3 }];
  expect(drawWinner(e, () => 0.5)?.id).toBe("b");
  expect(drawWinner(e, () => 0.1)?.id).toBe("a");
  expect(drawWinner([{ tickets: 0 }])).toBeNull();
});
