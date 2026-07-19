// Derived-token theming engine.
// Given a single seed hex + mode (light/dark), computes a full semantic token
// map with WCAG-validated contrast, and writes CSS variables to <html>.

export type Mode = "light" | "dark";
export type SectionKey =
  | "morning"
  | "evening"
  | "salah"
  | "tasbih"
  | "sleep"
  | "wake"
  | "custom"
  | "default";

// ---------- color math ----------

const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

export const hexToRgb = (hex: string): [number, number, number] => {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  const to = (v: number) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
};

export const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return [h, s, l];
};

export const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  h = ((h % 360) + 360) % 360;
  s = clamp(s); l = clamp(l);
  if (s === 0) { const v = l * 255; return [v, v, v]; }
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60)      { r = c; g = x; }
  else if (h < 120){ r = x; g = c; }
  else if (h < 180){ g = c; b = x; }
  else if (h < 240){ g = x; b = c; }
  else if (h < 300){ r = x; b = c; }
  else             { r = c; b = x; }
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
};

export const hexToHsl = (hex: string): [number, number, number] => {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHsl(r, g, b);
};

export const hslToHex = (h: number, s: number, l: number): string => {
  const [r, g, b] = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
};

// WCAG relative luminance and contrast
const chan = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
export const luminance = (hex: string): number => {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
};
export const contrast = (a: string, b: string): number => {
  const la = luminance(a), lb = luminance(b);
  const [lo, hi] = la < lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
};

/** Choose black or white to maximize contrast against bg. */
export const readableOn = (bg: string): string => {
  return contrast("#ffffff", bg) >= contrast("#0f0f10", bg) ? "#ffffff" : "#0f0f10";
};

/** Nudge a color's lightness until contrast(fg, result) >= min. Returns adjusted hex. */
export const ensureContrast = (bg: string, fg: string, min = 4.5): string => {
  if (contrast(bg, fg) >= min) return bg;
  const [h, s] = hexToHsl(bg);
  const fgL = luminance(fg);
  const goDarker = fgL > 0.5; // if fg is light (white), darken bg
  let l = hexToHsl(bg)[2];
  for (let i = 0; i < 100; i++) {
    l = goDarker ? Math.max(0, l - 0.01) : Math.min(1, l + 0.01);
    const candidate = hslToHex(h, s, l);
    if (contrast(candidate, fg) >= min) return candidate;
    if (l <= 0.02 || l >= 0.98) break;
  }
  return hslToHex(h, s, l);
};

// Blend two hex colors by t in [0,1]
export const mix = (a: string, b: string, t: number): string => {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
};

