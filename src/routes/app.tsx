import { useEffect, useState } from "react";
import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { SettingsButton } from "@/components/SettingsButton";
import { Onboarding, hasOnboarded } from "@/components/Onboarding";
import morningBackground from "@/assets/morning-landscape.webp.asset.json";
import eveningBackground from "@/assets/evening-landscape.webp.asset.json";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isEvening = pathname === "/app/evening";
  const isAdhkar = ["/app", "/app/", "/app/evening"].includes(pathname);
  const showBackground = isAdhkar || ["/app/salah", "/app/tasbih", "/app/more"].includes(pathname);
  const showSettings = !pathname.startsWith("/app/settings");
  useEffect(() => {
    if (!hasOnboarded()) setShowOnboarding(true);
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
    <div className={`app-shell ${isEvening ? "is-evening" : ""} ${isAdhkar ? "is-adhkar" : ""}`}>
      {showBackground && (
        <>
          <div
            className="app-background app-background-morning"
            style={{ "--screen-background": `url(${morningBackground.url})` } as React.CSSProperties}
            aria-hidden="true"
          />
          <div
            className="app-background app-background-evening"
            style={{ "--screen-background": `url(${eveningBackground.url})` } as React.CSSProperties}
            aria-hidden="true"
          />
        </>
      )}
      {showSettings && <SettingsButton />}
      <Outlet />
      <BottomNav />
      {showOnboarding && <Onboarding onDone={() => setShowOnboarding(false)} />}
    </div>
  );
}

