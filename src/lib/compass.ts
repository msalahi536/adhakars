// Compass + location helpers shared by the Qibla finder.
// Everything is defensive: web, iOS Safari, and the Capacitor native wrapper
// all behave differently, so each call is guarded and time limited.

type DeviceOrientationEventStatic = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};
type DeviceMotionEventStatic = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

export type PermResult = "granted" | "denied" | "unsupported";

/**
 * True when this device (iOS Safari) requires a real user gesture before
 * motion/orientation access can be requested. Everywhere else we can start
 * the compass automatically as soon as the page opens.
 */
export function needsGesturePermission(): boolean {
  if (typeof window === "undefined" || typeof DeviceOrientationEvent === "undefined") return false;
  const DOE = DeviceOrientationEvent as unknown as { requestPermission?: unknown };
  return typeof DOE.requestPermission === "function";
}

const PERM_OK_KEY = "qibla-perm-granted";

export function hasStoredPermission(): boolean {
  try {
    return localStorage.getItem(PERM_OK_KEY) === "1";
  } catch {
    return false;
  }
}

export function storePermissionGranted() {
  try {
    localStorage.setItem(PERM_OK_KEY, "1");
  } catch {
    // ignore
  }
}

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    let done = false;
    const t = setTimeout(() => {
      if (!done) {
        done = true;
        resolve(fallback);
      }
    }, ms);
    p.then(
      (v) => {
        if (!done) {
          done = true;
          clearTimeout(t);
          resolve(v);
        }
      },
      () => {
        if (!done) {
          done = true;
          clearTimeout(t);
          resolve(fallback);
        }
      },
    );
  });
}

export function isNative(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  try {
    return cap?.isNativePlatform?.() === true;
  } catch {
    return false;
  }
}

/**
 * Ask iOS for motion + orientation access. Must be called directly from a user
 * gesture. On platforms without the prompt this resolves "granted" when the
 * orientation API exists at all.
 */
export async function requestOrientationPermission(): Promise<PermResult> {
  if (typeof window === "undefined" || typeof DeviceOrientationEvent === "undefined") {
    return "unsupported";
  }
  const DOE = DeviceOrientationEvent as DeviceOrientationEventStatic;
  const DME =
    typeof DeviceMotionEvent !== "undefined"
      ? (DeviceMotionEvent as DeviceMotionEventStatic)
      : undefined;

  if (typeof DOE.requestPermission === "function") {
    const r = await withTimeout<PermResult>(
      DOE.requestPermission().then((v) => (v === "granted" ? "granted" : "denied")),
      12000,
      "denied",
    );
    return r;
  }
  if (DME && typeof DME.requestPermission === "function") {
    return withTimeout<PermResult>(
      DME.requestPermission().then((v) => (v === "granted" ? "granted" : "denied")),
      12000,
      "denied",
    );
  }
  return "granted";
}

export type Coords = { lat: number; lng: number };

export type PositionResult = { ok: true; coords: Coords } | { ok: false; error: string };

