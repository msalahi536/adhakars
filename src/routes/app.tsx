import { useEffect, useState } from "react";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { Onboarding, hasOnboarded } from "@/components/Onboarding";
import { initNativeBridge } from "@/lib/native-bridge";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const [showOnboarding, setShowOnboarding] = useState(false);
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

  // Initialize native bridge (Capacitor/iOS widgets + Live Activities)
  useEffect(() => {
    initNativeBridge();
  }, []);

  return (
    <>
      <Outlet />
      <BottomNav />
      {showOnboarding && <Onboarding onDone={() => setShowOnboarding(false)} />}
    </>
  );
}
