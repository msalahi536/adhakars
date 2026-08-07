import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, BellOff, ChevronDown, MapPin, Play } from "lucide-react";
import { HeaderSettingsButton } from "@/components/HeaderSettingsButton";
import { ConcentricCirclesPattern } from "@/components/HeaderPatterns";
import { PrayerTimeline } from "@/components/prayer/PrayerTimeline";
import { AfterSalahSheet } from "@/components/prayer/AfterSalahSheet";
import { PrayerPicker } from "@/components/prayer/PrayerPicker";
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
      } else {
        // One time repair for city coordinates saved by an older build.
        const fixed = await repairLocation(s.location);
        if (fixed) {
          s = { ...s, location: fixed };
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

  const toggleDismissNext = () => {
    if (!next) return;
    if (nextIsDismissed) {
      setDismissed(null);
      setDismissedState(null);
    } else {
      const v = { dayKey: next.dayKey, prayer: next.id };
      setDismissed(v);
      setDismissedState(v);
    }
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
  const [pickerOpen, setPickerOpen] = useState(false);
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

  // Countdown urgency: amber inside 30 minutes, red inside 10 minutes.
  const msLeft = next ? next.at.getTime() - now.getTime() : null;
  const urgencyColor =
    msLeft === null || msLeft < 0
      ? null
      : msLeft <= 10 * 60 * 1000
        ? "#ff9a8a"
        : msLeft <= 30 * 60 * 1000
          ? "#ffd166"
          : null;



  return (
    <>
      <header
        className="page-header relative overflow-hidden"
        style={{ background: "var(--grad-header)", color: "var(--header-fg)" }}
      >
        <ConcentricCirclesPattern />
        <HeaderSettingsButton />
        <div className="relative mx-auto max-w-md px-5 pb-6 pt-5">
          {settings.location ? (
            <div className="flex flex-col items-center pt-6 pb-1 text-center">
              <div
                className="text-[15px] font-semibold tracking-wide"
                style={{ color: "var(--header-sub)" }}
              >
                {next ? `${next.label} in` : loading ? "Loading prayer times" : "No times yet"}
              </div>
              <div
                className="mt-1 font-bold"
                style={{
                  fontSize: 52,
                  lineHeight: 1.02,
                  letterSpacing: "-0.02em",
                  fontVariantNumeric: "tabular-nums",
                  textShadow: "0 10px 30px rgba(0,0,0,0.22)",
                  color: urgencyColor ?? "inherit",
                  transition: "color 400ms ease",
                }}
              >
                {next ? formatCountdown(next.at.getTime() - now.getTime()) : "--:--:--"}
              </div>

              <button
                onClick={toggleDismissNext}
                disabled={!next}
                className="mt-4 rounded-full px-5 py-2 text-[13px] font-bold active:scale-95"
                style={{
                  background: nextIsDismissed
                    ? "color-mix(in oklab, var(--header-fg) 16%, transparent)"
                    : "color-mix(in oklab, var(--header-fg) 12%, transparent)",
                  color: "var(--header-fg)",
                  border: "1px solid color-mix(in oklab, var(--header-fg) 22%, transparent)",
                  backdropFilter: "blur(6px)",
                  transition: "background 200ms ease",
                }}
              >
                {nextIsDismissed ? "Tap to unmute next salah" : "Tap to dismiss"}
              </button>

              <div className="mt-3 flex items-center gap-2 text-[11px]">
                <span
                  className="inline-flex items-center gap-1"
                  style={{ color: "var(--header-sub)" }}
                >
                  <MapPin size={11} />
                  {settings.location.label}
                </span>
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
          {/* Recommended: entry into the after salah adhkar */}
          <div
            className="w-full overflow-hidden rounded-[30px] p-5"
            style={{
              background: "var(--surface-card)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="label-caps" style={{ color: "var(--muted-foreground)" }}>
                  Recommended
                </div>
                <div className="mt-1 text-2xl font-bold tracking-tight">
                  After {selectedLabel} Adhkar
                </div>
                <div className="mt-0.5 text-sm" style={{ color: "var(--muted-foreground)" }}>
                  {cur.done} of {cur.total} complete
                </div>
              </div>
              <button
                onClick={() => setPickerOpen(true)}
                className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold active:scale-95"
                style={{
                  background: "color-mix(in oklab, var(--foreground) 7%, transparent)",
                  color: "var(--foreground)",
                }}
              >
                Change
                <ChevronDown size={14} />
              </button>
            </div>

            <div className="mt-5 flex items-center gap-4">
              <button
                onClick={() => setSheetOpen(true)}
                aria-label={`Open after ${selectedLabel} adhkar`}
                className="relative flex shrink-0 items-center justify-center rounded-full active:scale-95"
                style={{
                  width: 64,
                  height: 64,
                  background: "var(--accent)",
                  color: "var(--accent-foreground)",
                  boxShadow: "0 16px 30px -14px color-mix(in oklab, var(--accent) 90%, transparent)",
                  transition: "transform 160ms ease",
                }}
              >
                <Play size={24} fill="currentColor" style={{ marginLeft: 3 }} />
                <svg
                  className="pointer-events-none absolute inset-0"
                  viewBox="0 0 64 64"
                  aria-hidden
                >
                  <circle
                    cx="32"
                    cy="32"
                    r="30"
                    fill="none"
                    stroke="color-mix(in oklab, var(--accent-foreground) 30%, transparent)"
                    strokeWidth="2.5"
                    strokeDasharray={`${(pct / 100) * 2 * Math.PI * 30} ${2 * Math.PI * 30}`}
                    strokeLinecap="round"
                    transform="rotate(-90 32 32)"
                  />
                </svg>
              </button>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">
                  {pct === 100 ? "Completed today" : pct > 0 ? "Continue" : "Begin the adhkar"}
                </div>
                <div
                  className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
                  style={{ background: "color-mix(in oklab, var(--foreground) 10%, transparent)" }}
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
              </div>
            </div>
          </div>

          {settings.location && (
            <div className="mt-3">
              <PrayerTimeline
                days={timelineDays}
                now={now}
                todayKey={todayKey}
                tone="deep"
                onPickPrayer={(id) => openAdhkar(id as SalahPrayer)}
              />
            </div>
          )}

          <button
            onClick={toggleMuteAll}
            className="mt-3 flex w-full items-center gap-3 rounded-[24px] px-5 py-4 text-left active:scale-[0.99]"
            style={{
              background: "var(--surface-card)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <span
              className="flex shrink-0 items-center justify-center rounded-full"
              style={{
                width: 38,
                height: 38,
                background: mutedAll
                  ? "color-mix(in oklab, var(--foreground) 8%, transparent)"
                  : "color-mix(in oklab, var(--accent) 16%, transparent)",
                color: mutedAll ? "var(--muted-foreground)" : "var(--accent)",
              }}
            >
              {mutedAll ? <BellOff size={18} /> : <Bell size={18} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">
                {mutedAll ? "Adhan muted today" : "Adhan notifications on"}
              </span>
              <span className="block text-xs" style={{ color: "var(--muted-foreground)" }}>
                {mutedAll ? "Tap to turn back on" : "Tap to mute for the rest of today"}
              </span>
            </span>
          </button>
        </div>
      </main>

      <AfterSalahSheet
        open={sheetOpen}
        prayer={prayer}
        onPrayer={setPrayer}
        onClose={() => setSheetOpen(false)}
      />
      <PrayerPicker
        open={pickerOpen}
        selected={prayer}
        progress={progress}
        onPick={(p) => {
          setPrayer(p);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />

    </>
  );
}
