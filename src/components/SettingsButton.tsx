import { Link } from "@tanstack/react-router";
import { Settings as SettingsIcon } from "lucide-react";

export function SettingsButton() {
  return (
    <Link
      to="/app/settings"
      aria-label="Settings"
      className="settings-button absolute z-10 flex items-center justify-center transition-transform active:scale-90"
    >
      <SettingsIcon size={18} strokeWidth={1.5} />
    </Link>
  );
}
