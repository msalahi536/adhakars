import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { BellRing, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Portal } from "@/components/Portal";
import { ADHAN_ENABLED_EVENT } from "@/lib/adhan-bridge";

export function AdhanEnabledNotice() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(ADHAN_ENABLED_EVENT, show);
    return () => window.removeEventListener(ADHAN_ENABLED_EVENT, show);
  }, []);
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => setOpen(false), 14000);
    return () => window.clearTimeout(timer);
  }, [open]);
  if (!open) return null;
  const modify = () => {
    window.localStorage.setItem("adhkar:open-adhan-settings", "1");
    window.dispatchEvent(new Event("adhkar:open-adhan-settings"));
    setOpen(false);
    void router.navigate({ to: "/app/salah" });
  };
  return <Portal>
    <aside role="status" aria-live="polite" className="fixed bottom-[calc(var(--bottom-nav-height)_+_16px)] right-4 z-[100] w-[calc(100%_-_32px)] max-w-[340px] rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-lg motion-safe:animate-in motion-safe:slide-in-from-right-4 motion-safe:fade-in">
      <div className="flex items-start gap-3">
        <BellRing size={20} className="mt-1 shrink-0 text-accent" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-5">Adhan is on for all 5 prayers</p>
          <Button variant="ghost" className="mt-1 h-8 justify-start px-0 text-xs text-accent" onClick={modify}>Tap here to modify <ArrowRight size={14} /></Button>
        </div>
        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" aria-label="Dismiss adhan notice" onClick={() => setOpen(false)}><X size={15} /></Button>
      </div>
    </aside>
  </Portal>;
}