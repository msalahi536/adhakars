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
        top: 18,
        left: 20,
        width: 36,
        height: 36,
        borderRadius: 999,
        color: "var(--foreground)",
        background: "color-mix(in oklab, var(--surface-card, var(--background)) 55%, transparent)",
        border: "1px solid color-mix(in oklab, currentColor 16%, transparent)",
        boxShadow: "0 4px 14px color-mix(in oklab, var(--foreground) 6%, transparent)",
        backdropFilter: "blur(14px) saturate(130%)",
        WebkitBackdropFilter: "blur(14px) saturate(130%)",
        cursor: "pointer",
      }}
    >
      <ChevronLeft size={18} strokeWidth={2.2} />
    </button>
  );
}
