import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Sun, Moon, RotateCcw, LoaderCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { HomeAppearancePreview } from './HomeAppearancePreview';
import { APPEARANCE_PAGES, COLOR_ROLES, FONT_OPTIONS, cachedPhoto, defaultPalette, devicePhoto, emptyAppearance, loadAppearancePhotos, normalizePalette, paletteWarnings, readAppearance, resolveAppearance, saveAppearancePhoto, writeAppearance, pruneAppearancePhotos, PERSONAL_PRESET, type AppearancePhase, type CustomAppearance, type Palette, type ColorRole } from '@/lib/custom-appearance';
import { DEFAULT_BACKGROUNDS } from '@/lib/backgrounds';
import { setPresetId } from '@/lib/theme-store';

const BASIC_COLORS: ColorRole[] = ['background', 'text', 'card'];
const LABELS: Partial<Record<ColorRole, string>> = { background: 'Background', card: 'Cards', text: 'Text', title: 'Page title', accent: 'Buttons', nav: 'Bottom bar' };

export function PersonalAppearanceSheet({ open, onClose, onApply }: { open: boolean; onClose: () => void; onApply: () => void }) {
  const [draft, setDraft] = useState<CustomAppearance>(emptyAppearance);
  const [phase, setPhase] = useState<AppearancePhase>('morning');
  const [page, setPage] = useState('all');
  const [applyBoth, setApplyBoth] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [, setRevision] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = open;
    if (!open) return;
    setDraft(readAppearance()); setError(''); setPhase('morning'); setPage('all'); setLoading(true);
    void loadAppearancePhotos().then(() => { if (mounted.current) setRevision(v => v + 1); }).catch(() => { if (mounted.current) setError('Saved photos could not be loaded.'); }).finally(() => { if (mounted.current) setLoading(false); });
    return () => { mounted.current = false; };
  }, [open]);
  const appearance = resolveAppearance(draft, phase, page);
  const palette = normalizePalette(appearance.colors ?? {}, phase);
  const image = cachedPhoto(appearance.photo) ?? DEFAULT_BACKGROUNDS[phase];
  const warnings = paletteWarnings(palette);
  const update = (patch: { colors?: Partial<Palette>; photo?: string | null }) => {
    const phases: AppearancePhase[] = applyBoth ? ['morning', 'evening'] : [phase];
    setDraft(previous => {
      const next = { ...previous };
      for (const target of phases) next[target] = { ...next[target], [page]: { ...next[target][page], ...patch,
        ...(patch.colors ? { colors: { ...next[target][page]?.colors, ...patch.colors } } : {}) } };
      return next;
    });
  };
  const resetScope = () => {
    const phases: AppearancePhase[] = applyBoth ? ['morning', 'evening'] : [phase];
    setDraft(previous => {
      const next = { ...previous };
      for (const target of phases) { const entries = { ...next[target] }; delete entries[page]; next[target] = entries; }
      return next;
    });
    setError('');
  };
  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true); setError('');
    try { const photo = await devicePhoto(file); const id = await saveAppearancePhoto(photo);
      if (mounted.current) { update({ photo: id }); setRevision(v => v + 1); }
    } catch (error) { if (mounted.current) setError(error instanceof Error ? error.message : 'Could not load this photo.'); }
    finally { if (mounted.current) setBusy(false); if (fileInput.current) fileInput.current.value = ''; }
  };
  const save = () => {
    try { writeAppearance(draft); setPresetId(PERSONAL_PRESET); window.dispatchEvent(new Event('adhkar:theme-change')); void pruneAppearancePhotos(draft).catch(() => {}); onApply(); onClose(); }
    catch { setError('Could not save your appearance. Free some device storage and try again.'); }
  };
  const colorControl = (role: ColorRole) => <label key={role} className="personal-color-row"><span>{LABELS[role] ?? COLOR_ROLES.find(([key]) => key === role)?.[1]}</span><input type="color" aria-label={LABELS[role] ?? COLOR_ROLES.find(([key]) => key === role)?.[1]} value={palette[role]} disabled={busy} onChange={event => update({ colors: { [role]: event.target.value } })} /></label>;
  return <Dialog open={open} onOpenChange={value => { if (!value && !busy) onClose(); }}>
    <DialogContent className="personal-appearance-sheet" aria-describedby="personal-appearance-description">
      <div className="personal-appearance-heading"><DialogTitle>Your look</DialogTitle><DialogDescription id="personal-appearance-description">Make it feel like yours.</DialogDescription></div>
      <div className="personal-appearance-scroll">
        <div className="personal-preview-wrap"><HomeAppearancePreview palette={palette} phase={phase} image={image} /></div>
        <div className="personal-phase" role="group" aria-label="Appearance phase">{(['morning', 'evening'] as const).map(value => <Button key={value} variant="ghost" disabled={busy} aria-pressed={phase === value} onClick={() => { setPhase(value); setError(''); }} className={phase === value ? 'is-selected' : ''}>{value === 'morning' ? <Sun /> : <Moon />}{value === 'morning' ? 'Morning' : 'Evening'}</Button>)}</div>
        <input ref={fileInput} className="sr-only" type="file" accept="image/*" aria-label="Choose background photo" onChange={event => void upload(event.target.files?.[0])} />
        <section className="personal-section"><h3>Background</h3><div className="personal-photo-actions"><Button variant="outline" disabled={busy || loading} onClick={() => fileInput.current?.click()}>{busy ? <LoaderCircle className="animate-spin" /> : <ImagePlus />}{busy ? 'Opening…' : appearance.photo ? 'Change photo' : 'Choose photo'}</Button><Button variant="outline" disabled={busy || loading} onClick={() => update({ photo: null })}><RotateCcw />Reset</Button></div></section>
        <section className="personal-section"><h3>Colors</h3><div className="personal-basic-colors">{BASIC_COLORS.map(colorControl)}</div></section>
        <div className="personal-font-section"><h3>Text style</h3><div className="personal-font-choices" role="group" aria-label="Text style">{FONT_OPTIONS.map((font, index) => <Button key={font} variant="outline" disabled={busy} aria-pressed={palette.font === font} className={`personal-font-choice personal-font-${index} ${palette.font === font ? 'is-selected' : ''}`} onClick={() => update({ colors: { font } })}>{['Classic', 'Clean', 'Soft', 'Modern'][index]}</Button>)}</div></div>
        {error && <p className="personal-error" role="alert">{error}</p>}
        <details className="personal-more-colors"><summary>More options{page !== 'all' ? ` · ${APPEARANCE_PAGES.find(([id]) => id === page)?.[1]}` : ''}</summary><div className="personal-page-row"><label htmlFor="personal-page">Apply to</label><Select value={page} onValueChange={setPage} disabled={busy}><SelectTrigger id="personal-page"><SelectValue /></SelectTrigger><SelectContent className="z-[260]">{APPEARANCE_PAGES.map(([id, label]) => <SelectItem value={id} key={id}>{label}</SelectItem>)}</SelectContent></Select></div><div className="personal-color-grid">{COLOR_ROLES.filter(([role]) => !BASIC_COLORS.includes(role)).map(([role]) => colorControl(role))}</div><Button variant="ghost" size="sm" disabled={busy} onClick={() => update({ colors: defaultPalette(phase) })}><RotateCcw />Reset colors</Button>{warnings.length > 0 && <p className="personal-warning">Some text may be hard to read: {warnings.join(', ')}</p>}</details>
        {page !== 'all' && <Button className="personal-inherit" variant="ghost" disabled={busy} onClick={() => setDraft(previous => { const next = { ...previous[phase] }; delete next[page]; return { ...previous, [phase]: next }; })}><RotateCcw />Use all-page appearance</Button>}
      </div>
      <div className="personal-footer"><Button variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button disabled={busy || loading} onClick={save}>Save changes</Button></div>
    </DialogContent>
  </Dialog>;
}
