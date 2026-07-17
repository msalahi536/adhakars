export type ThemeId = "dawn" | "dusk" | "salah";
export type ThemeMode = "auto" | "classic";

export const themes: { id: ThemeMode; name: string; description: string }[] = [
  { id: "auto", name: "Auto (Dawn / Dusk)", description: "Warm by day, cool by evening" },
  { id: "classic", name: "Classic", description: "Cream & gold, all day" },
];

const MODE_KEY = "adhkar:theme-mode";

export const getMode = (): ThemeMode => {
  if (typeof window === "undefined") return "auto";
  const raw = localStorage.getItem(MODE_KEY);
  if (raw === "auto" || raw === "classic") return raw;
  return "auto";
};

export const setMode = (m: ThemeMode) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(MODE_KEY, m);
};

export const applyTheme = (id: ThemeId) => {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", id);
};

export const resolveTheme = (mode: ThemeMode, route: string): ThemeId => {
  if (mode === "classic") return "dawn";
  if (route.startsWith("/app/evening")) return "dusk";
  return "dawn";
};

// Display prefs
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

export type HapticStrength = "light" | "medium" | "heavy";
export const triggerHaptic = async (strength: HapticStrength = "light") => {
  if (typeof window === "undefined") return;
  if (!getDisplay().haptics) return;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  if (cap?.isNativePlatform?.()) {
    try {
      const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
      const style =
        strength === "heavy"
          ? ImpactStyle.Heavy
          : strength === "medium"
            ? ImpactStyle.Medium
            : ImpactStyle.Light;
      await Haptics.impact({ style });
      return;
    } catch {
      // fall through to web vibrate
    }
  }
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(strength === "medium" ? 25 : strength === "heavy" ? 40 : 12);
  }
};

