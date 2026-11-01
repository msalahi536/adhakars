export type PagePointer = { id: number; x: number; y: number; time: number; distance: number };

export const CONTROLS_IDLE_MS = 4000;

export type SwipeDirection = "arabic" | "reversed";
export function swipeDelta(dx: number, direction: SwipeDirection): number {
  return (dx > 0 ? 1 : -1) * (direction === "arabic" ? 1 : -1);
}
export function swipeTarget(page: number, dx: number, dy: number, width: number, velocity: number, direction: SwipeDirection): number | null {
  if (Math.abs(dx) < 10 || Math.abs(dx) <= Math.abs(dy) * 1.3) return null;
  if (Math.abs(dx) < width * .25 && !(Math.abs(dx) >= 20 && Math.abs(velocity) >= .5)) return null;
  const target = page + swipeDelta(dx, direction);
  return target >= 1 && target <= 604 ? target : null;
}
export function rubberBand(dx: number, page: number, direction: SwipeDirection): number {
  const target = page + swipeDelta(dx, direction);
  return target < 1 || target > 604 ? dx * .22 : dx;
}

export function pageGesture(start: PagePointer, x: number, y: number, time: number): "tap" | "next" | "previous" | "none" {
  const dx = x - start.x;
  const dy = y - start.y;
  const distance = Math.max(start.distance, Math.hypot(dx, dy));
  if (distance < 10 && time - start.time < 300) return "tap";
  if (Math.abs(dx) > 65 && Math.abs(dy) < 65) return dx > 0 ? "next" : "previous";
  return "none";
}