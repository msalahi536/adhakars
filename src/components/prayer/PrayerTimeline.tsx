// Vertical mini timeline of prayer times, with an expanded multi day view.

import { useEffect, useRef, useState } from "react";
import { ChevronRight, CloudSun, Moon, Sun, Sunrise, Sunset, X } from "lucide-react";
import { formatMinutes, type Slot } from "@/lib/prayer-times";
import { useSheetDrag } from "@/lib/sheet-drag";

type Props = {
  /** yesterday, today, tomorrow, day after, in order */
  days: { key: string; label: string; slots: Slot[] }[];
  now: Date;
  todayKey: string;
  /** card styling: light surface or the deep tinted surface */
  tone?: "light" | "deep";
};

const isSunrise = (s: Slot) => s.id === "sunrise";

function Row({
  slot,
  state,
  rowRef,
}: {
  slot: Slot;
  state: "past" | "next" | "future";
  rowRef?: (el: HTMLDivElement | null) => void;
}) {
  const sunrise = isSunrise(slot);
  const color = state === "next" ? "var(--accent)" : "var(--foreground)";
  const opacity = state === "past" ? 0.72 : sunrise ? 0.85 : 1;
  return (
    <div
      ref={rowRef}
      data-state={state}
      className="prayer-timeline-row relative flex items-center"
      style={{ opacity }}
    >

      <div className="prayer-timeline-marker relative flex shrink-0 justify-center">
        {sunrise ? (
          <span
            className="rounded-full"
            style={{
              width: 6,
              height: 6,
              border: "1.5px solid color-mix(in oklab, var(--foreground) 45%, transparent)",
              background: "transparent",
            }}
          />
        ) : (
          <span
            className="rounded-full"
            style={{
              width: state === "next" ? 11 : 8,
              height: state === "next" ? 11 : 8,
              background:
                state === "next"
                  ? "var(--accent)"
                  : "color-mix(in oklab, var(--foreground) 35%, transparent)",
              boxShadow:
                state === "next"
                  ? "0 0 0 4px color-mix(in oklab, var(--accent) 22%, transparent)"
                  : "none",
            }}
          />
        )}
      </div>
      <div
        className="prayer-timeline-name flex-1"
        style={{
          color,
          fontWeight: state === "next" ? 700 : sunrise ? 500 : 600,
          fontSize: sunrise ? 12 : 14,
        }}
      >
        {slot.label}
      </div>
      <div
        className="prayer-timeline-time"
        style={{
          color:
            state === "next"
              ? "var(--accent)"
              : "color-mix(in oklab, var(--foreground) 78%, transparent)",
          fontWeight: state === "next" ? 700 : 600,
          fontSize: sunrise ? 12 : 13,
        }}
      >
        {formatMinutes(slot.minutes)}
      </div>
    </div>
  );
}

function DayList({
  slots,
  now,
  nextAt,
  showNowDivider,
  dim,
  nextRef,
}: {
  slots: Slot[];
  now: Date;
  nextAt: number | null;
  showNowDivider?: boolean;
  dim?: boolean;
  nextRef?: (el: HTMLDivElement | null) => void;
}) {
  const rows: React.ReactNode[] = [];
  let dividerPlaced = false;
  slots.forEach((s) => {
    if (showNowDivider && !dividerPlaced && s.at.getTime() > now.getTime()) {
      dividerPlaced = true;
      rows.push(
        <div key="now" className="flex items-center gap-2 py-3 pl-1">
          <span
            className="text-[10px] font-bold tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            NOW
          </span>
          <span className="h-px flex-1" style={{ background: "var(--accent)", opacity: 0.6 }} />
        </div>,
      );
    }
    const state: "past" | "next" | "future" =
      nextAt !== null && s.at.getTime() === nextAt
        ? "next"
        : s.at.getTime() <= now.getTime()
          ? "past"
          : "future";
    rows.push(
      <Row
        key={`${s.dayKey}-${s.id}`}
        slot={s}
        state={state}
        rowRef={state === "next" ? nextRef : undefined}
      />,
    );
  });

  return (
    <div className="prayer-timeline-list relative" style={{ opacity: dim ? 0.72 : 1 }}>
      <span
        className="absolute top-2 bottom-2"
        style={{
          left: 7.5,
          width: 1,
          background: "color-mix(in oklab, var(--foreground) 18%, transparent)",
        }}
      />
      {rows}
    </div>
  );
}

const ICONS: Record<string, typeof Sun> = { fajr: Sunrise, sunrise: Sun, dhuhr: Sun, asr: CloudSun, maghrib: Sunset, isha: Moon };

