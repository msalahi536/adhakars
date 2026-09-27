/**
 * Bridge to iOS Live Activities via an optional native Capacitor plugin
 * ("LiveActivities"). Every call is a safe no-op on the web or when the
 * plugin isn't installed.
 */

export type LiveActivityPrefs = {
  prayerCountdown: boolean;
  tasbihSession: boolean;
  fastingTimer: boolean;
};

const PREFS_KEY = "adhkar:live-activity-prefs";
const DEFAULT_PREFS: LiveActivityPrefs = {
  prayerCountdown: true,
  tasbihSession: true,
  fastingTimer: true,
};

type Plugin = Record<string, ((args?: unknown) => Promise<unknown>) | undefined>;
type CapWindow = {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    getPlatform?: () => string;
    Plugins?: Record<string, Plugin | undefined>;
  };
};

const cap = () =>
  typeof window === "undefined" ? undefined : (window as unknown as CapWindow).Capacitor;

export function isNativeApp(): boolean {
  const c = cap();
  return !!c?.isNativePlatform?.() && c.getPlatform?.() === "ios";
}

async function call(method: string, args?: unknown): Promise<void> {
  if (!isNativeApp()) return;
  const fn = cap()?.Plugins?.LiveActivities?.[method];
  if (!fn) return;
  try {
    await fn(args);
  } catch (e) {
    console.warn(`[native-bridge] ${method} failed`, e);
  }
}

export function getLiveActivityPrefs(): LiveActivityPrefs {
  if (typeof window === "undefined") return { ...DEFAULT_PREFS };
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_PREFS };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function setLiveActivityPrefs(prefs: LiveActivityPrefs): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  window.dispatchEvent(new Event("adhkar:la-prefs-update"));
}

export function onLiveActivityToggle(key: keyof LiveActivityPrefs, enabled: boolean): void {
  setLiveActivityPrefs({ ...getLiveActivityPrefs(), [key]: enabled });
  if (!enabled) {
    if (key === "tasbihSession") void endTasbihSession();
    if (key === "fastingTimer") void endFastingLiveActivity();
    if (key === "prayerCountdown") void call("endPrayerCountdown");
  }
  void call("setPrefs", getLiveActivityPrefs());
}

export function initNativeBridge(): void {
  if (!isNativeApp()) return;
  void call("setPrefs", getLiveActivityPrefs());
}

export async function startTasbihSession(args: { name: string; count: number; target?: number }) {
  if (!getLiveActivityPrefs().tasbihSession) return;
  await call("startTasbih", args);
}

export async function updateTasbihSession(args: { count: number; target?: number }) {
  if (!getLiveActivityPrefs().tasbihSession) return;
  await call("updateTasbih", args);
}

export async function endTasbihSession() {
  await call("endTasbih");
}

export async function startFastingLiveActivity(args: { label: string; endsAt: number }) {
  if (!getLiveActivityPrefs().fastingTimer) return;
  await call("startFasting", args);
}

export async function endFastingLiveActivity() {
  await call("endFasting");
}
