import { useEffect, useState } from "react";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { Onboarding, hasOnboarded } from "@/components/Onboarding";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  useEffect(() => {
    if (!hasOnboarded()) setShowOnboarding(true);
  }, []);

  return (
    <div className="app-shell">
      <Outlet />
      <BottomNav />
      {showOnboarding && <Onboarding onDone={() => setShowOnboarding(false)} />}
    </div>
  );
}
