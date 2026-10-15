import { useState } from "react";
import { MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CALC_METHODS, type PrayerSettings } from "@/lib/prayer-times";

type Props = {
  settings: PrayerSettings;
  onChange: (patch: Partial<PrayerSettings>) => void;
  onClose: () => void;
  onUseLocation: () => Promise<void>;
  onCity: () => Promise<void>;
  city: string;
  onCityChange: (city: string) => void;
  busy: boolean;
  error: string | null;
};

export function PrayerCalculationPopup({ settings, onChange, onClose, onUseLocation, onCity, city, onCityChange, busy, error }: Props) {
  const [locationOpen, setLocationOpen] = useState(false);
  return (
    <section role="dialog" aria-modal="true" aria-label="Prayer time settings" className="w-full max-w-sm rounded-3xl border border-border bg-background p-5 text-foreground shadow-xl" onClick={(event) => event.stopPropagation()}>
      <header className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Prayer time settings</h2>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose} aria-label="Close prayer time settings"><X size={19} /></Button>
      </header>
      <label htmlFor="adhan-calculation-method" className="mb-2 block text-sm font-medium">Calculation method</label>
      <Select value={settings.source === "jakim" ? "jakim" : String(settings.method)} onValueChange={(value) => onChange(value === "jakim" ? { source: "jakim" } : { source: "aladhan", method: Number(value) })}>
        <SelectTrigger id="adhan-calculation-method" className="h-11 w-full bg-card text-card-foreground"><SelectValue /></SelectTrigger>
        <SelectContent className="z-[240]">
          {CALC_METHODS.map((method) => <SelectItem key={method.id} value={String(method.id)}>{method.name}</SelectItem>)}
          <SelectItem value="jakim">JAKIM — Malaysia</SelectItem>
        </SelectContent>
      </Select>
      {settings.source === "jakim" ? <p className="mt-3 text-xs text-muted-foreground">Official JAKIM times for your Malaysian location.</p> : (
        <div className="mt-5 flex items-center justify-between gap-3">
          <label htmlFor="adhan-hanafi-asr" className="text-sm font-medium">Hanafi Asr</label>
          <Switch id="adhan-hanafi-asr" checked={settings.hanafi} onCheckedChange={(hanafi) => onChange({ hanafi })} />
        </div>
      )}
      <div className="mt-5 border-t border-border pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0"><p className="text-sm font-medium">Location</p><p className="mt-1 break-words text-xs text-muted-foreground">{settings.location?.label ?? "Not set"}</p></div>
          <Button variant="secondary" size="sm" className="shrink-0 rounded-full" onClick={() => setLocationOpen(!locationOpen)}>Change location</Button>
        </div>
        {locationOpen && <div className="mt-4 space-y-3">
          <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); void onCity(); }}>
            <input aria-label="City or town" placeholder="City or town" value={city} onChange={(event) => onCityChange(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-input bg-card px-3 py-2 text-sm text-card-foreground" />
            <Button type="submit" size="sm" disabled={busy || !city.trim()}>Save</Button>
          </form>
          <Button variant="outline" className="w-full rounded-full" disabled={busy} onClick={() => void onUseLocation()}><MapPin size={16} />{busy ? "Locating…" : "Use my location"}</Button>
          {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
        </div>}
      </div>
      <div className="mt-5 flex justify-end"><Button className="rounded-full" onClick={onClose}>Done</Button></div>
    </section>
  );
}