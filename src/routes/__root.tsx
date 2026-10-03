import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useLayoutEffect } from "react";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";

import { Toaster } from "@/components/ui/sonner";
import { RecitationPopup } from "@/components/RecitationPopup";
import appCss from "../styles.css?url";

import { applyThemeForRoute, PRE_PAINT_SCRIPT } from "@/lib/theme-store";
import { reconcileStreak } from "@/lib/storage";
import { applyReminders, getJumuahNotificationEnabled, getNotificationPrefs, scheduleJumuahNotification, checkNotificationPermission } from "@/lib/notifications";
import { supabase } from "@/integrations/supabase/client";


function NotFoundComponent() {
  return (
    <div className="flex h-full items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="mt-3 text-sm opacity-70">This page doesn't exist.</p>
        <Link
          to="/"
          className="mt-5 inline-block rounded-full px-5 py-2 text-sm font-semibold"
          style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex h-full items-center justify-center px-4 text-center">
      <div>
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-4 rounded-full px-5 py-2 text-sm font-semibold"
          style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content",
      },
      { title: "Sahih Al-Adhkar" },
      { name: "description", content: "Personal daily Islamic adhkar and tasbih." },
      { name: "theme-color", content: "#1f3d2b" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Sahih Al-Adhkar" },
      { name: "application-name", content: "Sahih Al-Adhkar" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { property: "og:title", content: "Sahih Al-Adhkar" },
      { name: "twitter:title", content: "Sahih Al-Adhkar" },
      { property: "og:description", content: "Personal daily Islamic adhkar and tasbih." },
      { name: "twitter:description", content: "Personal daily Islamic adhkar and tasbih." },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ca909766-1cfc-4956-ae39-1a1b7af04e7a/id-preview-656ea870--52d629f3-34a0-4e01-bea4-f2b3af1922d0.lovable.app-1779660312907.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ca909766-1cfc-4956-ae39-1a1b7af04e7a/id-preview-656ea870--52d629f3-34a0-4e01-bea4-f2b3af1922d0.lovable.app-1779660312907.png",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Amiri:wght@400&family=Cormorant+Garamond:wght@500;600&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,800&family=Hanken+Grotesk:wght@400;500;600;700&family=Jost:ital,wght@0,400;0,500;0,600;1,400&family=Outfit:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Scheherazade+New:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: PRE_PAINT_SCRIPT }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Apply before paint so a new route never shows the previous page's colors.
  const useThemeEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
  useThemeEffect(() => {
    applyThemeForRoute(pathname);
  }, [pathname]);

  // Re-apply when the selected color preset changes.
  useEffect(() => {
    const reapply = () => applyThemeForRoute(window.location.pathname);
    window.addEventListener("adhkar:theme-change", reapply);
    window.addEventListener("adhkar:visual-phase-change", reapply);
    return () => {
      window.removeEventListener("adhkar:theme-change", reapply);
      window.removeEventListener("adhkar:visual-phase-change", reapply);
    };
  }, []);

  useEffect(() => {
    reconcileStreak();
    const reapply = async () => {
      try {
        const scheduleKey = "adhkar:reminders-checked";
        const today = new Date().toISOString().slice(0, 10);
        if (window.localStorage.getItem(scheduleKey) === today) return;
        const granted = await checkNotificationPermission();
        if (granted) {
          await applyReminders(getNotificationPrefs());
          if (getJumuahNotificationEnabled()) await scheduleJumuahNotification();
          window.localStorage.setItem(scheduleKey, today);
        }
      } catch {
        // ignore
      }
    };
    // Prayer-based, Sunnah and period notifications refresh on every open.
    const smart = async () => {
      try {
        if (!(await checkNotificationPermission())) return;
        const m = await import("@/lib/smart-notifications");
        await m.rescheduleSmartNotifications();
      } catch {
        // ignore
      }
    };
    const onPeriod = () => void import("@/lib/smart-notifications").then((m) => m.reschedulePeriodNotifications());
    window.addEventListener("period:update", onPeriod);
    const onPrayer = () => void import("@/lib/smart-notifications").then((m) => m.rescheduleSmartAdhkar());
    window.addEventListener("adhkar:prayer-settings", onPrayer);
    const onStreak = () => void import("@/lib/smart-notifications").then((m) => m.rescheduleStreakNotifications());
    window.addEventListener("adhkar:streak-update", onStreak);
    const timer = window.setTimeout(() => {
      void reapply();
      void smart();
    }, 1200);
    window.addEventListener("adhkar:day-complete", reapply);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("adhkar:day-complete", reapply);
      window.removeEventListener("period:update", onPeriod);
      window.removeEventListener("adhkar:prayer-settings", onPrayer);
      window.removeEventListener("adhkar:streak-update", onStreak);
    };
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  // Deter casual copying of artwork: block right-click save and drag on media.
  useEffect(() => {
    const isMedia = (t: EventTarget | null) =>
      t instanceof Element && !!t.closest("img, picture, svg, canvas, video, [data-protected-art]");
    const onContextMenu = (e: MouseEvent) => {
      if (isMedia(e.target)) e.preventDefault();
    };
    const onDragStart = (e: DragEvent) => {
      if (isMedia(e.target)) e.preventDefault();
    };
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("dragstart", onDragStart);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("dragstart", onDragStart);
    };
  }, []);


  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <RecitationPopup />
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}
