// Quran tab shortcut into today's Hifz session. Reads the local log only after mount (device storage).
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { derive, loadHifz } from "@/lib/hifz/store";
import { localDay } from "@/lib/hifz/scheduler";
import { buildQueue } from "@/lib/hifz/session";

export function HifzDueCard() {
  const [due, setDue] = useState<number | null>(null);
  useEffect(() => {
    const read = () => {
      const st = loadHifz();
      if (!st.events.length && !st.plan) return setDue(null);
      const q = buildQueue(derive(st.events), localDay(new Date()), st.plan?.goal, st.plan?.paceLines ?? 5);
      setDue(q.manzil.length + q.sabqi.length + (q.sabaq.length ? 1 : 0));
    };
    read();
    window.addEventListener("hifz:changed", read);
    return () => window.removeEventListener("hifz:changed", read);
  }, []);
  if (due === null) return null;
  return (
    <Link to="/app/hifz/today" className="quran-card flex min-h-14 items-center justify-between gap-3 px-4 py-3" style={{ color: "var(--foreground)" }}>
      <span>
        <span className="block text-sm font-semibold">Hifz: {due} due today</span>
        <span className="block text-xs" style={{ color: "var(--muted-foreground)" }}>Manzil, sabqi and new lines</span>
      </span>
      <span aria-hidden>→</span>
    </Link>
  );
}
