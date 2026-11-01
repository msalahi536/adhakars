export type PagePointer = { id: number; x: number; y: number; time: number; distance: number };

export const CONTROLS_IDLE_MS = 4000;

export function pageGesture(start: PagePointer, x: number, y: number, time: number): "tap" | "next" | "previous" | "none" {
  const dx = x - start.x;
  const dy = y - start.y;
  const distance = Math.max(start.distance, Math.hypot(dx, dy));
  if (distance < 10 && time - start.time < 300) return "tap";
  if (Math.abs(dx) > 65 && Math.abs(dy) < 65) return dx < 0 ? "next" : "previous";
  return "none";
}