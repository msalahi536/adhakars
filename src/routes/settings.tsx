import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { themes, getMode, setMode, applyTheme, resolveTheme, getDisplay, setDisplay, type ThemeMode, type ThemeId } from "@/lib/theme";
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

  const themeOptions: { id: ThemeMode; name: string; swatch?: [string, string, string] }[] = [
    { id: "auto", name: "Auto (Dawn / Dusk)" },
    ...themes.map((t) => ({ id: t.id as ThemeMode, name: t.name, swatch: t.swatch })),
  ];

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-[calc(110px+env(safe-area-inset-bottom))]">
      <header className="mb-5">
        <div className="label-caps">Preferences</div>
        <h1 className="mt-1 text-3xl font-bold">Settings</h1>
      </header>

      <section
        className="mb-6 overflow-hidden rounded-[28px] p-6 shadow-xl shadow-black/10"
        style={{ background: "var(--grad-header)", color: "var(--accent-foreground)" }}
      >
        <div className="flex items-center gap-5">
          <div className="text-6xl leading-none">🔥</div>
          <div className="flex-1">
            <div className="label-caps">Current streak</div>
            <div className="text-5xl font-extrabold leading-none">{streak.current}</div>
            <div className="mt-1 text-xs font-semibold opacity-80">days in a row</div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs font-semibold" style={{ borderColor: "color-mix(in oklab, var(--accent-foreground) 25%, transparent)" }}>
          <span>Longest: {streak.longest} days</span>
          <span className="opacity-80">{streak.lastCompleted ? `Last: ${streak.lastCompleted}` : "Start today!"}</span>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="label-caps mb-3">Theme</h2>
        <div className="grid grid-cols-2 gap-3">
          {themeOptions.map((t) => {
            const active = mode === t.id;
            const swatch = t.swatch || ["#fbf5e2", "#0e1230", "#e0b552"];
            return (
              <button
                key={t.id}
                onClick={() => choose(t.id)}
                className="overflow-hidden rounded-2xl p-3 text-left transition"
                style={{
                  background: "var(--surface)",
                  border: active ? "2px solid var(--accent)" : "1px solid var(--border)",
                }}
              >
                <div
                  className="mb-2 flex h-14 items-center justify-center rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${swatch[0]}, ${swatch[1]})`,
                  }}
                >
                  <div
                    className="rounded-lg px-2.5 py-1 text-[10px] font-bold"
                    style={{ background: swatch[2], color: swatch[1] }}
                  >
                    Aa ٱ
                  </div>
                </div>
                <div className="text-xs font-semibold">{t.name}</div>
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

// helper to expose ThemeId import compat
export type _ = ThemeId;
