import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Suspense, useEffect, useState } from "react";
import { useHifzBeta } from "@/lib/hifz-beta";
import { loadState, saveState, type HifzState } from "@/lib/hifz";
import { PlanSetup } from "@/components/hifz/PlanSetup";
import { HifzHome } from "@/components/hifz/HifzHome";
import "@/components/hifz/hifz.css";

export const Route = createFileRoute("/app/hifz")({
  head: () => ({ meta: [
    { title: "Hifz, Sahih Al-Adhkar" },
    { name: "description", content: "A personal Quran memorization program: daily review, new lines and weak-spot drills." },
    { property: "og:title", content: "Hifz, Sahih Al-Adhkar" },
    { property: "og:description", content: "Memorize the Quran with spaced review, daily sessions and gentle drills." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: HiddenHifz,
});

function HiddenHifz() {
  const { enabled, checked } = useHifzBeta();
  const navigate = useNavigate();
  useEffect(() => { if (checked && !enabled) void navigate({ to: "/app/more", replace: true }); }, [checked, enabled, navigate]);
  return enabled ? <Suspense fallback={null}><HifzEntry /></Suspense> : null;
}

function HifzEntry() {
  const [state, setState] = useState<HifzState | null | undefined>(undefined);
  useEffect(() => { setState(loadState()); }, []);
  if (state === undefined) return null;
  const reload = () => setState(loadState());
  if (!state) return <PlanSetup done={reload} />;
  return (
    <>
      <header className="page-header relative overflow-hidden" style={{ background: "var(--grad-header)", color: "var(--header-fg)" }}>
        <div className="relative mx-auto max-w-md px-16 pb-6 pt-9 text-center">
          <div className="label-caps" style={{ color: "var(--header-sub)", opacity: 1 }}>Hifz</div>
          <h1 className="app-page-title mt-2">Your memorization</h1>
          <p className="mt-2 text-xs opacity-90">Review first, then new lines. Every day a little.</p>
        </div>
      </header>
      <HifzHome state={state} update={(s) => { saveState(s); setState({ ...s }); }} reset={reload} />
    </>
  );
}
