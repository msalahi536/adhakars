import { useEffect, useState } from "react";
import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { Onboarding, hasOnboarded } from "@/components/Onboarding";
import morningBackground from "@/assets/morning-landscape.png.asset.json";
import eveningBackground from "@/assets/evening-landscape.png.asset.json";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isEvening = pathname === "/app/evening";
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
    <div className={`app-shell ${isEvening ? "is-evening" : ""}`}>
      <div
        className="app-background app-background-morning"
        style={{ backgroundImage: `url(${morningBackground.url})` }}
        aria-hidden="true"
      />
      <div
        className="app-background app-background-evening"
        style={{ backgroundImage: `url(${eveningBackground.url})` }}
        aria-hidden="true"
      />
      <Outlet />
      <BottomNav />
      {showOnboarding && <Onboarding onDone={() => setShowOnboarding(false)} />}
    </div>
  );
}

