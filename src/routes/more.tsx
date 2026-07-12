import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BedDouble, Compass, BookPlus, ChevronRight, HandHeart } from "lucide-react";
import { HeaderSettingsButton } from "@/components/HeaderSettingsButton";
import { ConcentricCirclesPattern } from "@/components/HeaderPatterns";
import {
  getConsistency,
  getLifetime,
  getDaysOfRemembrance,
  type Consistency,
  type LifetimeCounts,
} from "@/lib/storage";

export const Route = createFileRoute("/more")({
  head: () => ({
    meta: [
      { title: "More, Adhkar as-Sahih" },
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
  { to: "/my-adhkar", title: "My Adhkar", subtitle: "Your own custom adhkar", Icon: BookPlus },
  { to: "/sleep", title: "Sleep & Wake", subtitle: "17 sleep + 7 wake adhkar", Icon: BedDouble },
  { to: "/qibla", title: "Qibla Finder", subtitle: "Find the direction of the Ka'bah", Icon: Compass },
  { to: "/about", title: "About & Support", subtitle: "The project, donate, contact", Icon: HandHeart },
];

function More() {
  const [consistency, setConsistency] = useState<Consistency>({
    days: [],
    current: 0,
    longest: 0,
    completedCount: 0,
    graceUsedRecently: false,
  });
  const [lifetime, setLifetime] = useState<LifetimeCounts>({
    total: 0, morning: 0, evening: 0, salah: 0, tasbih: 0, custom: 0,
  });
  const [daysOfRem, setDaysOfRem] = useState(0);
  const [lifetimeView, setLifetimeView] = useState<"days" | "count">("days");

  useEffect(() => {
    const refresh = () => {
      setConsistency(getConsistency());
      setLifetime(getLifetime());
      setDaysOfRem(getDaysOfRemembrance());
    };
    refresh();
    window.addEventListener("adhkar:streak-update", refresh);
    window.addEventListener("adhkar:lifetime-update", refresh);
    window.addEventListener("adhkar:commitment-update", refresh);
    return () => {
      window.removeEventListener("adhkar:streak-update", refresh);
      window.removeEventListener("adhkar:lifetime-update", refresh);
      window.removeEventListener("adhkar:commitment-update", refresh);
    };
  }, []);

  const todayDate = consistency.days[consistency.days.length - 1]?.date;
  const weeksConsistent = Math.floor(daysOfRem / 7);

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
          {/* Consistency card */}
          <section
            className="overflow-hidden rounded-[24px] p-5"
            style={{
              background: "linear-gradient(135deg, #1f3d2b 0%, #2d5a3d 100%)",
              color: "#ffffff",
            }}
          >
            <div className="label-caps" style={{ color: "rgba(255,255,255,0.85)", opacity: 1 }}>
              Consistency
            </div>
            <p className="mt-2 text-sm font-semibold" style={{ color: "#ffffff" }}>
              You have remembered Allah on {consistency.completedCount} of the last 30 days.
            </p>
            <div
              className="mt-3 grid gap-1"
              style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}
            >
              {consistency.days.map((d) => {
                const isToday = d.date === todayDate;
                let bg = "transparent";
                let border = "1px solid rgba(255,255,255,0.25)";
                if (d.status === "complete") {
                  bg = "#c9a84c";
                  border = "1px solid #c9a84c";
                } else if (d.status === "grace") {
                  bg = "#f5c542";
                  border = "1px solid #f5c542";
                }
                return (
                  <div
                    key={d.date}
                    title={d.date}
                    style={{
                      aspectRatio: "1 / 1",
                      borderRadius: 6,
                      background: bg,
                      border,
                      boxShadow: isToday ? "0 0 0 2px rgba(255,255,255,0.9)" : undefined,
                    }}
                  />
                );
              })}
            </div>
            {consistency.graceUsedRecently && (
              <p className="mt-3 text-xs" style={{ color: "rgba(255,255,255,0.9)" }}>
                You missed a day. Your streak is still going. Begin again today.
              </p>
            )}
            <div
              className="mt-3 flex items-center justify-between border-t pt-2 text-[11px]"
              style={{ borderColor: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.75)" }}
            >
              <span>Current streak: {consistency.current} days</span>
              <span>Longest: {consistency.longest} days</span>
            </div>
          </section>

          {/* My Dhikr card, dual view */}
          <section
            className="overflow-hidden rounded-[24px] p-5"
            style={{
              background: "linear-gradient(135deg, #1f3d2b 0%, #2d5a3d 100%)",
              color: "#ffffff",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="label-caps" style={{ color: "rgba(255,255,255,0.85)", opacity: 1 }}>
                My Dhikr
              </div>
              <div
                className="flex items-center rounded-full p-0.5 text-[11px] font-semibold"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                {(["days", "count"] as const).map((v) => {
                  const active = lifetimeView === v;
                  return (
                    <button
                      key={v}
                      onClick={() => setLifetimeView(v)}
                      className="rounded-full px-3 py-1"
                      style={{
                        background: active ? "#c9a84c" : "transparent",
                        color: active ? "#1f3d2b" : "#ffffff",
                      }}
                    >
                      {v === "days" ? "Days" : "Count"}
                    </button>
                  );
                })}
              </div>
            </div>

            {lifetimeView === "days" ? (
              <>
                <div
                  className="mt-2 text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  Days of remembrance
                </div>
                <div style={{ fontSize: 40, fontWeight: 800, color: "#c9a84c", lineHeight: 1.1 }}>
                  {daysOfRem.toLocaleString()} days of remembrance
                </div>
                <div className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
                  {weeksConsistent} weeks consistent
                </div>
              </>
            ) : (
              <>
                <div
                  className="mt-2 text-[11px] font-semibold uppercase tracking-wider"
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
              </>
            )}
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
