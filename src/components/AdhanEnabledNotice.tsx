import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Portal } from "@/components/Portal";
import { enableAllPrayerAlerts } from "@/lib/adhan-bridge";
import { ADHAN_PROMPT_EVENT, ADHAN_PROMPT_PENDING_KEY } from "@/lib/notifications";

/** Asks once, after notifications are first allowed, whether to turn on adhan. */
export function AdhanEnabledNotice() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const check = () => {
      if (window.localStorage.getItem(ADHAN_PROMPT_PENDING_KEY) === "1") setOpen(true);
    };
    check();
    window.addEventListener(ADHAN_PROMPT_EVENT, check);
    return () => window.removeEventListener(ADHAN_PROMPT_EVENT, check);
  }, []);
  if (!open) return null;
  const close = () => {
    window.localStorage.removeItem(ADHAN_PROMPT_PENDING_KEY);
    setOpen(false);
  };
  const yes = async () => {
    close();
    await enableAllPrayerAlerts();
    window.localStorage.setItem("adhkar:open-adhan-settings", "1");
    window.dispatchEvent(new Event("adhkar:open-adhan-settings"));
    void router.navigate({ to: "/app/salah" });
  };
  return <Portal>
    <div className="fixed inset-0 z-[230] flex items-center justify-center bg-background/70 p-6 backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in">
      <div role="dialog" aria-modal="true" aria-labelledby="adhan-ask-title" className="w-full max-w-[340px] rounded-3xl border border-border bg-card p-6 text-center text-card-foreground shadow-lg">
        <BellRing size={28} className="mx-auto text-accent" />
        <h2 id="adhan-ask-title" className="mt-3 text-lg font-semibold">Turn on adhan?</h2>
        <p className="mt-2 text-sm text-muted-foreground">Hear the adhan at each of the 5 daily prayers. You can choose reciters and turn prayers off anytime.</p>
        <div className="mt-5 flex flex-col gap-2">
          <Button onClick={() => void yes()}>Yes, turn on adhan</Button>
          <Button variant="ghost" onClick={close}>Not now</Button>
        </div>
      </div>
    </div>
  </Portal>;
}
