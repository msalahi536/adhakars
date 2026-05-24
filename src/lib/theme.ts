export type ThemeId = "dawn" | "dusk";
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
  if (route.startsWith("/evening")) return "dusk";
  return "dawn";
};

// Display prefs
export type DisplayPrefs = { showTransliteration: boolean; arabicLarge: boolean };
const DISPLAY_KEY = "adhkar:display";
export const getDisplay = (): DisplayPrefs => {
  if (typeof window === "undefined") return { showTransliteration: true, arabicLarge: false };
  try {
    return { showTransliteration: true, arabicLarge: false, ...JSON.parse(localStorage.getItem(DISPLAY_KEY) || "{}") };
  } catch {
    return { showTransliteration: true, arabicLarge: false };
  }
};
export const setDisplay = (d: DisplayPrefs) => localStorage.setItem(DISPLAY_KEY, JSON.stringify(d));
