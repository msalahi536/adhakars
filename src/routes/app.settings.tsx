import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { getDisplay, setDisplay } from "@/lib/theme";
import {
  setSeed,
  getPresetId,
  setPresetId,
  setCustomTriplet,
  resetTheme,
  PRESETS,
  DEFAULT_PRESET_ID,
} from "@/lib/theme-store";
import { sectionSeedFor } from "@/lib/theming";
import { backgroundsForPreset, PRESET_BACKGROUNDS } from "@/lib/backgrounds";
import { SuggestColorSheet } from "@/components/theme/SuggestColorSheet";
import {
  resetToday,
  resetAllProgress,
} from "@/lib/storage";
import {
  getNotificationPrefs,
  setNotificationPrefs,
  requestNotificationPermission,
  checkNotificationPermission,
  applyReminders,
  scheduleReminder,
  cancelReminder,
  isNativePlatform,
  type NotificationPrefs,
  type Reminder,
} from "@/lib/notifications";
import {
  getPrayerSettings,
  setPrayerSettings,
  lookupCity,
  resolveLocation,
  CALC_METHODS,
  SALAH_IDS,
  PRAYER_LABELS,
  type PrayerSettings,
  type AdhanSound,
} from "@/lib/prayer-times";
import { rescheduleAdhanNotifications } from "@/lib/adhan-notifications";
import { requestAppReview } from "@/lib/rate-app";
import {
  Star,
  BookOpen,
  Scale,
  Bell,
  Volume2,
  MapPin,
  Sun,
  Moon,
  Vibrate,
  Database,
  Trash2,
  Info,
  FileText,
  Mail,
  Sprout,
  Type,
  ALargeSmall,
  Check,
} from "lucide-react";

const APP_VERSION = "1.0.3";
const CONTACT_EMAIL = "msalahi536@gmail.com";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Settings, Sahih Al-Adhkar" },
      { name: "description", content: "Choose your color, reminders, and reading preferences." },
      { property: "og:title", content: "Settings, Sahih Al-Adhkar" },
      { property: "og:description", content: "Choose your color, reminders, and reading preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Settings,
});

