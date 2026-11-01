import { useRef } from "react";
import { Button } from "@/components/ui/button";

export function PopupHandle({ dismiss }: { dismiss: () => void }) {
  const drag = useRef<{ y: number; time: number; panel: HTMLElement } | null>(null);
  return <Button variant="ghost" aria-label="Dismiss popup" className="hz-popup-handle"
    onPointerDown={(event) => {
      const panel = event.currentTarget.closest<HTMLElement>('[role="dialog"]');
      if (!panel) return;
      drag.current = { y: event.clientY, time: performance.now(), panel };
      event.currentTarget.setPointerCapture(event.pointerId);
      panel.style.transition = "none";
    }}
    onPointerMove={(event) => {
      if (!drag.current) return;
      drag.current.panel.style.translate = `0 ${Math.max(0, event.clientY - drag.current.y)}px`;
    }}
    onPointerUp={(event) => {
      const current = drag.current;
      if (!current) return;
      const distance = event.clientY - current.y;
      current.panel.style.transition = "translate 200ms ease";
      current.panel.style.translate = "0 0";
      drag.current = null;
      if (distance > 60 || (distance > 25 && performance.now() - current.time < 200)) dismiss();
    }}
    onPointerCancel={() => {
      if (drag.current) { drag.current.panel.style.translate = "0 0"; drag.current.panel.style.transition = ""; }
      drag.current = null;
    }}
    onClick={(event) => { if (event.detail === 0) dismiss(); }}
  ><span /></Button>;
}