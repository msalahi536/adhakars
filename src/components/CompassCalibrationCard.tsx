import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subscribeOrientation } from "@/lib/compass";

type Props = {
  onDone: () => void;
  onSkip: () => void;
};

const SECTORS = 12; // heading directions to sweep through
const TILT_ZONES = 8; // tilt directions (figure-eight lobes)
const SIZE = 220;
const R = 96;

/**
 * Live calibration: the dot follows your phone's tilt, the ring fills in as
 * you rotate through every direction. Both must be covered to finish.
 */
export function CompassCalibrationCard({ onDone, onSkip }: Props) {
  const [mode, setMode] = useState<"waiting" | "live" | "nosensor">("waiting");
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [sectors, setSectors] = useState<boolean[]>(() => Array(SECTORS).fill(false));
  const [zones, setZones] = useState<boolean[]>(() => Array(TILT_ZONES).fill(false));
  const [heading, setHeading] = useState<number | null>(null);
  const gotRef = useRef(false);

  const sectorCount = sectors.filter(Boolean).length;
  const zoneCount = zones.filter(Boolean).length;
  const progress = Math.round(((sectorCount / SECTORS) * 0.6 + (zoneCount / TILT_ZONES) * 0.4) * 100);
  const complete = progress >= 100;

  useEffect(() => {
    const unsubscribe = subscribeOrientation((r) => {
      gotRef.current = true;
      setMode("live");
      if (r.beta !== null && r.gamma !== null) {
        const x = Math.max(-1, Math.min(1, r.gamma / 45));
        const y = Math.max(-1, Math.min(1, r.beta / 45));
        setTilt({ x, y });
        if (Math.hypot(x, y) > 0.45) {
          const ang = (Math.atan2(y, x) * 180) / Math.PI + 360;
          const z = Math.floor(((ang + 180 / TILT_ZONES) % 360) / (360 / TILT_ZONES));
          setZones((p) => (p[z] ? p : p.map((v, i) => (i === z ? true : v))));
        }
      }
      if (r.heading !== null) {
        setHeading(r.heading);
        const s = Math.floor(r.heading / (360 / SECTORS)) % SECTORS;
        setSectors((p) => (p[s] ? p : p.map((v, i) => (i === s ? true : v))));
      }
    });
    const t = window.setTimeout(() => {
      if (!gotRef.current) setMode("nosensor");
    }, 4000);
    return () => {
      unsubscribe();
      window.clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (complete && typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(30);
  }, [complete]);

  const c = SIZE / 2;
  const arc = (i: number) => {
    const a0 = ((i * 360) / SECTORS - 90 + 2) * (Math.PI / 180);
    const a1 = (((i + 1) * 360) / SECTORS - 90 - 2) * (Math.PI / 180);
    return `M ${c + R * Math.cos(a0)} ${c + R * Math.sin(a0)} A ${R} ${R} 0 0 1 ${c + R * Math.cos(a1)} ${c + R * Math.sin(a1)}`;
  };

  const status =
    mode === "waiting"
      ? "Waiting for motion…"
      : complete
        ? "Calibration complete"
        : sectorCount < SECTORS
          ? "Slowly turn around in a full circle"
          : "Now tilt your phone in a figure eight";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 px-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="calibration-title">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-2xl">
        <div className="px-6 pb-2 pt-5 text-center">
          <p className="label-caps text-accent">Compass calibration</p>
          <h2 id="calibration-title" className="mt-1 font-display text-2xl font-semibold">{status}</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {complete ? "Your compass is ready." : "Fill the ring by turning, and move the dot to every edge by tilting."}
          </p>
        </div>

        <div className="flex justify-center px-6 py-3">
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
            {sectors.map((on, i) => (
              <path key={i} d={arc(i)} fill="none" strokeWidth={10} strokeLinecap="round"
                stroke={on ? "var(--accent)" : "color-mix(in oklab, var(--muted-foreground) 25%, transparent)"} style={{ transition: "stroke 250ms" }} />
            ))}
            {zones.map((on, i) => {
              const a = ((i * 360) / TILT_ZONES) * (Math.PI / 180);
              return <circle key={i} cx={c + 62 * Math.cos(a)} cy={c + 62 * Math.sin(a)} r={4}
                fill={on ? "var(--accent)" : "var(--muted)"} stroke="var(--border)" />;
            })}
            <circle cx={c} cy={c} r={70} fill="none" stroke="var(--border)" strokeDasharray="3 5" />
            {heading !== null && (
              <line x1={c} y1={c} x2={c + 82 * Math.sin((heading * Math.PI) / 180)} y2={c - 82 * Math.cos((heading * Math.PI) / 180)}
                stroke="var(--muted-foreground)" strokeWidth={1.5} strokeLinecap="round" opacity={0.5} />
            )}
            <g style={{ transform: `translate(${c + tilt.x * 62}px, ${c + tilt.y * 62}px)`, transition: "transform 90ms linear" }}>
              <circle r={14} fill="var(--accent)" opacity={0.18} />
              <circle r={8} fill="var(--accent)" />
            </g>
            {complete && (
              <g transform={`translate(${c - 14} ${c - 14})`}>
                <circle cx={14} cy={14} r={18} fill="var(--card)" />
                <Check x={2} y={2} width={24} height={24} color="var(--accent)" strokeWidth={2.4} />
              </g>
            )}
          </svg>
        </div>

        <div className="px-6">
          {mode === "nosensor" ? (
            <p className="text-center text-xs leading-5 text-muted-foreground">
              Motion readings are unavailable on this device.
            </p>
          ) : (
            <>
              <div className="mb-1.5 flex justify-between text-[11px] font-semibold text-muted-foreground">
                <span>Directions {sectorCount}/{SECTORS} · Tilt {zoneCount}/{TILT_ZONES}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${progress}%` }} />
              </div>
            </>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border px-5 py-4">
          <Button variant="ghost" className="rounded-full text-muted-foreground" onClick={onSkip}>Close</Button>
          <Button className="rounded-full px-6" onClick={onDone}>{complete ? "Done" : "Finish"}</Button>
        </div>
      </div>
    </div>
  );
}