function SheetDay({ day, now, nextAt, dayRef, isToday, past }: {
  day: { key: string; label: string; slots: Slot[] }; now: Date; nextAt: number | null;
  dayRef: (el: HTMLElement | null) => void; isToday: boolean; past: boolean;
}) {
  const date = day.slots[0]?.at;
  return (
    <section ref={dayRef} className={`ptl-day ${past ? "is-past" : ""}`}>
      <header className="ptl-day-head">
        <span className="ptl-day-title">{day.label}</span>
        {date && <span className="ptl-day-date">{date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>}
      </header>
      <div className="ptl-list">
        <span className="ptl-line" aria-hidden />
        {day.slots.map((s) => {
          const t = s.at.getTime();
          const state = nextAt !== null && t === nextAt ? "next" : t <= now.getTime() ? "past" : "future";
          const Icon = ICONS[s.id] ?? Sun;
          return (
            <div key={s.id} className="ptl-row" data-state={state}>
              <span className="ptl-dot" aria-hidden />
              <span className="ptl-pill">
                <span className="ptl-ic"><Icon size={16} strokeWidth={1.6} /></span>
                <span className="ptl-name">{s.label}</span>
                <span className="ptl-time">{formatMinutes(s.minutes)}</span>
              </span>
            </div>
          );
        })}
      </div>
      {isToday && null}
    </section>
  );
}

function DayPill({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-bold"
      style={{
        background: "var(--surface-card)",
        color: "var(--foreground)",
        boxShadow: "var(--card-shadow)",
      }}
    >
      {label}
    </span>
  );
}

export function PrayerTimeline({ days, now, todayKey, tone = "light" }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { handlers: dragHandlers, style: dragStyle } = useSheetDrag(!expanded, () => setExpanded(false));
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const todaySectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!expanded) return;
    // Open on today: today's heading lands at the top of the list instead of the
    // view settling somewhere between yesterday and tomorrow.
    const t = window.setTimeout(() => {
      const box = scrollRef.current;
      const day = todaySectionRef.current;
      if (!box || !day) return;
      const top =
        box.scrollTop + (day.getBoundingClientRect().top - box.getBoundingClientRect().top) - 8;
      box.scrollTo({ top: Math.max(0, top), behavior: "auto" });

    }, 40);
    return () => window.clearTimeout(t);
  }, [expanded]);


  const all = days.flatMap((d) => d.slots);
  const next = all.find((s) => s.at.getTime() > now.getTime()) ?? null;
  const nextAt = next ? next.at.getTime() : null;

  const today = days.find((d) => d.key === todayKey);
  const tomorrow = days[days.findIndex((d) => d.key === todayKey) + 1];

  const displayDay = days.find((d) => d.key === next?.dayKey) ?? today ?? tomorrow;
  const compact = displayDay?.slots.slice(0, 6) ?? [];

  const deep = tone === "deep";
  const cardStyle: React.CSSProperties = deep
    ? ({
        background: "var(--surface-deep-gradient)",
        color: "var(--surface-deep-fg)",
        boxShadow: "var(--card-shadow)",
        ["--foreground" as string]: "var(--surface-deep-fg)",
        ["--muted-foreground" as string]: "var(--surface-deep-muted)",
      } as React.CSSProperties)
    : {
        background: "var(--surface-card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--card-shadow)",
        color: "var(--foreground)",
      };

  return (
    <>
      <button
        onClick={() => setExpanded(true)}
        className="prayer-timeline-card h-full w-full text-left active:scale-[0.99]"
        style={cardStyle}
      >
        <div className="prayer-timeline-heading flex items-center justify-between gap-2">
          <span className="label-caps">Upcoming</span>
          <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
            Tap for all
            <ChevronRight size={12} strokeWidth={1.8} style={{ marginLeft: 2, verticalAlign: "-1px" }} />
          </span>
        </div>
        {compact.length === 0 ? (
          <div className="py-3 text-sm" style={{ color: "var(--muted-foreground)" }}>
            Prayer times are not available yet.
          </div>
        ) : (
          <DayList slots={compact} now={now} nextAt={nextAt} />
        )}
      </button>

      {expanded && (
        <div
          className="fixed inset-x-0 top-0 flex flex-col justify-end"
          // eslint-disable-next-line
          data-overlay="prayer-timeline"
          style={{ background: "color-mix(in oklab, var(--foreground) 36%, transparent)", backdropFilter: "blur(8px)", zIndex: 90, bottom: 0 }}
          onClick={() => setExpanded(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="prayer-timeline-sheet rounded-t-[28px] px-5 pt-3"
            style={{
              // Partial sheet: the top edge sits below the status bar so the
              // panel reads as a sheet resting on the page, not a full-screen cover.
              maxHeight: "min(79dvh, 715px)", paddingBottom: "calc(var(--bottom-nav-row) + env(safe-area-inset-bottom, 0px) + 10px)", display: "flex", flexDirection: "column",
              ...dragStyle,
            } as React.CSSProperties}
          >
            {/* Only this grab strip closes the sheet. Dragging through the prayer list
                scrolls the list; it must not swipe the whole popup away. */}
            <div
              {...dragHandlers}
              className="ptl-grab"
              style={{ padding: "7px 0 12px", touchAction: "none", cursor: "grab" }}
            >
              <div
                className="mx-auto rounded-full"
                style={{
                  width: 40,
                  height: 4,
                  background: "color-mix(in oklab, var(--foreground) 22%, transparent)",
                }}
              />
            </div>
            <div className="ptl-head mb-0 flex items-start justify-between">
              <span className="ptl-art" aria-hidden />
              <div className="relative">
                <h2 className="ptl-title">Prayer timeline</h2>
                <p className="ptl-sub">Today &amp; tomorrow's prayer times</p>
              </div>
              <button
                onClick={() => setExpanded(false)}
                aria-label="Close"
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 34,
                  height: 34,
                  background: "color-mix(in oklab, var(--foreground) 8%, transparent)",
                  color: "var(--foreground)",
                }}
              >
                <X size={17} />
              </button>
            </div>
            <div
              ref={scrollRef}
              className="overflow-y-auto overscroll-contain"
              style={{
                flex: 1, minHeight: 0,
                position: "relative", zIndex: 1,
                paddingRight: "10px",
                paddingBottom: "60px",
                WebkitMaskImage: "linear-gradient(to bottom, #000 calc(100% - 90px), transparent)",
                maskImage: "linear-gradient(to bottom, #000 calc(100% - 90px), transparent)",
              }}
            >
              {days.map((d) => (
                <SheetDay key={d.key} day={d} now={now} nextAt={nextAt} isToday={d.key === todayKey} past={d.key < todayKey}
                  dayRef={(el) => { if (el && d.key === todayKey) todaySectionRef.current = el; }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
