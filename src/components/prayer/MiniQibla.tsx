// Self contained mini Qibla indicator: a small compass button that opens a
// popup with a larger compass. Remove this file and its single usage in
// src/routes/app.salah.tsx to drop the feature.

import { useEffect, useRef, useState } from "react";
import {
  getPosition,
  normalizeHeading,
  requestOrientationPermission,
  storePermissionGranted,
  subscribeOrientation,
} from "@/lib/compass";

const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

function bearingToKaaba(lat: number, lng: number): number {
  const p1 = toRad(lat);
  const p2 = toRad(KAABA_LAT);
  const dl = toRad(KAABA_LNG - lng);
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function MiniQibla() {
  const [open, setOpen] = useState(false);
  const [bearing, setBearing] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const smoothRef = useRef<number | null>(null);
  const contRef = useRef(0);
  const [angle, setAngle] = useState(0);

  useEffect(() => () => unsubRef.current?.(), []);

  const start = async () => {
    setNote(null);
    const perm = await requestOrientationPermission();
    if (perm === "granted") storePermissionGranted();
    const pos = await getPosition();
    if (!pos.ok) {
      setNote(pos.error);
      return;
    }
    setBearing(bearingToKaaba(pos.coords.lat, pos.coords.lng));
    if (perm === "denied" || perm === "unsupported") {
      setNote("Compass sensors are unavailable, so only the bearing is shown.");
      return;
    }
    unsubRef.current?.();
    unsubRef.current = subscribeOrientation((r) => {
      if (r.heading === null) return;
      const prev = smoothRef.current;
      let next = r.heading;
      if (prev !== null) {
        const delta = ((r.heading - prev + 540) % 360) - 180;
        if (Math.abs(delta) < 0.6) return;
        next = normalizeHeading(prev + delta * 0.18);
      }
      smoothRef.current = next;
      setHeading(next);
    });
  };

  const target = bearing !== null && heading !== null ? (bearing - heading + 360) % 360 : null;

  useEffect(() => {
    if (target === null) return;
    const cur = contRef.current;
    const delta = ((target - (((cur % 360) + 360) % 360) + 540) % 360) - 180;
    contRef.current = cur + delta;
    setAngle(contRef.current);
  }, [target]);

  const close = () => {
    unsubRef.current?.();
    unsubRef.current = null;
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          void start();
        }}
        aria-label="Qibla direction"
        className="flex items-center justify-center rounded-full"
        style={{
          width: 34,
          height: 34,
          background: "color-mix(in oklab, var(--header-fg) 15%, transparent)",
          color: "var(--header-fg)",
        }}
      >
        <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M12 5.6 L15 15.4 L12 13.2 L9 15.4 Z"
            fill="currentColor"
            transform={target !== null ? `rotate(${target} 12 12)` : undefined}
          />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
          onClick={close}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs rounded-[28px] p-5 text-center"
            style={{
              background: "var(--surface-card)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="label-caps">Qibla</div>
              <button onClick={close} className="text-lg leading-none opacity-60" aria-label="Close">
                ×
              </button>
            </div>

            <div className="relative mx-auto" style={{ width: 200, height: 200 }}>
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "radial-gradient(circle, var(--card) 0%, var(--muted) 78%)",
                  border: "2px solid color-mix(in oklab, var(--accent) 45%, transparent)",
                }}
              />
              {target !== null && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    transform: `rotate(${angle}deg)`,
                    transition: "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                >
                  <svg
                    width={34}
                    height={40}
                    viewBox="0 0 40 46"
                    style={{ transform: "translateY(-32px)" }}
                    aria-hidden="true"
                  >
                    <path d="M20 2 L36 42 L20 33 L4 42 Z" fill="var(--accent)" />
                  </svg>
                </div>
              )}
              <div
                className="absolute left-1/2 top-1/2 rounded-full"
                style={{
                  width: 10,
                  height: 10,
                  marginLeft: -5,
                  marginTop: -5,
                  background: "var(--accent)",
                }}
              />
            </div>

            <div className="mt-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
              {bearing !== null ? (
                <>
                  Qibla bearing{" "}
                  <span className="font-bold" style={{ color: "var(--foreground)" }}>
                    {bearing.toFixed(0)}°
                  </span>
                </>
              ) : (
                "Getting your direction..."
              )}
            </div>
            {note && (
              <div className="mt-2 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                {note}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
