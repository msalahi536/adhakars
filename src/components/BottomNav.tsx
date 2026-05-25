import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sunrise, Moon, CircleDot, Settings as SettingsIcon } from "lucide-react";
import { getStreak } from "@/lib/storage";

const tabs = [
  { to: "/" as const, label: "Morning", Icon: Sunrise },
  { to: "/evening" as const, label: "Evening", Icon: Moon },
  { to: "/tasbih" as const, label: "Tasbih", Icon: CircleDot },
  { to: "/settings" as const, label: "Settings", Icon: SettingsIcon },
];

const DARK_THEMES = new Set(["dark-emerald", "deep-navy"]);

export function BottomNav() {
  const [streak, setStreak] = useState(0);
  const [theme, setTheme] = useState<string>("dawn");

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
  const navBg = isDark ? "rgba(15,20,30,0.97)" : "rgba(255,255,255,0.97)";
  // dusk uses its own light bg and brand-purple active
  const themeNavBg = theme === "dusk" ? "rgba(238, 242, 247, 0.97)" : navBg;
  const iconColor = isDark ? "#ffffff" : "#4a5568";
  const activeColor = theme === "dusk" ? "#667eea" : "#c9a84c";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  return (
    <nav
      className="bottom-nav"
      style={{
        background: themeNavBg,
        backdropFilter: "blur(12px) saturate(180%)",
        WebkitBackdropFilter: "blur(12px) saturate(180%)",
        borderTop: `1px solid ${borderColor}`,
      }}
    >
      <div className="bottom-nav-row mx-auto max-w-md px-2">
        {tabs.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            activeOptions={{ exact: true }}
            className="relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold"
            style={{ transition: "color 0.25s ease" }}
          >
            {({ isActive }) => {
              const color = isActive ? activeColor : iconColor;
              const opacity = isActive ? 1 : 0.6;
              return (
                <>
                  <t.Icon size={24} strokeWidth={isActive ? 2.4 : 2} style={{ color, opacity }} />
                  <span style={{ color, opacity }}>{t.label}</span>
                  {t.to === "/settings" && streak > 0 && (
                    <span
                      className="absolute right-1.5 top-0.5 rounded-[12px] px-1.5 py-0.5 text-[9px] font-bold"
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
