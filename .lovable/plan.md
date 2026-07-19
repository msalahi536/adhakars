## Scope

Add a theming layer to Settings: a Mode toggle (Light / Dark / Auto) and a Color Theme customizer (presets + custom color wheel with live preview). Every color in the app becomes a derived semantic token from a single seed, with WCAG-validated contrast. No screen redesigns.

## Architecture

**New file `src/lib/theming.ts`** — the derivation engine:
- `oklchToHex`, `hexToOklch`, `relLuminance`, `contrast` utilities.
- `clampSeed(hex)` — clamps chroma and lightness into a safe range (never neon, never near-black/near-white).
- `deriveTokens({ seed, mode })` returns the full semantic token map:
  - Surfaces: `--surface`, `--surface-card`, `--background`, `--card`, `--card-2`, `--muted`, `--border`
  - Text: `--text-primary`, `--text-secondary`, `--foreground`, `--muted-foreground`, `--card-foreground`
  - Header: `--header-from`, `--header-to`, `--grad-header`, `--header-fg`, `--header-sub`, `--text-on-header`
  - Accent: `--accent`, `--accent-foreground`, `--text-on-accent`, `--primary`, `--primary-foreground`
  - Rings: `--ring-track`, `--ring-fill`, `--count-fg`
  - Nav: `--nav-bg`, `--nav-active`, `--nav-inactive`, `--nav-border`
  - Aliases the codebase already reads: `--translit`, `--btn-surface`, `--btn-fg`, `--source-bg`, `--source-fg`, `--arrow-bg`, `--arrow-fg`, `--dot-active`, `--dot-inactive`, `--index-badge-bg`, `--index-badge-fg`, `--card-shadow`.
- `validatePair(fg, bg, min=4.5)` — nudges bg lightness stepwise until contrast passes. Every text/bg pair runs through this; center count-fg validated against card.
- `deriveSectionSeed(baseSeed, sectionKey)` — small hue rotation + lightness step per section (Morning/Evening/Salah/Tasbih/Sleep/Wake) so they stay a distinct-but-harmonic family.
- `applyTokens(tokens)` — writes each var to `document.documentElement.style` and updates Capacitor StatusBar color/style to match header.

**New file `src/lib/theme-store.ts`** — persistence + reactive state:
- LocalStorage keys: `adhkar:mode` (`light|dark|auto`), `adhkar:seed` (hex), `adhkar:section-overrides` (map), `adhkar:theme-preset` (id or `custom`).
- `resolveMode()` (auto -> prefers-color-scheme), `getEffectiveTheme(route)`, subscribe/emit.
- Applied on load in a small inline script injected via `__root.tsx` `head()` scripts array, before first paint (no theme flash). Falls back to Classic preset if nothing stored.

**Presets** — `src/lib/theme-presets.ts` exporting: Classic, Rose, Lavender, Sakura, Ocean, Emerald, Sand, Midnight. Each `{ id, name, seedHex }`; derivation does the rest.

**Existing `src/lib/theme.ts`** — kept, but `applyTheme` + `resolveTheme` rewired: instead of setting `data-theme="dawn|dusk|salah"`, it computes the seed for the current section (base seed + section rotation, or per-section override) and calls `applyTokens(deriveTokens({ seed, mode }))`. The `dawn/dusk/salah` attribute stays set only for legacy CSS selectors that might reference it, but tokens win.

**`src/styles.css`** — keep the existing `:root` (Classic light) values as a static fallback so the app renders sanely before JS boots. Add missing token names (`--surface-card`, `--text-primary`, `--text-secondary`, `--ring-fill`, `--text-on-header`, `--text-on-accent`) with sensible fallbacks pointing at existing vars. No dark-mode class needed; JS writes vars directly.

## Settings UI

`src/routes/app.settings.tsx` — add a new **Appearance** section at the top (replaces the existing appearance controls):

```
Mode:  [ Light | Dark | Auto ]   (segmented)
Theme: 4×2 preset swatch grid
        each tile: mini header gradient + accent dot + name
       [ + Custom color ]  → opens sheet
Preview: <MiniPreview /> live mini phone frame
                            with an inner Light/Dark switch
[ ▸ Customize each section ]  (collapsed)
  Morning / Evening / Salah / Tasbih / Sleep&Wake
  each: swatch → opens same picker
[ Reset to defaults ]
```

**`src/components/theme/ThemePicker.tsx`** — bottom sheet with:
- Hue wheel (canvas or CSS conic-gradient with draggable knob).
- Single "Softness" slider (0=vivid, 1=muted → adjusts chroma).
- Optional hex field.
- The `<MiniPreview>` on top of the sheet updating live.

**`src/components/theme/MiniPreview.tsx`** — a small phone frame (~200×340) showing: header bar with gradient + label + title + progress bar, one dhikr card (Arabic word + source pill), a counter ring with number, bottom nav row. Reads from a supplied token map (not the global CSS vars) so it can preview candidates without applying globally.

## Section colors

Section keys map to hue rotations from the base:
- morning: −6°, +4% L (warmer, lighter)
- evening: +18°, −8% L (cooler, deeper)
- salah: −18°, +2% L (analogous warm sibling)
- tasbih: +8°
- sleep: +26°, −18% L (deep)
- wake: −10°, +8% L (bright)

Each result runs through the same validator. Section overrides replace the derived hex before derivation.

## Native

`src/lib/theming.ts` calls `StatusBar.setBackgroundColor` + `setStyle` after every apply, guarded by Capacitor platform check and dynamic import of `@capacitor/status-bar` (matches existing pattern). Install `@capacitor/status-bar`.

## Files

- new: `src/lib/theming.ts`, `src/lib/theme-store.ts`, `src/lib/theme-presets.ts`, `src/components/theme/ThemePicker.tsx`, `src/components/theme/MiniPreview.tsx`, `src/components/theme/ModeToggle.tsx`, `src/components/theme/PresetGrid.tsx`
- edited: `src/lib/theme.ts` (rewire apply/resolve), `src/routes/__root.tsx` (pre-paint inline script + wire apply on route change/mode change), `src/routes/app.settings.tsx` (new Appearance section), `src/styles.css` (add missing semantic token names as aliases; keep existing vars for fallback).
- add dep: `@capacitor/status-bar`.

## Acceptance checks (I will verify)

- Toggle Light/Dark/Auto, apply each preset, pick a neon custom color → ring number + card text stay ≥4.5:1 contrast in a browser probe.
- Reload preserves theme; no flash (inline script writes vars in `<head>`).
- Section colors visibly different but harmonious under each preset.
- Existing screens untouched structurally — only colors change.
