import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, BellOff, ChevronDown, ChevronRight, MapPin, Play } from "lucide-react";
import { PrayerTimeline } from "@/components/prayer/PrayerTimeline";
import { AfterSalahSheet } from "@/components/prayer/AfterSalahSheet";
import { PrayerPicker } from "@/components/prayer/PrayerPicker";
import { SALAH_PRAYERS, getSalahItems, isItemComplete, type SalahPrayer } from "@/data/salah";
import { getCounts } from "@/lib/storage";

import {
  DEFAULT_PRAYER_SETTINGS,
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
  type PrayerSettings,
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
  errorComponent: SalahError,
});

function SalahError() {
  return (
    <main
      className="scroll-area flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <div className="text-lg font-bold">Prayer times could not load</div>
      <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
        Check your connection or set your location again in Settings.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-5 rounded-full px-5 py-2.5 text-sm font-bold"
        style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
      >
        Try again
      </button>
    </main>
  );
}

const PRAYER_KEY = "selectedPrayer";
const validPrayer = (v: string | null): SalahPrayer => {
  const ids = SALAH_PRAYERS.map((p) => p.id) as string[];
  return (v && ids.includes(v) ? v : "fajr") as SalahPrayer;
};

const DAY_LABELS = ["Yesterday", "Today", "Tomorrow", "Day after"];

function Salah() {
  /* ---------------- prayer times ---------------- */
  const [settings, setSettingsState] = useState<PrayerSettings>(DEFAULT_PRAYER_SETTINGS);
  const [days, setDays] = useState<DayTimes[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [cityInput, setCityInput] = useState("");
  const [cityError, setCityError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [dismissed, setDismissedState] = useState<ReturnType<typeof getDismissed>>(null);

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
  const [prayer, setPrayerState] = useState<SalahPrayer>("fajr");
  useEffect(() => {
    setPrayerState(validPrayer(window.localStorage.getItem(PRAYER_KEY)));
  }, []);

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
    <div className="salah-page">
      <header className="salah-hero">
        <div className="salah-next-label">
          {!settings.location
            ? "Prayer times"
            : next
              ? `${next.label} in`
              : loading
                ? "Loading prayer times"
                : "No times yet"}
        </div>
        <div
          className="salah-countdown"
          style={{ color: urgencyColor ?? undefined, opacity: settings.location ? 1 : 0.55 }}
        >
          {next ? formatCountdown(next.at.getTime() - now.getTime()) : "--:--:--"}
        </div>
        <button onClick={toggleDismissNext} disabled={!next} className="salah-dismiss active:scale-95">
          {nextIsDismissed ? "Tap to unmute next salah" : "Tap to dismiss"}
        </button>
        <div className="salah-location">
          <MapPin size={12} strokeWidth={1.5} />
          {settings.location ? settings.location.label : "Location not set"}
        </div>
      </header>

      <main className="salah-content">
        <div className={`salah-content-inner ${settings.location ? "" : "no-location"}`}>
          {!settings.location && (
            <div
               className="salah-location-card w-full overflow-hidden p-5"
              style={{
                background: "var(--surface-card)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
                boxShadow: "var(--card-shadow)",
              }}
            >
              <div className="label-caps" style={{ color: "var(--muted-foreground)" }}>
                Location
              </div>
              <div className="mt-1 text-xl font-bold tracking-tight">Set your location</div>
              <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
                We use it only to calculate your prayer times. Nothing leaves your device except
                the coordinates used to look up the times.
              </p>
              <button
                onClick={() => void useMyLocation()}
                disabled={locating}
                className="mt-4 w-full rounded-full py-3 text-sm font-bold active:scale-[0.99]"
                style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
              >
                {locating ? "Locating..." : "Use my location"}
              </button>
              <div className="mt-2 flex gap-2">
                <input
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  placeholder="Or type a city"
                  className="min-w-0 flex-1 rounded-full px-4 py-2.5 outline-none"
                  style={{
                    fontSize: 16,
                    background: "var(--background)",
                    color: "var(--foreground)",
                    border: "1px solid var(--border)",
                  }}
                />
                <button
                  onClick={() => void submitCity()}
                  className="shrink-0 rounded-full px-5 text-sm font-bold"
                  style={{
                    background: "color-mix(in oklab, var(--foreground) 8%, transparent)",
                    color: "var(--foreground)",
                  }}
                >
                  Set
                </button>
              </div>
              {cityError && (
                <div className="mt-2 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                  {cityError}
                </div>
              )}
            </div>
          )}

          {/* Recommended: entry into the after salah adhkar */}

          <section className="salah-recommended-card">
            <div className="salah-recommended-top flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="salah-kicker">
                  Recommended
                </div>
              </div>
              <button
                onClick={() => setPickerOpen(true)}
                className="salah-change flex shrink-0 items-center gap-1 active:scale-95"
              >
                Change
                <ChevronDown size={12} strokeWidth={2} />
              </button>
            </div>
            <div className="salah-recommended-title">After {selectedLabel} Adhkar</div>
            <div className="salah-recommended-progress">{cur.done} of {cur.total} complete</div>

            <div className="salah-recommended-action flex items-center">
              <button
                onClick={() => setSheetOpen(true)}
                aria-label={`Open after ${selectedLabel} adhkar`}
                className="salah-play flex shrink-0 items-center justify-center rounded-full active:scale-95"
              >
                <Play size={18} fill="currentColor" strokeWidth={1.5} />
              </button>
              <div className="min-w-0 flex-1">
                <div className="salah-action-label">
                  {pct === 100 ? "Completed today" : pct > 0 ? "Continue" : "Begin the adhkar"}
                </div>
                <div className="salah-action-track">
                  <span style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          </section>

          {settings.location ? (
            <div className="salah-upcoming-wrap">
              <PrayerTimeline
                days={timelineDays}
                now={now}
                todayKey={todayKey}
                tone="deep"
              />
            </div>
          ) : (
            <div
              className="dhikr-card salah-upcoming-placeholder w-full overflow-hidden p-5"
              style={{
                background: "var(--surface-deep, var(--surface-card))",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
                boxShadow: "var(--card-shadow)",
              }}
            >
              <div className="label-caps" style={{ color: "var(--muted-foreground)" }}>
                Upcoming
              </div>
              <div className="mt-3 space-y-3">
                {["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"].map((label) => (
                  <div key={label} className="flex items-center gap-3">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: "color-mix(in oklab, var(--foreground) 18%, transparent)" }}
                    />
                    <span className="flex-1 text-sm font-semibold" style={{ opacity: 0.5 }}>
                      {label}
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}
                    >
                      --:--
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
                Times appear once your location is set.
              </div>
            </div>
          )}


          <button
            onClick={toggleMuteAll}
            className="salah-adhan-card flex w-full items-center text-left active:scale-[0.99]"
          >
            <span className="salah-adhan-icon flex shrink-0 items-center justify-center rounded-full">
              {mutedAll ? <BellOff size={16} /> : <Bell size={16} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="salah-adhan-title block">
                {mutedAll ? "Adhan muted today" : "Adhan notifications on"}
              </span>
              <span className="salah-adhan-subtitle block">
                {mutedAll ? "Tap to turn back on" : "Tap to mute for the rest of today"}
              </span>
            </span>
            <ChevronRight size={16} strokeWidth={1.5} className="salah-adhan-chevron" />
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

    </div>
  );
}
