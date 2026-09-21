import { Link, useRouterState } from "@tanstack/react-router";
import { Sun, Moon, MoreHorizontal } from "lucide-react";

function SalahIcon({ size = 22, strokeWidth = 1.8 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16M5.5 20V9.5L12 4l6.5 5.5V20M9 20v-6a3 3 0 0 1 6 0v6M3.5 9.5 12 2l8.5 7.5" />
    </svg>
  );
}

function TasbihIcon({ size = 22, strokeWidth = 1.8 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round">
      <circle cx="12" cy="3.2" r="1.4" /><circle cx="17.7" cy="5.4" r="1.4" /><circle cx="20.7" cy="10.7" r="1.4" /><circle cx="19.2" cy="16.5" r="1.4" /><circle cx="14.4" cy="20" r="1.4" /><circle cx="8.3" cy="19.4" r="1.4" /><circle cx="4.1" cy="15.2" r="1.4" /><circle cx="3.7" cy="9.2" r="1.4" /><circle cx="7" cy="4.7" r="1.4" />
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
            className="nav-item relative flex flex-1 flex-col items-center justify-center gap-1 px-0 font-medium"
            style={{ transition: "color 0.25s ease", minWidth: 0 }}
          >
            {({ isActive }) => {
              const active = isActive || (t.to === "/app/more" && moreNestedActive);
              const color = active ? activeColor : iconColor;
              const opacity = active ? 1 : 0.6;
              return (
                <>
                  <t.Icon size={22} strokeWidth={active ? 2.2 : 1.8} style={{ color, opacity }} />
                  <span
                    style={{
                      color,
                      opacity,
                      fontSize: 11,
                      whiteSpace: "nowrap",
                      lineHeight: 1.1,
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
