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
      className="absolute z-10 flex items-center justify-center rounded-full transition-transform active:scale-90"
      style={{
        top: "calc(env(safe-area-inset-top) + 10px)",
        left: 12,
        width: 36,
        height: 36,
        color: "currentColor",
        background: "color-mix(in oklab, currentColor 14%, transparent)",
        border: "none",
        cursor: "pointer",
      }}
    >
      <ChevronLeft size={20} />
    </button>
  );
}
