import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { toggleHifzBeta, readHifzBeta } from "@/lib/hifz-beta";
import { createVersionTapCounter, toggleQuranV2, readQuranV2 } from "@/lib/quran-v2";
import { toast } from "sonner";
import { DebugSettings } from "@/components/recite/DebugSettings";

/** Device-only Hifz access, deliberately without a visible beta switch. */
export function VoiceLabUnlock({ version }: { version: string }) {
  const onTap = useRef(createVersionTapCounter(() => {
    const enabled = toggleHifzBeta();
    // A fresh unlock also turns on the new Quran experience, so seven taps
    // enable both without needing taps beyond the test-session switch.
    if (enabled && !readQuranV2()) { toggleQuranV2(); toast("New Quran experience: on"); }
    return enabled;
  }, () => {
    toast(`New Quran experience: ${toggleQuranV2() ? "on" : "off"}`);
  }));
  return <><Button variant="ghost" onClick={onTap.current} className="h-auto select-none p-0 text-sm font-normal opacity-70 hover:bg-transparent" aria-label="App version">{version}</Button><DebugSettings/></>;
}
