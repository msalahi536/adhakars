import { describe, expect, test } from "bun:test";
import { CONTROLS_IDLE_MS, pageGesture, type PagePointer } from "./page-gesture";

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
    expect(pageGesture(start, 20, 100, 200)).toBe("next");
    expect(pageGesture(start, 180, 100, 200)).toBe("previous");
    expect(pageGesture(start, 20, 180, 200)).toBe("none");
  });
  test("controls hide after four seconds idle", () => {
    expect(CONTROLS_IDLE_MS).toBe(4000);
  });
});