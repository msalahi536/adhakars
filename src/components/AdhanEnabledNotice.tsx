import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { enableAllPrayerAlerts } from "@/lib/adhan-bridge";
import { ADHAN_PROMPT_EVENT, ADHAN_PROMPT_PENDING_KEY, requestNotificationPermission } from "@/lib/notifications";

/**
 * Asks once whether to turn on adhan. Uses the shared modal dialog layer so it
 * stays tappable when another dialog (e.g. the update notice) is also open —
 * a separate overlay would be blocked by that dialog's pointer/focus lock.
 */
export function AdhanEnabledNotice() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  useEffect(() => {
    let timer: number | undefined;
    // Never stack over another open popup (giveaway, update notice): two
    // modal layers fight over the page lock and can freeze the screen.
    const check = () => {
      window.clearTimeout(timer);
      if (window.localStorage.getItem(ADHAN_PROMPT_PENDING_KEY) !== "1") return;
      if (document.querySelector('[role="dialog"][data-state="open"]')) {
        timer = window.setTimeout(check, 1500);
        return;
      }
      setOpen(true);
    };
    check();
    window.addEventListener(ADHAN_PROMPT_EVENT, check);
    return () => { window.clearTimeout(timer); window.removeEventListener(ADHAN_PROMPT_EVENT, check); };
  }, []);
  const close = () => {
    window.localStorage.removeItem(ADHAN_PROMPT_PENDING_KEY);
    setOpen(false);
  };
  const yes = async () => {
    close();
    await requestNotificationPermission().catch(() => null);
    await enableAllPrayerAlerts().catch(() => null);
    window.localStorage.setItem("adhkar:open-adhan-settings", "1");
    window.dispatchEvent(new Event("adhkar:open-adhan-settings"));
    void router.navigate({ to: "/app/salah" });
  };
  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="z-[230] w-[calc(100%_-_48px)] max-w-[340px] rounded-3xl border-border bg-card p-6 text-center text-card-foreground shadow-lg [&>button:last-child]:hidden">
        <BellRing size={28} className="mx-auto text-accent" />
        <DialogTitle className="mt-1 text-center text-lg font-semibold">Turn on adhan?</DialogTitle>
        <DialogDescription className="text-center text-sm text-muted-foreground">Hear the adhan at each of the 5 daily prayers. You can choose reciters and turn prayers off anytime.</DialogDescription>
        <div className="mt-3 flex flex-col gap-2">
          <Button onClick={() => void yes()}>Yes, turn on adhan</Button>
          <Button variant="ghost" onClick={close}>Not now</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
