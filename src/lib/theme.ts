export type ThemeId = "warm-green" | "deep-navy" | "soft-sage" | "dark-emerald";

export const themes: { id: ThemeId; name: string; swatch: string[] }[] = [
  { id: "warm-green", name: "Warm Greens & Golds", swatch: ["#faf3e3", "#1f3d2b", "#c9a24c"] },
  { id: "deep-navy", name: "Deep Navy & Silver", swatch: ["#0c1226", "#1a2547", "#c5cbd6"] },
  { id: "soft-sage", name: "Soft Cream & Sage", swatch: ["#f7f3eb", "#a9bfa3", "#b08a44"] },
  { id: "dark-emerald", name: "Dark Emerald & Gold", swatch: ["#04130d", "#0d3320", "#e8b84a"] },
];

const THEME_KEY = "adhkar:theme";

export const getTheme = (): ThemeId => {
  if (typeof window === "undefined") return "warm-green";
  return (localStorage.getItem(THEME_KEY) as ThemeId) || "warm-green";
};

export const applyTheme = (t: ThemeId) => {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", t);
  localStorage.setItem(THEME_KEY, t);
};
