import { useEffect, useState } from "react";
import { Gift } from "lucide-react";

// Device codes of the Ilm Guide giveaway winners (from the admin entries).
const WINNER_CODES = ["8RBSD2XZ", "JGBBNS36", "X253Y2JX"];
const SEEN_KEY = "giveaway:winner-seen";

/** Shown once, only on a winner's own device (matched by its saved giveaway code). */
export function WinnerNotice() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const code = localStorage.getItem("giveaway:code");
    if (code && WINNER_CODES.includes(code) && !localStorage.getItem(SEEN_KEY)) {
      const t = window.setTimeout(() => setShow(true), 1500);
      return () => window.clearTimeout(t);
    }
  }, []);
  if (!show) return null;
  const close = () => { localStorage.setItem(SEEN_KEY, "1"); setShow(false); };
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-8" style={{ background: "color-mix(in oklab, var(--background) 30%, transparent)", backdropFilter: "blur(6px)" }}>
      <div role="alertdialog" aria-labelledby="wn-title" className="w-full max-w-[320px] rounded-3xl border border-border/60 bg-card p-6 text-center text-card-foreground shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl text-accent" style={{ background: "color-mix(in oklab, var(--accent) 14%, transparent)" }}>
          <Gift size={22} strokeWidth={1.7} />
        </span>
        <h2 id="wn-title" className="text-[19px] font-semibold leading-snug">Allahumma barik, you won! 🎉</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          You're one of the winners of lifetime access to Ilm Guide. Please check your email — and your spam or junk folder — for the details.
        </p>
        <button type="button" onClick={close} className="mt-5 w-full rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground">JazakAllahu khayran</button>
      </div>
    </div>
  );
}
