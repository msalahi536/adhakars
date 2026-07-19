import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ConcentricCirclesPattern } from "@/components/HeaderPatterns";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { getDisplay, setDisplay } from "@/lib/theme";
import {
  getModeSetting,
  setModeSetting,
  getSeed,
  setSeed,
  getPresetId,
  setPresetId,
  getOverrides,
  setSectionOverride,
  resolveMode,
  resetTheme,
  PRESETS,
  DEFAULT_SEED,
  DEFAULT_PRESET_ID,
  type ModeSetting,
} from "@/lib/theme-store";
import { deriveSectionSeed, type SectionKey } from "@/lib/theming";
import { MiniPreview } from "@/components/theme/MiniPreview";
import { ThemePicker } from "@/components/theme/ThemePicker";
import {
  resetToday,
  resetAllProgress,
  getCommitment,
  setCommitment,
  getCustomAdhkarRows,
  type CommitmentSection,
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

const APP_VERSION = "1.0.3";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings, Sahih Al-Adhkar" }] }),
  component: Settings,
});

function Settings() {
  const [mode, setModeState] = useState<ModeSetting>("auto");
  const [seed, setSeedState] = useState<string>(DEFAULT_SEED);
  const [presetId, setPresetIdState] = useState<string>(DEFAULT_PRESET_ID);
  const [overrides, setOverridesState] = useState<Partial<Record<SectionKey, string>>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [pickerOpen, setPickerOpen] = useState<null | { target: "base" | SectionKey; seed: string }>(null);
  const [display, setDisplayState] = useState(getDisplay());
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmResetAll, setConfirmResetAll] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifChecking, setNotifChecking] = useState(true);
  const [notifRequesting, setNotifRequesting] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);
  const [notifPrefs, setNotifPrefsState] = useState<NotificationPrefs>(() => getNotificationPrefs());
  const [commitment, setCommitmentState] = useState<Record<CommitmentSection, boolean>>(() => getCommitment());
  const [hasCustom, setHasCustom] = useState(false);
  const nativeAvailable = isNativePlatform();

  useEffect(() => {
    setModeState(getMode());
    setDisplayState(getDisplay());
    setNotifPrefsState(getNotificationPrefs());
    setCommitmentState(getCommitment());
    setHasCustom(getCustomAdhkarRows().length > 0);
    let cancelled = false;
    checkNotificationPermission().then((v) => {
      if (!cancelled) {
        setNotifEnabled(v);
        setNotifChecking(false);
      }
    });
    return () => {
      cancelled = true;
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
      await scheduleReminder(r);
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
    if (notifEnabled) void scheduleReminder(newReminder);
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

  const choose = (m: ThemeMode) => {
    setModeState(m);
    setMode(m);
    applyTheme(resolveTheme(m, "/app/settings"));
  };

  const updateDisplay = (patch: Partial<typeof display>) => {
    const d = { ...display, ...patch };
    setDisplayState(d);
    setDisplay(d);
    window.dispatchEvent(new Event("adhkar:display-update"));
  };

  const themePreview = (variant: "morning" | "evening") => {
    const isMorning = variant === "morning";
    const bg = isMorning ? "#faf6ec" : "#eef2f8";
    const card = isMorning ? "#fffcf4" : "#f5f8fc";
    const border = isMorning ? "rgba(184,146,58,0.25)" : "rgba(74,107,154,0.25)";
    const text = isMorning ? "#2d1f00" : "#1f3a5c";
    const accent = isMorning ? "#c9a84c" : "#4a6b9a";
    const translit = isMorning ? "#b8923a" : "#4a6b9a";
    return (
      <div
        className="flex h-24 items-center justify-center rounded-2xl p-3"
        style={{ background: bg }}
      >
        <div
          className="flex w-full max-w-[180px] flex-col items-center gap-1 rounded-xl px-3 py-2"
          style={{ background: card, border: `1px solid ${border}`, color: text }}
        >
          <div className="text-[14px] font-bold" style={{ fontFamily: "Scheherazade New, serif" }}>
            ٱ
          </div>
          <div className="text-[9px] italic" style={{ color: translit }}>
            bismillah
          </div>
          <div className="h-1 w-6 rounded-full" style={{ background: accent }} />
        </div>
      </div>
    );
  };

  return (
    <>
      <header
        className="page-header relative overflow-hidden"
        style={{ background: "var(--background)", color: "var(--foreground)" }}
      >
        <ConcentricCirclesPattern />
        <HeaderBackButton />
        <div
          className="relative mx-auto max-w-md px-4 pb-5 pt-4"
          style={{ paddingLeft: 60, paddingRight: 60 }}
        >
          <div className="label-caps">Preferences</div>
          <h1 className="mt-1 text-3xl font-bold">Settings</h1>
        </div>
      </header>

      <main className="scroll-area">
        <div className="mx-auto max-w-md px-4 py-4">
          {/* APPEARANCE */}
          <section className="mb-6">
            <h2 className="label-caps mb-3">Appearance</h2>
            <div className="space-y-3">
              {themes.map((t) => {
                const active = mode === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => choose(t.id)}
                    className="w-full overflow-hidden rounded-[24px] p-3 text-left transition"
                    style={{
                      background: "var(--surface)",
                      border: active ? "2px solid #c9a84c" : "1px solid var(--border)",
                    }}
                  >
                    {t.id === "auto" ? (
                      <div className="mb-2 grid grid-cols-2 gap-2">
                        {themePreview("morning")}
                        {themePreview("evening")}
                      </div>
                    ) : (
                      <div className="mb-2">{themePreview("morning")}</div>
                    )}
                    <div className="px-1">
                      <div className="text-sm font-semibold">{t.name}</div>
                      <div className="text-xs opacity-70">{t.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 space-y-3">
              <Toggle
                label="Show transliteration"
                value={display.showTransliteration}
                onChange={(v) => updateDisplay({ showTransliteration: v })}
              />
              <Toggle
                label="Large Arabic text"
                value={display.arabicLarge}
                onChange={(v) => updateDisplay({ arabicLarge: v })}
              />
            </div>
          </section>

          {/* MY DAILY COMMITMENT */}
          <section className="mb-6">
            <h2 className="label-caps mb-1">My Daily Commitment</h2>
            <p className="mb-3 text-xs opacity-70">
              Choose what counts as a complete day. Only what you select is tracked.
            </p>
            <div className="space-y-2">
              {(
                [
                  { id: "morning", label: "Morning Adhkar" },
                  { id: "evening", label: "Evening Adhkar" },
                  { id: "salah", label: "After Salah" },
                  { id: "sleep", label: "Sleep Adhkar" },
                  { id: "wake", label: "Wake Adhkar" },
                  ...(hasCustom ? [{ id: "custom" as CommitmentSection, label: "My Adhkar" }] : []),
                ] as { id: CommitmentSection; label: string }[]
              ).map(({ id, label }) => (
                <Toggle
                  key={id}
                  label={label}
                  value={commitment[id]}
                  onChange={(v) => {
                    const next = { ...commitment, [id]: v };
                    setCommitmentState(next);
                    setCommitment(next);
                  }}
                />
              ))}
            </div>
          </section>



          {/* REMINDERS */}
          <section className="mb-6">
            <h2 className="label-caps mb-3">Reminders</h2>
            <div
              className="rounded-[24px] p-4"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              {!nativeAvailable ? (
                <>
                  <div className="text-sm" style={{ fontWeight: 600 }}>
                    Daily Adhkar Reminders
                  </div>
                  <div className="mt-1 text-xs opacity-70">
                    Reminders are unavailable on the web. Install the mobile app to
                    get local device notifications at your chosen times.
                  </div>
                </>
              ) : notifChecking ? (
                <div className="py-2 text-xs opacity-60">Checking notification permission...</div>
              ) : !notifEnabled ? (
                <>
                  <div className="text-sm" style={{ fontWeight: 600 }}>
                    Daily Adhkar Reminders
                  </div>
                  <div className="mt-1 text-xs opacity-70">
                    Get local notifications on your device at times you choose. No internet needed.
                  </div>
                  <button
                    onClick={handleEnableNotifications}
                    disabled={notifRequesting}
                    className="mt-3 w-full rounded-full py-2 text-sm font-semibold disabled:opacity-70"
                    style={{ background: "#c9a84c", color: "#ffffff" }}
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
                </>
              ) : (
                <div className="space-y-3">
                  {notifPrefs.reminders.length === 0 && (
                    <div className="text-xs opacity-70">
                      No reminders yet. Add one below to get a daily notification at your chosen time.
                    </div>
                  )}
                  {notifPrefs.reminders.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-2 rounded-2xl px-3 py-2"
                      style={{
                        background: "var(--background)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <input
                        type="text"
                        value={r.label}
                        onChange={(e) => void updateReminder(r.id, { label: e.target.value })}
                        placeholder="Reminder"
                        className="min-w-0 flex-1 rounded-md bg-transparent text-sm font-semibold outline-none"
                        style={{ color: "var(--foreground)", opacity: r.enabled ? 1 : 0.6 }}
                      />
                      <input
                        type="time"
                        value={formatTime(r.hour, r.minute)}
                        onChange={(e) => {
                          const { hour, minute } = parseTime(e.target.value);
                          void updateReminder(r.id, { hour, minute });
                        }}
                        disabled={!r.enabled}
                        className="shrink-0 rounded-md px-2 py-1 text-sm font-semibold outline-none"
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          color: "var(--foreground)",
                          opacity: r.enabled ? 1 : 0.5,
                        }}
                      />
                      <button
                        onClick={() => void updateReminder(r.id, { enabled: !r.enabled })}
                        className="relative inline-block h-6 w-11 shrink-0 rounded-full transition"
                        style={{
                          background: r.enabled
                            ? "var(--accent)"
                            : "color-mix(in oklab, var(--foreground) 20%, transparent)",
                        }}
                        aria-label={`Toggle ${r.label}`}
                      >
                        <span
                          className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
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
                  ))}
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
                  <div className="text-[11px] opacity-60">
                    Reminders fire on your device using your local time. Set as many as you like at any times that suit your schedule.
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* FEEDBACK */}
          <section className="mb-6 space-y-3">
            <h2 className="label-caps mb-1">Feedback</h2>
            <Toggle
              label="Vibration on tap"
              description="Vibrate when tapping counters and the tasbih."
              value={display.haptics}
              onChange={(v) => updateDisplay({ haptics: v })}
            />
          </section>

          {/* DATA */}
          <section className="mb-6 space-y-3">
            <h2 className="label-caps mb-1">Data</h2>
            {confirmReset ? (
              <div
                className="rounded-2xl p-4"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <p className="mb-3 text-sm">Reset all counts for today?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      resetToday();
                      setConfirmReset(false);
                      window.location.reload();
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
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className="w-full rounded-full py-3 text-sm font-semibold"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                Reset today's progress
              </button>
            )}

            {confirmResetAll ? (
              <div
                className="rounded-2xl p-4"
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
                      window.location.reload();
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
              <button
                onClick={() => setConfirmResetAll(true)}
                className="w-full rounded-full py-3 text-sm font-semibold text-white"
                style={{ background: "#dc2626" }}
              >
                Reset all progress
              </button>
            )}
          </section>

          {/* ABOUT */}
          <section className="mb-6 space-y-3">
            <h2 className="label-caps mb-1">About</h2>
            <div
              className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <span className="font-semibold">Version</span>
              <span className="opacity-70">{APP_VERSION}</span>
            </div>
            <Link
              to="/privacy"
              className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <span>Privacy Policy</span>
              <span className="opacity-40">›</span>
            </Link>
            <Link
              to="/terms"
              className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <span>Terms of Service</span>
              <span className="opacity-40">›</span>
            </Link>
          </section>
        </div>
      </main>
    </>
  );
}

function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <span className="flex min-w-0 flex-col">
        <span>{label}</span>
        {description && (
          <span className="mt-0.5 text-xs font-normal opacity-70">{description}</span>
        )}
      </span>
      <span
        className="relative inline-block h-6 w-11 shrink-0 rounded-full transition"
        style={{
          background: value
            ? "var(--accent)"
            : "color-mix(in oklab, var(--foreground) 20%, transparent)",
        }}
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
          style={{ left: value ? 22 : 2 }}
        />
      </span>
    </button>
  );
}
