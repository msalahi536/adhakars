import { Link } from "@tanstack/react-router";
import { Settings as SettingsIcon } from "lucide-react";

/**
 * Small gear icon shown in the top-right corner of every page's header
 * block. Parent header MUST be `position: relative`.
 */
export function HeaderSettingsButton() {
  return (
    <Link
      to="/app/settings"
      aria-label="Settings"
      className="header-icon-button absolute z-10 flex items-center justify-center transition-transform active:scale-90"
      style={{
        top: "calc(env(safe-area-inset-top) + 18px)",
        right: 20,
        width: 44,
        height: 44,
        color: "currentColor",
        background: "color-mix(in oklab, var(--surface-card) 72%, transparent)",
        border: "1px solid color-mix(in oklab, currentColor 12%, transparent)",
        boxShadow: "0 8px 24px color-mix(in oklab, var(--foreground) 9%, transparent)",
        backdropFilter: "blur(18px) saturate(130%)",
      }}
    >
      <SettingsIcon size={21} strokeWidth={1.8} />
    </Link>
  );
}
