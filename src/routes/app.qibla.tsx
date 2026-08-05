import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { HeaderSettingsButton } from "@/components/HeaderSettingsButton";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { CompassCalibrationCard } from "@/components/CompassCalibrationCard";





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

type DeviceOrientationEventStatic = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

const CAL_DONE_KEY = "qibla-calibrated";

function normalizeHeading(h: number) {
  return ((h % 360) + 360) % 360;
}

function Qibla() {
  const [locStatus, setLocStatus] = useState<"idle" | "requesting" | "ok" | "error">("idle");
  const [locError, setLocError] = useState<string | null>(null);
  const [sensorStatus, setSensorStatus] = useState<"idle" | "requesting" | "ok" | "error">("idle");
  const [sensorError, setSensorError] = useState<string | null>(null);
  const [absolute, setAbsolute] = useState<boolean | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [heading, setHeading] = useState<number | null>(null); // 0 = true/magnetic North
  const [qiblaBearing, setQiblaBearing] = useState<number | null>(null);
  const [showCalibration, setShowCalibration] = useState(false);
  const [calibrated, setCalibrated] = useState(true);
  const listenerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const smoothRef = useRef<number | null>(null);

  const permState: "idle" | "requesting" | "granted" | "denied" =
    sensorStatus === "ok" && locStatus === "ok"
      ? "granted"
      : sensorStatus === "requesting" || locStatus === "requesting"
        ? "requesting"
        : sensorStatus === "error" || locStatus === "error"
          ? "denied"
          : "idle";
  const error = locError ?? sensorError;

  // First open: guide the user through calibration before showing the compass.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let done = false;
    try {
      done = localStorage.getItem(CAL_DONE_KEY) === "1";
    } catch {
      // ignore
    }
    setCalibrated(done);
    if (!done) setShowCalibration(true);
  }, []);

  useEffect(() => {
    return () => {
      if (listenerRef.current) {
        window.removeEventListener("deviceorientationabsolute", listenerRef.current as EventListener, true);
        window.removeEventListener("deviceorientation", listenerRef.current as EventListener, true);
      }
      if (watchIdRef.current !== null && typeof navigator !== "undefined") {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const markCalibrated = () => {
    try {
      localStorage.setItem(CAL_DONE_KEY, "1");
    } catch {
      // ignore
    }
    setCalibrated(true);
    setShowCalibration(false);
  };

  const startLocation = () => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setLocError("Location is not supported on this device.");
      setLocStatus("error");
      return;
    }
    setLocStatus("requesting");
    setLocError(null);
    const onPos = (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setCoords({ lat, lng });
      setQiblaBearing(bearingToKaaba(lat, lng));
      setLocStatus("ok");
      setLocError(null);
    };
    const onErr = (err: GeolocationPositionError) => {
      setLocError(
        err.code === err.PERMISSION_DENIED
          ? "Location permission denied. Allow location access for this app in your device settings, then try again."
          : `Could not get your location. ${err.message}`,
      );
      setLocStatus("error");
    };
    navigator.geolocation.getCurrentPosition(onPos, onErr, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000,
    });
    // Keep it fresh while the page is open.
    try {
      watchIdRef.current = navigator.geolocation.watchPosition(onPos, () => {}, {
        enableHighAccuracy: true,
        maximumAge: 30000,
      });
    } catch {
      // ignore
    }
  };

  const startCompass = async () => {
    setSensorStatus("requesting");
    setSensorError(null);
    const DOE = (typeof window !== "undefined" ? DeviceOrientationEvent : undefined) as
      | DeviceOrientationEventStatic
      | undefined;
    if (!DOE) {
      setSensorError("This device has no compass sensor.");
      setSensorStatus("error");
      return;
    }
    if (typeof DOE.requestPermission === "function") {
      try {
        const resp = await DOE.requestPermission();
        if (resp !== "granted") {
          setSensorError("Motion and orientation access was denied, so the compass cannot run.");
          setSensorStatus("error");
          return;
        }
      } catch {
        setSensorError("Motion and orientation access was blocked, so the compass cannot run.");
        setSensorStatus("error");
        return;
      }
    }

    let gotEvent = false;
    const handler = (e: DeviceOrientationEvent) => {
      const anyE = e as DeviceOrientationEvent & {
        webkitCompassHeading?: number;
        webkitCompassAccuracy?: number;
      };
      let h: number | null = null;
      if (typeof anyE.webkitCompassHeading === "number" && anyE.webkitCompassHeading >= 0) {
        h = anyE.webkitCompassHeading; // already true north, iOS
        setAbsolute(true);
      } else if (typeof e.alpha === "number") {
        h = normalizeHeading(360 - e.alpha);
        // Compensate for a rotated screen where available.
        const so = (window.screen?.orientation?.angle ?? 0) as number;
        h = normalizeHeading(h + so);
        setAbsolute(e.absolute === true);
      }
      if (h === null) return;
      gotEvent = true;
      if (sensorStatus !== "ok") setSensorStatus("ok");
      // Smooth across the 0/360 wrap so the needle does not jitter.
      const prev = smoothRef.current;
      let next = h;
      if (prev !== null) {
        let delta = ((h - prev + 540) % 360) - 180;
        next = normalizeHeading(prev + delta * 0.25);
      }
      smoothRef.current = next;
      setHeading(next);
    };
    listenerRef.current = handler;
    window.addEventListener("deviceorientationabsolute", handler as EventListener, true);
    window.addEventListener("deviceorientation", handler as EventListener, true);
    setSensorStatus("ok");

    setTimeout(() => {
      if (!gotEvent) {
        setSensorError("No compass readings from this device. Try calibrating, or open the app on a phone.");
        setSensorStatus("error");
      }
    }, 2500);
  };

  const start = async () => {
    startLocation();
    await startCompass();
  };

  // Rotation to apply to the qibla arrow: bearing - heading
  const arrowRotation =
    qiblaBearing !== null && heading !== null ? (qiblaBearing - heading + 360) % 360 : null;
  const aligned = arrowRotation !== null && (arrowRotation < 5 || arrowRotation > 355);

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
            <div className="mb-5 w-full">
              <CompassCalibrationCard onDismiss={markCalibrated} />
            </div>
          )}

          {permState !== "granted" && !showCalibration && (
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
                {permState === "requesting" ? "Requesting…" : "Enable Compass"}
              </button>
              {calibrated && (
                <button
                  onClick={() => setShowCalibration(true)}
                  className="rounded-full px-4 py-2 text-xs font-bold"
                  style={{
                    background: "var(--btn-surface)",
                    color: "var(--btn-fg)",
                    border: "1px solid color-mix(in oklab, var(--accent) 40%, transparent)",
                  }}
                >
                  Calibrate compass
                </button>
              )}
              {error && (
                <p className="text-center text-xs" style={{ color: "#c0392b" }}>
                  {error}
                </p>
              )}
            </div>
          )}


          {permState === "granted" && (
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
                    border: "2px solid color-mix(in oklab, var(--accent) 45%, transparent)",
                    boxShadow: "var(--card-shadow)",
                  }}
                />
                {/* Cardinal marks rotate with device so N always points to true North */}
                <div
                  className="absolute inset-0"
                  style={{
                    transform: `rotate(${heading !== null ? -heading : 0}deg)`,
                    transition: "transform 120ms linear",
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
                {arrowRotation !== null && (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      transform: `rotate(${arrowRotation}deg)`,
                      transition: "transform 200ms ease-out",
                    }}
                  >
                    <div className="flex flex-col items-center" style={{ transform: "translateY(-40px)" }}>
                      <div
                        style={{
                          width: 0,
                          height: 0,
                          borderLeft: "18px solid transparent",
                          borderRight: "18px solid transparent",
                          borderBottom: `40px solid ${aligned ? "#3d8f5c" : "var(--accent)"}`,
                          filter: aligned
                            ? "drop-shadow(0 0 12px color-mix(in oklab, #3d8f5c 60%, transparent))"
                            : "none",
                        }}
                      />
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
