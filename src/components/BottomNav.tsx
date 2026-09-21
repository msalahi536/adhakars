import { Link, useRouterState } from "@tanstack/react-router";
import { Sun, Moon, MoreHorizontal } from "lucide-react";

function SalahIcon({ size = 22, strokeWidth = 1.5 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M5 21V10h3v11M16 21V10h3v11M4 10h5M15 10h5M6.5 10V7M17.5 10V7" />
      <path d="M8 21v-7.5A4.7 4.7 0 0 1 12 8a4.7 4.7 0 0 1 4 5.5V21M10.5 21v-4a1.5 1.5 0 0 1 3 0v4M12 8V3M12 3c1.2.2 2 .8 2.5 1.7-1.1.3-2 .1-2.5-.6" />
    </svg>
  );
}

function TasbihIcon({ size = 22, strokeWidth = 1.5 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round">
      <circle cx="12" cy="3" r="1.15" /><circle cx="17" cy="4.8" r="1.15" /><circle cx="20.2" cy="9" r="1.15" /><circle cx="20" cy="14.3" r="1.15" /><circle cx="16.6" cy="18.2" r="1.15" /><circle cx="11.5" cy="19.4" r="1.15" /><circle cx="6.8" cy="17.2" r="1.15" /><circle cx="4" cy="12.7" r="1.15" /><circle cx="4.7" cy="7.4" r="1.15" /><circle cx="8.2" cy="4" r="1.15" /><path d="M11.5 20.55v1.65M9.8 23h3.4" />
    </svg>
  );
}

const MORE_NESTED = ["/app/sleep", "/app/wake", "/app/qibla", "/app/my-adhkar", "/app/settings", "/app/about"];

const tabs = [
  { to: "/app" as const, label: "Morning", Icon: Sun },
  { to: "/app/evening" as const, label: "Evening", Icon: Moon },
  { to: "/app/salah" as const, label: "Salah", Icon: SalahIcon },
  { to: "/app/tasbih" as const, label: "Tasbih", Icon: TasbihIcon },
  { to: "/app/more" as const, label: "More", Icon: MoreHorizontal },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const moreNestedActive = MORE_NESTED.some((p) => pathname === p || pathname.startsWith(p + "/"));

  const iconColor = "var(--nav-inactive)";
  const activeColor = "var(--nav-active)";
  const borderColor = "var(--nav-border)";

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <div
        className="bottom-nav-row mx-auto max-w-md px-2"
        style={{ borderColor }}
      >
        {tabs.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            activeOptions={{ exact: true }}
            className="nav-item relative flex flex-1 flex-col items-center justify-center px-0 font-medium"
            style={{ transition: "color 0.25s ease", minWidth: 0 }}
          >
            {({ isActive }) => {
              const active = isActive || (t.to === "/app/more" && moreNestedActive);
              const color = active ? activeColor : iconColor;
              const opacity = active ? 1 : 0.6;
              return (
                <>
                   <t.Icon size={22} strokeWidth={1.5} style={{ color, opacity }} />
                  <span
                    style={{
                      color,
                      opacity,
                       fontSize: 12,
                      whiteSpace: "nowrap",
                      lineHeight: 1,
                    }}
                  >
                    {t.label}
                  </span>
                  <span
                    aria-hidden
                    className="nav-active-mark"
                    style={{ background: active ? activeColor : "transparent" }}
                  />
                </>
              );
            }}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export const BottomNavigation = BottomNav;
