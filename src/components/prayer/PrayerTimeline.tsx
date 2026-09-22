// Vertical mini timeline of prayer times, with an expanded multi day view.

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Portal } from "@/components/Portal";
import { formatMinutes, type PrayerId, type Slot } from "@/lib/prayer-times";

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
  const [dragY, setDragY] = useState(0);
  const [startY, setStartY] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const nextRowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!expanded) {
      setDragY(0);
      return;
    }
    // Center the next prayer when the timeline opens, even if it is tomorrow.
    const t = window.setTimeout(() => {
      const box = scrollRef.current;
      const row = nextRowRef.current;
      if (!box || !row) return;
      const top =
        box.scrollTop +
        (row.getBoundingClientRect().top - box.getBoundingClientRect().top) -
        box.clientHeight / 2 +
        row.clientHeight / 2;
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
        <Portal>
        <div
          className="fixed inset-0 flex flex-col justify-end"
          // eslint-disable-next-line
          data-overlay="prayer-timeline"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", zIndex: 200 }}
          onClick={() => setExpanded(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => setStartY(e.touches[0].clientY)}
            onTouchMove={(e) => {
              if (startY === null) return;
              setDragY(Math.max(0, e.touches[0].clientY - startY));
            }}
            onTouchEnd={() => {
              if (dragY > 90) setExpanded(false);
              setDragY(0);
              setStartY(null);
            }}
            className="rounded-t-[28px] px-5 pb-8 pt-3"
            style={{
              background: "#f9f5f0",
              color: "#3c5438",
              maxHeight: "88vh",
              transform: `translateY(${dragY}px)`,
              transition: startY === null ? "transform 220ms ease" : "none",
              ["--foreground" as string]: "#3c5438",
              ["--muted-foreground" as string]: "#8a8f80",
              ["--accent" as string]: "#70815d",
              ["--surface-card" as string]: "#ffffff",
              ["--border" as string]: "rgba(60, 84, 56, 0.12)",
              ["--card-shadow" as string]: "0 2px 10px rgba(60, 84, 56, 0.08)",
            } as React.CSSProperties}
          >
            <div
              className="mx-auto mb-3 rounded-full"
              style={{
                width: 40,
                height: 4,
                background: "color-mix(in oklab, var(--foreground) 22%, transparent)",
              }}
            />
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-bold">Prayer timeline</h2>
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
                maxHeight: "72vh",
                position: "relative",
                paddingRight: "10px",
                paddingBottom: "calc(var(--bottom-nav-row) + env(safe-area-inset-bottom))",
              }}
            >
              {days.map((d) => (
                <div key={d.key} className="mb-5">
                  <div className="mb-2.5">
                    <DayPill label={d.label} />
                  </div>
                  <DayList
                    slots={d.slots}
                    now={now}
                    nextAt={nextAt}
                    nextRef={(el) => {
                      if (el) nextRowRef.current = el;
                    }}
                    showNowDivider={d.key === todayKey}
                    dim={d.key < todayKey}
                  />
                </div>

              ))}
            </div>
          </div>
        </div>
        </Portal>
      )}
    </>
  );
}
