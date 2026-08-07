import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { HeaderSettingsButton } from "@/components/HeaderSettingsButton";
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
  const [phase, setPhase] = useState<"intro" | "requesting" | "ready" | "error">("intro");
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
      if (!got) {
        setError(
          "No compass readings from this device. Try calibrating, or open the app on a phone.",
        );
      }
    }, 3000);
  };

  // Permissions first, then calibration. Runs from a real user gesture.
  const start = async () => {
    setPhase("requesting");
    setError(null);

    setStep("Requesting motion access…");
    const sensor = await requestOrientationPermission();
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

    let calibrated = false;
    try {
      calibrated = localStorage.getItem(CAL_DONE_KEY) === "1";
    } catch {
      // ignore
    }
    if (!calibrated && sensor !== "unsupported") setShowCalibration(true);
  };

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
        className="page-header relative overflow-hidden"
        style={{ background: "var(--grad-header)", color: "var(--header-fg)" }}
      >
        <HeaderBackButton />
        <HeaderSettingsButton />
        <div className="mx-auto max-w-md px-5 pb-4 pt-5" style={{ paddingLeft: 60, paddingRight: 60 }}>
          <div className="label-caps" style={{ color: "var(--header-sub)", opacity: 1 }}>
            Direction of Prayer
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Qibla Finder</h1>
          <p className="mt-2 text-xs" style={{ color: "var(--header-sub)" }}>
            Point your phone flat. The arrow will point toward the Kaaba.
          </p>
        </div>
      </header>

      <main className="scroll-area">
        <div
          className="mx-auto flex w-full max-w-md flex-col items-center px-5 py-6"
          style={{ color: "var(--foreground)" }}
        >
          {showCalibration && (
            <CompassCalibrationCard onDone={markCalibrated} onSkip={() => setShowCalibration(false)} />
          )}

          {permState !== "ready" && (
            <div className="mt-6 flex w-full flex-col items-center gap-4">
              <p
                className="text-center text-sm"
                style={{ color: "var(--muted-foreground)" }}
              >
                We need your location and motion sensors to compute the Qibla direction. Nothing
                leaves your device.
              </p>
              <button
                onClick={() => void start()}
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
            <>
              <div
                className="relative mt-4 flex items-center justify-center"
                style={{ width: 280, height: 280 }}
              >
                {/* Compass ring */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, var(--card) 0%, var(--muted) 75%)",
                    border: `2px solid ${aligned ? "color-mix(in oklab, #3d8f5c 70%, transparent)" : "color-mix(in oklab, var(--accent) 45%, transparent)"}`,
                    boxShadow: aligned
                      ? "0 0 28px color-mix(in oklab, #3d8f5c 35%, transparent), var(--card-shadow)"
                      : "var(--card-shadow)",
                    transition: "border-color 300ms ease, box-shadow 300ms ease",
                  }}
                />

                {/* Cardinal marks rotate with device so N always points to true North */}
                <div
                  className="absolute inset-0"
                  style={{
                    transform: `rotate(${qiblaBearing !== null && heading !== null ? arrowAngle - qiblaBearing : 0}deg)`,
                    transition: "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                >
                  {(["N", "E", "S", "W"] as const).map((label, i) => (
                    <div
                      key={label}
                      className="absolute left-1/2 top-1/2 text-xs font-bold"
                      style={{
                        color:
                          label === "N"
                            ? "var(--accent)"
                            : "color-mix(in oklab, var(--foreground) 55%, transparent)",
                        transform: `translate(-50%, -50%) rotate(${i * 90}deg) translateY(-118px) rotate(${-i * 90}deg)`,
                      }}
                    >
                      {label}
                    </div>
                  ))}
                </div>
                {/* Qibla arrow */}
                {targetRotation !== null && (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      transform: `rotate(${arrowAngle}deg)`,
                      transition: "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  >
                    <div
                      className="flex flex-col items-center"
                      style={{ transform: "translateY(-40px)" }}
                    >
                      <svg width={40} height={46} viewBox="0 0 40 46" aria-hidden="true">
                        <path
                          d="M20 2 L36 42 L20 33 L4 42 Z"
                          fill={aligned ? "#3d8f5c" : "var(--accent)"}
                          stroke={aligned ? "#3d8f5c" : "var(--accent)"}
                          strokeWidth={1}
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div
                        className="mt-1 text-[10px] font-bold tracking-wide"
                        style={{ color: aligned ? "#3d8f5c" : "var(--accent)" }}
                      >
                        KAABA
                      </div>
                    </div>
                  </div>
                )}

                {/* Center dot */}
                <div
                  className="absolute rounded-full"
                  style={{
                    width: 12,
                    height: 12,
                    background: "var(--accent)",
                    boxShadow:
                      "0 0 0 4px color-mix(in oklab, var(--accent) 20%, transparent)",
                  }}
                />
              </div>

              {!showCalibration && (
                <button
                  onClick={() => setShowCalibration(true)}
                  className="mt-4 rounded-full px-4 py-2 text-xs font-bold"
                  style={{
                    background: "var(--btn-surface)",
                    color: "var(--btn-fg)",
                    border:
                      "1px solid color-mix(in oklab, var(--accent) 40%, transparent)",
                  }}
                >
                  Calibrate compass
                </button>
              )}

              {absolute === false && (
                <p
                  className="mt-3 text-center text-[11px]"
                  style={{ color: "#c0392b" }}
                >
                  This device reports a relative compass, so the direction may drift. Calibrate,
                  then hold the phone flat and face North once to reset it.
                </p>
              )}



              <div
                className="mt-6 w-full space-y-1.5 text-center text-xs"
                style={{ color: "var(--muted-foreground)" }}
              >
                {qiblaBearing !== null && (
                  <div>
                    Qibla bearing:{" "}
                    <span className="font-bold" style={{ color: "var(--foreground)" }}>
                      {qiblaBearing.toFixed(1)}°
                    </span>
                  </div>
                )}
                {heading !== null && (
                  <div>
                    Your heading:{" "}
                    <span className="font-bold" style={{ color: "var(--foreground)" }}>
                      {heading.toFixed(1)}°
                    </span>
                  </div>
                )}
                {coords && (
                  <div>
                    Distance to Kaaba:{" "}
                    <span className="font-bold" style={{ color: "var(--foreground)" }}>
                      {distanceKm(coords.lat, coords.lng).toFixed(0)} km
                    </span>
                  </div>
                )}
                {aligned && (
                  <div className="pt-2 text-sm font-bold" style={{ color: "#3d8f5c" }}>
                    ✓ You are facing the Qibla
                  </div>
                )}
              </div>

              <p
                className="mt-6 text-center text-[10px]"
                style={{ color: "var(--muted-foreground)", opacity: 0.8 }}
              >
                Tip: Keep phone flat and away from metal or magnets for best accuracy.
              </p>
            </>
          )}
        </div>
      </main>
    </>
  );
}
