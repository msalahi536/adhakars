import { Gift } from "lucide-react";
import { markGiveawayAsked } from "@/lib/giveaway";

/**
 * Small first question before the full giveaway popup, so nobody mistakes it
 * for an ad. Plain fixed layer (no modal lock), so it can never freeze the screen.
 */
export function GiveawayTeaser({ onChoice }: { onChoice: (yes: boolean) => void }) {
  const pick = (yes: boolean) => { markGiveawayAsked(yes ? "yes" : "no"); onChoice(yes); };
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-8" style={{ background: "color-mix(in oklab, var(--background) 35%, transparent)" }}
      onClick={() => pick(false)}>
      <div role="alertdialog" aria-labelledby="gt-title" onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[300px] rounded-3xl border border-border/60 bg-card p-5 text-center text-card-foreground shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl text-accent" style={{ background: "color-mix(in oklab, var(--accent) 14%, transparent)" }}>
          <Gift size={20} strokeWidth={1.7} />
        </span>
        <h2 id="gt-title" className="text-[17px] font-semibold leading-snug">Would you like to enter a giveaway?</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">A free giveaway from Sahih Al-Adhkar — not an ad.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => pick(false)} className="rounded-full border border-border/70 px-4 py-2.5 text-sm font-semibold">No thanks</button>
          <button type="button" onClick={() => pick(true)} className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground">Yes</button>
        </div>
      </div>
    </div>
  );
}
