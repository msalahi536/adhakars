import { Link, useRouterState } from "@tanstack/react-router";
import { Sun, Moon, MoreHorizontal } from "lucide-react";

function SalahIcon({ size = 22, strokeWidth = 1.8 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20.5h18M5 20.5v-9.2h3v9.2M16 20.5v-9.2h3v9.2M4.3 8.8h4.4M15.3 8.8h4.4M5.7 8.8V6.2M18.3 8.8V6.2" />
      <path d="M8 20.5v-7.2c0-2.6 1.8-4.9 4-5.8 2.2.9 4 3.2 4 5.8v7.2M10.2 20.5v-4.1a1.8 1.8 0 0 1 3.6 0v4.1M12 7.5V3.3M12 3.3c1.1.2 1.8.8 2.2 1.6-1 .3-1.8.1-2.2-.5" />
    </svg>
  );
}

function TasbihIcon({ size = 22, strokeWidth = 1.8 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round">
      <circle cx="12" cy="3" r="1.25" /><circle cx="17" cy="4.8" r="1.25" /><circle cx="20.2" cy="9" r="1.25" /><circle cx="20" cy="14.3" r="1.25" /><circle cx="16.6" cy="18.2" r="1.25" /><circle cx="11.5" cy="19.4" r="1.25" /><circle cx="6.8" cy="17.2" r="1.25" /><circle cx="4" cy="12.7" r="1.25" /><circle cx="4.7" cy="7.4" r="1.25" /><circle cx="8.2" cy="4" r="1.25" /><path d="M11.5 20.7v1.6M9.7 23h3.6" />
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
