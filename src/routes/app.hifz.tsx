import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Suspense, useEffect, useState } from "react";
import { useHifzBeta } from "@/lib/hifz-beta";
import { loadState, saveState, type HifzState } from "@/lib/hifz";
import { PlanSetup } from "@/components/hifz/PlanSetup";
import { HifzHome } from "@/components/hifz/HifzHome";
import { HeaderBackButton } from "@/components/HeaderBackButton";
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
  const onChild = useRouterState({ select: (s) => s.location.pathname !== "/app/hifz" });
  useEffect(() => { if (checked && !enabled) void navigate({ to: "/app/more", replace: true }); }, [checked, enabled, navigate]);
  if (!enabled) return null;
  if (onChild) return <Outlet />;
  return <Suspense fallback={null}><HifzEntry /></Suspense>;
}

function HifzEntry() {
  const [state, setState] = useState<HifzState | null | undefined>(undefined);
  useEffect(() => { setState(loadState()); }, []);
  if (state === undefined) return null;
  const reload = () => setState(loadState());
  if (!state) return <><div className="hz-entry-back"><HeaderBackButton /></div><PlanSetup done={reload} /></>;
  return (
    <>
      <header className="hz-home-header">
        <HeaderBackButton />
      </header>
      <HifzHome state={state} update={(s) => { saveState(s); setState({ ...s }); }} reset={reload} />
    </>
  );
}
