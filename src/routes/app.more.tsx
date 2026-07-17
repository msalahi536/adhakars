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

export const Route = createFileRoute("/app/more")({
  head: () => ({
    meta: [
      { title: "More, Sahih Al-Adhkar" },
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
            className="overflow-hidden rounded-[24px] p-4"
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
            {(() => {
              const now = new Date();
              const year = now.getFullYear();
              const month = now.getMonth();
              const firstDow = new Date(year, month, 1).getDay();
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const statusByDate = new Map(consistency.days.map((d) => [d.date, d.status]));
              const pad = (n: number) => String(n).padStart(2, "0");
              const monthLabel = now.toLocaleString(undefined, { month: "long", year: "numeric" });
              const weekdays = ["S", "M", "T", "W", "T", "F", "S"];
              const cells: Array<{ key: string; date?: string; day?: number }> = [];
              for (let i = 0; i < firstDow; i++) cells.push({ key: `b${i}` });
              for (let d = 1; d <= daysInMonth; d++) {
                cells.push({ key: `d${d}`, date: `${year}-${pad(month + 1)}-${pad(d)}`, day: d });
              }
              return (
                <>
                  <div className="mt-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.7)" }}>
                    {monthLabel}
                  </div>
                  <div className="mt-1 grid gap-0.5" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
                    {weekdays.map((w, i) => (
                      <div key={`w${i}`} className="text-center text-[9px]" style={{ color: "rgba(255,255,255,0.55)" }}>{w}</div>
                    ))}
                    {cells.map((c) => {
                      if (!c.date) return <div key={c.key} style={{ height: 26 }} />;
                      const status = statusByDate.get(c.date);
                      const isToday = c.date === todayDate;
                      const isFuture = c.date > todayDate;
                      let bg = "transparent";
                      let border = "1px solid rgba(255,255,255,0.25)";
                      let color = "rgba(255,255,255,0.7)";
                      if (status === "complete") {
                        bg = "#c9a84c"; border = "1px solid #c9a84c"; color = "#1f3d2b";
                      } else if (status === "grace") {
                        bg = "#f5c542"; border = "1px solid #f5c542"; color = "#1f3d2b";
                      } else if (isFuture) {
                        border = "1px dashed rgba(255,255,255,0.15)"; color = "rgba(255,255,255,0.35)";
                      }
                      return (
                        <div
                          key={c.key}
                          title={c.date}
                          className="flex items-center justify-center text-[9px] font-semibold"
                          style={{
                            height: 26,
                            borderRadius: 5,
                            background: bg,
                            border,
                            color,
                            boxShadow: isToday ? "0 0 0 1.5px rgba(255,255,255,0.9)" : undefined,
                          }}
                        >
                          {c.day}
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
            {consistency.graceUsedRecently && (
              <p className="mt-2 text-xs" style={{ color: "rgba(255,255,255,0.9)" }}>
                You missed a day. Your streak is still going. Begin again today.
              </p>
            )}
            <div
              className="mt-2 flex items-center justify-between border-t pt-2 text-[11px]"
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
