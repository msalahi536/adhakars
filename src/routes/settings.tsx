import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { themes, getTheme, applyTheme, type ThemeId } from "@/lib/theme";
import { getStreak, resetToday } from "@/lib/storage";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — My Adhkar" }] }),
  component: Settings,
});

function Settings() {
  const [theme, setTheme] = useState<ThemeId>("warm-green");
  const [streak, setStreak] = useState({ current: 0, longest: 0, lastCompleted: null as string | null });
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    setTheme(getTheme());
    setStreak(getStreak());
    const f = () => setStreak(getStreak());
    window.addEventListener("adhkar:streak-update", f);
    return () => window.removeEventListener("adhkar:streak-update", f);
  }, []);

  const choose = (id: ThemeId) => {
    setTheme(id);
    applyTheme(id);
  };

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-32">
      <header className="mb-6">
        <div className="text-xs uppercase tracking-[0.2em] opacity-60">Preferences</div>
        <h1 className="mt-1 text-3xl font-bold">Settings</h1>
      </header>

      <section className="mb-6 rounded-[24px] p-5" style={{ background: "var(--card)", color: "var(--card-foreground)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider opacity-70">Current Streak</div>
            <div className="mt-1 text-4xl font-bold">
              {streak.current} <span className="text-2xl">🔥</span>
            </div>
            <div className="mt-2 text-xs opacity-70">Longest: {streak.longest} days</div>
          </div>
          <div className="text-right text-xs opacity-70">
            {streak.lastCompleted ? <>Last:<br />{streak.lastCompleted}</> : "Start today!"}
          </div>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold opacity-80">Theme</h2>
        <div className="grid grid-cols-2 gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => choose(t.id)}
              className="rounded-2xl p-4 text-left transition"
              style={{
                background: "var(--surface)",
                border: theme === t.id ? "2px solid var(--accent)" : "1px solid var(--border)",
              }}
            >
              <div className="mb-2 flex gap-1.5">
                {t.swatch.map((c) => (
                  <div
                    key={c}
                    className="h-7 w-7 rounded-full border"
                    style={{ background: c, borderColor: "color-mix(in oklab, currentColor 15%, transparent)" }}
                  />
                ))}
              </div>
              <div className="text-xs font-semibold">{t.name}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold opacity-80">Today's Progress</h2>
        {confirmReset ? (
          <div className="rounded-2xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <p className="text-sm mb-3">Reset all counts for today?</p>
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
