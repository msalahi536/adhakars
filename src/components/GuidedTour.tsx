import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Portal } from "@/components/Portal";

type TourStep = { route: string; target: string; title: string; body: string };

const NAV = (n: number) => `.bottom-nav .nav-item:nth-child(${n})`;

export const TOUR_STEPS: TourStep[] = [
  { route: "/app", target: ".adhkar-counter-target", title: "Morning adhkar", body: "Tap the counter each time you recite. Swipe the card left or right to move on." },
  { route: "/app", target: NAV(2), title: "Evening adhkar", body: "Your evening remembrance lives here, ready after Asr." },
  { route: "/app/salah", target: NAV(3), title: "Salah", body: "Prayer times for your location, a live countdown, and adhan alerts." },
  { route: "/app/tasbih", target: NAV(4), title: "Tasbih", body: "A simple counter for your dhikr. Just tap anywhere." },
  { route: "/app/more", target: NAV(5), title: "More", body: "Dua Library, Qibla, Sleep, Ruqyah, Hajj & Umrah and more." },
  { route: "/app/more", target: ".settings-button", title: "Settings", body: "Change your theme, reminder times and more — always up here." },
];

type Rect = { top: number; left: number; width: number; height: number };

export function GuidedTour({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const step = TOUR_STEPS[i];

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    setRect(null);
    if (window.location.pathname.replace(/\/$/, "") !== step.route) void router.navigate({ to: step.route as "/app" });
    const startedAt = performance.now();
    const measure = () => {
      if (cancelled) return;
      const el = document.querySelector(step.target);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0) {
          const pad = 6;
          setRect({ top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 });
        }
      }
      if (performance.now() - startedAt < 1500 || !el) raf = requestAnimationFrame(measure);
    };
    raf = requestAnimationFrame(measure);
    const onResize = () => { startedAtReset(); };
    const startedAtReset = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure); };
    window.addEventListener("resize", onResize);
    return () => { cancelled = true; cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, [i, step.route, step.target, router]);

  const last = i === TOUR_STEPS.length - 1;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const below = rect ? rect.top + rect.height / 2 < vh / 2 : true;
  const tipStyle: React.CSSProperties = rect
    ? below ? { top: Math.min(rect.top + rect.height + 18, vh - 220) } : { bottom: Math.min(Math.max(vh - rect.top + 18, 16), vh - 240) }
    : { top: "40%" };

  return (
    <Portal>
      <div className="tour-root" role="dialog" aria-modal="true" aria-labelledby="tour-title">
        {rect ? (
          <div className="tour-spotlight" style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }} aria-hidden="true">
            <span className="tour-pulse" />
          </div>
        ) : <div className="tour-dim" aria-hidden="true" />}
        <div key={i} className="tour-tip" style={tipStyle}>
          <div className="tour-tip-head">
            <span className="tour-count">{i + 1} of {TOUR_STEPS.length}</span>
            <button type="button" className="tour-skip" onClick={onSkip}>Skip</button>
          </div>
          <h2 id="tour-title">{step.title}</h2>
          <p>{step.body}</p>
          <div className="tour-actions">
            <button type="button" className="tour-back" disabled={i === 0} onClick={() => setI(i - 1)} aria-label="Back"><ArrowLeft size={16} /></button>
            <div className="tour-dots">{TOUR_STEPS.map((_, d) => <span key={d} data-on={d === i} />)}</div>
            <button type="button" className="tour-next" onClick={() => last ? onDone() : setI(i + 1)}>
              {last ? "Finish" : "Next"} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
