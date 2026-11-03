import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { toggleHifzBeta } from "@/lib/hifz-beta";
import { createVersionTapCounter, toggleQuranV2 } from "@/lib/quran-v2";
import { toast } from "sonner";
import { DebugSettings } from "@/components/recite/DebugSettings";

/** Device-only Hifz access, deliberately without a visible beta switch. */
export function VoiceLabUnlock({ version }: { version: string }) {
  const onTap = useRef(createVersionTapCounter(() => { toggleHifzBeta(); }, () => {
    toast(`New Quran experience: ${toggleQuranV2() ? "on" : "off"}`);
  }));
  return <><Button variant="ghost" onClick={onTap.current} className="h-auto select-none p-0 text-sm font-normal opacity-70 hover:bg-transparent" aria-label="App version">{version}</Button><DebugSettings/></>;
}
