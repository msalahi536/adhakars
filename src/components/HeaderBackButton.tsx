import { useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

/**
 * Small back-arrow button shown in the top-left corner of a page's header
 * block, mirroring HeaderSettingsButton on the right. Parent header MUST
 * be `position: relative`.
 */
export function HeaderBackButton({ fallbackTo = "/app/more" }: { fallbackTo?: string }) {
  const router = useRouter();

  const onClick = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
    } else {
      router.navigate({ to: fallbackTo });
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back"
      className="header-icon-button absolute z-10 flex items-center justify-center transition-transform active:scale-90"
      style={{
        top: "calc(env(safe-area-inset-top) + 18px)",
        left: 20,
        width: 44,
        height: 44,
        color: "currentColor",
        background: "color-mix(in oklab, var(--surface-card) 72%, transparent)",
        border: "1px solid color-mix(in oklab, currentColor 12%, transparent)",
        boxShadow: "0 8px 24px color-mix(in oklab, var(--foreground) 9%, transparent)",
        backdropFilter: "blur(18px) saturate(130%)",
        cursor: "pointer",
      }}
    >
      <ChevronLeft size={20} />
    </button>
  );
}
