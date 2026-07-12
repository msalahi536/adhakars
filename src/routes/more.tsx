import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BedDouble, Compass, BookPlus, ChevronRight } from "lucide-react";
import { HeaderSettingsButton } from "@/components/HeaderSettingsButton";
import { SparseStarsPattern } from "@/components/HeaderPatterns";
import { getStreak } from "@/lib/storage";

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
  to: "/sleep" | "/qibla" | "/my-adhkar";
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
];

function More() {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setStreak(getStreak().current);
    const onStreak = () => setStreak(getStreak().current);
    window.addEventListener("adhkar:streak-update", onStreak);
    return () => window.removeEventListener("adhkar:streak-update", onStreak);
  }, []);

  return (
    <>
      <header
        className="page-header relative overflow-hidden"
        style={{ background: "var(--background)", color: "var(--foreground)" }}
      >
        <SparseStarsPattern />
        <HeaderSettingsButton />
        <div className="relative mx-auto max-w-md px-4 pb-5 pt-4">
          <div className="label-caps">More</div>
          <h1 className="mt-1 text-3xl font-bold">Tools</h1>
          {streak > 0 && (
            <div
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
              style={{
                background: "linear-gradient(135deg, #c9a84c, #b8923a)",
                color: "#ffffff",
              }}
            >
              <span>🔥</span>
              <span>{streak}-day streak</span>
            </div>
          )}
        </div>
      </header>

      <main className="scroll-area">
        <div className="mx-auto max-w-md px-4 py-2">
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
