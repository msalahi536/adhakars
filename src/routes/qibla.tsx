import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/qibla")({
  head: () => ({
    meta: [
      { title: "Qibla Finder — My Adhkar" },
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
  const listenerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null);

  useEffect(() => {
    // Auto-start if previously granted (skips the iOS gesture-required prompt).
    if (typeof window !== "undefined" && localStorage.getItem("qibla-perm-granted") === "1") {
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
      const anyE = e as DeviceOrientationEvent & { webkitCompassHeading?: number };
      if (typeof anyE.webkitCompassHeading === "number") {
        setHeading(anyE.webkitCompassHeading);
      } else if (typeof e.alpha === "number") {
        const h = (360 - e.alpha) % 360;
        setHeading(h);
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
        className="page-header"
        style={{
          background: "linear-gradient(135deg, #1f3d2b 0%, #2d5a3d 100%)",
          color: "#ffffff",
        }}
      >
        <div className="mx-auto max-w-md px-5 pb-4 pt-5">
          <div className="label-caps" style={{ color: "rgba(255,255,255,0.85)", opacity: 1 }}>
            Direction of Prayer
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Qibla Finder</h1>
          <p className="mt-2 text-xs opacity-90">
            Point your phone flat. The gold arrow will point toward the Kaaba.
          </p>
        </div>
      </header>

      <main className="scroll-area" style={{ background: "#0f1a14" }}>
        <div className="mx-auto flex w-full max-w-md flex-col items-center px-5 py-6 text-white">
          {permState !== "granted" && (
            <div className="mt-6 flex w-full flex-col items-center gap-4">
              <p className="text-center text-sm opacity-80">
                We need your location and motion sensors to compute the Qibla direction. Nothing
                leaves your device.
              </p>
              <button
                onClick={() => start()}
                className="rounded-full px-6 py-3 text-sm font-bold"
                style={{ background: "#c9a84c", color: "#1f3d2b" }}
              >
                {permState === "requesting" ? "Requesting…" : "Enable Compass"}
              </button>
              {error && (
                <p className="text-center text-xs" style={{ color: "#ff9b9b" }}>
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
                    background: "radial-gradient(circle, #1a2e22 0%, #0f1a14 70%)",
                    border: "2px solid rgba(201,168,76,0.35)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                  }}
                />
                {/* Cardinal marks — rotate with device so N always points to true North */}
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
                        color: label === "N" ? "#ff6b6b" : "rgba(255,255,255,0.7)",
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
                          borderBottom: `40px solid ${aligned ? "#4ade80" : "#c9a84c"}`,
                          filter: aligned ? "drop-shadow(0 0 12px #4ade80)" : "none",
                        }}
                      />
                      <div
                        className="mt-1 text-[10px] font-bold"
                        style={{ color: aligned ? "#4ade80" : "#c9a84c" }}
                      >
                        KAABA
                      </div>
                    </div>
                  </div>
                )}
                {/* Center dot */}
                <div
                  className="absolute rounded-full"
                  style={{ width: 12, height: 12, background: "#c9a84c" }}
                />
              </div>

              <div className="mt-6 w-full space-y-2 text-center text-xs opacity-80">
                {qiblaBearing !== null && (
                  <div>Qibla bearing: <span className="font-bold text-white">{qiblaBearing.toFixed(1)}°</span></div>
                )}
                {heading !== null && (
                  <div>Your heading: <span className="font-bold text-white">{heading.toFixed(1)}°</span></div>
                )}
                {coords && (
                  <div>
                    Distance to Kaaba:{" "}
                    <span className="font-bold text-white">
                      {distanceKm(coords.lat, coords.lng).toFixed(0)} km
                    </span>
                  </div>
                )}
                {aligned && (
                  <div className="pt-2 text-sm font-bold" style={{ color: "#4ade80" }}>
                    ✓ You are facing the Qibla
                  </div>
                )}
              </div>

              <p className="mt-6 text-center text-[10px] opacity-60">
                Tip: Keep phone flat and away from metal / magnets for best accuracy.
              </p>
            </>
          )}
        </div>
      </main>
    </>
  );
}
