// ============ Rate This App ============
// Explicit rating actions open the store review destination synchronously.
// Apple's in-app request may silently do nothing, even when its promise resolves.

export function requestAppReview() {
  if (typeof window === "undefined") return;
  const platform = (window as Window & { Capacitor?: { getPlatform?: () => string } }).Capacitor?.getPlatform?.();
  const isIOS = platform === "ios" || (platform !== "android" && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  ));
  const url = isIOS
    ? "https://apps.apple.com/app/id6791834420?action=write-review"
    : "https://play.google.com/store/apps/details?id=com.mindcastmedia.adhkar";
  // Stay inside the click gesture: async plugin imports can lose popup permission.
  window.open(url, "_blank", "noopener,noreferrer");
}

// ============ Smart prompt state ============

const SESSIONS_KEY = "adhkar:rate:sessions";
const RATED_KEY = "adhkar:rate:done";
const NEXT_AT_KEY = "adhkar:rate:next-at";
const FIRST_PROMPT_AT = 5;
const PROMPT_EVERY_AFTER_DISMISS = 10;

const read = (key: string): number => {
  if (typeof window === "undefined") return 0;
  const n = parseInt(localStorage.getItem(key) || "0", 10);
  return Number.isFinite(n) ? n : 0;
};

export const getCompletedSessions = (): number => read(SESSIONS_KEY);

export const hasRated = (): boolean =>
  typeof window !== "undefined" && localStorage.getItem(RATED_KEY) === "1";

export const markRated = () => {
  if (typeof window === "undefined") return;
  localStorage.setItem(RATED_KEY, "1");
};

export const markPromptDismissed = () => {
  if (typeof window === "undefined") return;
  localStorage.setItem(NEXT_AT_KEY, String(getCompletedSessions() + PROMPT_EVERY_AFTER_DISMISS));
};

// Call when a dhikr counter reaches its target (one completed session).
export const noteDhikrSessionComplete = () => {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSIONS_KEY, String(getCompletedSessions() + 1));
  window.dispatchEvent(new Event("adhkar:rate-check"));
};

export const shouldShowRatePrompt = (): boolean => {
  if (typeof window === "undefined") return false;
  if (hasRated()) return false;
  const sessions = getCompletedSessions();
  if (sessions < FIRST_PROMPT_AT) return false;
  const nextAt = read(NEXT_AT_KEY);
  return sessions >= nextAt;
};
