// Legacy shim + display / haptic prefs.
// Theming now lives in `./theming.ts` (engine) and `./theme-store.ts` (persistence).

import {
  applyThemeForRoute,
  getModeSetting,
  setModeSetting,
  type ModeSetting,
} from "./theme-store";

// Legacy type re-export. The old "auto" | "classic" is remapped:
// classic -> light. Existing callers keep working.
export type ThemeMode = ModeSetting;
export type ThemeId = "light" | "dark";

export const themes: { id: ThemeMode; name: string; description: string }[] = [
  { id: "light", name: "Light", description: "Bright surfaces" },
  { id: "dark",  name: "Dark",  description: "Deep, easy on the eyes" },
  { id: "auto",  name: "Auto",  description: "Follows device appearance" },
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
  // no-op alias; the engine handles resolution.
  return "light";
};

// ============= Display + haptics prefs (unchanged) =============

export type DisplayPrefs = { showTransliteration: boolean; arabicLarge: boolean; haptics: boolean };
const DISPLAY_KEY = "adhkar:display";
const defaults: DisplayPrefs = { showTransliteration: true, arabicLarge: false, haptics: true };

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
export const triggerHaptic = async (strength: HapticStrength = "heavy") => {
  if (typeof window === "undefined") return;
  if (!getDisplay().haptics) return;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  if (cap?.isNativePlatform?.()) {
    try {
      const mod: any = await import(/* @vite-ignore */ "@capacitor/haptics");
      const { Haptics, ImpactStyle } = mod;
      const style =
        strength === "heavy" || strength === "double"
          ? ImpactStyle.Heavy
          : strength === "medium"
            ? ImpactStyle.Medium
            : ImpactStyle.Light;
      if (strength === "double") {
        await Haptics.impact({ style });
        await new Promise((r) => setTimeout(r, 120));
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
