import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Calculator, GraduationCap, Settings2, Wrench } from "lucide-react";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { useZakatState } from "@/lib/zakat/store";
import { getZakatPrices } from "@/lib/zakat/prices.functions";
import { Setup, SettingsSheet } from "@/components/zakat/setup";
import { Guided, QuickMode } from "@/components/zakat/calculator";
import { Results } from "@/components/zakat/results";
import { Tools } from "@/components/zakat/tools";
import { Learn } from "@/components/zakat/learn";
import { getRules } from "@/lib/zakat/rules";
import { Muted, PrimaryButton, Segmented } from "@/components/zakat/ui";

export const Route = createFileRoute("/app/more_/zakat")({
  head: () => ({
    meta: [
      { title: "Zakat Calculator, Sahih Al-Adhkar" },
      { name: "description", content: "Calculate your zakat by the Hanafi, Maliki, Shafi'i or Hanbali school, or the views of Ibn Baz and Ibn Uthaymeen. Private, on your device." },
      { property: "og:title", content: "Zakat Calculator, Sahih Al-Adhkar" },
      { property: "og:description", content: "A private zakat calculator following the documented positions of each school, with live gold and silver prices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ZakatPage,
});

type Tab = "calculate" | "tools" | "learn";

function ZakatPage() {
  const [s, update] = useZakatState();
  const [tab, setTab] = useState<Tab>("calculate");
  const [showResult, setShowResult] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Refresh live prices when older than 6 hours; keep the last cached prices on failure.
  useEffect(() => {
    if (!s) return;
    const age = s.prices ? Date.now() - new Date(s.prices.updatedAt).getTime() : Infinity;
    if (age < 6 * 3600_000) return;
    getZakatPrices()
      .then((p) => update((x) => ({ ...x, prices: { goldUsd: p.goldUsdPerGram, silverUsd: p.silverUsdPerGram, fx: p.fx, updatedAt: p.updatedAt } })))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!s]);

  return (
    <>
      <header className="page-header relative overflow-hidden" style={{ background: "var(--grad-header)", color: "var(--header-fg)" }}>
        <HeaderBackButton />
        <div className="relative mx-auto max-w-md px-16 pb-6 pt-9 text-center">
          <div className="label-caps" style={{ color: "var(--header-sub)", opacity: 1 }}>More</div>
          <h1 className="app-page-title mt-2">Zakat Calculator</h1>
          {s?.setupDone && (
            <button type="button" aria-label="Zakat settings" onClick={() => setSettingsOpen(true)} className="mt-2 inline-flex min-h-[32px] items-center gap-1.5 rounded-full px-3 text-xs font-semibold" style={{ background: "color-mix(in oklab, var(--surface-card, var(--background)) 60%, transparent)", border: "1px solid color-mix(in oklab, currentColor 14%, transparent)" }}>
              {getRules(s.madhab, s.custom).name} <Settings2 size={13} />
            </button>
          )}
        </div>
      </header>

      <main className="scroll-area">
        <div className="mx-auto max-w-md space-y-3 px-4 py-3">
          {!s ? null : !s.setupDone ? (
            <Setup s={s} update={update} />
          ) : (
            <>
              <Segmented
                value={tab}
                onChange={setTab}
                options={[
                  { value: "calculate", label: "Calculate", icon: <Calculator size={15} /> },
                  { value: "tools", label: "Tools", icon: <Wrench size={15} /> },
                  { value: "learn", label: "Learn", icon: <GraduationCap size={15} /> },
                ]}
              />

              {tab === "calculate" && (
                <>
                  <div className="mx-auto w-[220px]">
                    <Segmented size="sm" value={s.mode} onChange={(m) => { update((x) => ({ ...x, mode: m })); setShowResult(false); }} options={[{ value: "guided", label: "Guided" }, { value: "quick", label: "Quick" }]} />
                  </div>
                  {showResult ? (
                    <>
                      <Results s={s} update={update} />
                      <PrimaryButton className="w-full" onClick={() => setShowResult(false)}>Edit my answers</PrimaryButton>
                    </>
                  ) : s.mode === "quick" ? (
                    <>
                      <QuickMode s={s} update={update} />
                      <PrimaryButton className="w-full" onClick={() => setShowResult(true)}>See my zakat</PrimaryButton>
                    </>
                  ) : (
                    <Guided s={s} update={update} onDone={() => setShowResult(true)} />
                  )}
                </>
              )}
              {tab === "tools" && <Tools s={s} update={update} onUseHistory={() => { setTab("calculate"); setShowResult(false); }} />}
              {tab === "learn" && <Learn />}
              <Muted className="pb-6 text-center">Everything you enter stays on this device.</Muted>
              <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} s={s} update={update} />
            </>
          )}
        </div>
      </main>
    </>
  );
}