// rgba string from hex
export const rgba = (hex: string, alpha: number): string => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`;
};

// ---------- seed clamping ----------

/** Clamp a seed into a "safe" range: bounded chroma & mid lightness. */
export const clampSeed = (hex: string): string => {
  const [h, s, l] = hexToHsl(hex);
  const s2 = clamp(s, 0.18, 0.78); // never grey, never neon
  const l2 = clamp(l, 0.35, 0.72); // never near-black or near-white
  return hslToHex(h, s2, l2);
};

// ---------- section derivation ----------

const SECTION_ROTATION: Record<SectionKey, { dh: number; dl: number; ds: number }> = {
  morning: { dh: -8, dl: 0.02, ds: 0.02 },
  evening: { dh: 22, dl: -0.06, ds: 0 },
  salah:   { dh: -22, dl: 0, ds: 0.04 },
  tasbih:  { dh: 12, dl: 0.01, ds: 0 },
  sleep:   { dh: 40, dl: -0.14, ds: -0.02 },
  wake:    { dh: -6, dl: 0.06, ds: 0.02 },
  custom:  { dh: 30, dl: 0, ds: 0 },
  default: { dh: 0, dl: 0, ds: 0 },
};

export const deriveSectionSeed = (baseSeed: string, section: SectionKey): string => {
  const { dh, dl, ds } = SECTION_ROTATION[section];
  const [h, s, l] = hexToHsl(baseSeed);
  return clampSeed(hslToHex(h + dh, clamp(s + ds, 0.18, 0.78), clamp(l + dl, 0.32, 0.75)));
};

// ---------- token derivation ----------

export type Tokens = Record<string, string>;

export const deriveTokens = (opts: { seed: string; mode: Mode }): Tokens => {
  const seed = clampSeed(opts.seed);
  const [h, s, l] = hexToHsl(seed);
  const isDark = opts.mode === "dark";

  // Surfaces
  const background = isDark
    ? hslToHex(h, Math.min(0.14, s * 0.3), 0.09)               // deep near-black with tint
    : hslToHex(h, Math.min(0.22, s * 0.35), 0.965);            // very light tinted cream
  const surface = isDark
    ? hslToHex(h, Math.min(0.16, s * 0.35), 0.13)
    : hslToHex(h, Math.min(0.22, s * 0.35), 0.99);
  const surfaceCard = isDark
    ? hslToHex(h, Math.min(0.16, s * 0.35), 0.16)              // slightly elevated
    : hslToHex(h, Math.min(0.22, s * 0.35), 1.0);
  const muted = isDark
    ? hslToHex(h, Math.min(0.18, s * 0.4), 0.22)
    : hslToHex(h, Math.min(0.28, s * 0.5), 0.92);

  // Text
  const textPrimary = isDark
    ? hslToHex(h, 0.06, 0.94)                                   // near-white, softened
    : hslToHex(h, 0.4, 0.14);                                   // deep tinted near-black
  const textSecondary = isDark
    ? hslToHex(h, 0.08, 0.72)
    : hslToHex(h, 0.25, 0.38);

  // Border
  const border = isDark
    ? rgba(hslToHex(h, 0.3, 0.6), 0.14)
    : rgba(hslToHex(h, 0.5, 0.35), 0.14);

  // Accent — desaturate a notch in dark, keep vivid in light
  const accent = isDark
    ? hslToHex(h, Math.max(0.32, s * 0.75), Math.max(0.5, l))
    : hslToHex(h, Math.min(0.75, s), Math.min(0.55, Math.max(0.42, l)));
  const textOnAccent = readableOn(accent);
  const accentValidated = ensureContrast(accent, textOnAccent, 4.5);

  // Header gradient — richer in dark, lighter in light
  let headerFrom: string, headerTo: string;
  if (isDark) {
    headerFrom = hslToHex(h, Math.min(0.65, s), 0.28);
    headerTo   = hslToHex(h - 8, Math.min(0.7, s), 0.18);
  } else {
    headerFrom = hslToHex(h, Math.min(0.55, s * 0.9), 0.72);
    headerTo   = hslToHex(h + 6, Math.min(0.62, s), 0.55);
  }
  const headerMid = mix(headerFrom, headerTo, 0.5);
  let headerFg = readableOn(headerMid);
  headerFrom = ensureContrast(headerFrom, headerFg, 4.5);
  headerTo   = ensureContrast(headerTo,   headerFg, 4.5);
  headerFg   = readableOn(mix(headerFrom, headerTo, 0.5));
  const headerSub = headerFg === "#ffffff"
    ? rgba("#ffffff", 0.82)
    : rgba("#000000", 0.65);

  // Validate primary body text against surface
  const cardFg = ensureContrast(textPrimary, surfaceCard, 4.5) === textPrimary
    ? textPrimary
    : (isDark ? "#ffffff" : "#0f0f10");
  const bgFg  = ensureContrast(textPrimary, background, 4.5) === textPrimary
    ? textPrimary
    : (isDark ? "#ffffff" : "#0f0f10");

  // Ring track — very low contrast neutral
  const ringTrack = isDark
    ? rgba("#ffffff", 0.10)
    : rgba("#000000", 0.10);

  // Count fg validated against card (this is the ring center number)
  const countFg = ensureContrast(cardFg, surfaceCard, 4.5);

  // Nav
  const navBg = isDark
    ? rgba(hslToHex(h, Math.min(0.12, s * 0.3), 0.08), 0.94)
    : rgba(hslToHex(h, Math.min(0.20, s * 0.3), 0.98), 0.94);
  const navBorder = isDark ? rgba("#ffffff", 0.08) : rgba("#000000", 0.08);
  const navActive = accentValidated;
  const navInactive = isDark ? rgba("#ffffff", 0.55) : rgba("#000000", 0.5);

  // Shadow
  const cardShadow = isDark
    ? "0 6px 20px rgba(0,0,0,0.35)"
    : `0 4px 16px ${rgba(hslToHex(h, 0.4, 0.15), 0.08)}`;

  // Legacy aliases the codebase reads
  const translit  = isDark ? mix(accentValidated, "#ffffff", 0.35) : mix(accentValidated, "#000000", 0.1);
  const btnSurface = isDark ? rgba(accentValidated, 0.18) : rgba(accentValidated, 0.14);
  const btnFg = textSecondary;
  const dotActive = accentValidated;
  const dotInactive = isDark ? rgba("#ffffff", 0.2) : rgba("#000000", 0.15);
  const sourceBg = btnSurface;
  const sourceFg = textSecondary;

  return {
    // core
    "--background": background,
    "--foreground": bgFg,
    "--surface": surface,
    "--surface-card": surfaceCard,
    "--card": surfaceCard,
    "--card-2": surfaceCard,
    "--card-foreground": cardFg,
    "--muted": muted,
    "--muted-foreground": textSecondary,
    "--primary": accentValidated,
    "--primary-foreground": textOnAccent,
    "--accent": accentValidated,
    "--accent-foreground": textOnAccent,
    "--border": border,
    "--translit": translit,
    "--text-primary": cardFg,
    "--text-secondary": textSecondary,
    "--text-on-accent": textOnAccent,
    "--text-on-header": headerFg,

    // header
    "--header-from": headerFrom,
    "--header-to": headerTo,
    "--grad-header": `linear-gradient(135deg, ${headerFrom} 0%, ${headerTo} 100%)`,
    "--header-fg": headerFg,
    "--header-sub": headerSub,

    // nav
    "--nav-bg": navBg,
    "--nav-safe-area-bg": background,
    "--nav-border": navBorder,
    "--nav-active": navActive,
    "--nav-inactive": navInactive,

    // rings / counters
    "--ring-track": ringTrack,
    "--ring-fill": accentValidated,
    "--count-fg": countFg,

    // legacy pill/badge/dot aliases
    "--index-badge-bg": accentValidated,
    "--index-badge-fg": textOnAccent,
    "--btn-surface": btnSurface,
    "--btn-fg": btnFg,
    "--dot-active": dotActive,
    "--dot-inactive": dotInactive,
    "--arrow-bg": btnSurface,
    "--arrow-fg": btnFg,
    "--source-bg": sourceBg,
    "--source-fg": sourceFg,
    "--card-shadow": cardShadow,
  };
};

// ---------- apply to DOM ----------

export const applyTokens = (tokens: Tokens, mode: Mode) => {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  for (const k in tokens) el.style.setProperty(k, tokens[k]);
  el.setAttribute("data-theme-mode", mode);
  // Legacy attribute for any old CSS selectors
  el.setAttribute("data-theme", mode === "dark" ? "dark" : "dawn");

  // Native status bar sync (best-effort, no-op on web)
  void syncStatusBar(tokens["--header-from"] ?? tokens["--background"], mode);
};

const syncStatusBar = async (color: string, mode: Mode) => {
  try {
    if (typeof window === "undefined") return;
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    if (!cap?.isNativePlatform?.()) return;
    const modName = "@capacitor/status-bar";
    const mod: any = await import(/* @vite-ignore */ modName);
    const { StatusBar, Style } = mod;
    await StatusBar.setBackgroundColor({ color });
    await StatusBar.setStyle({ style: mode === "dark" ? Style.Dark : Style.Light });
  } catch {
    // plugin not installed or web — ignore
  }
};
