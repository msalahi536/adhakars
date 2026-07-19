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
  to: "/app/sleep" | "/app/qibla" | "/app/my-adhkar" | "/app/about";
  title: string;
  subtitle: string;
  Icon: typeof BedDouble;
};

const tiles: Tile[] = [
  { to: "/app/my-adhkar", title: "My Adhkar", subtitle: "Your own custom adhkar", Icon: BookPlus },
  { to: "/app/sleep", title: "Sleep & Wake", subtitle: "17 sleep + 7 wake adhkar", Icon: BedDouble },
  { to: "/app/qibla", title: "Qibla Finder", subtitle: "Find the direction of the Ka'bah", Icon: Compass },
  { to: "/app/about", title: "About & Support", subtitle: "The project, donate, contact", Icon: HandHeart },
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
              background: "var(--surface-deep-gradient, var(--surface-deep))",
              color: "var(--surface-deep-fg)",
            }}
          >
            <div className="label-caps" style={{ color: "var(--surface-deep-muted)", opacity: 1 }}>
              Consistency
            </div>
            <p className="mt-2 text-sm font-semibold" style={{ color: "var(--surface-deep-fg)" }}>
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
                  <div
                    className="mt-2 text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--surface-deep-muted)" }}
                  >
                    {monthLabel}
                  </div>
                  <div className="mt-1 grid gap-0.5" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
                    {weekdays.map((w, i) => (
                      <div
                        key={`w${i}`}
                        className="text-center text-[9px]"
                        style={{ color: "color-mix(in oklab, var(--surface-deep-fg) 55%, transparent)" }}
                      >
                        {w}
                      </div>
                    ))}
                    {cells.map((c) => {
                      if (!c.date) return <div key={c.key} style={{ height: 26 }} />;
                      const status = statusByDate.get(c.date);
                      const isToday = c.date === todayDate;
                      const isFuture = todayDate ? c.date > todayDate : false;
                      let bg = "transparent";
                      let border = "1px solid var(--surface-deep-border)";
                      let color = "color-mix(in oklab, var(--surface-deep-fg) 70%, transparent)";
                      if (status === "complete") {
                        bg = "var(--accent)";
                        border = "1px solid var(--accent)";
                        color = "var(--surface-deep-accent-fg)";
                      } else if (status === "grace") {
                        bg = "color-mix(in oklab, var(--accent) 75%, #ffd54f)";
                        border = "1px solid color-mix(in oklab, var(--accent) 75%, #ffd54f)";
                        color = "var(--surface-deep-accent-fg)";
                      } else if (isFuture) {
                        border = "1px dashed color-mix(in oklab, var(--surface-deep-fg) 20%, transparent)";
                        color = "color-mix(in oklab, var(--surface-deep-fg) 35%, transparent)";
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
                            boxShadow: isToday
                              ? "0 0 0 1.5px color-mix(in oklab, var(--surface-deep-fg) 90%, transparent)"
                              : undefined,
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
              <p className="mt-2 text-xs" style={{ color: "var(--surface-deep-fg)" }}>
                You missed a day. Your streak is still going. Begin again today.
              </p>
            )}
            <div
              className="mt-2 flex items-center justify-between border-t pt-2 text-[11px]"
              style={{
                borderColor: "var(--surface-deep-border)",
                color: "var(--surface-deep-muted)",
              }}
            >
              <span>Current streak: {consistency.current} days</span>
              <span>Longest: {consistency.longest} days</span>
            </div>
          </section>

          {/* My Dhikr card, dual view */}
          <section
            className="overflow-hidden rounded-[24px] p-5"
            style={{
              background: "var(--surface-deep-gradient, var(--surface-deep))",
              color: "var(--surface-deep-fg)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="label-caps" style={{ color: "var(--surface-deep-muted)", opacity: 1 }}>
                My Dhikr
              </div>
              <div
                className="flex items-center rounded-full p-0.5 text-[11px] font-semibold"
                style={{ background: "color-mix(in oklab, var(--surface-deep-fg) 12%, transparent)" }}
              >
                {(["days", "count"] as const).map((v) => {
                  const active = lifetimeView === v;
                  return (
                    <button
                      key={v}
                      onClick={() => setLifetimeView(v)}
                      className="rounded-full px-3 py-1"
                      style={{
                        background: active ? "var(--accent)" : "transparent",
                        color: active ? "var(--surface-deep-accent-fg)" : "var(--surface-deep-fg)",
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
                  style={{ color: "var(--surface-deep-muted)" }}
                >
                  Days of remembrance
                </div>
                <div style={{ fontSize: 40, fontWeight: 800, color: "var(--accent)", lineHeight: 1.1 }}>
                  {daysOfRem.toLocaleString()} days of remembrance
                </div>
                <div className="mt-1 text-sm" style={{ color: "var(--surface-deep-muted)" }}>
                  {weeksConsistent} weeks consistent
                </div>
              </>
            ) : (
              <>
                <div
                  className="mt-2 text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: "var(--surface-deep-muted)" }}
                >
                  Total Remembrances
                </div>
                <div style={{ fontSize: 48, fontWeight: 800, color: "var(--accent)", lineHeight: 1.1 }}>
                  {lifetime.total.toLocaleString()}
                </div>
                <div
                  className="mt-4 grid grid-cols-4 gap-2 border-t pt-3"
                  style={{ borderColor: "var(--surface-deep-border)" }}
                >
                  {(["morning", "evening", "salah", "tasbih"] as const).map((k) => (
                    <div key={k} className="flex flex-col items-center">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color: "color-mix(in oklab, var(--surface-deep-fg) 60%, transparent)" }}
                      >
                        {k}
                      </span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "var(--surface-deep-fg)" }}>
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
