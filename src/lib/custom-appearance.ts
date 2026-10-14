import { deriveTokens, readableOn, rgba, hexToRgb, contrast, type Tokens } from './theming';

export type AppearancePhase = 'morning' | 'evening';
export const APPEARANCE_KEY = 'adhkar:personal-appearance:v1';
export const PERSONAL_PRESET = 'personal';
export const APPEARANCE_PAGES = [
  ['all', 'All pages'], ['morning', 'Morning adhkar'], ['evening', 'Evening adhkar'],
  ['salah', 'Salah'], ['tasbih', 'Tasbih'], ['more', 'More'], ['sleep', 'Sleep & Wake'],
  ['qibla', 'Qibla'], ['duas', 'Dua Library'], ['period', 'Period Companion'],
  ['ruqyah', 'Ruqyah'], ['hajj', 'Hajj & Umrah'], ['fasting', 'Fasting'], ['settings', 'Settings'],
] as const;
export const COLOR_ROLES = [
  ['background', 'Page background'], ['card', 'Cards'], ['text', 'Card & Arabic text'],
  ['muted', 'Secondary text'], ['title', 'Page titles'], ['accent', 'Primary color'],
  ['accentText', 'Button text'], ['translit', 'Transliteration'], ['nav', 'Navigation'],
  ['navText', 'Inactive navigation'], ['border', 'Borders'], ['header', 'Header'],
  ['headerText', 'Header text'], ['counter', 'Counter text'],
] as const;
export type ColorRole = typeof COLOR_ROLES[number][0];
export type Palette = Record<ColorRole, string> & { font: string };
export const FONT_OPTIONS = ['Jost', 'Hanken Grotesk', 'Outfit', 'Plus Jakarta Sans'] as const;
export type PageAppearance = { colors?: Partial<Palette>; photo?: string | null };
export type CustomAppearance = Record<AppearancePhase, Record<string, PageAppearance>>;
export const emptyAppearance = (): CustomAppearance => ({ morning: {}, evening: {} });

export function pageForAppearance(pathname: string) {
  const slug = pathname.replace(/\/$/, '').split('/')[2];
  return slug || 'morning';
}
export function resolveAppearance(config: CustomAppearance, phase: AppearancePhase, page: string): PageAppearance {
  const base = config[phase]?.all ?? {};
  const override = config[phase]?.[page] ?? {};
  return { colors: { ...base.colors, ...override.colors }, photo: override.photo === undefined ? base.photo : override.photo };
}
export function defaultPalette(phase: AppearancePhase): Palette {
  const t = deriveTokens({ seed: '#70815d', mode: phase === 'evening' ? 'dark' : 'light' });
  return { background: t['--background'], card: t['--card'], text: t['--card-foreground'],
    muted: t['--muted-foreground'], title: t['--foreground'], accent: t['--accent'],
    accentText: t['--accent-foreground'], translit: t['--translit'], nav: phase === 'evening' ? '#151b18' : '#fafcf9',
    navText: phase === 'evening' ? '#b3bcb3' : '#566151', border: phase === 'evening' ? '#455044' : '#d1d9cc',
    header: t['--header-from'], headerText: t['--header-fg'], counter: t['--count-fg'], font: 'Jost' };
}
export function normalizePalette(value: Partial<Palette>, phase: AppearancePhase): Palette {
  const result = defaultPalette(phase);
  for (const [key] of COLOR_ROLES) {
    const color = value[key];
    if (typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color)) result[key] = color;
  }
  if (FONT_OPTIONS.some(font => font === value.font)) result.font = String(value.font);
  return result;
}
export function paletteTokens(p: Palette, phase: AppearancePhase): Tokens {
  const t = deriveTokens({ seed: p.accent, mode: phase === 'evening' ? 'dark' : 'light' });
  const rgb = hexToRgb(p.accent).join(', ');
  Object.assign(t, {
    '--background': p.background, '--foreground': p.title, '--surface': p.card,
    '--surface-card': p.card, '--card': p.card, '--card-2': p.card, '--card-foreground': p.text,
    '--text-primary': p.text, '--text-secondary': p.muted, '--muted-foreground': p.muted, '--text-muted': p.muted,
    '--muted': p.card, '--title': p.title, '--eyebrow': p.title,
    '--accent': p.accent, '--primary': p.accent, '--accent-foreground': p.accentText,
    '--primary-foreground': p.accentText, '--text-on-accent': p.accentText,
    '--translit': p.translit, '--border': p.border,
    '--header-from': p.header, '--header-to': p.header, '--grad-header': p.header,
    '--header-fg': p.headerText, '--header-sub': p.headerText, '--text-on-header': p.headerText,
    '--nav-bg': p.nav, '--nav-safe-area-bg': p.nav, '--nav-active': p.accent, '--nav-inactive': p.navText, '--nav-border': p.border,
    '--count-fg': p.counter, '--ring-fill': p.accent, '--ring-track': rgba(p.accent, .18),
    '--index-badge-bg': p.accent, '--index-badge-fg': p.accentText,
    '--btn-surface': p.card, '--btn-fg': p.accent, '--arrow-bg': p.card, '--arrow-fg': p.accent,
    '--source-bg': p.card, '--source-fg': p.muted, '--dot-active': p.accent, '--dot-inactive': rgba(p.accent, .3),
    '--preset-ink': p.accent, '--preset-ink-strong': p.title, '--preset-ink-rgb': rgb, '--preset-muted': p.muted,
    '--eve-ink': p.accent, '--eve-ink-rgb': rgb, '--eve-title': p.title, '--eve-eyebrow': p.muted,
    '--eve-nav-active': p.accent, '--eve-nav-inactive': p.navText, '--eve-muted': p.muted, '--eve-source-fg': p.muted,
    '--font-sans': `"${p.font}", system-ui, sans-serif`,
    '--font-display': `"${p.font}", system-ui, sans-serif`,
    '--surface-deep': p.header, '--surface-deep-fg': p.headerText,
    '--surface-deep-muted': p.headerText, '--surface-deep-border': p.border,
    '--surface-deep-gradient': p.header, '--surface-deep-accent-fg': readableOn(p.accent),
  });
  return t;
}
export function paletteWarnings(p: Palette) {
  return [['Card text', p.text, p.card], ['Button text', p.accentText, p.accent], ['Header text', p.headerText, p.header]]
    .filter(([, foreground, background]) => contrast(foreground, background) < 4.5).map(([label]) => label);
}
export function readAppearance(): CustomAppearance {
  if (typeof window === 'undefined') return emptyAppearance();
  try {
    const raw = JSON.parse(localStorage.getItem(APPEARANCE_KEY) ?? '{}');
    return { morning: raw.morning ?? {}, evening: raw.evening ?? {} };
  } catch { return emptyAppearance(); }
}
export function writeAppearance(config: CustomAppearance) {
  localStorage.setItem(APPEARANCE_KEY, JSON.stringify(config));
}

