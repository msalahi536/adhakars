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

export function BottomNav() {
  const [streak, setStreak] = useState(0);
  useEffect(() => {
    setStreak(getStreak().current);
    const f = () => setStreak(getStreak().current);
    window.addEventListener("adhkar:streak-update", f);
    return () => window.removeEventListener("adhkar:streak-update", f);
  }, []);

  return (
    <nav
      className="glass-nav fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        borderColor: "color-mix(in oklab, var(--foreground) 12%, transparent)",
      }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2" style={{ height: 70 }}>
        {tabs.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            activeOptions={{ exact: true }}
            className="relative flex flex-1 flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-semibold"
          >
            {({ isActive }) => (
              <>
                <div
                  className="flex items-center justify-center rounded-full px-4 py-1 transition-all"
                  style={
                    isActive
                      ? { background: "color-mix(in oklab, var(--accent) 30%, transparent)", color: "var(--accent)" }
                      : { color: "color-mix(in oklab, var(--foreground) 60%, transparent)" }
                  }
                >
                  <t.Icon size={26} strokeWidth={isActive ? 2.4 : 2} />
                </div>
                <span
                  style={{
                    color: isActive ? "var(--accent)" : "color-mix(in oklab, var(--foreground) 60%, transparent)",
                  }}
                >
                  {t.label}
                </span>
                {t.to === "/settings" && streak > 0 && (
                  <span
                    className="absolute right-2 top-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                    style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                  >
                    🔥{streak}
                  </span>
                )}
              </>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}
