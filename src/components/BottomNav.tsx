import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Sunrise, Moon, CircleDot, Hand, MoreHorizontal } from "lucide-react";
import { getStreak } from "@/lib/storage";

const MORE_NESTED = ["/sleep", "/wake", "/qibla"];

const tabs = [
  { to: "/" as const, label: "Morning", Icon: Sunrise },
  { to: "/evening" as const, label: "Evening", Icon: Moon },
  { to: "/salah" as const, label: "Salah", Icon: Hand },
  { to: "/tasbih" as const, label: "Tasbih", Icon: CircleDot },
  { to: "/more" as const, label: "More", Icon: MoreHorizontal },
];

const DARK_THEMES = new Set(["dark-emerald", "deep-navy"]);

export function BottomNav() {
  const [streak, setStreak] = useState(0);
  const [theme, setTheme] = useState<string>("dawn");
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const moreNestedActive = MORE_NESTED.some((p) => pathname === p || pathname.startsWith(p + "/"));

  useEffect(() => {
    setStreak(getStreak().current);
    const update = () => setTheme(document.documentElement.getAttribute("data-theme") || "dawn");
    update();
    const onStreak = () => setStreak(getStreak().current);
    window.addEventListener("adhkar:streak-update", onStreak);
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      window.removeEventListener("adhkar:streak-update", onStreak);
      obs.disconnect();
    };
  }, []);

  const isDark = DARK_THEMES.has(theme);
  const iconColor = isDark ? "#ffffff" : "#4a5568";
  const activeColor = theme === "dusk" ? "#667eea" : "#c9a84c";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  return (
    <nav
      className="bottom-nav"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        width: "100%",
        zIndex: 100,
        boxSizing: "border-box",
        paddingBottom: "env(safe-area-inset-bottom)",
        background: "var(--nav-bg)",
        backdropFilter: "blur(12px) saturate(180%)",
        WebkitBackdropFilter: "blur(12px) saturate(180%)",
        borderTop: `1px solid ${borderColor}`,
      }}
    >
      <div className="bottom-nav-row mx-auto max-w-md px-1">
        {tabs.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            activeOptions={{ exact: true }}
            className="relative flex flex-1 flex-col items-center justify-center gap-0.5 px-0 text-[9px] font-semibold"
            style={{ transition: "color 0.25s ease", minWidth: 0 }}
          >
            {({ isActive }) => {
              const color = isActive ? activeColor : iconColor;
              const opacity = isActive ? 1 : 0.6;
              return (
                <>
                  <t.Icon size={19} strokeWidth={isActive ? 2.4 : 2} style={{ color, opacity }} />
                  <span
                    style={{
                      color,
                      opacity,
                      fontSize: 9,
                      whiteSpace: "nowrap",
                      lineHeight: 1,
                    }}
                  >
                    {t.label}
                  </span>
                  {t.to === "/more" && streak > 0 && (
                    <span
                      className="absolute right-0 top-0 rounded-[10px] px-1 py-0.5 text-[8px] font-bold"
                      style={{ background: activeColor, color: isDark ? "#0a0a0a" : "#ffffff" }}
                    >
                      {streak}
                    </span>
                  )}
                </>
              );
            }}
          </Link>
        ))}
      </div>
    </nav>
  );
}
