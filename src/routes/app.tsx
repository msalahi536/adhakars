import { useEffect, useLayoutEffect, useState } from "react";
import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { SettingsButton } from "@/components/SettingsButton";
import { Onboarding, hasOnboarded } from "@/components/Onboarding";
import { WhatsNewDialog } from "@/components/WhatsNewDialog";
import { backgroundsForPreset } from "@/lib/backgrounds";
import { getPresetId, resetTheme, resolveVisualPhase, type VisualPhase } from "@/lib/theme-store";

const UPDATE_WELCOME_KEY = "adhkar:update-welcome:2026-09";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [themeRevision, setThemeRevision] = useState(0);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  
  const isAdhkar = ["/app", "/app/", "/app/evening"].includes(pathname);
  const isSettings = pathname.startsWith("/app/settings");
  const showSettings = !pathname.startsWith("/app/settings");

  // Derive phase and backgrounds directly during render to prevent transition flashes
  const backgrounds = backgroundsForPreset(getPresetId());
  const visualPhase = resolveVisualPhase(pathname);

  useEffect(() => {
    if (!hasOnboarded()) {
      setShowOnboarding(true);
      window.localStorage.setItem(UPDATE_WELCOME_KEY, "seen");
      return;
    }
    if (window.localStorage.getItem(UPDATE_WELCOME_KEY) !== "seen") {
      resetTheme();
      window.localStorage.setItem(UPDATE_WELCOME_KEY, "seen");
      window.dispatchEvent(new Event("adhkar:theme-change"));
      setShowWhatsNew(true);
    }
  }, []);

  useLayoutEffect(() => {
    const sync = () => setThemeRevision(r => r + 1);
    window.addEventListener("adhkar:theme-change", sync);
    window.addEventListener("storage", sync);
    window.addEventListener("adhkar:visual-phase-change", sync);
    return () => {
      window.removeEventListener("adhkar:theme-change", sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("adhkar:visual-phase-change", sync);
    };
  }, []);

  // Lock the viewport while inside /app so .scroll-area handles scrolling.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.classList.add("app-mode");
    body.classList.add("app-mode");
    return () => {
      html.classList.remove("app-mode");
      body.classList.remove("app-mode");
    };
  }, []);

  return (
    <div className={`app-shell ${visualPhase === "evening" ? "is-evening" : ""} ${isAdhkar ? "is-adhkar" : ""} ${isSettings ? "is-settings" : ""}`}>
      <div
        className="app-background app-background-morning"
        style={{ "--screen-background": `url(${backgrounds.morning})` } as React.CSSProperties}
        aria-hidden="true"
      />
      <div
        className="app-background app-background-evening"
        style={{ "--screen-background": `url(${backgrounds.evening})` } as React.CSSProperties}
        aria-hidden="true"
      />
      <div className="app-content-frame">
        {showSettings && <SettingsButton />}
        <Outlet />
      </div>
      <BottomNav />
      {showOnboarding && <Onboarding onDone={() => setShowOnboarding(false)} />}
      <WhatsNewDialog open={showWhatsNew} onClose={() => setShowWhatsNew(false)} />
    </div>
  );
}
