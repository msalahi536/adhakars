import { useEffect, useLayoutEffect, useState } from "react";
import { createFileRoute, Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { SettingsButton } from "@/components/SettingsButton";
import { Onboarding, hasOnboarded } from "@/components/Onboarding";
import { WhatsNewDialog } from "@/components/WhatsNewDialog";
import { RatePrompt } from "@/components/RatePrompt";
import { backgroundsForPreset } from "@/lib/backgrounds";
import { JUMUAH_NOTIF_ID, registerNotificationTapHandler } from "@/lib/notifications";
import { DEFAULT_PRESET_ID, getPresetId, resetTheme, resolveVisualPhase, type VisualPhase } from "@/lib/theme-store";
import { rememberMoreDestination } from "@/lib/more-navigation";
import { isPeriodNotifId, isSmartAdhkarId, smartAdhkarKind, SUNNAH_NOTIF_ID } from "@/lib/smart-notifications";
import { FULL_ADHAN_URL, isPrayerNotifId } from "@/lib/adhan-notifications";
import { getPrayerSettings } from "@/lib/prayer-times";
import { initNativeBridge } from "@/lib/native-bridge";

const UPDATE_WELCOME_KEY = "adhkar:update-welcome:2026-09";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  // Keep the server and first browser render identical, then restore the saved
  // artwork before paint. Reading localStorage during render causes React to
  // preserve the server's default background during hydration.
  const [activePresetId, setActivePresetId] = useState(DEFAULT_PRESET_ID);
  const [activeVisualPhase, setActiveVisualPhase] = useState<VisualPhase>("morning");
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  
  const isAdhkar = ["/app", "/app/", "/app/evening"].includes(pathname);
  const isSettings = pathname.startsWith("/app/settings");
  const showSettings = !pathname.startsWith("/app/settings");

  // Derive phase and backgrounds directly during render to prevent transition flashes
  const backgrounds = backgroundsForPreset(activePresetId);
  const visualPhase = activeVisualPhase;

  useEffect(() => {
    initNativeBridge();
  }, []);

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

  const router = useRouter();

  useEffect(() => {
    rememberMoreDestination(pathname);
  }, [pathname]);

  // Tapping the Friday (Jumu'ah) notification opens the Jumu'ah Sunnahs page.
  useEffect(() => {
    registerNotificationTapHandler((id) => {
      if (id === JUMUAH_NOTIF_ID) {
        window.localStorage.setItem("adhkar:open-jumuah", "1");
        void router.navigate({ to: "/app/duas" });
      } else if (id === SUNNAH_NOTIF_ID) {
        window.localStorage.setItem("adhkar:open-sunnah", "1");
        void router.navigate({ to: "/app/more" });
      } else if (isSmartAdhkarId(id)) {
        void router.navigate({ to: smartAdhkarKind(id) === "evening" ? "/app/evening" : "/app" });
      } else if (isPeriodNotifId(id)) {
        void router.navigate({ to: "/app/period" });
      } else if (isPrayerNotifId(id)) {
        void router.navigate({ to: "/app/salah" });
        // Full adhan: the notification plays 30s, the rest continues here.
        if (getPrayerSettings().sound === "adhan" && FULL_ADHAN_URL) {
          const a = new Audio(FULL_ADHAN_URL);
          void a.play().catch(() => {});
        }
      }
    });
  }, [router]);

  useLayoutEffect(() => {
    const sync = () => {
      setActivePresetId(getPresetId());
      setActiveVisualPhase(resolveVisualPhase(window.location.pathname));
    };
    sync();
    window.addEventListener("adhkar:theme-change", sync);
    window.addEventListener("storage", sync);
    window.addEventListener("adhkar:visual-phase-change", sync);
    return () => {
      window.removeEventListener("adhkar:theme-change", sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("adhkar:visual-phase-change", sync);
    };
  }, [pathname]);

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
      <RatePrompt />
    </div>
  );
}
