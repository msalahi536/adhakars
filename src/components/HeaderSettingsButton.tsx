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
        top: "calc(env(safe-area-inset-top) + 20px)",
        right: 20,
        width: 48,
        height: 48,
        color: "currentColor",
        background: "color-mix(in oklab, var(--surface-card) 72%, transparent)",
        border: "1px solid color-mix(in oklab, currentColor 12%, transparent)",
        boxShadow: "0 5px 16px color-mix(in oklab, var(--foreground) 6%, transparent)",
        backdropFilter: "blur(14px)",
      }}
    >
      <SettingsIcon size={23} strokeWidth={1.6} />
    </Link>
  );
}