function Settings() {
  const [presetId, setPresetIdState] = useState<string>(DEFAULT_PRESET_ID);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [display, setDisplayState] = useState(getDisplay());
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmResetAll, setConfirmResetAll] = useState(false);
  const [resetNote, setResetNote] = useState<string | null>(null);

  useEffect(() => {
    if (!resetNote) return;
    const t = setTimeout(() => setResetNote(null), 2500);
    return () => clearTimeout(t);
  }, [resetNote]);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifChecking, setNotifChecking] = useState(true);
  const [notifRequesting, setNotifRequesting] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);

  const [notifPrefs, setNotifPrefsState] = useState<NotificationPrefs>(() => getNotificationPrefs());

  const [nativeAvailable, setNativeAvailable] = useState(false);
  const [prayerSettings, setPrayerSettingsState] = useState<PrayerSettings>(() =>
    getPrayerSettings(),
  );
  const [cityInput, setCityInput] = useState("");
  const [cityOpen, setCityOpen] = useState(false);
  const [cityBusy, setCityBusy] = useState(false);
  const [cityError, setCityError] = useState<string | null>(null);

  const [locationSaved, setLocationSaved] = useState<string | null>(null);
  const updatePrayerSettings = (patch: Partial<PrayerSettings>) => {
    const next = { ...getPrayerSettings(), ...patch };
    setPrayerSettingsState(next);
    setPrayerSettings(next);
    void rescheduleAdhanNotifications(next);
  };

  useEffect(() => {
    setPresetIdState(getPresetId());
    setDisplayState(getDisplay());
    setPrayerSettingsState(getPrayerSettings());
    setNotifPrefsState(getNotificationPrefs());

    setNativeAvailable(isNativePlatform());
    let cancelled = false;
    const refresh = () => {
      checkNotificationPermission().then((v) => {
        if (!cancelled) {
          setNotifEnabled(v);
          setNotifChecking(false);
          // Re-arm reminders on the device (they can be lost after reinstall or reboot).
          if (v) void applyReminders(getNotificationPrefs());
        }
      });
    };
    refresh();
    // Safety net: never leave the UI stuck on "Checking...".
    const t = setTimeout(() => {
      if (!cancelled) setNotifChecking(false);
    }, 5000);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearTimeout(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);


  const handleEnableNotifications = async () => {
    setNotifRequesting(true);
    setNotifError(null);
    try {
      const result = await requestNotificationPermission();
      if (result.granted) {
        setNotifEnabled(true);
        await applyReminders(notifPrefs);
      } else {
        setNotifEnabled(false);
        if (result.reason === "denied") {
          setNotifError("Notification permission denied. Please enable in device settings.");
        } else if (result.reason === "unavailable") {
          setNotifError("Notifications are not available on this device.");
        } else {
          setNotifError(
            `Could not request notification permission. ${result.error ?? "Please check your device settings."}`,
          );
        }
      }
    } catch (error) {
      console.error("Notification permission error:", error);
      setNotifError("Could not request notification permission. Please check your device settings.");
    } finally {
      setNotifRequesting(false);
    }
  };

  const persistPrefs = (next: NotificationPrefs) => {
    setNotifPrefsState(next);
    setNotificationPrefs(next);
  };

  const updateReminder = async (id: number, patch: Partial<Reminder>) => {
    const next: NotificationPrefs = {
      ...notifPrefs,
      reminders: notifPrefs.reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    };
    persistPrefs(next);
    const r = next.reminders.find((x) => x.id === id);
    if (!r) return;
    if (r.enabled && notifEnabled) {
      const res = await scheduleReminder(r);
      if (!res.ok) setNotifError(`Could not schedule "${r.label}". ${res.error}`);
    } else {
      await cancelReminder(r.id);
    }
  };

  const addReminder = () => {
    const now = new Date();
    const newReminder: Reminder = {
      id: notifPrefs.nextId,
      label: "New reminder",
      hour: now.getHours(),
      minute: 0,
      enabled: true,
    };
    const next: NotificationPrefs = {
      reminders: [...notifPrefs.reminders, newReminder],
      nextId: notifPrefs.nextId + 1,
    };
    persistPrefs(next);
    if (notifEnabled) {
      void scheduleReminder(newReminder);
    }
  };


  const removeReminder = async (id: number) => {
    await cancelReminder(id);
    const next: NotificationPrefs = {
      ...notifPrefs,
      reminders: notifPrefs.reminders.filter((r) => r.id !== id),
    };
    persistPrefs(next);
  };

  const parseTime = (v: string): { hour: number; minute: number } => {
    const [h, m] = v.split(":").map((n) => parseInt(n, 10));
    return {
      hour: Number.isFinite(h) ? Math.max(0, Math.min(23, h)) : 0,
      minute: Number.isFinite(m) ? Math.max(0, Math.min(59, m)) : 0,
    };
  };

  const formatTime = (hour: number, minute: number) =>
    `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  const choosePreset = (p: { id: string; seed: string }) => {
    setPresetIdState(p.id);
    setPresetId(p.id);
    setSeed(p.seed);
    setCustomTriplet({});
    window.dispatchEvent(new Event("adhkar:theme-change"));
  };


  const doReset = () => {
    resetTheme();
    setPresetIdState(DEFAULT_PRESET_ID);
    window.dispatchEvent(new Event("adhkar:theme-change"));
  };

  const updateDisplay = (patch: Partial<typeof display>) => {
    const d = { ...display, ...patch };
    setDisplayState(d);
    setDisplay(d);
    window.dispatchEvent(new Event("adhkar:display-update"));
  };

  return (
    <>
      <header
        className="page-header relative overflow-hidden"
        style={{ background: "var(--background)", color: "var(--foreground)" }}
      >
        <HeaderBackButton />
        <div
          className="relative mx-auto max-w-md px-16 pb-6 pt-9 text-center"
          style={{ paddingLeft: 60, paddingRight: 60 }}
        >
          <div className="label-caps">Preferences</div>
          <h1 className="app-page-title mt-2">Settings</h1>
        </div>
      </header>

      <main className="scroll-area settings-scroll-area">
        <div className="mx-auto max-w-md px-5 py-3">
          {/* APPEARANCE */}
          <section className="mb-6">
            <h2 className="label-caps mb-3 text-center">Appearance</h2>

            {/* Preview */}
            <div className="mb-4 flex justify-center">
              <div className="flex items-end gap-3">
                {(["morning", "evening"] as const).map((k) => (
                  <div key={k} className="flex flex-col items-center gap-1.5">
                    <div
                      style={{
                        width: 116,
                        height: 236,
                        borderRadius: 22,
                        padding: 4,
                        background: "linear-gradient(180deg,#2a2a2c 0%,#141416 100%)",
                        boxShadow: "0 14px 30px -18px rgba(0,0,0,0.5)",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: 18,
                          backgroundImage: `url(${backgroundsForPreset(presetId)[k]})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center top",
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold opacity-70">
                      {k === "morning" ? "Morning" : "Evening"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="settings-group mb-3 p-4">
              <div className="settings-row-title">Theme</div>
              <div className="settings-row-desc mb-3">
                Choose a theme that matches your preference.
              </div>
              <div className="settings-theme-grid grid grid-cols-4 gap-2">
                {PRESETS.map((p) => {
                  const active = presetId === p.id;
                  const morningSeed = sectionSeedFor(p.id, p.seed, "morning");
                  const eveningSeed = sectionSeedFor(p.id, p.seed, "evening");
                  const art = PRESET_BACKGROUNDS[p.id];
                  return (
                    <button
                      key={p.id}
                      onClick={() => choosePreset(p)}
                      className="settings-theme-option flex flex-col items-center gap-1 rounded-2xl p-2 transition"
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                      }}
                      aria-label={p.name}
                    >
                      <div
                        style={{
                          position: "relative",
                          width: "100%",
                          height: 40,
                          borderRadius: 10,
                          overflow: "hidden",
                          display: "flex",
                          background: `linear-gradient(135deg, ${morningSeed} 0%, ${eveningSeed} 100%)`,
                        }}
                      >
                        {art && (
                          <>
                            <div
                              style={{
                                flex: 1,
                                backgroundImage: `url(${art.morning})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center top",
                              }}
                            />
                            <div
                              style={{
                                flex: 1,
                                backgroundImage: `url(${art.evening})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center top",
                              }}
                            />
                          </>
                        )}
                        {active && (
                          <div
                            className="settings-theme-check"
                            style={{
                              position: "absolute",
                              top: 3,
                              right: 3,
                              width: 16,
                              height: 16,
                              borderRadius: "50%",
                              background: "var(--accent)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                            }}
                          >
                            <Check
                              size={11}
                              strokeWidth={3.5}
                              style={{ color: "var(--accent-foreground)" }}
                            />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-semibold">{p.name}</span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setSuggestOpen(true)}
                className="settings-suggest-row"
              >
                <span className="settings-suggest-plus">+</span>
                <span>Suggest a theme</span>
              </button>
              <button
                onClick={doReset}
                className="settings-reset-theme mt-2 w-full rounded-full py-2.5 text-xs font-semibold"
                style={{
                  background: "var(--muted)",
                  color: "var(--foreground)",
                }}
              >
                Reset theme to default
              </button>
            </div>

            <div className="settings-group">
              <Toggle
                icon={<Type size={17} strokeWidth={1.8} />}
                label="Show transliteration"
                description="Show Arabic transliteration below dhikrs."
                value={display.showTransliteration}
                onChange={(v) => updateDisplay({ showTransliteration: v })}
              />
              <Toggle
                icon={<ALargeSmall size={17} strokeWidth={1.8} />}
                label="Large Arabic text"
                description="Increase Arabic text size."
                value={display.arabicLarge}
                onChange={(v) => updateDisplay({ arabicLarge: v })}
              />
            </div>
          </section>

          <SuggestColorSheet open={suggestOpen} onClose={() => setSuggestOpen(false)} />

          {/* PRAYER TIMES */}
          <section className="mb-6">
            <h2 className="label-caps mb-3">Prayer Times</h2>
            <div className="settings-group">
              <div className="settings-row">
                <span className="settings-icon">
                  <BookOpen size={17} strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="settings-row-title">Calculation method</div>
                  <div className="settings-row-desc">
                    Select the method used for prayer times.
                  </div>
                  <select
                    value={prayerSettings.method}
                    onChange={(e) => updatePrayerSettings({ method: parseInt(e.target.value, 10) })}
                    className="settings-select"
                  >
                    {CALC_METHODS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Toggle
                icon={<Scale size={17} strokeWidth={1.8} />}
                label="Hanafi Asr"
                description="Calculate Asr time at double shadow length."
                value={prayerSettings.hanafi}
                onChange={(v) => updatePrayerSettings({ hanafi: v })}
              />

              {!nativeAvailable ? (
                <div className="settings-row">
                  <span className="settings-icon">
                    <Bell size={17} strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="settings-row-title">Adhan notifications</div>
                    <div className="settings-row-desc">
                      Adhan notifications are available in the mobile app.
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <Toggle
                    icon={<Bell size={17} strokeWidth={1.8} />}
                    label="Adhan notifications"
                    description="Get notified for each prayer time."
                    value={prayerSettings.adhanEnabled}
                    onChange={(v) => {
                      void (async () => {
                        if (v && !notifEnabled) {
                          const res = await requestNotificationPermission();
                          setNotifEnabled(res.granted);
                          if (!res.granted) {
                            setNotifError(
                              res.granted === false && res.error
                                ? res.error
                                : "Could not request notification permission.",
                            );
                            return;
                          }
                        }
                        updatePrayerSettings({ adhanEnabled: v });
                      })();
                    }}
                  />

                  {prayerSettings.adhanEnabled && (
                    <div className="settings-subrows">
                      {SALAH_IDS.map((id) => (
                        <Toggle
                          key={id}
                          label={PRAYER_LABELS[id]}
                          value={prayerSettings.perPrayer[id]}
                          onChange={(v) =>
                            updatePrayerSettings({
                              perPrayer: { ...prayerSettings.perPrayer, [id]: v },
                            })
                          }
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              <div className="settings-row">
                <span className="settings-icon">
                  <Volume2 size={17} strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="settings-row-title">Notification sound</div>
                  <div className="settings-row-desc mb-2">
                    Choose how you want to be notified.
                  </div>
                  <div className="grid grid-cols-3 gap-1 rounded-full p-1" style={{ background: "var(--muted)" }}>
                    {(
                      [
                        { id: "adhan", label: "Adhan" },
                        { id: "takbir", label: "Takbir only" },
                        { id: "silent", label: "Silent" },
                      ] as { id: AdhanSound; label: string }[]
                    ).map((o) => {
                      const active = prayerSettings.sound === o.id;
                      return (
                        <button
                          key={o.id}
                          onClick={() => updatePrayerSettings({ sound: o.id })}
                          className="rounded-full px-2 py-2 text-[11px] font-semibold transition"
                          style={{
                            background: active ? "var(--accent)" : "transparent",
                            color: active ? "var(--accent-foreground)" : "var(--foreground)",
                            boxShadow: active ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                          }}
                        >
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="settings-row">
                <span className="settings-icon">
                  <MapPin size={17} strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="settings-row-title">Location</div>
                      <div className="settings-row-desc truncate">
                        {prayerSettings.location ? prayerSettings.location.label : "Not set"}
                      </div>
                    </div>
                    <button
                      onClick={() => setCityOpen((v) => !v)}
                      className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold"
                      style={{ background: "var(--muted)", color: "var(--foreground)" }}
                    >
                      Change
                    </button>
                  </div>
                  {locationSaved && !cityOpen && (
                    <div
                      className="mt-2 rounded-xl px-3 py-2 text-xs font-semibold"
                      style={{
                        background: "color-mix(in oklab, var(--accent) 14%, transparent)",
                        color: "var(--foreground)",
                      }}
                    >
                      {locationSaved}
                    </div>
                  )}
                  {cityOpen && (
                    <div className="mt-3 space-y-2">
                      <div className="flex gap-2">
                        <input
                          value={cityInput}
                          onChange={(e) => setCityInput(e.target.value)}
                          placeholder="City, country"
                          className="min-w-0 flex-1 rounded-full px-3 py-2 outline-none"
                          style={{
                            fontSize: 16,
                            background: "var(--background)",
                            color: "var(--foreground)",
                            border: "1px solid var(--border)",
                          }}
                        />
                        <button
                          onClick={async () => {
                            setCityBusy(true);
                            setCityError(null);
                            const loc = await lookupCity(cityInput);
                            setCityBusy(false);
                            if (!loc) {
                              setCityError("We could not find that place. Try a city and country.");
                              return;
                            }
                            updatePrayerSettings({ location: loc });
                            setCityInput("");
                            setCityOpen(false);
                            setLocationSaved(`Location saved: ${loc.label}`);
                          }}
                          disabled={cityBusy}
                          className="shrink-0 rounded-full px-4 text-sm font-bold"
                          style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                        >
                          {cityBusy ? "..." : "Set"}
                        </button>
                      </div>
                      <button
                        onClick={async () => {
                          setCityBusy(true);
                          setCityError(null);
                          const loc = await resolveLocation(true);
                          setCityBusy(false);
                          if (!loc) {
                            setCityError("We could not get your location. Type a city instead.");
                            return;
                          }
                          updatePrayerSettings({ location: loc });
                          setCityOpen(false);
                          setLocationSaved(`Location saved: ${loc.label}`);
                        }}
                        className="w-full rounded-full py-2 text-xs font-semibold"
                        style={{ background: "var(--muted)", color: "var(--foreground)" }}
                      >
                        Use my current location
                      </button>
                      {cityError && <div className="text-[11px] opacity-70">{cityError}</div>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* REMINDERS */}
          <section className="mb-6">
            <h2 className="label-caps mb-3">Reminders</h2>
            <div className="settings-group">
              {!nativeAvailable ? (
                <div className="settings-row">
                  <span className="settings-icon">
                    <Bell size={17} strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="settings-row-title">Daily Adhkar Reminders</div>
                    <div className="settings-row-desc">
                      Reminders are unavailable on the web. Install the mobile app to
                      get local device notifications at your chosen times.
                    </div>
                  </div>
                </div>
              ) : notifChecking ? (
                <div className="settings-row">
                  <span className="settings-icon">
                    <Bell size={17} strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1 py-1 text-xs opacity-60">
                    Checking notification permission...
                  </div>
                </div>
              ) : !notifEnabled ? (
                <div className="settings-row">
                  <span className="settings-icon">
                    <Bell size={17} strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="settings-row-title">Daily Adhkar Reminders</div>
                    <div className="settings-row-desc">
                      Get local notifications on your device at times you choose. No internet needed.
                    </div>
                    <button
                      onClick={handleEnableNotifications}
                      disabled={notifRequesting}
                      className="mt-3 w-full rounded-full py-2 text-sm font-semibold disabled:opacity-70"
                      style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                    >
                      {notifRequesting ? "Requesting..." : "Enable Reminders"}
                    </button>
                    {notifError && (
                      <div
                        className="mt-2 rounded-lg px-3 py-2 text-xs"
                        style={{
                          background: "rgba(220, 38, 38, 0.1)",
                          color: "#b91c1c",
                          border: "1px solid rgba(220, 38, 38, 0.3)",
                        }}
                      >
                        {notifError}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="settings-row">
                    <span className="settings-icon">
                      <Bell size={17} strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="settings-row-title">Daily Adhkar Reminders</div>
                      <div className="settings-row-desc">
                        Get reminded to read your morning and evening adhkar.
                      </div>
                    </div>
                  </div>
                  {notifPrefs.reminders.length === 0 && (
                    <div className="settings-row">
                      <div className="text-xs opacity-70">
                        No reminders yet. Add one below to get a daily notification at your chosen time.
                      </div>
                    </div>
                  )}
                  {notifPrefs.reminders.map((r, i) => (
                    <div key={r.id} className="settings-row">
                      <span className="settings-icon">
                        {i % 2 === 0 ? (
                          <Sun size={17} strokeWidth={1.8} />
                        ) : (
                          <Moon size={17} strokeWidth={1.8} />
                        )}
                      </span>
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <input
                          type="text"
                          value={r.label}
                          onChange={(e) => void updateReminder(r.id, { label: e.target.value })}
                          placeholder="Reminder"
                          className="min-w-0 flex-1 rounded-md bg-transparent font-semibold outline-none"
                          style={{
                            color: "var(--foreground)",
                            opacity: r.enabled ? 1 : 0.6,
                            fontSize: 16,
                          }}
                        />
                        <input
                          type="time"
                          value={formatTime(r.hour, r.minute)}
                          onChange={(e) => {
                            const { hour, minute } = parseTime(e.target.value);
                            void updateReminder(r.id, { hour, minute });
                          }}
                          disabled={!r.enabled}
                          className="shrink-0 rounded-md px-2 py-1 font-semibold outline-none"
                          style={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            color: "var(--foreground)",
                            opacity: r.enabled ? 1 : 0.5,
                            fontSize: 16,
                          }}
                        />
                        <button
                          onClick={() => void updateReminder(r.id, { enabled: !r.enabled })}
                          className="settings-switch"
                          style={{
                            background: r.enabled
                              ? "var(--accent)"
                              : "color-mix(in oklab, var(--foreground) 20%, transparent)",
                          }}
                          aria-label={`Toggle ${r.label}`}
                        >
                          <span
                            className="settings-switch-knob"
                            style={{ left: r.enabled ? 22 : 2 }}
                          />
                        </button>
                        <button
                          onClick={() => void removeReminder(r.id)}
                          className="shrink-0 rounded-full text-lg leading-none opacity-50 hover:opacity-100"
                          style={{ color: "var(--foreground)", padding: "2px 6px" }}
                          aria-label={`Remove ${r.label}`}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="settings-row">
                    <button
                      onClick={addReminder}
                      className="w-full rounded-full py-2 text-sm font-semibold"
                      style={{
                        background: "var(--background)",
                        border: "1px dashed var(--border)",
                        color: "var(--foreground)",
                      }}
                    >
                      + Add reminder
                    </button>
                  </div>
                  <div className="settings-row">
                    <div className="text-[11px] opacity-60">
                      Reminders fire on your device using your local time. Set as many as you like at any times that suit your schedule.
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* FEEDBACK */}
          <section className="mb-6">
            <h2 className="label-caps mb-3">Feedback</h2>
            <div className="settings-group">
              <Toggle
                icon={<Vibrate size={17} strokeWidth={1.8} />}
                label="Vibration on tap"
                description="Vibrate when tapping counters and the tasbih."
                value={display.haptics}
                onChange={(v) => updateDisplay({ haptics: v })}
              />
            </div>
          </section>

          {/* DATA */}
          <section className="mb-6">
            <h2 className="label-caps mb-3">Data</h2>
            {resetNote && (
              <div
                className="mb-3 rounded-2xl px-4 py-3 text-sm font-medium"
                style={{
                  background: "color-mix(in oklab, var(--accent) 16%, var(--surface))",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              >
                {resetNote}
              </div>
            )}
            <div className="settings-group mb-3">
              {confirmReset ? (
                <div className="settings-row">
                  <div className="min-w-0 flex-1">
                    <p className="mb-3 text-sm">Reset all counts for today?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          resetToday();
                          setConfirmReset(false);
                          window.dispatchEvent(new Event("adhkar:streak-update"));
                          setResetNote("Today's progress has been reset.");
                        }}
                        className="flex-1 rounded-full py-2 text-sm font-semibold"
                        style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                      >
                        Yes, reset
                      </button>
                      <button
                        onClick={() => setConfirmReset(false)}
                        className="flex-1 rounded-full py-2 text-sm font-semibold"
                        style={{ background: "var(--muted)", color: "var(--foreground)" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmReset(true)}
                  className="settings-row w-full text-left"
                >
                  <span className="settings-icon">
                    <Database size={17} strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="settings-row-title">Reset today's progress</div>
                    <div className="settings-row-desc">
                      Clear today's dhikr, tasbih and checklist progress.
                    </div>
                  </div>
                </button>
              )}
            </div>

            {confirmResetAll ? (
              <div
                className="rounded-[24px] p-4"
                style={{
                  background: "rgba(220, 38, 38, 0.08)",
                  border: "1px solid rgba(220, 38, 38, 0.3)",
                }}
              >
                <p className="mb-1 text-sm font-semibold" style={{ color: "#b91c1c" }}>
                  Reset ALL progress?
                </p>
                <p className="mb-3 text-xs" style={{ color: "#b91c1c" }}>
                  This wipes every day's counts, your streak, and lifetime
                  totals. This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      resetAllProgress();
                      setConfirmResetAll(false);
                      setResetNote("All progress has been reset.");
                    }}
                    className="flex-1 rounded-full py-2 text-sm font-semibold text-white"
                    style={{ background: "#dc2626" }}
                  >
                    Yes, reset everything
                  </button>
                  <button
                    onClick={() => setConfirmResetAll(false)}
                    className="flex-1 rounded-full py-2 text-sm font-semibold"
                    style={{ background: "var(--muted)", color: "var(--foreground)" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="settings-group settings-danger">
                <button
                  onClick={() => setConfirmResetAll(true)}
                  className="settings-row w-full text-left"
                >
                  <span className="settings-icon settings-icon-danger">
                    <Trash2 size={17} strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="settings-row-title" style={{ color: "#b91c1c" }}>
                      Reset all progress
                    </div>
                    <div className="settings-row-desc" style={{ color: "#b91c1c", opacity: 0.8 }}>
                      This will clear all your data, including history.
                    </div>
                  </div>
                </button>
              </div>
            )}
          </section>

          {/* ABOUT */}
          <section className="mb-6">
            <h2 className="label-caps mb-3">About</h2>
            <div className="settings-group">
              <button
                type="button"
                onClick={() => void requestAppReview()}
                className="settings-row w-full text-left"
              >
                <span className="settings-icon">
                  <Star size={17} strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="settings-row-title">Rate This App</div>
                  <div className="settings-row-desc">
                    If you find this app beneficial, please consider leaving a review.
                  </div>
                </div>
                <span className="settings-chevron">›</span>
              </button>
              <div className="settings-row">
                <span className="settings-icon">
                  <Info size={17} strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="settings-row-title">Version</div>
                </div>
                <span className="text-sm opacity-70">{APP_VERSION}</span>
              </div>
              <Link to="/app/privacy" className="settings-row">
                <span className="settings-icon">
                  <FileText size={17} strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="settings-row-title">Privacy Policy</div>
                </div>
                <span className="settings-chevron">›</span>
              </Link>
              <Link to="/app/terms" className="settings-row">
                <span className="settings-icon">
                  <FileText size={17} strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="settings-row-title">Terms of Service</div>
                </div>
                <span className="settings-chevron">›</span>
              </Link>
            </div>
          </section>

          {/* SUPPORT */}
          <section className="mb-6">
            <h2 className="label-caps mb-3">Support</h2>
            <div className="settings-group">
              <div className="settings-row">
                <span className="settings-icon">
                  <Mail size={17} strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="settings-row-title">Contact &amp; Feedback</div>
                  <div className="settings-row-desc">
                    Found a mistake in an adhkar? Have an idea for a feature? I'd love to hear from you.
                  </div>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="settings-contact-button"
                  >
                    <Mail size={14} strokeWidth={2} />
                    <span>{CONTACT_EMAIL}</span>
                  </a>
                  <div className="mt-2 text-center text-[11px] opacity-60">
                    Mohammad Salahi
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ABOUT THE PROJECT */}
          <section className="mb-6">
            <h2 className="label-caps mb-3">About the Project</h2>
            <div className="settings-group">
              <div className="settings-row items-start">
                <span className="settings-icon">
                  <Sprout size={17} strokeWidth={1.8} />
                </span>
                <p className="min-w-0 flex-1 text-[13px] leading-relaxed opacity-80">
                  Sahih Al-Adhkar is a simple, offline friendly companion for the
                  daily remembrance of Allah. Every dhikr and du'a in this app is
                  taken from authentic narrations, with the source listed on each
                  card so you can verify it yourself.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

function Toggle({
  icon,
  label,
  description,
  value,
  onChange,
}: {
  icon?: ReactNode;
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="settings-row w-full text-left"
    >
      {icon && <span className="settings-icon">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="settings-row-title block">{label}</span>
        {description && <span className="settings-row-desc block">{description}</span>}
      </span>
      <span
        className="settings-switch"
        style={{
          background: value
            ? "var(--accent)"
            : "color-mix(in oklab, var(--foreground) 20%, transparent)",
        }}
      >
        <span
          className="settings-switch-knob"
          style={{ left: value ? 22 : 2 }}
        />
      </span>
    </button>
  );
}
