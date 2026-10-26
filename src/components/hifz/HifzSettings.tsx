// Hifz settings: daily reminder, pace, goal and re-running setup. Reads device storage only after mount.
import { useEffect, useState } from "react";
import { getHifzReminder, rescheduleHifzReminder, setHifzReminder, type HifzReminder } from "@/lib/hifz/reminder";
import { loadHifz, savePlan, type HifzPlan } from "@/lib/hifz/store";
import type { Goal } from "@/lib/hifz/layout";
import type { MChapter } from "@/lib/hifz/mushaf";

const PACES = [3, 5, 7, 10, 15, 0];
const soft = { background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" };
const on = { background: "var(--accent)", color: "var(--accent-foreground)" };
const muted = { color: "var(--muted-foreground)" };

export function goalLabel(g: Goal | undefined, chapters: MChapter[]): string {
  if (!g) return "No goal yet";
  const n = (id: number) => chapters.find((c) => c.id === id)?.name ?? `Surah ${id}`;
  if (g.type === "juz-amma") return "Juz 'Amma, from An-Nas backward";
  if (g.type === "whole") return g.direction === "forward" ? "Whole Quran, from Al-Fatihah" : "Whole Quran, from An-Nas";
  if (g.type === "surahs") return g.surahs.length <= 3 ? g.surahs.map(n).join(", ") : `${g.surahs.length} surahs`;
  return `${g.from} to ${g.to}`;
}

export function HifzSettings({ chapters, onSetup }: { chapters: MChapter[]; onSetup: () => void }) {
  const [rem, setRem] = useState<HifzReminder>({ on: false, time: "19:00" });
  const [plan, setPlan] = useState<HifzPlan | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setRem(getHifzReminder()); setPlan(loadHifz().plan); void rescheduleHifzReminder(); }, []);

  const toggle = async () => {
    setBusy(true); setMsg("");
    const next = { ...rem, on: !rem.on };
    const r = await setHifzReminder(next);
    if (r.ok) setRem(next); else setMsg(r.error ?? "Couldn't turn on reminders.");
    setBusy(false);
  };
  const setTime = async (time: string) => {
    const next = { ...rem, time };
    setRem(next);
    if (next.on) await setHifzReminder(next); else try { localStorage.setItem("hifz:reminder", JSON.stringify(next)); } catch { /* ignore */ }
  };
  const setPace = (v: number) => {
    if (!plan) return;
    const p = { ...plan, paceLines: v, updatedAt: new Date().toISOString() };
    savePlan(p); setPlan(p); void rescheduleHifzReminder();
  };

  return (
    <section className="glass-card space-y-4 p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <h2 className="label-caps">Hifz settings</h2>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span><span className="block text-sm font-semibold">Daily reminder</span><span className="block text-xs" style={muted}>"Hifz: X reviews due today". Skipped once today is done.</span></span>
          <button role="switch" aria-checked={rem.on} aria-label="Daily Hifz reminder" disabled={busy} onClick={toggle} className="relative h-8 w-14 shrink-0 rounded-full transition-colors" style={rem.on ? on : soft}>
            <span className="absolute top-1 h-6 w-6 rounded-full transition-all" style={{ left: rem.on ? 28 : 4, background: rem.on ? "var(--accent-foreground)" : "var(--muted-foreground)" }} />
          </button>
        </div>
        {rem.on && (
          <label className="flex items-center justify-between text-sm">Time
            <input type="time" value={rem.time} onChange={(e) => e.target.value && setTime(e.target.value)} className="min-h-11 rounded-xl px-3" style={soft} />
          </label>
        )}
        {msg && <p className="text-xs" style={{ color: "var(--destructive)" }}>{msg}</p>}
      </div>

      <div>
        <div className="mb-1.5 text-sm font-semibold">Daily pace</div>
        {plan ? (
          <div className="grid grid-cols-3 gap-1.5">
            {PACES.map((v) => <button key={v} onClick={() => setPace(v)} className="min-h-11 rounded-xl text-sm font-semibold" style={(plan.paceLines ?? 5) === v ? on : soft}>{v ? `${v} lines` : "Full page"}</button>)}
          </div>
        ) : <p className="text-xs" style={muted}>Set a goal first.</p>}
      </div>

      <div className="flex items-center justify-between gap-3">
        <span><span className="block text-sm font-semibold">Goal</span><span className="block text-xs" style={muted}>{goalLabel(plan?.goal, chapters)}</span></span>
        <button onClick={onSetup} className="min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold" style={soft}>Change</button>
      </div>

      <button onClick={onSetup} className="min-h-11 w-full rounded-full text-sm font-semibold" style={soft}>Re-run setup</button>
    </section>
  );
}
