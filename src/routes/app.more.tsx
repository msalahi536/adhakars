import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BedDouble, Compass, ChevronRight, HandHeart, Moon, ShieldCheck, Landmark, MoonStar, BookOpen, CalendarDays, X } from "lucide-react";
import {
  getConsistency,
  getLifetime,
  getDaysOfRemembrance,
  type Consistency,
  type LifetimeCounts,
} from "@/lib/storage";
import { SunnahOfTheDay } from "@/components/SunnahOfTheDay";
import { Portal } from "@/components/Portal";

// Completed days follow the active palette accent.
const DONE = "color-mix(in oklab, var(--surface-deep-fg) 88%, transparent)";
const DONE_SOFT = "color-mix(in oklab, var(--surface-deep-fg) 45%, transparent)";

export const Route = createFileRoute("/app/more")({
  validateSearch: (s: Record<string, unknown>) => {
    const out: { open?: string; section?: string } = {};
    if (typeof s.open === "string") out.open = s.open;
    if (typeof s.section === "string") out.section = s.section;
    return out;
  },
  head: () => ({
    meta: [
      { title: "More, Sahih Al-Adhkar" },
      { name: "description", content: "Sleep & Wake adhkar, Qibla finder and more tools." },
      { property: "og:title", content: "More, Sahih Al-Adhkar" },
      { property: "og:description", content: "Sleep and wake adhkar, Qibla finder, and more tools." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: More,
});

type Tile = {
  to: "/app/sleep" | "/app/qibla" | "/app/about" | "/app/period" | "/app/ruqyah" | "/app/hajj" | "/app/fasting" | "/app/duas";
  title: string;
  subtitle: string;
  Icon: typeof BedDouble;
};

const tiles: Tile[] = [
  { to: "/app/duas", title: "Dua Library", subtitle: "50 authentic duas for every feeling", Icon: BookOpen },
  { to: "/app/qibla", title: "Qibla Finder", subtitle: "Find the direction of the Ka'bah", Icon: Compass },
  { to: "/app/period", title: "Period Companion", subtitle: "Private cycle tracker and guidance", Icon: Moon },
  { to: "/app/ruqyah", title: "Ruqyah Companion", subtitle: "Daily protection and authentic ruqyah", Icon: ShieldCheck },
  { to: "/app/hajj", title: "Hajj & Umrah Companion", subtitle: "Station-by-station guide and du‘as", Icon: Landmark },
  { to: "/app/fasting", title: "Fasting Companion", subtitle: "Hijri fasting calendar and Ramadan", Icon: MoonStar },
  { to: "/app/sleep", title: "Sleep & Wake", subtitle: "17 sleep + 7 wake adhkar", Icon: BedDouble },
  { to: "/app/about", title: "About & Support", subtitle: "The project and contact", Icon: HandHeart },
];

function More() {
  const navigate = useNavigate();
  const { open, section } = Route.useSearch();

  // Deep links from notification taps: /app/more?open=...&section=...
  useEffect(() => {
    if (!open) return;
    if (open === "dua-library" && section === "jumuah") {
      window.localStorage.setItem("adhkar:open-jumuah", "1");
      window.dispatchEvent(new Event("adhkar:open-jumuah"));
      void navigate({ to: "/app/duas" });
    } else if (open === "dua-library") {
      void navigate({ to: "/app/duas" });
    } else if (open === "sunnah-of-the-day") {
      window.localStorage.setItem("adhkar:open-sunnah", "1");
      window.dispatchEvent(new Event("adhkar:open-sunnah"));
    } else if (open === "period-companion") {
      void navigate({ to: "/app/period" });
    }
  }, [open, section, navigate]);

  const [consistency, setConsistency] = useState<Consistency>({
    days: [],
    current: 0,
    longest: 0,
    completedCount: 0,
    graceUsedRecently: false,
  });
  const [lifetime, setLifetime] = useState<LifetimeCounts>({
    total: 0, morning: 0, evening: 0, salah: 0, tasbih: 0,
  });
  const [daysOfRem, setDaysOfRem] = useState(0);
  const [lifetimeView, setLifetimeView] = useState<"days" | "count">("days");
  const [statsOpen, setStatsOpen] = useState(false);

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
        <div className="relative mx-auto max-w-md px-16 pb-6 pt-9 text-center">
          <div className="label-caps" style={{ color: "var(--header-sub)", opacity: 1 }}>More</div>
          <h1 className="app-page-title mt-2">Tools</h1>
          <p className="mt-2 text-xs opacity-90">Sleep, wake, qibla and your own adhkar.</p>
        </div>
      </header>

       <main className="scroll-area">
         <div className="mx-auto max-w-md px-5 py-3 space-y-4">
           <SunnahOfTheDay />

           <div className="grid grid-cols-2 gap-3">
             {tiles.slice(0, 4).map(({ to, title, subtitle, Icon }) => (
               <Link
                 key={to}
                 to={to}
                 className="group flex flex-col rounded-[24px] p-4 transition-transform active:scale-[0.98]"
                 style={{
                   background: "var(--surface, var(--card))",
                   border: "1px solid var(--border)",
                   boxShadow: "var(--card-shadow, 0 4px 16px rgba(0,0,0,0.06))",
                   color: "var(--foreground)",
                   minHeight: 132,
                 }}
               >
                 <div
                   className="flex h-10 w-10 items-center justify-center rounded-full"
                   style={{
                     background: "color-mix(in oklab, var(--accent) 14%, var(--card))",
                     color: "var(--accent)",
                   }}
                 >
                   <Icon size={20} strokeWidth={2} />
                 </div>
                 <div className="pt-3">
                   <div className="flex min-h-9 items-start gap-1 text-[14px] font-bold leading-snug">
                     <span>{title}</span>
                     <ChevronRight
                       size={14}
                       className="mt-0.5 shrink-0 opacity-40 transition-transform group-hover:translate-x-0.5"
                     />
                   </div>
                   <div className="text-[10px] leading-snug" style={{ color: "var(--muted-foreground)" }}>
                     {subtitle}
                   </div>
                 </div>
               </Link>
             ))}
           </div>

            <div className="grid grid-cols-2 gap-3">
              {tiles.slice(4).map(({ to, title, subtitle, Icon }) => (
               <Link
                 key={to}
                 to={to}
                 className="group flex flex-col rounded-[24px] p-4 transition-transform active:scale-[0.98]"
                 style={{
                   background: "var(--surface, var(--card))",
                   border: "1px solid var(--border)",
                   boxShadow: "var(--card-shadow, 0 4px 16px rgba(0,0,0,0.06))",
                   color: "var(--foreground)",
                   minHeight: 132,
                 }}
               >
                 <div
                   className="flex h-10 w-10 items-center justify-center rounded-full"
                   style={{
                     background: "color-mix(in oklab, var(--accent) 14%, var(--card))",
                     color: "var(--accent)",
                   }}
                 >
                   <Icon size={20} strokeWidth={2} />
                 </div>
                 <div className="pt-3">
                   <div className="flex min-h-9 items-start gap-1 text-[14px] font-bold leading-snug">
                     <span>{title}</span>
                     <ChevronRight size={14} className="mt-0.5 shrink-0 opacity-40 transition-transform group-hover:translate-x-0.5" />
                   </div>
                   <div className="text-[10px] leading-snug" style={{ color: "var(--muted-foreground)" }}>
                     {subtitle}
                   </div>
                 </div>
               </Link>
             ))}
           </div>

           <button
             type="button"
             className="more-consistency-entry"
             onClick={() => setStatsOpen(true)}
             aria-label="Open consistency and dhikr statistics"
           >
             <span className="more-consistency-icon" aria-hidden="true"><CalendarDays size={20} strokeWidth={1.8} /></span>
             <span className="min-w-0 flex-1 text-left">
               <span className="label-caps block">Consistency</span>
               <span className="mt-0.5 block text-sm font-semibold">{consistency.completedCount} of the last 30 days</span>
               <span className="mt-0.5 block text-[10px] opacity-70">Current streak: {consistency.current} days</span>
             </span>
             <ChevronRight size={17} className="shrink-0 opacity-60" aria-hidden="true" />
           </button>

           {statsOpen && (
             <Portal>
               <div className="more-stats-backdrop" onClick={() => setStatsOpen(false)}>
                 <div className="more-stats-sheet" role="dialog" aria-modal="true" aria-label="Consistency and dhikr statistics" onClick={(event) => event.stopPropagation()}>
                   <div className="more-stats-sheet-header">
                     <div>
                       <div className="label-caps">Your remembrance</div>
                       <h2>Consistency</h2>
                     </div>
                     <button type="button" className="more-stats-close" onClick={() => setStatsOpen(false)} aria-label="Close statistics">
                       <X size={18} />
                     </button>
                   </div>
          {/* Consistency card */}
          <section
             className="overflow-hidden rounded-[24px] p-4 more-stats-card"
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
                        bg = DONE;
                        border = `1px solid ${DONE}`;
                        color = "var(--surface-deep)";
                      } else if (status === "grace") {
                        bg = DONE_SOFT;
                        border = `1px solid ${DONE_SOFT}`;
                        color = "var(--surface-deep)";
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

            {/* My Dhikr, folded into this card */}
            <div
              className="mt-3 flex items-center justify-between border-t pt-3"
              style={{ borderColor: "var(--surface-deep-border)" }}
            >
              <div className="label-caps" style={{ color: "var(--surface-deep-muted)", opacity: 1 }}>
                My Dhikr
              </div>
              <div
                className="flex items-center rounded-full p-0.5 text-[10px] font-semibold"
                style={{ background: "color-mix(in oklab, var(--surface-deep-fg) 12%, transparent)" }}
              >
                {(["days", "count"] as const).map((v) => {
                  const active = lifetimeView === v;
                  return (
                    <button
                      key={v}
                      onClick={() => setLifetimeView(v)}
                      className="rounded-full px-2.5 py-0.5"
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
              <div className="mt-1.5 flex items-end justify-between">
                <div className="flex items-baseline gap-2">
                  <span style={{ fontSize: 28, fontWeight: 800, color: "var(--surface-deep-fg)", lineHeight: 1 }}>
                    {daysOfRem.toLocaleString()}
                  </span>
                  <span className="text-[11px]" style={{ color: "var(--surface-deep-muted)" }}>
                    days of remembrance
                  </span>
                </div>
                <span className="text-[11px]" style={{ color: "var(--surface-deep-muted)" }}>
                  {weeksConsistent} weeks consistent
                </span>
              </div>
            ) : (
              <>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span style={{ fontSize: 28, fontWeight: 800, color: "var(--surface-deep-fg)", lineHeight: 1 }}>
                    {lifetime.total.toLocaleString()}
                  </span>
                  <span className="text-[11px]" style={{ color: "var(--surface-deep-muted)" }}>
                    total remembrances
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {(["morning", "evening", "salah", "tasbih"] as const).map((k) => (
                    <div key={k} className="flex flex-col items-center">
                      <span
                        className="text-[9px] font-semibold uppercase tracking-wider"
                        style={{ color: "color-mix(in oklab, var(--surface-deep-fg) 60%, transparent)" }}
                      >
                        {k}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--surface-deep-fg)" }}>
                        {lifetime[k].toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
                 </div>
               </div>
             </Portal>
           )}
        </div>
      </main>
    </>
  );
}
