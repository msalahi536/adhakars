import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import {
  requestAppReview,
  shouldShowRatePrompt,
  markRated,
  markPromptDismissed,
} from "@/lib/rate-app";
import { triggerHaptic } from "@/lib/theme";

export function RatePrompt() {
  const [open, setOpen] = useState(false);
  // Only show once per app open.
  const shownThisSession = useRef(false);

  useEffect(() => {
    const check = () => {
      if (shownThisSession.current) return;
      if (!shouldShowRatePrompt()) return;
      shownThisSession.current = true;
      setOpen(true);
    };
    window.addEventListener("adhkar:rate-check", check);
    return () => window.removeEventListener("adhkar:rate-check", check);
  }, []);

  if (!open) return null;

  const handleRate = () => {
    void triggerHaptic("medium");
    markRated();
    setOpen(false);
    void requestAppReview();
  };

  const handleNotNow = () => {
    void triggerHaptic("light");
    markPromptDismissed();
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Rate Sahih Al-Adhkar"
    >
      <button
        type="button"
        aria-label="Dismiss"
        onClick={handleNotNow}
        className="absolute inset-0 cursor-default"
        style={{ background: "rgba(10, 8, 6, 0.45)" }}
      />
      <div
        className="rate-sheet relative mx-4 w-full max-w-[400px] rounded-3xl border px-6 pb-7 pt-6 text-center shadow-2xl"
        style={{
          background: "var(--card)",
          borderColor: "var(--border)",
          color: "var(--card-foreground)",
          marginBottom: "calc(env(safe-area-inset-bottom, 0px) + 96px)",
        }}
      >
        <span
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
          style={{
            background: "color-mix(in oklab, var(--accent) 14%, transparent)",
            color: "var(--accent)",
          }}
        >
          <Star size={22} strokeWidth={1.6} fill="currentColor" />
        </span>
        <h2 className="mb-2 text-lg font-semibold leading-snug">
          Enjoying Sahih Al-Adhkar?
        </h2>
        <p className="mb-5 text-sm leading-relaxed opacity-75">
          Your rating helps others discover authentic adhkar.
        </p>
        <button
          type="button"
          onClick={handleRate}
          className="mb-2 w-full rounded-full py-3 text-sm font-semibold transition-transform active:scale-[0.98]"
          style={{ background: "var(--accent)", color: "var(--accent-foreground, #fff)" }}
        >
          Rate Now
        </button>
        <button
          type="button"
          onClick={handleNotNow}
          className="w-full rounded-full py-2.5 text-sm font-semibold opacity-70 transition-transform active:scale-[0.98]"
        >
          Not Now
        </button>
      </div>
    </div>
  );
}
