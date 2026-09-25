import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Crosshair, Lightbulb, Navigation } from "lucide-react";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { CompassCalibrationCard } from "@/components/CompassCalibrationCard";
import {
  getPosition,
  hasStoredPermission,
  needsGesturePermission,
  normalizeHeading,
  requestOrientationPermission,
  storePermissionGranted,
  subscribeOrientation,
} from "@/lib/compass";






export const Route = createFileRoute("/app/qibla")({
  head: () => ({
    meta: [
      { title: "Qibla Finder, Sahih Al-Adhkar" },
      { name: "description", content: "Find the direction of the Qibla from your location." },
      { property: "og:title", content: "Qibla Finder, Sahih Al-Adhkar" },
      { property: "og:description", content: "Find the direction of the Qibla from your location." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Qibla,
});

// Kaaba coordinates
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

function toRad(d: number) {
  return (d * Math.PI) / 180;
}
function toDeg(r: number) {
  return (r * 180) / Math.PI;
}

function bearingToKaaba(lat: number, lng: number): number {
  const φ1 = toRad(lat);
  const φ2 = toRad(KAABA_LAT);
  const Δλ = toRad(KAABA_LNG - lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function distanceKm(lat: number, lng: number): number {
  const R = 6371;
  const φ1 = toRad(lat);
  const φ2 = toRad(KAABA_LAT);
  const Δφ = toRad(KAABA_LAT - lat);
  const Δλ = toRad(KAABA_LNG - lng);
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const CAL_DONE_KEY = "qibla-calibrated";

function Qibla() {
  const [phase, setPhase] = useState<"intro" | "requesting" | "ready" | "error">("requesting");
  const [step, setStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [absolute, setAbsolute] = useState<boolean | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [qiblaBearing, setQiblaBearing] = useState<number | null>(null);
  const [showCalibration, setShowCalibration] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);
  const smoothRef = useRef<number | null>(null);
  // Continuous (unwrapped) rotation so the arrow never spins the long way
  // around when the heading crosses 360 back to 0.
  const contRef = useRef(0);
  const [arrowAngle, setArrowAngle] = useState(0);

  useEffect(() => {
    return () => {
      unsubRef.current?.();
    };
  }, []);

  // Lock the page in place: no pinch zoom, no dragging the layout around.
  useEffect(() => {
    const stop = (e: Event) => e.preventDefault();
    document.addEventListener("gesturestart", stop, { passive: false });
    document.addEventListener("gesturechange", stop, { passive: false });
    const onTouch = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    document.addEventListener("touchmove", onTouch, { passive: false });
    return () => {
      document.removeEventListener("gesturestart", stop);
      document.removeEventListener("gesturechange", stop);
      document.removeEventListener("touchmove", onTouch);
    };
  }, []);

  const markCalibrated = () => {
    try {
      localStorage.setItem(CAL_DONE_KEY, "1");
    } catch {
      // ignore
    }
    setShowCalibration(false);
  };

  const attachCompass = () => {
    unsubRef.current?.();
    let got = false;
    unsubRef.current = subscribeOrientation((r) => {
      if (r.heading === null) return;
      got = true;
      setAbsolute(r.absolute);
      const prev = smoothRef.current;
      let next = r.heading;
      if (prev !== null) {
        const delta = ((r.heading - prev + 540) % 360) - 180;
        // Ignore tiny jitter so the arrow sits still when the phone does.
        if (Math.abs(delta) < 0.6) return;
        next = normalizeHeading(prev + delta * 0.18);
      }
      smoothRef.current = next;
      setHeading(next);
    });
    setTimeout(() => {
      if (!got && needsGesturePermission()) {
        // Stored permission no longer valid (e.g. iOS reset it): ask again.
        unsubRef.current?.();
        try { localStorage.removeItem("qibla-perm-granted"); } catch { /* ignore */ }
        setPhase("intro");
        return;
      }
      if (!got) {
        setError(
          "No compass readings from this device. Try calibrating, or open the app on a phone.",
        );
      }
    }, 3000);
  };

  // Permissions first, then calibration. Runs from a real user gesture.
  const start = async (skipPrompt = false) => {
    setPhase("requesting");
    setError(null);

    setStep("Requesting motion access…");
    // Permission was already granted before: don't re-prompt (iOS would reject
    // a prompt that isn't triggered by a tap). Just attach to the sensor.
    const sensor = skipPrompt ? "granted" : await requestOrientationPermission();
    if (sensor === "denied") {
      setError(
        "Motion and orientation access was denied. Allow it for this app in your device settings, then try again.",
      );
      setPhase("error");
      return;
    }
    if (sensor === "granted") storePermissionGranted();


    setStep("Getting your location…");
    const pos = await getPosition();
    if (!pos.ok) {
      setError(pos.error);
      setPhase("error");
      return;
    }
    setCoords(pos.coords);
    setQiblaBearing(bearingToKaaba(pos.coords.lat, pos.coords.lng));

    setStep("");
    if (sensor === "unsupported") {
      setError("This device has no compass sensor, so only the bearing is shown.");
    } else {
      attachCompass();
    }
    setPhase("ready");
  };

  // Auto start when opening the page. iOS only allows the motion prompt from a
  // real tap, so the button is kept for that first run; once granted (or on
  // platforms with no prompt) the compass comes up on its own.
  const autoRef = useRef(false);
  useEffect(() => {
    if (autoRef.current) return;
    autoRef.current = true;
    if (!needsGesturePermission()) void start();
    else if (hasStoredPermission()) void start(true);
    else setPhase("intro");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const permState = phase;


  // Rotation to apply to the qibla arrow: bearing - heading, unwrapped.
  const targetRotation =
    qiblaBearing !== null && heading !== null ? (qiblaBearing - heading + 360) % 360 : null;

  useEffect(() => {
    if (targetRotation === null) return;
    const current = contRef.current;
    const delta = ((targetRotation - (((current % 360) + 360) % 360) + 540) % 360) - 180;
    contRef.current = current + delta;
    setArrowAngle(contRef.current);
  }, [targetRotation]);

  const aligned = targetRotation !== null && (targetRotation < 5 || targetRotation > 355);


  return (
    <>
      <header
        className="page-header qibla-header relative overflow-hidden"
        style={{ background: "var(--grad-header)", color: "var(--header-fg)" }}
      >
        <HeaderBackButton />
        <div className="qibla-header-content mx-auto max-w-md px-16 text-center">
          <div className="label-caps" style={{ color: "var(--header-sub)", opacity: 1 }}>
            Direction of Prayer
          </div>
          <h1 className="app-page-title mt-2">Qibla Finder</h1>
        </div>
      </header>

      <main className="scroll-area qb-main">
        <div
          className="qibla-page mx-auto flex min-h-full w-full max-w-md flex-col items-center"
          style={{ color: "var(--foreground)" }}
        >
          {showCalibration && (
            <CompassCalibrationCard onDone={markCalibrated} onSkip={() => setShowCalibration(false)} />
          )}

          {permState !== "ready" && (
            <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 pb-10">
              <p
                className="text-center text-sm"
                style={{ color: "var(--muted-foreground)" }}
              >
                We need your location and motion sensors to compute the Qibla direction. Nothing
                leaves your device.
              </p>
              <button
                onClick={() => void start(false)}
                disabled={permState === "requesting"}
                className="rounded-full px-6 py-3 text-sm font-bold disabled:opacity-70"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-foreground)",
                  boxShadow: "var(--card-shadow)",
                }}
              >
                {permState === "requesting" ? (step || "Requesting…") : permState === "error" ? "Try again" : "Enable Compass"}
              </button>
              {error && (
                <p className="text-center text-xs" style={{ color: "#c0392b" }}>
                  {error}
                </p>
              )}
            </div>
          )}




          {permState === "ready" && (
            <div className="qibla-ready">
              <div className="qb-dial" data-aligned={aligned || undefined}>
                <div
                  className="qb-rose"
                  style={{
                    transform: `rotate(${qiblaBearing !== null && heading !== null ? arrowAngle - qiblaBearing : 0}deg)`,
                  }}
                >
                  {Array.from({ length: 72 }).map((_, i) => (
                    <span
                      key={i}
                      className={`qb-tick ${i % 18 === 0 ? "is-major" : i % 6 === 0 ? "is-mid" : ""}`}
                      style={{ transform: `rotate(${i * 5}deg)` }}
                    />
                  ))}
                  {(["N", "E", "S", "W"] as const).map((label, i) => (
                    <span
                      key={label}
                      className="qb-cardinal"
                      style={{ transform: `translate(-50%, -50%) rotate(${i * 90}deg) translateY(calc(var(--qb-r) * -0.78)) rotate(${-i * 90}deg)` }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <div className="qb-inner" aria-hidden="true">
                  <svg viewBox="0 0 100 100" className="qb-star">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <rect key={i} x="30" y="30" width="40" height="40" rx="2" transform={`rotate(${i * 11.25} 50 50)`} />
                    ))}
                  </svg>
                </div>
                {targetRotation !== null && (
                  <div className="qb-needle" style={{ transform: `rotate(${arrowAngle}deg)` }}>
                    <svg viewBox="0 0 40 90" aria-hidden="true">
                      <path d="M20 2 L34 62 L20 54 Z" className="qb-needle-dark" />
                      <path d="M20 2 L6 62 L20 54 Z" className="qb-needle-light" />
                    </svg>
                  </div>
                )}
                <span className="qb-hub" />
              </div>

              {aligned && (
                <div className="mt-3 flex items-center gap-1.5 text-sm font-bold text-primary">
                  <Check aria-hidden size={16} strokeWidth={2} />
                  <span>You are facing the Qibla</span>
                </div>
              )}

              <button onClick={() => setShowCalibration(true)} className="qb-cal-btn">
                <Crosshair size={16} strokeWidth={1.8} aria-hidden />
                Calibrate compass
              </button>

              {absolute === false && (
                <p className="mt-2 text-center text-[11px] text-destructive">
                  This device reports a relative compass, so the direction may drift. Calibrate to improve it.
                </p>
              )}

              <div className="qb-stats">
                <div className="qb-stat">
                  <span className="qb-stat-icon"><Navigation size={16} strokeWidth={1.8} /></span>
                  <div>
                    <div className="qb-stat-label">Qibla bearing</div>
                    <div className="qb-stat-value">{qiblaBearing !== null ? `${qiblaBearing.toFixed(1)}°` : "--"}</div>
                  </div>
                </div>
                <div className="qb-stat-divider" />
                <div className="qb-stat">
                  <span className="qb-stat-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M4 7l8-4 8 4v10l-8 4-8-4z" /><path d="M4 10l8 4 8-4" /></svg>
                  </span>
                  <div>
                    <div className="qb-stat-label">Distance to Kaaba</div>
                    <div className="qb-stat-value">{coords ? `${Math.round(distanceKm(coords.lat, coords.lng)).toLocaleString()} km` : "--"}</div>
                  </div>
                </div>
              </div>

              <div className="qb-tip">
                <Lightbulb size={18} strokeWidth={1.6} aria-hidden />
                <p>Tip: Keep your phone flat and away from metal or magnets for best accuracy.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
