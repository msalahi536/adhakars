import { useEffect, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Portal } from "@/components/Portal";
import { triggerHaptic } from "@/lib/theme";

type Sunnah = { arabic: string; translation: string; reference: string | null };

const K_CACHE = "adhkar:sunnah-cache";
const K_DISMISSED = "adhkar:sunnah-dismissed";
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

async function loadSunnah(): Promise<Sunnah | null> {
  try {
    const c = JSON.parse(localStorage.getItem(K_CACHE) || "null");
    if (c?.date === today() && c.item) return c.item;
  } catch {
    // ignore
  }
  for (const url of ["/api/widgets", "https://sahihaladhkar.com/api/widgets"]) {
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const j = await r.json();
      const item = j?.sunnah_of_day as Sunnah | null;
      if (item?.translation) {
        localStorage.setItem(K_CACHE, JSON.stringify({ date: today(), item }));
        return item;
      }
    } catch {
      // try next
    }
  }
  return null;
}

/** Floating daily Sunnah: a card that settles into a small pill; swipe or X hides it for the day. */
export function SunnahOfTheDay({ hidden }: { hidden?: boolean }) {
  const [item, setItem] = useState<Sunnah | null>(null);
  const [state, setState] = useState<"off" | "card" | "pill">("off");
  const [open, setOpen] = useState(false);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const floatRef = useRef<HTMLDivElement | null>(null);
  const start = useRef<{ x: number; y: number; dragX: number; dragY: number; left: number; top: number } | null>(null);
  const moved = useRef(false);

  useEffect(() => {
    let alive = true;
    const onOpen = () => {
      localStorage.removeItem(K_DISMISSED);
      void loadSunnah().then((s) => {
        if (!alive || !s) return;
        setItem(s);
        setState("pill");
        setOpen(true);
      });
    };
    window.addEventListener("adhkar:open-sunnah", onOpen);
    if (localStorage.getItem("adhkar:open-sunnah") === "1") {
      localStorage.removeItem("adhkar:open-sunnah");
      onOpen();
    } else if (localStorage.getItem(K_DISMISSED) !== today()) {
      void loadSunnah().then((s) => {
        if (!alive || !s) return;
        setItem(s);
        window.setTimeout(() => alive && setState((v) => (v === "off" ? "card" : v)), 1800);
      });
    }
    return () => {
      alive = false;
      window.removeEventListener("adhkar:open-sunnah", onOpen);
    };
  }, []);

  // Settle into a quiet pill after a few seconds.
  useEffect(() => {
    if (state !== "card") return;
    const t = window.setTimeout(() => {
      setDrag({ x: 0, y: 0 });
      setState("pill");
    }, 6500);
    return () => window.clearTimeout(t);
  }, [state]);

  const dismiss = () => {
    localStorage.setItem(K_DISMISSED, today());
    setOpen(false);
    setState("off");
    void triggerHaptic("light");
  };

  const onDown = (e: React.PointerEvent) => {
    const rect = floatRef.current?.getBoundingClientRect();
    if (!rect) return;
    start.current = {
      x: e.clientX,
      y: e.clientY,
      dragX: drag.x,
      dragY: drag.y,
      left: rect.left - drag.x,
      top: rect.top - drag.y,
    };
    moved.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!start.current) return;
    const shell = document.querySelector<HTMLElement>(".app-shell")?.getBoundingClientRect();
    const rect = floatRef.current?.getBoundingClientRect();
    if (!rect) return;
    const rawX = start.current.dragX + e.clientX - start.current.x;
    const rawY = start.current.dragY + e.clientY - start.current.y;
    if (Math.abs(e.clientX - start.current.x) + Math.abs(e.clientY - start.current.y) > 6) moved.current = true;
    const minX = (shell?.left ?? 0) + 8 - start.current.left;
    const maxX = (shell?.right ?? window.innerWidth) - rect.width - 8 - start.current.left;
    const minY = 92 - start.current.top;
    const maxY = window.innerHeight - rect.height - 104 - start.current.top;
    setDrag({
      x: Math.min(Math.max(rawX, minX), maxX),
      y: Math.min(Math.max(rawY, minY), maxY),
    });
  };
  const onUp = () => {
    if (!start.current) return;
    start.current = null;
    if (!moved.current) {
      if (state === "pill") {
        setDrag({ x: 0, y: 0 });
        setState("card");
        void triggerHaptic("light");
      } else {
        setOpen(true);
      }
    }
  };

  if (!item || state === "off" || hidden) return null;
  const pull = Math.min(1, (Math.abs(drag.x) + drag.y) / 140);

  return (
    <>
      <div
        ref={floatRef}
        className={`sunnah-float is-${state} ${drag.x || drag.y ? "is-dragging" : ""}`}
        style={{ transform: `translate3d(${drag.x}px, ${drag.y}px, 0)`, opacity: 1 - pull * 0.15 }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        role="button"
        aria-label="Open Sunnah of the day"
      >
        <span className="sunnah-float-icon">
          <Sparkles size={state === "card" ? 16 : 18} strokeWidth={1.8} />
          {state === "pill" && <span className="sunnah-float-dot" />}
        </span>
        {state === "card" ? (
          <span className="sunnah-float-body">
            <span className="sunnah-float-kicker">Sunnah of the day</span>
            <span className="sunnah-float-text">{item.translation}</span>
          </span>
        ) : (
          <span className="sr-only">Show today's Sunnah</span>
        )}
        {state === "card" && (
          <button
            className="sunnah-float-close"
            aria-label="Hide for today"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); dismiss(); }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && (
        <Portal>
          <div className="sunnah-sheet-backdrop" onClick={() => setOpen(false)}>
            <div className="sunnah-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Sunnah of the day">
              <div className="sunnah-sheet-handle" />
              <div className="sunnah-float-kicker">Sunnah of the day</div>
              <p className="sunnah-sheet-arabic" dir="rtl" lang="ar">{item.arabic}</p>
              <p className="sunnah-sheet-text">{item.translation}</p>
              {item.reference && <p className="sunnah-sheet-ref">{item.reference}</p>}
              <div className="sunnah-sheet-actions">
                <button className="sunnah-sheet-btn is-ghost" onClick={dismiss}>Hide for today</button>
                <button className="sunnah-sheet-btn" onClick={() => { setOpen(false); setState("pill"); }}>Close</button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
