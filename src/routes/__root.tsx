import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { BottomNav } from "@/components/BottomNav";
import { applyTheme, getMode, resolveTheme } from "@/lib/theme";
import { reconcileStreak } from "@/lib/storage";
import { initOneSignal } from "@/lib/onesignal";

function NotFoundComponent() {
  return (
    <div className="flex h-full items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="mt-3 text-sm opacity-70">This page doesn't exist.</p>
        <Link to="/" className="mt-5 inline-block rounded-full px-5 py-2 text-sm font-semibold" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex h-full items-center justify-center px-4 text-center">
      <div>
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <button
          onClick={() => { router.invalidate(); reset(); }}
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
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "My Adhkar" },
      { name: "description", content: "Personal daily Islamic adhkar and tasbih." },
      { name: "theme-color", content: "#1f3d2b" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { property: "og:title", content: "My Adhkar" },
      { name: "twitter:title", content: "My Adhkar" },
      { property: "og:description", content: "Personal daily Islamic adhkar and tasbih." },
      { name: "twitter:description", content: "Personal daily Islamic adhkar and tasbih." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ca909766-1cfc-4956-ae39-1a1b7af04e7a/id-preview-656ea870--52d629f3-34a0-4e01-bea4-f2b3af1922d0.lovable.app-1779660312907.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ca909766-1cfc-4956-ae39-1a1b7af04e7a/id-preview-656ea870--52d629f3-34a0-4e01-bea4-f2b3af1922d0.lovable.app-1779660312907.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
    ],
    scripts: [
      { src: "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js", defer: true },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
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
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    applyTheme(resolveTheme(getMode(), pathname));
  }, [pathname]);

  useEffect(() => {
    reconcileStreak();
    initOneSignal();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="app-shell" style={{ background: "var(--background)" }}>
        <div
          key={pathname.startsWith("/evening") ? "ev" : pathname.startsWith("/tasbih") ? "ta" : pathname.startsWith("/settings") ? "se" : "mo"}
          className="app-content fade-in"
        >
          <Outlet />
        </div>
        <BottomNav />
      </div>
    </QueryClientProvider>
  );
}
