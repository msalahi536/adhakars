// Persistent theme store: seed, mode, section overrides, preset id, custom triplet.

import type { Mode, SectionKey, CustomOverrides } from "./theming";
import {
  applyTokens,
  deriveSectionSeed,
  sectionSeedFor,
  deriveTokens,
  clampSeed,
} from "./theming";

const K_LEGACY_MODE = "adhkar:mode";
const K_SEED = "adhkar:seed";
const K_PRESET = "adhkar:preset";
const K_LEGACY_OVERRIDES = "adhkar:section-overrides";
const K_CUSTOM = "adhkar:custom-triplet";

export type ModeSetting = "light";
export type VisualPhase = "morning" | "evening";

export const DEFAULT_SEED = "#70815d";
export const DEFAULT_PRESET_ID = "original";

export type Preset = { id: string; name: string; seed: string };

export const PRESETS: Preset[] = [
  { id: "original",  name: "Original",  seed: "#70815d" },
  { id: "rose",      name: "Rose",      seed: "#d47a8b" },
  { id: "lavender",  name: "Twilight",  seed: "#8a7bd0" },
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
  return "light";
};
export const setModeSetting = (_m: ModeSetting) => removeLS(K_LEGACY_MODE);

/** Resolve the artwork and palette phase for the whole app. */
export const resolveVisualPhase = (
  pathname = typeof window !== "undefined" ? window.location.pathname : "/app",
): VisualPhase => {
  return pathname.startsWith("/app/evening") ? "evening" : "morning";
};

export const getSeed = (): string => clampSeed(readLS(K_SEED) ?? DEFAULT_SEED);
export const setSeed = (hex: string) => writeLS(K_SEED, clampSeed(hex));

export const getPresetId = (): string => {
  const v = readLS(K_PRESET) ?? DEFAULT_PRESET_ID;
  // Removed presets fold back into the default preset.
  return v === "classic" || v === "sakura" || v === "custom" ? DEFAULT_PRESET_ID : v;
};
export const setPresetId = (id: string) => writeLS(K_PRESET, id);

export const getCustomTriplet = (): CustomOverrides => {
  const raw = readLS(K_CUSTOM);
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
};
export const setCustomTriplet = (t: CustomOverrides) => {
  writeLS(K_CUSTOM, JSON.stringify(t));
};
export const clearCustomTriplet = () => removeLS(K_CUSTOM);

export const resolveMode = (): Mode => {
  return resolveVisualPhase() === "evening" ? "dark" : "light";
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

export const applyThemeForRoute = (pathname: string, sectionKey?: SectionKey) => {
  const visualPhase = resolveVisualPhase(pathname);
  const mode: Mode = visualPhase === "evening" ? "dark" : "light";
  const base = getSeed();
  const section = sectionKey ?? sectionForRoute(pathname);
  const isCustom = getPresetId() === "custom";
  const triplet = isCustom ? getCustomTriplet() : {};

  const presetId = getPresetId();
  if (typeof document !== "undefined") {
    document.documentElement.dataset.section = section;
    document.documentElement.dataset.preset = presetId;
    document.documentElement.dataset.visualPhase = visualPhase;
  }
  const seed = sectionSeedFor(
    presetId,
    triplet.accent ?? base,
    visualPhase === "evening" ? "evening" : section,
  );

  // Custom overrides for background / accent are global; header is
  // per-section-derived unless overridden.
  // The Original preset gives each section its own established palette.
  const custom: CustomOverrides = {
    background: triplet.background,
    accent: presetId === DEFAULT_PRESET_ID ? seed : triplet.accent,
    header: triplet.header
      ? deriveSectionSeed(triplet.header, section)
      : undefined,
  };


  const tokens = deriveTokens({ seed, mode, custom });
  applyTokens(tokens, mode);
};

export const resetTheme = () => {
  removeLS(K_LEGACY_MODE);
  removeLS(K_SEED);
  removeLS(K_PRESET);
  removeLS(K_LEGACY_OVERRIDES);
  removeLS(K_CUSTOM);
};

export const PRE_PAINT_SCRIPT = `(function(){try{
var p=location.pathname;
var phase=p.indexOf('/app/evening')===0?'evening':'morning';
var mode=phase==='evening'?'dark':'light';
var section=(p==='/app'||p==='/app/')?'morning':(p.indexOf('/app/evening')===0?'evening':(p.indexOf('/app/salah')===0?'salah':(p.indexOf('/app/tasbih')===0?'tasbih':'default')));
document.documentElement.setAttribute('data-theme-mode',mode);
document.documentElement.setAttribute('data-theme', mode==='dark'?'dark':'dawn');
document.documentElement.setAttribute('data-visual-phase',phase);
document.documentElement.setAttribute('data-section',section);
document.documentElement.setAttribute('data-preset',localStorage.getItem('${K_PRESET}')||'original');
}catch(e){}})();`;
