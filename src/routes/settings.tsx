import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { themes, getMode, setMode, applyTheme, resolveTheme, getDisplay, setDisplay, type ThemeMode } from "@/lib/theme";
import { getStreak, resetToday } from "@/lib/storage";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — My Adhkar" }] }),
  component: Settings,
});

function Settings() {
  const [mode, setModeState] = useState<ThemeMode>("auto");
  const [streak, setStreak] = useState({ current: 0, longest: 0, lastCompleted: null as string | null });
  const [display, setDisplayState] = useState(getDisplay());
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    setModeState(getMode());
    setStreak(getStreak());
    setDisplayState(getDisplay());
  }, []);

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
      <div className="flex h-24 items-center justify-center rounded-2xl p-3" style={{ background: bg }}>
        <div
          className="flex w-full max-w-[180px] flex-col items-center gap-1 rounded-xl px-3 py-2"
          style={{ background: card, border: `1px solid ${border}`, color: text }}
        >
          <div className="text-[14px] font-bold" style={{ fontFamily: "Scheherazade New, serif" }}>ٱ</div>
          <div className="text-[9px] italic" style={{ color: translit }}>bismillah</div>
          <div className="h-1 w-6 rounded-full" style={{ background: accent }} />
        </div>
      </div>
    );
  };

  return (
    <div
      className="mx-auto max-w-md px-4"
      style={{
        paddingTop: "calc(env(safe-area-inset-top) + 16px)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 80px)",
      }}
    >
      <header className="mb-5">
        <div className="label-caps">Preferences</div>
        <h1 className="mt-1 text-3xl font-bold">Settings</h1>
      </header>

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
          <span className="opacity-90">{streak.lastCompleted ? `Last: ${streak.lastCompleted}` : "Start today"}</span>
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
      </section>

      <section className="mb-6">
        <h2 className="label-caps mb-3">Today's progress</h2>
        {confirmReset ? (
          <div className="rounded-2xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
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

      <section className="rounded-2xl p-4 text-xs opacity-70" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        Based on the authentic adhkar compiled by Shaykh Abdul Aziz At-Tarefe, compiled by Yasser Peerun.
      </section>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <span>{label}</span>
      <span
        className="relative inline-block h-6 w-11 rounded-full transition"
        style={{ background: value ? "var(--accent)" : "color-mix(in oklab, var(--foreground) 20%, transparent)" }}
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
          style={{ left: value ? 22 : 2 }}
        />
      </span>
    </button>
  );
}
