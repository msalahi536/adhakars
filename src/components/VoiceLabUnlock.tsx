import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { createHifzBetaTapCounter, toggleHifzBeta, useHifzBeta } from "@/lib/hifz-beta";
import { debugEnabled, RECITATION_DEBUG_KEY } from "@/components/recite/recitation-debug";

/** Device-only Hifz access, deliberately without a visible beta switch. */
export function VoiceLabUnlock({ version }: { version: string }) {
  const { enabled } = useHifzBeta();
  const [debug, setDebug] = useState<boolean | null>(null);
  const onTap = useRef(createHifzBetaTapCounter(() => { toggleHifzBeta(); }));
  return <>
    <Button variant="ghost" onClick={onTap.current} className="h-auto select-none p-0 text-sm font-normal opacity-70 hover:bg-transparent" aria-label="App version">{version}</Button>
    {enabled && <div className="mt-4 w-full border-t border-border pt-3 text-left">
      <p className="mb-2 text-xs text-muted-foreground">Hifz beta</p>
      <label className="flex items-center justify-between gap-4 text-sm" htmlFor="recitation-debug">Save recitation debug<Switch id="recitation-debug" checked={debug ?? debugEnabled()} onCheckedChange={(value) => { localStorage.setItem(RECITATION_DEBUG_KEY, value ? "1" : "0"); setDebug(value); }} /></label>
      <p className="mt-2 text-xs text-muted-foreground">Audio stays on this device until you choose Share debug.</p>
    </div>}
  </>;
}
