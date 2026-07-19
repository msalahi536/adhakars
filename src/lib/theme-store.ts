// Persistent theme store: seed, mode, section overrides, preset id, custom triplet.

import type { Mode, SectionKey, CustomOverrides } from "./theming";
import {
  applyTokens,
  deriveSectionSeed,
  deriveTokens,
  clampSeed,
} from "./theming";

const K_MODE = "adhkar:mode";
const K_SEED = "adhkar:seed";
const K_PRESET = "adhkar:preset";
const K_OVERRIDES = "adhkar:section-overrides";
const K_CUSTOM = "adhkar:custom-triplet";

export type ModeSetting = "light" | "dark" | "auto";

export const DEFAULT_SEED = "#c9a84c";
export const DEFAULT_PRESET_ID = "classic";

export type Preset = { id: string; name: string; seed: string };

export const PRESETS: Preset[] = [
  { id: "classic",   name: "Classic",   seed: "#c9a84c" },
  { id: "rose",      name: "Rose",      seed: "#d47a8b" },
  { id: "lavender",  name: "Twilight",  seed: "#8a7bd0" },
  { id: "sakura",    name: "Sakura",    seed: "#e69ba5" },
  { id: "ocean",     name: "Ocean",     seed: "#4a9ab3" },
  { id: "emerald",   name: "Emerald",   seed: "#3f9d7a" },
  { id: "sand",      name: "Sand",      seed: "#b8925a" },
  { id: "midnight",  name: "Midnight",  seed: "#5b6ea8" },
];

const readLS = (k: string): string | null => {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(k); } catch { return null; }
};
const writeLS = (k: string, v: string) => {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(k, v); } catch {}
};
const removeLS = (k: string) => {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(k); } catch {}
};

export const getModeSetting = (): ModeSetting => {
  const v = readLS(K_MODE);
  return v === "light" || v === "dark" || v === "auto" ? v : "auto";
};
export const setModeSetting = (m: ModeSetting) => writeLS(K_MODE, m);

export const getSeed = (): string => clampSeed(readLS(K_SEED) ?? DEFAULT_SEED);
export const setSeed = (hex: string) => writeLS(K_SEED, clampSeed(hex));

export const getPresetId = (): string => readLS(K_PRESET) ?? DEFAULT_PRESET_ID;
export const setPresetId = (id: string) => writeLS(K_PRESET, id);

export const getOverrides = (): Partial<Record<SectionKey, string>> => {
  const raw = readLS(K_OVERRIDES);
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
};
export const setOverrides = (o: Partial<Record<SectionKey, string>>) =>
  writeLS(K_OVERRIDES, JSON.stringify(o));

export const setSectionOverride = (section: SectionKey, hex: string | null) => {
  const cur = getOverrides();
  if (hex === null) delete cur[section];
  else cur[section] = clampSeed(hex);
  setOverrides(cur);
};

export const getCustomTriplet = (): CustomOverrides => {
  const raw = readLS(K_CUSTOM);
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
};
export const setCustomTriplet = (t: CustomOverrides) => {
  writeLS(K_CUSTOM, JSON.stringify(t));
};
export const clearCustomTriplet = () => removeLS(K_CUSTOM);

export const resolveMode = (setting: ModeSetting = getModeSetting()): Mode => {
  if (setting === "light") return "light";
  if (setting === "dark") return "dark";
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
};

export const sectionForRoute = (pathname: string): SectionKey => {
  if (pathname === "/app" || pathname === "/app/") return "morning";
  if (pathname.startsWith("/app/evening")) return "evening";
  if (pathname.startsWith("/app/salah")) return "salah";
  if (pathname.startsWith("/app/tasbih")) return "tasbih";
  if (pathname.startsWith("/app/sleep")) return "sleep";
  if (pathname.startsWith("/app/wake")) return "wake";
  if (pathname.startsWith("/app/my-adhkar")) return "custom";
  return "default";
};

export const applyThemeForRoute = (pathname: string) => {
  const mode = resolveMode();
  const base = getSeed();
  const overrides = getOverrides();
  const section = sectionForRoute(pathname);
  const isCustom = getPresetId() === "custom";
  const triplet = isCustom ? getCustomTriplet() : {};

  // Per-section override always wins for the header hue.
  const sectionOverride = overrides[section];
  const seed = sectionOverride ?? deriveSectionSeed(triplet.accent ?? base, section);

  // Custom overrides for background / accent are global; header is
  // per-section-derived unless overridden.
  const custom: CustomOverrides = {
    background: triplet.background,
    accent: triplet.accent,
    header: sectionOverride ? undefined : triplet.header
      ? deriveSectionSeed(triplet.header, section)
      : undefined,
  };

  const tokens = deriveTokens({ seed, mode, custom });
  applyTokens(tokens, mode);
};

export const resetTheme = () => {
  removeLS(K_MODE);
  removeLS(K_SEED);
  removeLS(K_PRESET);
  removeLS(K_OVERRIDES);
  removeLS(K_CUSTOM);
};

export const PRE_PAINT_SCRIPT = `(function(){try{
var m=localStorage.getItem('${K_MODE}')||'auto';
var mode = m==='light'?'light':(m==='dark'?'dark':(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));
document.documentElement.setAttribute('data-theme-mode',mode);
document.documentElement.setAttribute('data-theme', mode==='dark'?'dark':'dawn');
}catch(e){}})();`;
