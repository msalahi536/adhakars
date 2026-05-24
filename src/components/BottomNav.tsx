import { Link } from "@tanstack/react-router";

const tabs = [
  { to: "/" as const, label: "Morning", icon: "🌅" },
  { to: "/evening" as const, label: "Evening", icon: "🌙" },
  { to: "/tasbih" as const, label: "Tasbih", icon: "📿" },
  { to: "/settings" as const, label: "Settings", icon: "⚙️" },
];

export function BottomNav() {
  return (
    <nav
      className="glass-nav fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{ paddingBottom: "env(safe-area-inset-bottom)", borderColor: "var(--border)" }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pt-2 pb-2">
        {tabs.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            activeOptions={{ exact: true }}
            className="flex flex-1 flex-col items-center gap-1 py-1.5 text-[11px] font-medium opacity-60 transition data-[status=active]:opacity-100"
          >
            {({ isActive }) => (
              <>
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-lg transition"
                  style={
                    isActive
                      ? { background: "color-mix(in oklab, var(--accent) 28%, transparent)" }
                      : undefined
                  }
                >
                  {t.icon}
                </span>
                <span>{t.label}</span>
              </>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}
