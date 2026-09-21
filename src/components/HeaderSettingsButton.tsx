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
    >
      <SettingsIcon size={18} strokeWidth={1.5} />
    </Link>
  );
}
