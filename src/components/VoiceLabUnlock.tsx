import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { createHifzBetaTapCounter, toggleHifzBeta } from "@/lib/hifz-beta";

/** Device-only Hifz access, deliberately without a visible beta switch. */
export function VoiceLabUnlock({ version }: { version: string }) {
  const onTap = useRef(createHifzBetaTapCounter(() => { toggleHifzBeta(); }));
  return <Button variant="ghost" onClick={onTap.current} className="h-auto select-none p-0 text-sm font-normal opacity-70 hover:bg-transparent" aria-label="App version">{version}</Button>;
}
