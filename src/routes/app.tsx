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
import { FULL_ADHAN_URL, isPrayerNotifId, rescheduleAdhanNotifications } from "@/lib/adhan-notifications";
import { AdhanPlayer } from "@/components/AdhanPlayer";
import { getPrayerSettings } from "@/lib/prayer-times";
import { initNativeBridge } from "@/lib/native-bridge";
import { isAdhanPlaying, onAdhanPlaying } from "@/lib/adhan-bridge";

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

  const [adhan, setAdhan] = useState({ visible: false, prayer: "", reciterId: "" });

  useEffect(() => {
    initNativeBridge();
    const reschedule = () => {
      // Prayer alerts are planned on every app open or resume so nothing
      // depends on the Salah page having been visited.
      void rescheduleAdhanNotifications(getPrayerSettings());
      // Sunnah, Jumu'ah, streak, period and smart adhkar reminders too.
      void import("@/lib/smart-notifications").then((m) => m.rescheduleSmartNotifications());
    };
    reschedule();
    const onVisible = () => {
      if (document.visibilityState === "visible") reschedule();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  useEffect(() => {
    const unsubscribe = onAdhanPlaying(({ prayer, reciterId }) =>
      setAdhan({ visible: true, prayer: prayer || "fajr", reciterId }),
    );
    // Cold start: native may start the adhan before this listener exists, so
    // ask the native side directly on launch and whenever the app resumes.
    let cancelled = false;
    const check = async () => {
      const s = await isAdhanPlaying().catch(() => null);
      if (cancelled || !s || !(s.playing || s.hasSession)) return;
      setAdhan((a) =>
        a.visible ? a : { visible: true, prayer: s.prayer || "fajr", reciterId: s.reciterId || "" },
      );
    };
    const timers = [0, 600, 1500, 3000].map((ms) => window.setTimeout(() => void check(), ms));
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
      document.removeEventListener("visibilitychange", onVisible);
      if (typeof unsubscribe === "function") unsubscribe();
    };
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

  // Notification taps: opens the right page (and section) for each reminder.
  // Taps can arrive three ways: the standard notification plugin's tap event,
  // a window event the native side dispatches, or a tap the native side saved
  // before the app finished loading (cold start).
  useEffect(() => {
    const openJumuah = () => {
      window.localStorage.setItem("adhkar:open-jumuah", "1");
      window.dispatchEvent(new Event("adhkar:open-jumuah"));
      void router.navigate({ to: "/app/duas" });
    };
    const openSunnah = () => {
      window.localStorage.setItem("adhkar:open-sunnah", "1");
      window.dispatchEvent(new Event("adhkar:open-sunnah"));
      void router.navigate({ to: "/app/more" });
    };
    const openFromNotification = (id: number | undefined, route: string | undefined) => {
      if (id === JUMUAH_NOTIF_ID || id === 889002) return openJumuah();
      if (id === SUNNAH_NOTIF_ID || id === 889001) return openSunnah();
      if (id !== undefined && isSmartAdhkarId(id)) {
        void router.navigate({ to: smartAdhkarKind(id) === "evening" ? "/app/evening" : "/app" });
        return;
      }
      if (id !== undefined && isPeriodNotifId(id)) {
        void router.navigate({ to: "/app/period" });
        return;
      }
      if (id !== undefined && isPrayerNotifId(id)) {
        void router.navigate({ to: "/app/salah" });
        // Full adhan: the notification plays 30s, the rest continues here.
        if (getPrayerSettings().sound === "adhan" && FULL_ADHAN_URL) {
          const a = new Audio(FULL_ADHAN_URL);
          void a.play().catch(() => {});
        }
        return;
      }
      // Unknown id: fall back to the route carried on the notification.
      if (route && route.startsWith("/app")) void router.history.push(route);
    };

    registerNotificationTapHandler(openFromNotification);

    const onNativeTap = (e: Event) => {
      const d = (e as CustomEvent).detail ?? {};
      const id = d.id !== undefined ? Number(d.id) : undefined;
      openFromNotification(Number.isFinite(id) ? id : undefined, typeof d.route === "string" ? d.route : undefined);
    };
    window.addEventListener("adhkar:notification-tap", onNativeTap);

    // Cold start: ask the native plugin for a tap it saved before we loaded.
    const plugin = (window as any).Capacitor?.Plugins?.AdhanNotifications;
    if (plugin) {
      Promise.resolve()
        .then(() => plugin.getPendingNotificationTap())
        .then((d: any) => {
          if (!d || (d.id === undefined && !d.route)) return;
          const id = d.id !== undefined ? Number(d.id) : undefined;
          openFromNotification(Number.isFinite(id) ? id : undefined, typeof d.route === "string" ? d.route : undefined);
        })
        .catch(() => {});
    }
    return () => window.removeEventListener("adhkar:notification-tap", onNativeTap);
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
      <AdhanPlayer
        visible={adhan.visible}
        prayer={adhan.prayer}
        reciterId={adhan.reciterId}
        onClose={() => setAdhan((a) => ({ ...a, visible: false }))}
      />
      {showOnboarding && <Onboarding onDone={() => setShowOnboarding(false)} />}
      <WhatsNewDialog open={showWhatsNew} onClose={() => setShowWhatsNew(false)} />
      <RatePrompt />
    </div>
  );
}
