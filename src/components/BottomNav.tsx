import { Link, useRouterState } from "@tanstack/react-router";
import { Sun, Moon, CircleDot, Landmark, MoreHorizontal } from "lucide-react";

const MORE_NESTED = ["/app/sleep", "/app/wake", "/app/qibla", "/app/my-adhkar", "/app/settings", "/app/about"];

const tabs = [
  { to: "/app" as const, label: "Morning", Icon: Sun },
  { to: "/app/evening" as const, label: "Evening", Icon: Moon },
  { to: "/app/salah" as const, label: "Salah", Icon: Landmark },
  { to: "/app/tasbih" as const, label: "Tasbih", Icon: CircleDot },
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
