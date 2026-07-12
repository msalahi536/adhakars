import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  themes,
  getMode,
  setMode,
  applyTheme,
  resolveTheme,
  getDisplay,
  setDisplay,
  type ThemeMode,
} from "@/lib/theme";
import { getStreak, resetToday, getLifetime, type LifetimeCounts } from "@/lib/storage";
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
  type ReminderId,
} from "@/lib/notifications";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — My Adhkar" }] }),
  component: Settings,
});

function Settings() {
  const [mode, setModeState] = useState<ThemeMode>("auto");
  const [streak, setStreak] = useState({
    current: 0,
    longest: 0,
    lastCompleted: null as string | null,
  });
  const [display, setDisplayState] = useState(getDisplay());
  const [confirmReset, setConfirmReset] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [lifetime, setLifetime] = useState<LifetimeCounts>({
    total: 0,
    morning: 0,
    evening: 0,
    salah: 0,
    tasbih: 0,
  });

  useEffect(() => {
    setModeState(getMode());
    setStreak(getStreak());
    setDisplayState(getDisplay());
    setLifetime(getLifetime());
    const check = () => setNotifEnabled(getNotificationPermission());
    check();
    const id = setInterval(check, 1000);
    const onLife = () => setLifetime(getLifetime());
    window.addEventListener("adhkar:lifetime-update", onLife);
    return () => {
      clearInterval(id);
      window.removeEventListener("adhkar:lifetime-update", onLife);
    };
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotifEnabled(granted);
  };

  const choose = (m: ThemeMode) => {
    setModeState(m);
    setMode(m);
    applyTheme(resolveTheme(m, "/settings"));
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
      <header className="page-header" style={{ background: "var(--background)" }}>
        <div className="mx-auto max-w-md px-4 pb-5 pt-4">
          <div className="label-caps">Preferences</div>
          <h1 className="mt-1 text-3xl font-bold">Settings</h1>
        </div>
      </header>

      <main className="scroll-area">
        <div className="mx-auto max-w-md px-4 py-4">
          <section
            className="mb-6 overflow-hidden rounded-[24px] p-6 shadow-xl shadow-black/10"
            style={{
              background: "linear-gradient(135deg, #c9a84c, #b8923a)",
              color: "#ffffff",
            }}
          >
            <div className="label-caps" style={{ color: "rgba(255,255,255,0.85)", opacity: 1 }}>
              Current streak
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span style={{ fontSize: 48, fontWeight: 800, color: "#ffffff", lineHeight: 1 }}>
                {streak.current}
              </span>
              <span className="text-sm font-semibold opacity-90">days</span>
            </div>
            <div
              className="mt-4 flex items-center justify-between border-t pt-3 text-xs font-semibold"
              style={{ borderColor: "rgba(255,255,255,0.25)" }}
            >
              <span>Longest: {streak.longest} days</span>
              <span className="opacity-90">
                {streak.lastCompleted ? `Last: ${streak.lastCompleted}` : "Start today"}
              </span>
            </div>
          </section>

          <section
            className="mb-6 overflow-hidden rounded-[24px] p-5"
            style={{
              background: "linear-gradient(135deg, #1f3d2b 0%, #2d5a3d 100%)",
              color: "#ffffff",
            }}
          >
            <div className="label-caps" style={{ color: "rgba(255,255,255,0.85)", opacity: 1 }}>
              My Dhikr
            </div>
            <div
              className="mt-1 text-[11px] font-semibold uppercase tracking-wider"
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
          </section>



          <section className="mb-6">
            <h2 className="label-caps mb-3">Theme</h2>
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
          </section>

          <section className="mb-6">
            <h2 className="label-caps mb-3">Notifications</h2>
            <div
              className="rounded-[24px] p-4"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="text-sm" style={{ fontWeight: 600 }}>
                Daily Adhkar Reminders
              </div>
              <div className="mt-1 text-xs opacity-70">Morning at 5:00 AM, Evening at 4:30 PM</div>
              {notifEnabled ? (
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="opacity-70">Reminders enabled ✓</span>
                </div>
              ) : (
                <button
                  onClick={handleEnableNotifications}
                  className="mt-3 w-full rounded-full py-2 text-sm font-semibold"
                  style={{ background: "#c9a84c", color: "#ffffff" }}
                >
                  Enable Reminders
                </button>
              )}
            </div>
          </section>

          <section className="mb-6 space-y-3">
            <h2 className="label-caps mb-1">Display</h2>
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
            <Toggle
              label="Vibration on tap"
              description="Vibrate when tapping counters and the tasbih."
              value={display.haptics}
              onChange={(v) => updateDisplay({ haptics: v })}
            />
          </section>

          <section className="mb-6">
            <h2 className="label-caps mb-3">Today's progress</h2>
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
          </section>

          <section
            className="mb-4 rounded-2xl p-4 text-xs opacity-70"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            Based on the authentic adhkar compiled by Shaykh Abdul Aziz At-Tarefe, compiled by
            Yasser Peerun.
          </section>

          <section
            className="rounded-2xl p-4 text-xs"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="label-caps mb-1">Contact</div>
            <div className="font-semibold">Mohammad Salahi</div>
            <a
              href="mailto:msalahi536@gmail.com"
              className="mt-0.5 block font-semibold"
              style={{ color: "var(--accent)" }}
            >
              msalahi536@gmail.com
            </a>
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
