// Shared state for the one recitation popup. The popup is bound to the audio
// player (not to a card), so it can survive the swipe stack swapping cards —
// each speaker button registers its DOM node as an anchor and the popup
// re-anchors itself to the currently playing card.
import { useSyncExternalStore } from "react";
import type { Track } from "./recitation-player";

export type PopupOpen = {
  openerId: string;
  title: string;
  tracks: Track[];
  label: string | null;
};

let open: PopupOpen | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export function setPopupOpen(next: PopupOpen | null) {
  open = next;
  emit();
}

export function closePopup() {
  if (open) setPopupOpen(null);
}

export function usePopupOpen(): PopupOpen | null {
  return useSyncExternalStore(
    (f) => { subs.add(f); return () => { subs.delete(f); }; },
    () => open,
    () => null,
  );
}

const anchors = new Map<string, HTMLElement>();

export function setAnchor(id: string, el: HTMLElement | null) {
  if (el) anchors.set(id, el);
  else anchors.delete(id);
}

export function getAnchor(id: string) {
  return anchors.get(id) ?? null;
}
