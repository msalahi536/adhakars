import { useCallback, useEffect, useRef, useState, type CSSProperties, type TouchEvent } from "react";

/**
 * Drag-a-sheet-down-to-dismiss that does not steal taps from the buttons inside it.
 *
 * Setting state on touchstart re-renders the sheet, and the browser then retargets the
 * click it synthesizes after a finger tap to a shared ancestor — so the button's own
 * onClick never fires (this is how the after-salah close button stopped working). The
 * start position therefore lives in a ref: nothing re-renders until the finger moves.
 */
export function useSheetDrag(closed: boolean, onDismiss: () => void, threshold = 90) {
  const startY = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!closed) return;
    startY.current = null;
    setDragY(0);
    setDragging(false);
  }, [closed]);

  const onTouchStart = useCallback((e: TouchEvent) => {
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (startY.current === null) return;
    const dy = Math.max(0, e.touches[0].clientY - startY.current);
    if (dy > 0) {
      setDragging(true);
      setDragY(dy);
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (dragY > threshold) onDismiss();
    startY.current = null;
    setDragY(0);
    setDragging(false);
  }, [dragY, onDismiss, threshold]);

  const style: CSSProperties = {
    transform: `translateY(${dragY}px)`,
    transition: dragging ? "none" : "transform 220ms ease",
  };

  return { dragY, dragging, handlers: { onTouchStart, onTouchMove, onTouchEnd }, style };
}
