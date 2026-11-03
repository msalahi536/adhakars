import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { useHifzBeta } from "@/lib/hifz-beta";
import { debugEnabled, RECITATION_DEBUG_KEY } from "@/lib/hifz-debug";

export function DebugSettings() {
  const { enabled } = useHifzBeta();
  const [checked, setChecked] = useState(false);
  useEffect(() => { setChecked(debugEnabled()); }, [enabled]);
  if (!enabled) return null;
  return <label className="flex items-center justify-between gap-3 py-3 text-sm">Test session recording<Switch aria-label="Test session recording" checked={checked} onCheckedChange={v => { localStorage.setItem(RECITATION_DEBUG_KEY, v ? "1" : "0"); setChecked(v); }}/></label>;
}