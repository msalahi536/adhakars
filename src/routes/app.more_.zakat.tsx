import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Settings2 } from "lucide-react";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { useZakatState } from "@/lib/zakat/store";
import { getZakatPrices } from "@/lib/zakat/prices.functions";
import { Setup, SettingsSheet } from "@/components/zakat/setup";
import { Guided, QuickMode } from "@/components/zakat/calculator";
import { Results } from "@/components/zakat/results";
import { Tools } from "@/components/zakat/tools";
import { Learn } from "@/components/zakat/learn";
import { getRules } from "@/lib/zakat/rules";
import { Muted, PrimaryButton } from "@/components/zakat/ui";

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
        {s?.setupDone && (
          <button type="button" aria-label="Zakat settings" onClick={() => setSettingsOpen(true)} className="header-icon-button absolute z-10 flex h-9 w-9 items-center justify-center rounded-full" style={{ top: 62, left: 20, border: "1px solid color-mix(in oklab, currentColor 16%, transparent)", background: "color-mix(in oklab, var(--surface-card, var(--background)) 55%, transparent)", color: "var(--foreground)" }}>
            <Settings2 size={17} />
          </button>
        )}
        <div className="relative mx-auto max-w-md px-16 pb-6 pt-9 text-center">
          <div className="label-caps" style={{ color: "var(--header-sub)", opacity: 1 }}>More</div>
          <h1 className="app-page-title mt-2">Zakat Calculator</h1>
          {s?.setupDone && <p className="mt-2 text-xs opacity-90">{getRules(s.madhab, s.custom).name}</p>}
        </div>
      </header>

      <main className="scroll-area">
        <div className="mx-auto max-w-md space-y-3 px-4 py-3">
          {!s ? null : !s.setupDone ? (
            <Setup s={s} update={update} />
          ) : (
            <>
              <div className="grid grid-cols-3 gap-1 rounded-full p-1" role="tablist" style={{ background: "color-mix(in oklab, var(--foreground) 6%, transparent)" }}>
                {(["calculate", "tools", "learn"] as const).map((t) => (
                  <button key={t} role="tab" aria-selected={tab === t} type="button" onClick={() => setTab(t)} className="min-h-[40px] rounded-full text-[13px] font-semibold capitalize" style={{ background: tab === t ? "var(--accent)" : "transparent", color: tab === t ? "var(--accent-foreground)" : "var(--foreground)" }}>
                    {t}
                  </button>
                ))}
              </div>

              {tab === "calculate" && (
                <>
                  <div className="grid grid-cols-2 gap-1 rounded-full p-1" style={{ border: "1px solid var(--border)" }}>
                    {(["guided", "quick"] as const).map((m) => (
                      <button key={m} type="button" aria-pressed={s.mode === m} onClick={() => { update((x) => ({ ...x, mode: m })); setShowResult(false); }} className="min-h-[36px] rounded-full text-xs font-semibold capitalize" style={{ background: s.mode === m ? "color-mix(in oklab, var(--accent) 16%, transparent)" : "transparent" }}>
                        {m}
                      </button>
                    ))}
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
