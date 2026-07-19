// Derived-token theming engine.
// Given a seed hex + mode (light/dark), computes a full semantic token map
// with WCAG-validated contrast, and writes CSS variables to <html>.
//
// Optional `custom` overrides let the user directly set the top bar,
// background, and/or accent independently — text colors auto-derive.

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

export type CustomOverrides = {
  header?: string;      // top bar seed
  background?: string;  // page background
  accent?: string;      // rings / buttons / active nav
};

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

/** Nudge bg's lightness until contrast(bg, fg) >= min. */
export const ensureContrast = (bg: string, fg: string, min = 4.5): string => {
  if (contrast(bg, fg) >= min) return bg;
  const [h, s] = hexToHsl(bg);
  const fgL = luminance(fg);
  const goDarker = fgL > 0.5;
  let l = hexToHsl(bg)[2];
  for (let i = 0; i < 100; i++) {
    l = goDarker ? Math.max(0, l - 0.01) : Math.min(1, l + 0.01);
    const candidate = hslToHex(h, s, l);
    if (contrast(candidate, fg) >= min) return candidate;
    if (l <= 0.02 || l >= 0.98) break;
  }
  return hslToHex(h, s, l);
};

export const mix = (a: string, b: string, t: number): string => {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
};

export const rgba = (hex: string, alpha: number): string => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`;
};

// ---------- seed clamping ----------

export const clampSeed = (hex: string): string => {
  const [h, s, l] = hexToHsl(hex);
  const s2 = clamp(s, 0.18, 0.82);
  const l2 = clamp(l, 0.32, 0.75);
  return hslToHex(h, s2, l2);
};

// ---------- section derivation ----------
// Tonal-only variation of the SAME hue: keep every section on the base hue,
// separate them by lightness / saturation only. Family-of-one, not rainbow.

const SECTION_TONE: Record<SectionKey, { dl: number; ds: number }> = {
  morning: { dl:  0.04, ds: -0.04 }, // warm & light
  evening: { dl: -0.06, ds:  0.03 }, // deeper
  salah:   { dl: -0.10, ds:  0.06 }, // richest
  tasbih:  { dl:  0.01, ds: -0.06 }, // soft
  sleep:   { dl: -0.14, ds:  0.04 }, // deep, quiet
  wake:    { dl:  0.07, ds: -0.03 }, // bright
  custom:  { dl:  0.00, ds:  0.00 },
  default: { dl:  0.00, ds:  0.00 },
};

export const deriveSectionSeed = (baseSeed: string, section: SectionKey): string => {
  const { dl, ds } = SECTION_TONE[section];
  const [h, s, l] = hexToHsl(baseSeed);
  return clampSeed(hslToHex(h, clamp(s + ds, 0.18, 0.82), clamp(l + dl, 0.28, 0.78)));
};

// ---------- token derivation ----------

export type Tokens = Record<string, string>;

export const deriveTokens = (opts: {
  seed: string;
  mode: Mode;
  custom?: CustomOverrides;
}): Tokens => {
  const seed = clampSeed(opts.seed);
  const [h, s, l] = hexToHsl(seed);
  const isDark = opts.mode === "dark";
  const c = opts.custom ?? {};

  // --- surfaces ---
  const bgDefault = isDark
    ? hslToHex(h, Math.min(0.14, s * 0.3), 0.09)
    : hslToHex(h, Math.min(0.22, s * 0.35), 0.965);
  const background = c.background ? clampSurface(c.background, isDark) : bgDefault;
  const [bh, bs] = hexToHsl(background);

  const surface = isDark
    ? hslToHex(bh, Math.min(0.16, bs + 0.02), Math.min(0.18, hexToHsl(background)[2] + 0.04))
    : hslToHex(bh, Math.min(0.22, bs + 0.02), Math.min(0.99, hexToHsl(background)[2] + 0.025));
  const surfaceCard = isDark
    ? hslToHex(bh, Math.min(0.16, bs + 0.02), Math.min(0.20, hexToHsl(background)[2] + 0.07))
    : hslToHex(bh, Math.min(0.22, bs + 0.02), 1.0);
  const muted = isDark
    ? hslToHex(bh, Math.min(0.18, bs + 0.04), Math.min(0.28, hexToHsl(background)[2] + 0.13))
    : hslToHex(bh, Math.min(0.28, bs + 0.06), 0.92);

  // --- surface-deep: rich dark theme-tinted card
  // Same theme hue, always dark, regardless of app mode. Used by After Salah
  // ayah card, Consistency card, My Dhikr card.
  const deepH = h;
  const deepS = Math.min(0.55, Math.max(0.32, s * 0.85));
  const deepL = isDark ? 0.13 : 0.20;
  const surfaceDeep = hslToHex(deepH, deepS, deepL);
  const surfaceDeepFg = "#ffffff";
  const surfaceDeepMuted = rgba("#ffffff", 0.78);
  const surfaceDeepBorder = rgba("#ffffff", 0.18);

  // --- text ---
  const textPrimaryRaw = isDark
    ? hslToHex(bh, 0.06, 0.94)
    : hslToHex(bh, 0.4, 0.14);
  const textSecondary = isDark
    ? hslToHex(bh, 0.08, 0.72)
    : hslToHex(bh, 0.25, 0.38);

  // border
  const border = isDark
    ? rgba(hslToHex(bh, 0.3, 0.6), 0.14)
    : rgba(hslToHex(bh, 0.5, 0.35), 0.14);

  // --- accent ---
  const accentSource = c.accent ? clampSeed(c.accent) : seed;
  const [ah, as, al] = hexToHsl(accentSource);
  const accent = isDark
    ? hslToHex(ah, Math.max(0.32, as * 0.75), Math.max(0.5, al))
    : hslToHex(ah, Math.min(0.75, as), Math.min(0.55, Math.max(0.42, al)));
  const textOnAccent = readableOn(accent);
  const accentValidated = ensureContrast(accent, textOnAccent, 4.5);
  // Text-on-accent when accent sits on the deep surface (calendar/badge cells)
  const surfaceDeepAccentFg = readableOn(accentValidated);

  // --- header ---
  let headerFrom: string, headerTo: string;
  if (c.header) {
    const hs2 = clampSeed(c.header);
    const [hh, hss, hll] = hexToHsl(hs2);
    if (isDark) {
      headerFrom = hslToHex(hh, Math.min(0.7, hss), Math.max(0.20, hll * 0.55));
      headerTo   = hslToHex(hh - 8, Math.min(0.7, hss), Math.max(0.14, hll * 0.42));
    } else {
      headerFrom = hslToHex(hh, Math.min(0.62, hss), Math.min(0.72, Math.max(0.5, hll + 0.08)));
      headerTo   = hslToHex(hh + 6, Math.min(0.68, hss), Math.max(0.42, hll - 0.06));
    }
  } else if (isDark) {
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
  const headerSub = headerFg === "#ffffff" ? rgba("#ffffff", 0.82) : rgba("#000000", 0.65);

  // validated body / card text
  const cardFg = ensureContrast(textPrimaryRaw, surfaceCard, 4.5) === textPrimaryRaw
    ? textPrimaryRaw
    : (isDark ? "#ffffff" : "#0f0f10");
  const bgFg = ensureContrast(textPrimaryRaw, background, 4.5) === textPrimaryRaw
    ? textPrimaryRaw
    : (isDark ? "#ffffff" : "#0f0f10");

  const ringTrack = isDark ? rgba("#ffffff", 0.10) : rgba("#000000", 0.10);
  const countFg = ensureContrast(cardFg, surfaceCard, 4.5);

  // Nav
  const navBg = isDark
    ? rgba(hslToHex(bh, Math.min(0.12, bs * 0.7), 0.08), 0.94)
    : rgba(hslToHex(bh, Math.min(0.20, bs * 0.7), 0.98), 0.94);
  const navBorder = isDark ? rgba("#ffffff", 0.08) : rgba("#000000", 0.08);
  const navActive = accentValidated;
  const navInactive = isDark ? rgba("#ffffff", 0.55) : rgba("#000000", 0.5);

  const cardShadow = isDark
    ? "0 6px 20px rgba(0,0,0,0.35)"
    : `0 4px 16px ${rgba(hslToHex(bh, 0.4, 0.15), 0.08)}`;

  // legacy aliases
  const translit  = isDark ? mix(accentValidated, "#ffffff", 0.35) : mix(accentValidated, "#000000", 0.1);
  const btnSurface = isDark ? rgba(accentValidated, 0.18) : rgba(accentValidated, 0.14);
  const btnFg = textSecondary;
  const dotActive = accentValidated;
  const dotInactive = isDark ? rgba("#ffffff", 0.2) : rgba("#000000", 0.15);
  const sourceBg = btnSurface;
  const sourceFg = textSecondary;

  return {
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

    // deep, richly-tinted feature surface
    "--surface-deep": surfaceDeep,
    "--surface-deep-fg": surfaceDeepFg,
    "--surface-deep-muted": surfaceDeepMuted,
    "--surface-deep-border": surfaceDeepBorder,
    "--surface-deep-accent-fg": surfaceDeepAccentFg,
    "--surface-deep-gradient": `linear-gradient(135deg, ${hslToHex(deepH, deepS, deepL + 0.04)} 0%, ${surfaceDeep} 100%)`,

    "--header-from": headerFrom,
    "--header-to": headerTo,
    "--grad-header": `linear-gradient(135deg, ${headerFrom} 0%, ${headerTo} 100%)`,
    "--header-fg": headerFg,
    "--header-sub": headerSub,

    "--nav-bg": navBg,
    "--nav-safe-area-bg": background,
    "--nav-border": navBorder,
    "--nav-active": navActive,
    "--nav-inactive": navInactive,

    "--ring-track": ringTrack,
    "--ring-fill": accentValidated,
    "--count-fg": countFg,

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

// Allow user-picked background to be anywhere on the wheel, but clamp
// its lightness to something usable (near-white in light, near-black in dark).
const clampSurface = (hex: string, isDark: boolean): string => {
  const [hh, ss] = hexToHsl(hex);
  const s2 = clamp(ss, 0.02, 0.35);
  const l2 = isDark ? clamp(hexToHsl(hex)[2] * 0.15 + 0.05, 0.05, 0.14) : clamp(hexToHsl(hex)[2] * 0.15 + 0.9, 0.90, 0.99);
  return hslToHex(hh, s2, l2);
};

// ---------- apply to DOM ----------

export const applyTokens = (tokens: Tokens, mode: Mode) => {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  for (const k in tokens) el.style.setProperty(k, tokens[k]);
  el.setAttribute("data-theme-mode", mode);
  el.setAttribute("data-theme", mode === "dark" ? "dark" : "dawn");
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
    // ignore
  }
};
