import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { ImagePlus, Sun, Moon, Sparkles, RotateCcw, Trash2, LoaderCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { suggestPhotoPalette } from '@/lib/theme-palette.functions';
import { APPEARANCE_PAGES, COLOR_ROLES, FONT_OPTIONS, cachedPhoto, defaultPalette, devicePhoto, emptyAppearance, loadAppearancePhotos, normalizePalette, paletteTokens, paletteWarnings, readAppearance, resolveAppearance, saveAppearancePhoto, writeAppearance, PERSONAL_PRESET, type AppearancePhase, type CustomAppearance, type Palette } from '@/lib/custom-appearance';
import { DEFAULT_BACKGROUNDS } from '@/lib/backgrounds';
import { setPresetId } from '@/lib/theme-store';
import { pruneAppearancePhotos } from '@/lib/custom-appearance';

export function PersonalAppearanceSheet({ open, onClose, onApply }: { open: boolean; onClose: () => void; onApply: () => void }) {
  const [draft, setDraft] = useState<CustomAppearance>(emptyAppearance);
  const [phase, setPhase] = useState<AppearancePhase>('morning');
  const [page, setPage] = useState('all');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [autoMatch, setAutoMatch] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [aiMatched, setAiMatched] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const mounted = useRef(false);
  const matchPalette = useServerFn(suggestPhotoPalette);
  useEffect(() => { mounted.current = open; if (!open) return;
    setDraft(readAppearance()); setError(''); setPhase('morning'); setPage('all'); setAiMatched(false); setLoading(true);
    void loadAppearancePhotos().then(() => setRevision(v => v + 1)).catch(() => setError('Saved photos could not be loaded.')).finally(() => setLoading(false));
    return () => { mounted.current = false; };
  }, [open]);
  const appearance = resolveAppearance(draft, phase, page);
  const palette = normalizePalette(appearance.colors ?? {}, phase);
  const image = cachedPhoto(appearance.photo) ?? DEFAULT_BACKGROUNDS[phase];
  const warnings = paletteWarnings(palette);
  const update = (patch: { colors?: Partial<Palette>; photo?: string | null }) => {
    setDraft(previous => ({ ...previous, [phase]: { ...previous[phase], [page]: { ...previous[phase][page], ...patch,
      ...(patch.colors ? { colors: { ...previous[phase][page]?.colors, ...patch.colors } } : {}) } } }));
    setAiMatched(false);
  };
  const runMatching = async (photo: string, selectedPhase = phase, selectedPage = page) => {
    setBusy(true); setError('');
    try {
      const result = await matchPalette({ data: { image: photo, phase: selectedPhase } });
      if (!mounted.current) return;
      if (!result.ok) { setError(result.error); return; }
      setDraft(previous => ({ ...previous, [selectedPhase]: { ...previous[selectedPhase], [selectedPage]: { ...previous[selectedPhase][selectedPage], colors: result.palette } } }));
      setAiMatched(true);
    } catch { if (mounted.current) setError('Could not connect to Gemini. Your photo is saved in this draft; you can choose colors below.'); }
    finally { if (mounted.current) setBusy(false); }
  };
  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true); setError('');
    try { const photo = await devicePhoto(file); const id = await saveAppearancePhoto(photo);
      if (!mounted.current) return;
      update({ photo: id }); setRevision(v => v + 1);
      if (autoMatch) await runMatching(photo);
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not load this photo.'); }
    finally { setBusy(false); if (fileInput.current) fileInput.current.value = ''; }
  };
  const save = () => {
    try { writeAppearance(draft); setPresetId(PERSONAL_PRESET); window.dispatchEvent(new Event('adhkar:theme-change')); void pruneAppearancePhotos(draft).catch(() => {}); onApply(); onClose(); }
    catch { setError('Could not save your appearance. Free some device storage and try again.'); }
  };
  return <Dialog open={open} onOpenChange={value => { if (!value && !busy) onClose(); }}>
    <DialogContent className="personal-appearance-sheet" aria-describedby="personal-appearance-description">
      <div className="personal-appearance-heading"><DialogTitle>Custom background &amp; colors</DialogTitle>
        <DialogDescription id="personal-appearance-description">Your own Morning and Evening.</DialogDescription></div>
      <div className="personal-appearance-scroll">
        <div className="personal-phase" role="group" aria-label="Appearance phase">
          {(['morning', 'evening'] as const).map(value => <Button key={value} variant="ghost" disabled={busy} aria-pressed={phase === value} onClick={() => { setPhase(value); setError(''); setAiMatched(false); }} className={phase === value ? 'is-selected' : ''}>{value === 'morning' ? <Sun /> : <Moon />}{value === 'morning' ? 'Morning' : 'Evening'}</Button>)}
        </div>
        <label className="personal-label" htmlFor="personal-page">Page</label>
        <Select value={page} onValueChange={value => { setPage(value); setAiMatched(false); }} disabled={busy}>
          <SelectTrigger id="personal-page"><SelectValue /></SelectTrigger><SelectContent className="z-[260]">{APPEARANCE_PAGES.map(([id, label]) => <SelectItem value={id} key={id}>{label}</SelectItem>)}</SelectContent>
        </Select>
        <div key={revision} className="personal-preview" style={{ ...paletteTokens(palette, phase), '--personal-photo': `url("${image}")` } as CSSProperties} aria-label={`${phase} appearance preview`}>
          <div className="personal-preview-title">{phase === 'morning' ? 'Morning' : 'Evening'}<small>أذكار {phase === 'morning' ? 'الصباح' : 'المساء'}</small></div>
          <div className="personal-preview-card"><div className="personal-preview-arabic" lang="ar" dir="rtl">سُبْحَانَ اللَّهِ وَبِحَمْدِهِ</div><em>Subḥānallāhi wa biḥamdih</em><p>Glory be to Allah and praise Him.</p><span className="personal-preview-counter">33</span></div>
          <div className="personal-preview-nav"><Sun /><Moon /><span>☾</span><span>33</span><span>•••</span></div>
        </div>
        <input ref={fileInput} className="sr-only" type="file" accept="image/*" aria-label="Choose background photo" onChange={event => void upload(event.target.files?.[0])} />
        <div className="personal-photo-actions"><Button variant="outline" disabled={busy || loading} onClick={() => fileInput.current?.click()}><ImagePlus />{appearance.photo ? 'Change photo' : 'Choose photo'}</Button>
          {appearance.photo && <Button variant="ghost" size="icon" title="Remove photo" aria-label="Remove photo" disabled={busy} onClick={() => update({ photo: null })}><Trash2 /></Button>}</div>
        <label className="personal-auto-match"><input type="checkbox" checked={autoMatch} disabled={busy} onChange={event => setAutoMatch(event.target.checked)} />Match colors with Gemini when choosing a photo</label>
        <p className="personal-privacy">Photos stay on this device. Gemini matching sends a copy for analysis.</p>
        <Button className="personal-match" disabled={busy || !cachedPhoto(appearance.photo)} onClick={() => { const photo = cachedPhoto(appearance.photo); if (photo) void runMatching(photo); }}>{busy ? <LoaderCircle className="animate-spin" /> : <Sparkles />}{busy ? 'Matching your photo…' : 'Match colors with Gemini'}</Button>
        {aiMatched && <p className="personal-status" role="status">Gemini colors ready</p>}
        {error && <p className="personal-error" role="alert">{error}</p>}
        <div className="personal-colors-heading"><h3>Colors</h3><Button variant="ghost" size="sm" disabled={busy} onClick={() => update({ colors: defaultPalette(phase) })}><RotateCcw />Reset colors</Button></div>
        <div className="personal-color-grid">{COLOR_ROLES.map(([role, label]) => <label key={role} className="personal-color-row"><span>{label}</span><input type="color" aria-label={label} value={palette[role]} disabled={busy} onChange={event => update({ colors: { [role]: event.target.value } })} /></label>)}</div>
        {warnings.length > 0 && <p className="personal-warning" role="status">Low contrast: {warnings.join(', ')}</p>}
        <label className="personal-label" htmlFor="personal-font">Font</label>
        <Select value={palette.font} disabled={busy} onValueChange={font => update({ colors: { font } })}><SelectTrigger id="personal-font"><SelectValue /></SelectTrigger><SelectContent className="z-[260]">{FONT_OPTIONS.map(font => <SelectItem key={font} value={font}>{font}</SelectItem>)}</SelectContent></Select>
        {page !== 'all' && <Button className="mt-3 w-full" variant="ghost" disabled={busy} onClick={() => setDraft(previous => { const next = { ...previous[phase] }; delete next[page]; return { ...previous, [phase]: next }; })}><RotateCcw />Use all-page appearance</Button>}
      </div>
      <div className="personal-footer"><Button variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button disabled={busy || loading} onClick={save}>Save appearance</Button></div>
    </DialogContent>
  </Dialog>;
}