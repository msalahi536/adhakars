import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { X, Settings2, BookOpen, Headphones, ALargeSmall, Moon, Layers, Scan, UserRound, Repeat2, Play, ArrowLeftRight, Vibrate, Info, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { TAJWEED_GROUPS } from "@/lib/tajweed-rules";
import { RECITERS, reciterName } from "@/lib/quran";
import type { ReciteSettings as Settings } from "@/lib/recite/model";
import { SampleConsentSettings } from "@/components/hifz/SampleConsent";

function Label({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return <span className="rc-setting-label"><Icon aria-hidden="true" /><span>{children}</span></span>;
}
export function Choice<T extends string>({ label, icon, value, options, onChange }: { label: string; icon?: LucideIcon; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return <fieldset className="rc-setting"><legend>{icon ? <Label icon={icon}>{label}</Label> : label}</legend><div className="rc-choice">{options.map((o) => <Button variant="ghost" key={o.value} aria-pressed={value === o.value} className={value === o.value ? "is-on" : ""} onClick={() => onChange(o.value)}>{o.label}</Button>)}</div></fieldset>;
}
function Toggle({ label, icon, checked, change }: { label: string; icon: LucideIcon; checked: boolean; change: (value: boolean) => void }) {
  return <div className="rc-toggle-row"><Label icon={icon}>{label}</Label><Switch aria-label={label} checked={checked} onCheckedChange={change} /></div>;
}
export function ReciteSettings({ settings, change, close }: { settings: Settings; change: (value: Partial<Settings>) => void; close: () => void }) {
  const [guide, setGuide] = useState(false);
  return <section className="rc-sheet rc-settings" role="dialog" aria-modal="true" aria-label="Page settings">
    <div className="rc-settings-handle" aria-hidden="true" />
    <header className="rc-settings-header"><Settings2 aria-hidden="true" /><h2>Page settings</h2><Button variant="ghost" size="icon" aria-label="Close settings" onClick={close}><X /></Button></header>
    <div className="rc-settings-rule" aria-hidden="true"><span /></div>
    <div className="rc-settings-content">
      <label className="rc-setting"><Label icon={BookOpen}>Mushaf</Label><select aria-label="Mushaf" value={settings.layout === "mushaf" ? "mushaf" : "ayah"} onChange={(e) => change({ layout: e.target.value === "mushaf" ? "mushaf" : "ayah" })}><option value="mushaf">Madani · 15 lines</option><option value="indopak" disabled>Indo-Pak · 16 lines — unavailable</option><option value="ayah">Uthmani text</option></select></label>
      <Choice icon={Headphones} label="Recitation mode" value={settings.mode} onChange={(mode) => change({ mode })} options={[{ value: "self", label: "Self check" }, { value: "ai", label: "AI check" }]} />
      <Toggle icon={Info} label="Show unclear words" checked={settings.showUnclearWords} change={(showUnclearWords) => change({ showUnclearWords })} />
      <Toggle icon={Info} label="Tajweed tips" checked={settings.tajweedTips} change={(tajweedTips) => change({ tajweedTips })} />
      <Toggle icon={ALargeSmall} label="Tajweed colors" checked={settings.tajweed} change={(tajweed) => change({ tajweed })} />
      <Toggle icon={Moon} label="Night reading" checked={settings.theme === "night"} change={(night) => change({ theme: night ? "night" : "auto" })} />
      <Button className="rc-guide-toggle" variant="ghost" aria-expanded={guide} onClick={() => setGuide(!guide)}><Label icon={BookOpen}>Color guide</Label></Button>
      {guide && <ul className="rc-color-guide">{TAJWEED_GROUPS.map((g) => <li key={g.id}><i className={`rc-swatch rc-tj-${g.id}`} /><span>{g.label}<small>{g.sub}</small></span></li>)}</ul>}
      <Choice icon={Layers} label="Hide style" value={settings.hideStyle} onChange={(hideStyle) => change({ hideStyle })} options={[{ value: "faint", label: "Faint" }, { value: "mist", label: "Mist" }, { value: "blank", label: "Blank" }]} />
      <Choice icon={Scan} label="Hide amount" value={settings.hideAmount} onChange={(hideAmount) => change({ hideAmount })} options={[{ value: "page", label: "Whole page" }, { value: "ayah", label: "First word of each ayah" }, { value: "line", label: "First word of each line" }]} />
      {settings.layout !== "mushaf" && <><label className="rc-setting"><Label icon={ALargeSmall}>Text size</Label><input aria-label="Text size" type="range" min="20" max="34" value={settings.size} onChange={(e) => change({ size: Number(e.target.value) })} /></label><Toggle icon={BookOpen} label="Translation" checked={settings.translation} change={(translation) => change({ translation })} /><Toggle icon={ALargeSmall} label="Transliteration" checked={settings.transliteration} change={(transliteration) => change({ transliteration })} /></>}
      <label className="rc-setting"><Label icon={UserRound}>Qari</Label><select aria-label="Qari" value={settings.reciter} onChange={(e) => change({ reciter: Number(e.target.value) })}>{RECITERS.filter((r) => r.group === 1 && r.sync === "word" && !r.server && !r.files).map((r) => <option key={r.id} value={r.id}>{reciterName(r)}</option>)}</select></label>
      <Choice icon={Repeat2} label="Repeat each ayah" value={settings.repeat} onChange={(repeat) => change({ repeat })} options={["1", "3", "5", "∞"].map((value) => ({ value, label: value }))} />
      <label className="rc-setting"><Label icon={Play}>Playback speed</Label><select aria-label="Playback speed" value={settings.speed} onChange={(e) => change({ speed: Number(e.target.value) })}>{[0.75, 1, 1.25, 1.5].map((r) => <option key={r} value={r}>{r}×</option>)}</select></label>
      <Choice icon={ArrowLeftRight} label="Swipe direction" value={settings.swipeDirection} onChange={(swipeDirection) => change({ swipeDirection })} options={[{ value: "arabic", label: "Arabic" }, { value: "reversed", label: "Reversed" }]} />
      <Toggle icon={Vibrate} label="Haptics" checked={settings.haptics} change={(haptics) => change({ haptics })} />
      <SampleConsentSettings />
      <footer className="rc-disclaimer"><Info aria-hidden="true" /><span>AI feedback can be wrong and does not replace a qualified teacher.</span></footer>
    </div>
  </section>;
}
