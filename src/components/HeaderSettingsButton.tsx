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
      className="absolute z-10 flex items-center justify-center rounded-full transition-transform active:scale-90"
      style={{
        top: "calc(env(safe-area-inset-top) + 10px)",
        right: 12,
        width: 36,
        height: 36,
        color: "currentColor",
        background: "color-mix(in oklab, currentColor 14%, transparent)",
      }}
    >
      <SettingsIcon size={18} />
    </Link>
  );
}
