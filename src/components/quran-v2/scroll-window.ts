export type PageWindow = { first: number; last: number };
export function openingWindow(page: number): PageWindow {
  return { first: Math.max(1, page - 1), last: Math.min(604, page + 1) };
}
export function extendWindow(window: PageWindow, direction: "before" | "after"): PageWindow {
  return direction === "before"
    ? { ...window, first: Math.max(1, window.first - 2) }
    : { ...window, last: Math.min(604, window.last + 2) };
}
export function preservedScrollOffset(scrollTop: number, oldTop: number, newTop: number) {
  return scrollTop + newTop - oldTop;
}