// Custom photos stay on this device and are never sent for remote analysis.
let photoCache: Record<string, string> = {};
async function photoDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('adhkar-personal-photos', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('photos');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Photo storage is unavailable on this device.'));
  });
}
export async function loadAppearancePhotos() {
  const db = await photoDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('photos', 'readonly');
    const request = transaction.objectStore('photos').openCursor();
    request.onsuccess = () => { const cursor = request.result; if (cursor) { photoCache[String(cursor.key)] = String(cursor.value); cursor.continue(); } };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('Could not load saved photos.'));
  });
  db.close();
}
export function cachedPhoto(id?: string | null) { return id ? photoCache[id] : undefined; }
export async function pruneAppearancePhotos(config: CustomAppearance) {
  const used = new Set(Object.values(config).flatMap(pages => Object.values(pages).map(page => page.photo).filter(Boolean)));
  const db = await photoDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('photos', 'readwrite');
    const request = transaction.objectStore('photos').openCursor();
    request.onsuccess = () => { const cursor = request.result; if (!cursor) return;
      if (!used.has(String(cursor.key))) { cursor.delete(); delete photoCache[String(cursor.key)]; } cursor.continue(); };
    transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(new Error('Photo cleanup failed.'));
  });
  db.close();
}
export async function saveAppearancePhoto(dataUrl: string) {
  const id = crypto.randomUUID();
  const db = await photoDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('photos', 'readwrite');
    transaction.objectStore('photos').put(dataUrl, id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('Could not save the photo. Free some device storage and try again.'));
  });
  db.close(); photoCache[id] = dataUrl; return id;
}
export async function devicePhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose a photo.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image(); image.src = url; await image.decode();
    const scale = Math.min(1, 1440 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas'); canvas.width = Math.round(image.naturalWidth * scale); canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext('2d'); if (!context) throw new Error('Could not read this photo.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', .83);
  } catch { throw new Error('This photo could not be opened. Try a JPG, PNG or WebP photo.'); }
  finally { URL.revokeObjectURL(url); }
}