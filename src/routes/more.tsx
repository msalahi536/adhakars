import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BedDouble, Compass, BookPlus, ChevronRight, HandHeart } from "lucide-react";
import { HeaderSettingsButton } from "@/components/HeaderSettingsButton";
import { ConcentricCirclesPattern } from "@/components/HeaderPatterns";
import { getStreak, getLifetime, type LifetimeCounts } from "@/lib/storage";

export const Route = createFileRoute("/more")({
  head: () => ({
    meta: [
      { title: "More — My Adhkar" },
      { name: "description", content: "Sleep & Wake adhkar, Qibla finder and more tools." },
    ],
  }),
  component: More,
});

type Tile = {
  to: "/sleep" | "/qibla" | "/my-adhkar" | "/about";
  title: string;
  subtitle: string;
  Icon: typeof BedDouble;
};

const tiles: Tile[] = [
  {
    to: "/my-adhkar",
    title: "My Adhkar",
    subtitle: "Your own custom adhkar",
    Icon: BookPlus,
  },
  {
    to: "/sleep",
    title: "Sleep & Wake",
    subtitle: "17 sleep + 7 wake adhkar",
    Icon: BedDouble,
  },
  {
    to: "/qibla",
    title: "Qibla Finder",
    subtitle: "Find the direction of the Ka'bah",
    Icon: Compass,
  },
  {
    to: "/about",
    title: "About & Support",
    subtitle: "The project, donate, contact",
    Icon: HandHeart,
  },
];

function More() {
  const [streak, setStreak] = useState({
    current: 0,
    longest: 0,
    lastCompleted: null as string | null,
  });
  const [lifetime, setLifetime] = useState<LifetimeCounts>({
    total: 0,
    morning: 0,
    evening: 0,
    salah: 0,
    tasbih: 0,
    custom: 0,
  });

  useEffect(() => {
    setStreak(getStreak());
    setLifetime(getLifetime());
    const onStreak = () => setStreak(getStreak());
    const onLife = () => setLifetime(getLifetime());
    window.addEventListener("adhkar:streak-update", onStreak);
    window.addEventListener("adhkar:lifetime-update", onLife);
    return () => {
      window.removeEventListener("adhkar:streak-update", onStreak);
      window.removeEventListener("adhkar:lifetime-update", onLife);
    };
  }, []);

  return (
    <>
      <header
        className="page-header relative overflow-hidden"
        style={{ background: "var(--grad-header)", color: "var(--header-fg)" }}
      >
        <ConcentricCirclesPattern />
        <HeaderSettingsButton />
        <div className="relative mx-auto max-w-md px-4 pb-5 pt-4" style={{ paddingRight: 60 }}>
          <div className="label-caps" style={{ color: "var(--header-sub)", opacity: 1 }}>More</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Tools</h1>
          <p className="mt-2 text-xs opacity-90">Sleep, wake, qibla and your own adhkar.</p>
        </div>
      </header>

      <main className="scroll-area">
        <div className="mx-auto max-w-md px-4 py-4 space-y-4">
          <section
            className="overflow-hidden rounded-[24px] p-6 shadow-xl shadow-black/10"
            style={{
              background: "linear-gradient(135deg, #c9a84c, #b8923a)",
              color: "#ffffff",
            }}
          >
            <div className="label-caps" style={{ color: "rgba(255,255,255,0.85)", opacity: 1 }}>
              Current streak
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span style={{ fontSize: 48, fontWeight: 800, color: "#ffffff", lineHeight: 1 }}>
                {streak.current}
              </span>
              <span className="text-sm font-semibold opacity-90">days</span>
            </div>
            <div
              className="mt-4 flex items-center justify-between border-t pt-3 text-xs font-semibold"
              style={{ borderColor: "rgba(255,255,255,0.25)" }}
            >
              <span>Longest: {streak.longest} days</span>
              <span className="opacity-90">
                {streak.lastCompleted ? `Last: ${streak.lastCompleted}` : "Start today"}
              </span>
            </div>
          </section>

          <section
            className="overflow-hidden rounded-[24px] p-5"
            style={{
              background: "linear-gradient(135deg, #1f3d2b 0%, #2d5a3d 100%)",
              color: "#ffffff",
            }}
          >
            <div className="label-caps" style={{ color: "rgba(255,255,255,0.85)", opacity: 1 }}>
              My Dhikr
            </div>
            <div
              className="mt-1 text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Total Remembrances
            </div>
            <div style={{ fontSize: 48, fontWeight: 800, color: "#c9a84c", lineHeight: 1.1 }}>
              {lifetime.total.toLocaleString()}
            </div>
            <div
              className="mt-4 grid grid-cols-4 gap-2 border-t pt-3"
              style={{ borderColor: "rgba(255,255,255,0.18)" }}
            >
              {(["morning", "evening", "salah", "tasbih"] as const).map((k) => (
                <div key={k} className="flex flex-col items-center">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                  >
                    {k}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#ffffff" }}>
                    {lifetime[k].toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3">
            {tiles.map(({ to, title, subtitle, Icon }) => (
              <Link
                key={to}
                to={to}
                className="group flex flex-col rounded-[24px] p-4 transition-transform active:scale-[0.98]"
                style={{
                  background: "var(--surface, var(--card))",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--card-shadow, 0 4px 16px rgba(0,0,0,0.06))",
                  color: "var(--foreground)",
                  minHeight: 148,
                }}
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{
                    background: "color-mix(in oklab, var(--accent) 18%, transparent)",
                    color: "var(--accent)",
                  }}
                >
                  <Icon size={22} strokeWidth={2.2} />
                </div>
                <div className="mt-auto pt-4">
                  <div className="flex items-center gap-1 text-[15px] font-bold">
                    <span>{title}</span>
                    <ChevronRight
                      size={14}
                      className="opacity-40 transition-transform group-hover:translate-x-0.5"
                    />
                  </div>
                  <div
                    className="mt-0.5 text-[11px] leading-snug"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {subtitle}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
