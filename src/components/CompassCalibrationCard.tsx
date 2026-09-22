import { useEffect, useRef, useState } from "react";
import { Check, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subscribeOrientation } from "@/lib/compass";

type Props = {
  onDone: () => void;
  onSkip: () => void;
};

const WIDTH = 286;
const HEIGHT = 174;
const PATH = "M143 87 C88 16 31 31 31 87 C31 143 88 158 143 87 C198 16 255 31 255 87 C255 143 198 158 143 87";

export function CompassCalibrationCard({ onDone, onSkip }: Props) {
  const [mode, setMode] = useState<"waiting" | "live" | "nosensor">("waiting");
  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);
  const lastRef = useRef<{ beta: number; gamma: number } | null>(null);
  const movementRef = useRef(0);
  const gotRef = useRef(false);

  useEffect(() => {
    const unsubscribe = subscribeOrientation((reading) => {
      if (reading.beta === null || reading.gamma === null) return;
      gotRef.current = true;
      setMode("live");

      const last = lastRef.current;
      lastRef.current = { beta: reading.beta, gamma: reading.gamma };
      if (!last || complete) return;

      const betaDelta = Math.min(8, Math.abs(reading.beta - last.beta));
      const gammaDelta = Math.min(8, Math.abs(reading.gamma - last.gamma));
      if (betaDelta + gammaDelta < 0.8) return;

      movementRef.current = Math.min(100, movementRef.current + (betaDelta + gammaDelta) * 0.65);
      const next = Math.round(movementRef.current);
      setProgress(next);
      if (next >= 100) setComplete(true);
    });
    const timeout = window.setTimeout(() => {
      if (!gotRef.current) setMode("nosensor");
    }, 4000);
    return () => {
      unsubscribe();
      window.clearTimeout(timeout);
    };
  }, [complete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 px-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="calibration-title">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl">
        <div className="border-b border-border px-6 pb-4 pt-5">
          <p className="label-caps text-accent">Compass calibration</p>
          <h2 id="calibration-title" className="mt-1 font-display text-2xl font-semibold">
            {complete ? "Calibration complete" : "Move your phone in a figure eight"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {complete
              ? "Your compass is ready to guide you toward the Qibla."
              : "Hold your phone securely and draw a slow, wide figure eight in the air. Follow the motion shown below."}
          </p>
        </div>

        <div className="px-6 py-5">
          <div className="relative mx-auto overflow-hidden rounded-xl border border-border bg-muted/50" style={{ width: WIDTH, height: HEIGHT }}>
            <svg className="absolute inset-0" width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true">
              <path d={PATH} fill="none" stroke="var(--border)" strokeWidth="10" strokeLinecap="round" />
              <path d={PATH} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeDasharray="7 9" />
            </svg>
            <div className={`calibration-phone ${complete ? "is-complete" : ""}`} aria-hidden="true">
              {complete ? <Check size={20} strokeWidth={2} /> : <Smartphone size={20} strokeWidth={1.8} />}
            </div>
          </div>

          {mode === "nosensor" ? (
            <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
              Motion readings are unavailable. You can continue and calibrate from your phone settings if needed.
            </p>
          ) : (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                <span>{mode === "waiting" ? "Waiting for motion" : complete ? "Ready" : "Keep moving slowly"}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <p className="mt-4 text-[11px] leading-5 text-muted-foreground">
            Keep away from magnets, metal surfaces, and magnetic phone cases while calibrating.
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
          <Button variant="ghost" className="rounded-full text-muted-foreground" onClick={onSkip}>Skip for now</Button>
          <Button className="rounded-full px-6" onClick={complete || mode === "nosensor" ? onDone : onSkip}>
            {complete ? "Continue" : mode === "nosensor" ? "Continue" : "Use compass"}
          </Button>
        </div>
      </div>
    </div>
  );
}