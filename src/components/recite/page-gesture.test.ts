import { describe, expect, test } from "bun:test";
import { CONTROLS_IDLE_MS, pageGesture, rubberBand, swipeTarget, type PagePointer } from "./page-gesture";

const start: PagePointer = { id: 1, x: 100, y: 100, time: 0, distance: 0 };
describe("mushaf page pointer gestures", () => {
  test("a tap must move less than 10px", () => {
    expect(pageGesture(start, 109, 100, 100)).toBe("tap");
    expect(pageGesture(start, 110, 100, 100)).toBe("none");
    expect(pageGesture(start, 108, 108, 100)).toBe("none");
    expect(pageGesture({ ...start, distance: 20 }, 100, 100, 100)).toBe("none");
  });
  test("a tap must take less than 300ms, never a long press", () => {
    expect(pageGesture(start, 100, 100, 299)).toBe("tap");
    expect(pageGesture(start, 100, 100, 300)).toBe("none");
    expect(pageGesture(start, 100, 100, 700)).toBe("none");
  });
  test("horizontal swipes turn pages rather than toggle controls", () => {
    expect(pageGesture(start, 20, 100, 200)).toBe("previous");
    expect(pageGesture(start, 180, 100, 200)).toBe("next");
    expect(pageGesture(start, 20, 180, 200)).toBe("none");
  });
  test("controls hide after four seconds idle", () => {
    expect(CONTROLS_IDLE_MS).toBe(4000);
  });
});
test("Arabic swipes right advance, reversed swipes left advance", () => {
  expect(swipeTarget(562, 100, 0, 390, .1, "arabic")).toBe(563);
  expect(swipeTarget(562, -100, 0, 390, .1, "arabic")).toBe(561);
  expect(swipeTarget(562, -100, 0, 390, .1, "reversed")).toBe(563);
});
test("turn at 25 percent width or a fast flick, otherwise spring back", () => {
  expect(swipeTarget(562, 99, 0, 400, .1, "arabic")).toBeNull();
  expect(swipeTarget(562, 100, 0, 400, .1, "arabic")).toBe(563);
  expect(swipeTarget(562, 30, 0, 400, .6, "arabic")).toBe(563);
});
test("vertical gestures and taps never turn", () => {
  expect(swipeTarget(562, 110, 140, 390, 1, "arabic")).toBeNull();
  expect(swipeTarget(562, 5, 0, 390, 1, "arabic")).toBeNull();
});
test("page 1 and 604 resist outward swipes without turning", () => {
  expect(swipeTarget(1, -150, 0, 390, 1, "arabic")).toBeNull();
  expect(swipeTarget(604, 150, 0, 390, 1, "arabic")).toBeNull();
  expect(Math.abs(rubberBand(-150, 1, "arabic"))).toBeLessThan(150);
  expect(Math.abs(rubberBand(150, 604, "arabic"))).toBeLessThan(150);
});