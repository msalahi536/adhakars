import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, BellOff, Check, ChevronRight, Clock } from "lucide-react";
import { HeaderSettingsButton } from "@/components/HeaderSettingsButton";
import { ConcentricCirclesPattern } from "@/components/HeaderPatterns";
import { PrayerTimeline } from "@/components/prayer/PrayerTimeline";
import { AfterSalahSheet } from "@/components/prayer/AfterSalahSheet";
import { SALAH_PRAYERS, getSalahItems, isItemComplete, type SalahPrayer } from "@/data/salah";
import { getCounts } from "@/lib/storage";

import {
  addDays,
  currentPrayer,
  dateKey,
  fetchDay,
  formatCountdown,
  formatMinutes,
  getDismissed,
  getPrayerSettings,
  isMutedAllToday,
  lookupCity,
  prunePrayerCache,
  repairLocation,
  resolveLocation,
  setDismissed,
  setMuteAllToday,
  setPrayerSettings,
  slotsForDay,
  type DayTimes,
  type Slot,
} from "@/lib/prayer-times";
import { rescheduleAdhanNotifications } from "@/lib/adhan-notifications";

export const Route = createFileRoute("/app/salah")({
  head: () => ({
    meta: [
      { title: "Prayer Times and Salah Adhkar, Sahih Al-Adhkar" },
      {
        name: "description",
        content:
          "Daily prayer times with a live countdown, an upcoming timeline, adhan notifications, and the adhkar said after each prayer.",
      },
      { property: "og:title", content: "Prayer Times and Salah Adhkar" },
      {
        property: "og:description",
        content: "Live prayer countdown, timeline, adhan notifications, and after salah adhkar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Salah,
});

const PRAYER_KEY = "selectedPrayer";
const validPrayer = (v: string | null): SalahPrayer => {
  const ids = SALAH_PRAYERS.map((p) => p.id) as string[];
  return (v && ids.includes(v) ? v : "fajr") as SalahPrayer;
};

const DAY_LABELS = ["Yesterday", "Today", "Tomorrow", "Day after"];

function Salah() {
  /* ---------------- prayer times ---------------- */
  const [settings, setSettingsState] = useState(() => getPrayerSettings());
  const [days, setDays] = useState<DayTimes[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [cityInput, setCityInput] = useState("");
  const [cityError, setCityError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [dismissed, setDismissedState] = useState(() => getDismissed());
  const [mutedAll, setMutedAll] = useState(false);
  const autoSelected = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setMutedAll(isMutedAllToday());
    setDismissedState(getDismissed());
    prunePrayerCache();
  }, []);

  const load = useCallback(async (s = getPrayerSettings()) => {
    if (!s.location) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const base = new Date();
    const results = await Promise.all(
      [-1, 0, 1, 2].map((offset) => fetchDay(addDays(base, offset), s)),
    );
    setDays(results.filter((d): d is DayTimes => d !== null));
    setLoading(false);
    void rescheduleAdhanNotifications(s);
  }, []);

  // First load: reuse the stored location, otherwise try the device once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let s = getPrayerSettings();
      if (!s.location) {
        const loc = await resolveLocation();
        if (loc) {
          s = { ...s, location: loc };
          setPrayerSettings(s);
        }
      }
      if (cancelled) return;
      setSettingsState(s);
      await load(s);
    })();
    const onSettings = () => {
      const s = getPrayerSettings();
      setSettingsState(s);
      void load(s);
    };
    window.addEventListener("adhkar:prayer-settings", onSettings);
    return () => {
      cancelled = true;
      window.removeEventListener("adhkar:prayer-settings", onSettings);
    };
  }, [load]);

  const todayKey = dateKey(now);

  const timelineDays = useMemo(() => {
    const base = new Date();
    return [-1, 0, 1, 2]
      .map((offset, i) => {
        const key = dateKey(addDays(base, offset));
        const day = days.find((d) => d.key === key);
        return day ? { key, label: DAY_LABELS[i], slots: slotsForDay(day) } : null;
      })
      .filter((d): d is { key: string; label: string; slots: Slot[] } => d !== null);
  }, [days]);

  const allSlots = useMemo(() => timelineDays.flatMap((d) => d.slots), [timelineDays]);
  const next = useMemo(
    () => allSlots.find((s) => s.at.getTime() > now.getTime()) ?? null,
    [allSlots, now],
  );

  const nextIsDismissed =
    !!next && !!dismissed && dismissed.dayKey === next.dayKey && dismissed.prayer === next.id;

  const dismissNext = () => {
    if (!next) return;
    const v = { dayKey: next.dayKey, prayer: next.id };
    setDismissed(v);
    setDismissedState(v);
    void rescheduleAdhanNotifications(getPrayerSettings());
  };

  const toggleMuteAll = () => {
    const v = !mutedAll;
    setMuteAllToday(v);
    setMutedAll(v);
    void rescheduleAdhanNotifications(getPrayerSettings());
  };

  const useMyLocation = async () => {
    setLocating(true);
    setCityError(null);
    const loc = await resolveLocation(true);
    setLocating(false);
    if (!loc) {
      setCityError("We could not get your location. Type a city instead.");
      return;
    }
    const s = { ...getPrayerSettings(), location: loc };
    setPrayerSettings(s);
    setSettingsState(s);
    void load(s);
  };

  const submitCity = async () => {
    setLocating(true);
    setCityError(null);
    const loc = await lookupCity(cityInput);
    setLocating(false);
    if (!loc) {
      setCityError("We could not find that place. Try a city and country.");
      return;
    }
    const s = { ...getPrayerSettings(), location: loc };
    setPrayerSettings(s);
    setSettingsState(s);
    setCityInput("");
    void load(s);
  };

  /* ---------------- adhkar ---------------- */
  const [prayer, setPrayerState] = useState<SalahPrayer>(() => {
    if (typeof window === "undefined") return "fajr";
    return validPrayer(window.localStorage.getItem(PRAYER_KEY));
  });
  const [sheetOpen, setSheetOpen] = useState(false);
  const setPrayer = (p: SalahPrayer) => {
    if (typeof window !== "undefined") window.localStorage.setItem(PRAYER_KEY, p);
    setPrayerState(p);
  };
  const openAdhkar = (p: SalahPrayer) => {
    setPrayer(p);
    setSheetOpen(true);
  };

  // Auto select the most recent prayer once times are known.
  useEffect(() => {
    if (autoSelected.current) return;
    const today = timelineDays.find((d) => d.key === todayKey);
    if (!today) return;
    autoSelected.current = true;
    const cur = currentPrayer(today.slots, new Date());
    if (cur) setPrayer(cur as SalahPrayer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timelineDays, todayKey]);

  // Progress per prayer, refreshed whenever the sheet closes.
  const [progress, setProgress] = useState<Record<string, { done: number; total: number }>>({});
  useEffect(() => {
    if (sheetOpen) return;
    const out: Record<string, { done: number; total: number }> = {};
    SALAH_PRAYERS.forEach((p) => {
      const items = getSalahItems(p.id);
      const counts = getCounts(`salah_${p.id}`);
      out[p.id] = {
        done: items.filter((i) => isItemComplete(i, counts)).length,
        total: items.length,
      };
    });
    setProgress(out);
  }, [sheetOpen]);

  const selectedLabel = SALAH_PRAYERS.find((p) => p.id === prayer)?.label ?? "";
  const cur = progress[prayer] ?? { done: 0, total: 0 };
  const pct = cur.total ? Math.round((cur.done / cur.total) * 100) : 0;


  return (
    <>
      <header
        className="page-header relative overflow-hidden"
        style={{ background: "var(--grad-header)", color: "var(--header-fg)" }}
      >
        <ConcentricCirclesPattern />
        <HeaderSettingsButton />
        <div className="relative mx-auto max-w-md px-5 pb-6 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="label-caps" style={{ color: "var(--header-sub)", opacity: 1 }}>
                Prayer Times
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">
                {settings.location ? settings.location.label : "Set your location"}
              </h1>
            </div>
            <div style={{ marginRight: 44 }}>
              <MiniQibla />
            </div>
          </div>

          {settings.location ? (
            <div className="mt-5">
              <div className="text-sm font-semibold" style={{ color: "var(--header-sub)" }}>
                {next ? `${next.label} in` : loading ? "Loading prayer times" : "No times yet"}
              </div>
              <div
                className="mt-1 font-bold tabular-nums"
                style={{ fontSize: 44, lineHeight: 1.05, fontVariantNumeric: "tabular-nums" }}
              >
                {next ? formatCountdown(next.at.getTime() - now.getTime()) : "--:--:--"}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={dismissNext}
                  disabled={!next || nextIsDismissed}
                  className="rounded-full px-4 py-2 text-xs font-bold"
                  style={
                    nextIsDismissed
                      ? {
                          background: "color-mix(in oklab, var(--header-fg) 12%, transparent)",
                          color: "var(--header-sub)",
                        }
                      : {
                          background: "var(--accent)",
                          color: "var(--accent-foreground)",
                        }
                  }
                >
                  {nextIsDismissed ? "Next adhan muted" : "Tap to dismiss"}
                </button>
                <button
                  onClick={toggleMuteAll}
                  className="text-xs font-semibold underline"
                  style={{ color: "var(--header-sub)" }}
                >
                  {mutedAll ? "Unmute today" : "Mute all today"}
                </button>
              </div>
            </div>
          ) : (
            <div
              className="mt-4 rounded-2xl p-3"
              style={{ background: "color-mix(in oklab, var(--header-fg) 12%, transparent)" }}
            >
              <p className="text-xs" style={{ color: "var(--header-sub)" }}>
                We need your location to calculate prayer times. Nothing leaves your device except
                the coordinates used to look up the times.
              </p>
              <button
                onClick={() => void useMyLocation()}
                disabled={locating}
                className="mt-3 w-full rounded-full py-2 text-sm font-bold"
                style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
              >
                {locating ? "Locating..." : "Use my location"}
              </button>
              <div className="mt-2 flex gap-2">
                <input
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  placeholder="Or type a city"
                  className="min-w-0 flex-1 rounded-full px-3 py-2 outline-none"
                  style={{
                    fontSize: 16,
                    background: "var(--surface-card)",
                    color: "var(--foreground)",
                    border: "1px solid var(--border)",
                  }}
                />
                <button
                  onClick={() => void submitCity()}
                  className="rounded-full px-4 text-sm font-bold"
                  style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                >
                  Set
                </button>
              </div>
              {cityError && (
                <div className="mt-2 text-[11px]" style={{ color: "var(--header-sub)" }}>
                  {cityError}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="scroll-area flex flex-col" style={{ background: "var(--background)" }}>
        <div className="mx-auto w-full max-w-md px-5 pb-8 pt-4">
          {settings.location && (
            <PrayerTimeline
              days={timelineDays}
              now={now}
              todayKey={todayKey}
              onPickPrayer={(id) => openAdhkar(id as SalahPrayer)}
            />
          )}

          {/* Entry card into the after salah adhkar */}
          <button
            onClick={() => setSheetOpen(true)}
            className="mt-4 w-full overflow-hidden rounded-[26px] p-5 text-left active:scale-[0.99]"
            style={{
              background: "var(--surface-deep-gradient)",
              color: "var(--surface-deep-fg)",
              boxShadow: "var(--card-shadow)",
              transition: "transform 160ms ease",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="label-caps" style={{ color: "var(--surface-deep-muted)" }}>
                  After Salah Adhkar
                </div>
                <div className="mt-1 text-xl font-bold">After {selectedLabel}</div>
              </div>
              <span
                className="flex shrink-0 items-center justify-center rounded-full"
                style={{
                  width: 40,
                  height: 40,
                  background: "var(--accent)",
                  color: "var(--accent-foreground)",
                }}
              >
                <ChevronRight size={20} />
              </span>
            </div>

            <div
              className="mt-4 h-1.5 w-full overflow-hidden rounded-full"
              style={{ background: "rgba(255,255,255,0.18)" }}
            >
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: "var(--accent)",
                  transition: "width 300ms ease",
                }}
              />
            </div>
            <div className="mt-2 text-xs" style={{ color: "var(--surface-deep-muted)" }}>
              {cur.done} of {cur.total} complete, tap to begin
            </div>
          </button>

          {/* Quick jump into any prayer */}
          <div
            className="hide-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1"
            style={{ scrollbarWidth: "none" }}
          >
            {SALAH_PRAYERS.map((p) => {
              const active = p.id === prayer;
              const pr = progress[p.id];
              const done = pr && pr.total > 0 && pr.done === pr.total;
              return (
                <button
                  key={p.id}
                  onClick={() => openAdhkar(p.id)}
                  className="flex shrink-0 items-center justify-center gap-1.5 font-bold active:scale-95"
                  style={{
                    minWidth: 74,
                    height: 36,
                    borderRadius: 18,
                    padding: "0 14px",
                    fontSize: 13,
                    background: active
                      ? "var(--accent)"
                      : "color-mix(in oklab, var(--foreground) 8%, transparent)",
                    color: active ? "var(--accent-foreground)" : "var(--foreground)",
                    transition: "background 0.25s ease, color 0.25s ease",
                  }}
                >
                  {p.label}
                  {done && <Check size={13} />}
                </button>
              );
            })}
          </div>
        </div>
      </main>

      <AfterSalahSheet
        open={sheetOpen}
        prayer={prayer}
        onPrayer={setPrayer}
        onClose={() => setSheetOpen(false)}
      />

    </>
  );
}
