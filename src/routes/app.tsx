import { useEffect, useLayoutEffect, useState } from "react";
import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { SettingsButton } from "@/components/SettingsButton";
import { Onboarding, hasOnboarded } from "@/components/Onboarding";
import { backgroundsForPreset, DEFAULT_BACKGROUNDS } from "@/lib/backgrounds";
import { getPresetId, resolveVisualPhase, type VisualPhase } from "@/lib/theme-store";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isAdhkar = ["/app", "/app/", "/app/evening"].includes(pathname);
  const showSettings = !pathname.startsWith("/app/settings");
  const [backgrounds, setBackgrounds] = useState(DEFAULT_BACKGROUNDS);
  const [visualPhase, setVisualPhase] = useState<VisualPhase>("morning");
  useEffect(() => {
    if (!hasOnboarded()) setShowOnboarding(true);
  }, []);

  useLayoutEffect(() => {
    const sync = () => {
      setBackgrounds(backgroundsForPreset(getPresetId()));
      setVisualPhase(resolveVisualPhase());
    };
    sync();
    const timer = window.setInterval(sync, 30_000);
    window.addEventListener("adhkar:theme-change", sync);
    window.addEventListener("adhkar:prayer-settings", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("adhkar:theme-change", sync);
      window.removeEventListener("adhkar:prayer-settings", sync);
      window.removeEventListener("storage", sync);
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
    <div className={`app-shell ${visualPhase === "evening" ? "is-evening" : ""} ${isAdhkar ? "is-adhkar" : ""}`}>
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
      {showSettings && <SettingsButton />}
      <Outlet />
      <BottomNav />
      {showOnboarding && <Onboarding onDone={() => setShowOnboarding(false)} />}
    </div>
  );
}

