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
  const start = useRef<{ x: number; y: number } | null>(null);
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
    const t = window.setTimeout(() => setState("pill"), 9000);
    return () => window.clearTimeout(t);
  }, [state]);

  const dismiss = () => {
    localStorage.setItem(K_DISMISSED, today());
    setOpen(false);
    setState("off");
    void triggerHaptic("light");
  };

  const onDown = (e: React.PointerEvent) => {
    start.current = { x: e.clientX, y: e.clientY };
    moved.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!start.current) return;
    const x = e.clientX - start.current.x;
    const y = Math.max(0, e.clientY - start.current.y);
    if (Math.abs(x) + y > 6) moved.current = true;
    setDrag({ x, y });
  };
  const onUp = () => {
    if (!start.current) return;
    start.current = null;
    if (Math.abs(drag.x) > 80 || drag.y > 50) dismiss();
    else if (!moved.current) setOpen(true);
    setDrag({ x: 0, y: 0 });
  };

  if (!item || state === "off" || hidden) return null;
  const pull = Math.min(1, (Math.abs(drag.x) + drag.y) / 140);

  return (
    <>
      <div
        className={`sunnah-float is-${state} ${drag.x || drag.y ? "is-dragging" : ""}`}
        style={{ transform: `translate(${drag.x}px, ${drag.y}px)`, opacity: 1 - pull * 0.6 }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        role="button"
        aria-label="Open Sunnah of the day"
      >
        <span className="sunnah-float-icon"><Sparkles size={state === "card" ? 16 : 14} strokeWidth={1.8} /></span>
        {state === "card" ? (
          <span className="sunnah-float-body">
            <span className="sunnah-float-kicker">Sunnah of the day</span>
            <span className="sunnah-float-text">{item.translation}</span>
          </span>
        ) : (
          <span className="sunnah-float-kicker">Sunnah</span>
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
