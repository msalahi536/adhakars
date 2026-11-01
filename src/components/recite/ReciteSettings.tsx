import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { RECITERS, reciterName } from "@/lib/quran";
import type { ReciteSettings as Settings } from "@/lib/recite/model";

export function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return <fieldset className="rc-setting"><legend>{label}</legend><div className="rc-choice">{options.map((o) => <Button variant="ghost" key={o.value} aria-pressed={value === o.value} className={value === o.value ? "is-on" : ""} onClick={() => onChange(o.value)}>{o.label}</Button>)}</div></fieldset>;
}
export function ReciteSettings({ settings, change, close }: { settings: Settings; change: (value: Partial<Settings>) => void; close: () => void }) {
  return <section className="rc-sheet rc-settings" role="dialog" aria-modal="true" aria-label="Page settings">
    <header><h2>Page settings</h2><Button variant="ghost" size="icon" aria-label="Close settings" onClick={close}><X /></Button></header>
    <Choice label="Layout" value={settings.layout} onChange={(layout) => change({ layout })} options={[{ value: "mushaf", label: "Mushaf page" }, { value: "ayah", label: "Ayah by ayah" }, { value: "translation", label: "With translation" }]} />
    <label className="rc-setting">Text size <input aria-label="Text size" type="range" min="20" max="34" value={settings.size} onChange={(e) => change({ size: Number(e.target.value) })} /><span className="rc-arabic rc-preview" style={{ fontSize: settings.size }}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span></label>
    <div className="rc-checks">{([ ["numbers", "Ayah numbers"], ["translation", "Translation"], ["transliteration", "Transliteration"], ["mist", "Mist animation"] ] as const).map(([key, title]) => <label key={key}>{title}<input type="checkbox" checked={settings[key]} onChange={(e) => change({ [key]: e.target.checked })} /></label>)}</div>
    <Choice label="Hints" value={settings.hints} onChange={(hints) => change({ hints })} options={[{ value: "off", label: "Off" }, { value: "letter", label: "First letter" }, { value: "peek", label: "Peek" }]} />
    <label className="rc-setting">Qari<select aria-label="Qari" value={settings.reciter} onChange={(e) => change({ reciter: Number(e.target.value) })}>{RECITERS.filter((r) => r.group === 1 && r.sync === "word" && !r.server && !r.files).map((r) => <option key={r.id} value={r.id}>{reciterName(r)}</option>)}</select></label>
    <Choice label="Repeat each ayah" value={settings.repeat} onChange={(repeat) => change({ repeat })} options={["1", "3", "5", "∞"].map((value) => ({ value, label: value }))} />
    <label className="rc-setting">Playback speed<select aria-label="Playback speed" value={settings.speed} onChange={(e) => change({ speed: Number(e.target.value) })}>{[0.75, 1, 1.25, 1.5].map((r) => <option key={r} value={r}>{r}×</option>)}</select></label>
  </section>;
}