function webPosition(): Promise<PositionResult> {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    return Promise.resolve({ ok: false, error: "Location is not supported on this device." });
  }
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve({
          ok: false,
          error: "Location timed out. Check that location access is allowed, then try again.",
        });
      }
    }, 18000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({ ok: true, coords: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
      },
      (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({
          ok: false,
          error:
            err.code === err.PERMISSION_DENIED
              ? "Location permission denied. Allow location access for this app, then try again."
              : `Could not get your location. ${err.message}`,
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  });
}

const POS_CACHE_KEY = "qibla-pos-cache";
const POS_CACHE_MAX_AGE = 1000 * 60 * 60 * 24 * 14; // 14 days

export function getCachedPosition(): Coords | null {
  try {
    const raw = localStorage.getItem(POS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { lat: number; lng: number; at: number };
    if (typeof parsed.lat !== "number" || typeof parsed.lng !== "number") return null;
    if (Date.now() - parsed.at > POS_CACHE_MAX_AGE) return null;
    return { lat: parsed.lat, lng: parsed.lng };
  } catch {
    return null;
  }
}

function cachePosition(coords: Coords) {
  try {
    localStorage.setItem(POS_CACHE_KEY, JSON.stringify({ ...coords, at: Date.now() }));
  } catch {
    // ignore
  }
}

/**
 * Get a position once. A recent cached fix is reused so the browser does not
 * prompt for location on every visit. Inside the native wrapper we try the
 * native plugin first, falling back to the web geolocation API.
 */
export async function getPosition(opts?: { force?: boolean }): Promise<PositionResult> {
  if (!opts?.force) {
    const cached = getCachedPosition();
    if (cached) return { ok: true, coords: cached };
  }

  if (isNative()) {
    try {
      const { Geolocation } = await import("@capacitor/geolocation");
      try {
        const perm = await Geolocation.requestPermissions();
        if (perm.location === "denied" && perm.coarseLocation === "denied") {
          return {
            ok: false,
            error:
              "Location permission denied. Enable location for this app in your device settings.",
          };
        }
      } catch {
        // requestPermissions may be unimplemented; continue and let the read decide
      }
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
      });
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      cachePosition(coords);
      return { ok: true, coords };
    } catch {
      // Plugin missing or unimplemented in this native build: use the web API.
      const fallback = await webPosition();
      if (fallback.ok) cachePosition(fallback.coords);
      return fallback;
    }
  }

  const web = await webPosition();
  if (web.ok) cachePosition(web.coords);
  return web;
}



export function normalizeHeading(h: number) {
  return ((h % 360) + 360) % 360;
}

export type Reading = {
  heading: number | null;
  absolute: boolean;
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
};

export function readOrientation(e: DeviceOrientationEvent): Reading {
  const anyE = e as DeviceOrientationEvent & { webkitCompassHeading?: number };
  let heading: number | null = null;
  let absolute = e.absolute === true;
  if (typeof anyE.webkitCompassHeading === "number" && anyE.webkitCompassHeading >= 0) {
    heading = normalizeHeading(anyE.webkitCompassHeading);
    absolute = true;
  } else if (typeof e.alpha === "number") {
    const so =
      typeof window !== "undefined" ? ((window.screen?.orientation?.angle ?? 0) as number) : 0;
    heading = normalizeHeading(360 - e.alpha + so);
  }
  return {
    heading,
    absolute,
    alpha: typeof e.alpha === "number" ? e.alpha : null,
    beta: typeof e.beta === "number" ? e.beta : null,
    gamma: typeof e.gamma === "number" ? e.gamma : null,
  };
}

/**
 * Subscribe to orientation events. Both `deviceorientationabsolute` and
 * `deviceorientation` are attached, but only ONE source is ever used: the
 * absolute event wins as soon as it fires. Mixing the two makes the heading
 * flip between two different reference frames, which looks like a compass
 * spinning a full turn or two arrows fighting each other.
 */
export function subscribeOrientation(cb: (r: Reading, raw: DeviceOrientationEvent) => void) {
  if (typeof window === "undefined") return () => {};
  let source: "absolute" | "plain" | null = null;

  const make = (kind: "absolute" | "plain") => (e: Event) => {
    if (source === null) source = kind;
    // Once an absolute feed exists, ignore the relative one entirely.
    if (kind !== source) {
      if (kind === "absolute") source = "absolute";
      else return;
    }
    const doe = e as DeviceOrientationEvent;
    cb(readOrientation(doe), doe);
  };

  const absHandler = make("absolute");
  const plainHandler = make("plain");
  window.addEventListener("deviceorientationabsolute", absHandler, true);
  window.addEventListener("deviceorientation", plainHandler, true);
  return () => {
    window.removeEventListener("deviceorientationabsolute", absHandler, true);
    window.removeEventListener("deviceorientation", plainHandler, true);
  };

}
