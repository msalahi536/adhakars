export type ThemeId = "dawn" | "dusk" | "warm-green" | "deep-navy" | "soft-sage" | "dark-emerald";
export type ThemeMode = "auto" | ThemeId;

export const themes: { id: ThemeId; name: string; swatch: [string, string, string] }[] = [
  { id: "dawn", name: "Dawn", swatch: ["#fbf5e2", "#1f3d2b", "#e0b552"] },
  { id: "dusk", name: "Dusk", swatch: ["#0e1230", "#2a4c5e", "#cfd4dc"] },
  { id: "warm-green", name: "Warm Greens & Golds", swatch: ["#faf3e3", "#1f3d2b", "#c9a24c"] },
  { id: "deep-navy", name: "Deep Navy & Silver", swatch: ["#0c1226", "#1a2547", "#c5cbd6"] },
  { id: "soft-sage", name: "Soft Cream & Sage", swatch: ["#f7f3eb", "#7e9a78", "#b08a44"] },
  { id: "dark-emerald", name: "Dark Emerald & Gold", swatch: ["#04130d", "#0d3320", "#e8b84a"] },
];

const MODE_KEY = "adhkar:theme-mode";

export const getMode = (): ThemeMode => {
  if (typeof window === "undefined") return "auto";
  return (localStorage.getItem(MODE_KEY) as ThemeMode) || "auto";
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
  if (mode !== "auto") return mode;
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
