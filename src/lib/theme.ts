// Legacy shim + display / haptic prefs.
import { Haptics, ImpactStyle } from "@capacitor/haptics";
// Theming now lives in `./theming.ts` (engine) and `./theme-store.ts` (persistence).

import {
  applyThemeForRoute,
  getModeSetting,
  setModeSetting,
  type ModeSetting,
} from "./theme-store";

// Legacy type re-export retained for compatibility.
export type ThemeMode = ModeSetting;
export type ThemeId = "light" | "dark";

export const themes: { id: ThemeMode; name: string; description: string }[] = [
  { id: "page", name: "Page-based", description: "Morning and evening follow their pages" },
  { id: "morning", name: "Always morning", description: "Use the morning artwork and colors everywhere" },
  { id: "evening", name: "Always evening", description: "Use the evening artwork and colors everywhere" },
];

export const getMode = (): ThemeMode => {
  const v = getModeSetting();
  return v;
};

export const setMode = (m: ThemeMode) => {
  setModeSetting(m);
};

// Kept for compatibility. New apply is `applyThemeForRoute(pathname)`.
export const applyTheme = (_id: ThemeId) => {
  if (typeof window === "undefined") return;
  applyThemeForRoute(window.location.pathname);
};

export const resolveTheme = (_mode: ThemeMode, _route: string): ThemeId => {
  return _mode === "evening" ? "dark" : "light";
};

// ============= Display + haptics prefs (unchanged) =============

export type DisplayPrefs = { showTransliteration: boolean; showTranslation: boolean; showArabic: boolean; arabicLarge: boolean; haptics: boolean };
const DISPLAY_KEY = "adhkar:display";
const defaults: DisplayPrefs = { showTransliteration: true, showTranslation: true, showArabic: true, arabicLarge: false, haptics: true };

export const getDisplay = (): DisplayPrefs => {
  if (typeof window === "undefined") return defaults;
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(DISPLAY_KEY) || "{}") };
  } catch {
    return defaults;
  }
};
export const setDisplay = (d: DisplayPrefs) => localStorage.setItem(DISPLAY_KEY, JSON.stringify(d));

export const vibrateIfEnabled = (pattern: number | number[]) => {
  if (typeof window !== "undefined" && !getDisplay().haptics) return;
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  navigator.vibrate(pattern);
};

export type HapticStrength = "light" | "medium" | "heavy" | "double";

const isNative = () =>
  !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Plays a custom vibration pattern so actions carry a signature feel.
 * On iOS (no raw pattern API) the pattern is replayed as a sequence of native
 * impacts: each "on" segment becomes an impact whose weight follows its length,
 * "off" segments become pauses. Respects the haptics preference.
 */
export const triggerHapticPattern = async (pattern: number[], _fallback: HapticStrength = "light") => {
  if (typeof window === "undefined" || !getDisplay().haptics) return;
  if (isNative()) {
    try {
      for (let i = 0; i < pattern.length; i++) {
        const ms = pattern[i];
        if (i % 2 === 1) { await wait(ms); continue; }
        const style = ms >= 20 ? ImpactStyle.Heavy : ms >= 12 ? ImpactStyle.Medium : ImpactStyle.Light;
        await Haptics.impact({ style });
      }
      return;
    } catch {
      // fall through
    }
  }
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(pattern);
};
export const triggerHaptic = async (strength: HapticStrength = "heavy") => {
  if (typeof window === "undefined") return;
  if (!getDisplay().haptics) return;
  if (isNative()) {
    try {
      const style =
        strength === "heavy" || strength === "double"
          ? ImpactStyle.Heavy
          : strength === "medium"
            ? ImpactStyle.Medium
            : ImpactStyle.Light;
      if (strength === "double") {
        await Haptics.impact({ style });
        await wait(120);
        await Haptics.impact({ style });
      } else {
        await Haptics.impact({ style });
      }
      return;
    } catch {
      // fall through to web vibrate
    }
  }
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    if (strength === "double") navigator.vibrate([40, 80, 40]);
    else navigator.vibrate(strength === "medium" ? 25 : strength === "heavy" ? 40 : 12);
  }
};
