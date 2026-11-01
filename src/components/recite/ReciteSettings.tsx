import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState } from "react";
import { TAJWEED_GROUPS } from "@/lib/tajweed-rules";
import { RECITERS, reciterName } from "@/lib/quran";
import type { ReciteSettings as Settings } from "@/lib/recite/model";

export function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return <fieldset className="rc-setting"><legend>{label}</legend><div className="rc-choice">{options.map((o) => <Button variant="ghost" key={o.value} aria-pressed={value === o.value} className={value === o.value ? "is-on" : ""} onClick={() => onChange(o.value)}>{o.label}</Button>)}</div></fieldset>;
}
export function ReciteSettings({ settings, change, close }: { settings: Settings; change: (value: Partial<Settings>) => void; close: () => void }) {
  const [guide, setGuide] = useState(false);
  return <section className="rc-sheet rc-settings" role="dialog" aria-modal="true" aria-label="Page settings">
    <header><h2>Page settings</h2><Button variant="ghost" size="icon" aria-label="Close settings" onClick={close}><X /></Button></header>
    <label className="rc-setting">Mushaf<select aria-label="Mushaf" value={settings.layout === "mushaf" ? "mushaf" : "ayah"} onChange={(e) => change({ layout: e.target.value === "mushaf" ? "mushaf" : "ayah" })}><option value="mushaf">Madani · 15 lines</option><option value="indopak" disabled>Indo-Pak · 16 lines — unavailable</option><option value="ayah">Uthmani text</option></select></label>
    <Choice label="Recitation mode" value={settings.mode} onChange={(mode) => change({ mode })} options={[{ value: "self", label: "Self check" }, { value: "ai", label: "AI check · soon" }]} />
    <Choice label="Swipe direction" value={settings.swipeDirection} onChange={(swipeDirection) => change({ swipeDirection })} options={[{ value: "arabic", label: "Arabic" }, { value: "reversed", label: "Reversed" }]} />
    <div className="rc-checks"><label>Haptics<input type="checkbox" checked={settings.haptics} onChange={(e) => change({ haptics: e.target.checked })} /></label><label>Sounds<input type="checkbox" checked={settings.sounds} onChange={(e) => change({ sounds: e.target.checked })} /></label></div>
    <div className="rc-checks"><label>Tajweed colors<input type="checkbox" checked={settings.tajweed} onChange={(e) => change({ tajweed: e.target.checked })} /></label><label>Night reading<input type="checkbox" checked={settings.theme === "night"} onChange={(e) => change({ theme: e.target.checked ? "night" : "auto" })} /></label></div>
    <Button variant="ghost" onClick={() => setGuide(!guide)}>Color guide</Button>
    {guide && <ul className="rc-color-guide">{TAJWEED_GROUPS.map((g) => <li key={g.id}><i className={`rc-swatch rc-tj-${g.id}`} /><span>{g.label}<small>{g.sub}</small></span></li>)}</ul>}
    <Choice label="Hide style" value={settings.hideStyle} onChange={(hideStyle) => change({ hideStyle })} options={[{ value: "faint", label: "Faint" }, { value: "mist", label: "Mist" }, { value: "blank", label: "Blank" }]} />
    <Choice label="Hide amount" value={settings.hideAmount} onChange={(hideAmount) => change({ hideAmount })} options={[{ value: "page", label: "Whole page" }, { value: "ayah", label: "First word of each ayah" }, { value: "line", label: "First word of each line" }]} />
    {settings.layout !== "mushaf" && <><label className="rc-setting">Text size<input aria-label="Text size" type="range" min="20" max="34" value={settings.size} onChange={(e) => change({ size: Number(e.target.value) })} /></label><div className="rc-checks">{([["translation", "Translation"], ["transliteration", "Transliteration"]] as const).map(([key, title]) => <label key={key}>{title}<input type="checkbox" checked={settings[key]} onChange={(e) => change({ [key]: e.target.checked })} /></label>)}</div></>}
    <label className="rc-setting">Qari<select aria-label="Qari" value={settings.reciter} onChange={(e) => change({ reciter: Number(e.target.value) })}>{RECITERS.filter((r) => r.group === 1 && r.sync === "word" && !r.server && !r.files).map((r) => <option key={r.id} value={r.id}>{reciterName(r)}</option>)}</select></label>
    <Choice label="Repeat each ayah" value={settings.repeat} onChange={(repeat) => change({ repeat })} options={["1", "3", "5", "∞"].map((value) => ({ value, label: value }))} />
    <label className="rc-setting">Playback speed<select aria-label="Playback speed" value={settings.speed} onChange={(e) => change({ speed: Number(e.target.value) })}>{[0.75, 1, 1.25, 1.5].map((r) => <option key={r} value={r}>{r}×</option>)}</select></label>
    <footer className="rc-disclaimer">AI feedback can be wrong and does not replace a qualified teacher.</footer>
  </section>;
}
