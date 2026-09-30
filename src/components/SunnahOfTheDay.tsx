import { useEffect, useState } from "react";
import { BookOpen, ChevronRight } from "lucide-react";
import { Portal } from "@/components/Portal";
import { triggerHaptic } from "@/lib/theme";

type Sunnah = { arabic: string; translation: string; reference: string | null };

const K_CACHE = "adhkar:sunnah-cache";
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

/** Daily Sunnah entry for the More page, with its full reading in a bottom sheet. */
export function SunnahOfTheDay() {
  const [item, setItem] = useState<Sunnah | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    const onOpen = () => {
      void loadSunnah().then((s) => {
        if (!alive || !s) return;
        setItem(s);
        setOpen(true);
      });
    };
    window.addEventListener("adhkar:open-sunnah", onOpen);
    if (localStorage.getItem("adhkar:open-sunnah") === "1") {
      localStorage.removeItem("adhkar:open-sunnah");
      onOpen();
    } else {
      void loadSunnah().then((s) => {
        if (!alive || !s) return;
        setItem(s);
      });
    }
    return () => {
      alive = false;
      window.removeEventListener("adhkar:open-sunnah", onOpen);
    };
  }, []);

  const show = () => {
    setOpen(true);
    void triggerHaptic("light");
  };

  if (!item) return null;

  return (
    <>
      <button
        className="sunnah-more-entry"
        onClick={show}
        aria-label="Open Sunnah of the day"
      >
        <span className="sunnah-more-icon" aria-hidden="true">
          <BookOpen size={22} strokeWidth={1.7} />
          <span className="sunnah-more-page-line" />
        </span>
        <span className="sunnah-more-copy">
          <span className="sunnah-float-kicker">Sunnah of the day</span>
          <span className="sunnah-more-text">“{item.translation}”</span>
          {item.reference && <span className="sunnah-more-reference">{item.reference}</span>}
        </span>
        <span className="sunnah-more-open" aria-hidden="true">
          <ChevronRight className="sunnah-more-chevron" size={17} strokeWidth={1.8} />
        </span>
      </button>

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
                <button className="sunnah-sheet-btn" onClick={() => setOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
