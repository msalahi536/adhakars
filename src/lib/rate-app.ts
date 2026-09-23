// ============ Rate This App ============
// Native in-app review when the Capacitor plugin is present,
// otherwise falls back to the store page in the browser.

export async function requestAppReview() {
  try {
    // Try native Capacitor in-app review first (works when plugin is installed)
    const { RateApp } = await import("capacitor-rate-app");
    await RateApp.requestReview();
  } catch {
    // Fallback to opening store link in browser
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      window.open("https://apps.apple.com/us/app/sahih-al-adhkar/id6791834420");
    } else {
      window.open("https://play.google.com/store/apps/details?id=com.mindcastmedia.adhkar");
    }
  }
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
