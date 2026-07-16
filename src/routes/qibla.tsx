import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { HeaderSettingsButton } from "@/components/HeaderSettingsButton";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { CompassCalibrationCard } from "@/components/CompassCalibrationCard";

const CAL_OPEN_COUNT_KEY = "qibla-open-count";
const CAL_AUTO_LIMIT = 3;


export const Route = createFileRoute("/qibla")({
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

function Qibla() {
  const [permState, setPermState] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [heading, setHeading] = useState<number | null>(null); // device compass heading (0 = N)
  const [qiblaBearing, setQiblaBearing] = useState<number | null>(null);
  const [showCalibration, setShowCalibration] = useState<boolean>(false);
  const lowAccuracyShownRef = useRef(false);
  const listenerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null);

  // Auto-show calibration card the first N opens.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(CAL_OPEN_COUNT_KEY);
      const n = raw ? parseInt(raw, 10) || 0 : 0;
      if (n < CAL_AUTO_LIMIT) {
        setShowCalibration(true);
      }
      localStorage.setItem(CAL_OPEN_COUNT_KEY, String(n + 1));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    // Auto-start only when the platform does NOT require a per-session user
    // gesture for motion access.
    const DOE = DeviceOrientationEvent as DeviceOrientationEventStatic;
    const needsGesture = typeof DOE?.requestPermission === "function";
    if (
      typeof window !== "undefined" &&
      !needsGesture &&
      localStorage.getItem("qibla-perm-granted") === "1"
    ) {
      void start(true);
    }
    return () => {
      if (listenerRef.current) {
        window.removeEventListener("deviceorientationabsolute", listenerRef.current as EventListener);
        window.removeEventListener("deviceorientation", listenerRef.current as EventListener);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = async (auto = false) => {
    setError(null);
    setPermState("requesting");

    // 1) Geolocation
    if (!("geolocation" in navigator)) {
      setError("Geolocation not supported on this device.");
      setPermState("denied");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        setQiblaBearing(bearingToKaaba(lat, lng));
      },
      (err) => {
        setError(`Location error: ${err.message}. Please enable location.`);
        setPermState("denied");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );

    // 2) Motion / orientation permission (iOS 13+)
    // On auto-start (previously granted), skip requestPermission — it requires a
    // fresh user gesture and would throw. Just attach listeners directly.
    const DOE = DeviceOrientationEvent as DeviceOrientationEventStatic;
    if (!auto) {
      try {
        if (typeof DOE?.requestPermission === "function") {
          const resp = await DOE.requestPermission();
          if (resp !== "granted") {
            setError("Motion access denied. Enable in iOS Settings → Safari → Motion & Orientation.");
            setPermState("denied");
            return;
          }
        }
      } catch {
        setError("Motion access blocked. Enable in iOS Settings → Safari → Motion & Orientation.");
        setPermState("denied");
        return;
      }
    }

    const handler = (e: DeviceOrientationEvent) => {
      const anyE = e as DeviceOrientationEvent & {
        webkitCompassHeading?: number;
        webkitCompassAccuracy?: number;
      };
      if (typeof anyE.webkitCompassHeading === "number") {
        setHeading(anyE.webkitCompassHeading);
      } else if (typeof e.alpha === "number") {
        const h = (360 - e.alpha) % 360;
        setHeading(h);
      }
      // Low compass accuracy: iOS reports -1 for invalid, or a degree value
      // where larger = worse. Anything > 30° or -1 is treated as low accuracy.
      const acc = anyE.webkitCompassAccuracy;
      if (
        typeof acc === "number" &&
        (acc < 0 || acc > 30) &&
        !lowAccuracyShownRef.current
      ) {
        lowAccuracyShownRef.current = true;
        setShowCalibration(true);
      }
    };
    listenerRef.current = handler;
    window.addEventListener("deviceorientationabsolute", handler as EventListener, true);
    window.addEventListener("deviceorientation", handler as EventListener, true);

    try {
      localStorage.setItem("qibla-perm-granted", "1");
    } catch {
      // ignore
    }
    setPermState("granted");
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
              <CompassCalibrationCard onDismiss={() => setShowCalibration(false)} />
            </div>
          )}
          {permState !== "granted" && (
            <div className="mt-6 flex w-full flex-col items-center gap-4">
              <p
                className="text-center text-sm"
                style={{ color: "var(--muted-foreground)" }}
              >
                We need your location and motion sensors to compute the Qibla direction. Nothing
                leaves your device.
              </p>
              <button
                onClick={() => start()}
                className="rounded-full px-6 py-3 text-sm font-bold"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-foreground)",
                  boxShadow: "var(--card-shadow)",
                }}
              >
                {permState === "requesting" ? "Requesting…" : "Enable Compass"}
              </button>
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
