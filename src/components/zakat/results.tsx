import { useMemo, useState } from "react";
import { toast } from "sonner";
import { calculateZakat, type Result } from "@/lib/zakat/calculate";
import { COMPARE_IDS, getRules } from "@/lib/zakat/rules";
import { currentPrices, hijriOf, money, nisabGrams, settingsFor, uid, type ZakatState } from "@/lib/zakat/store";
import { rescheduleZakatReminders } from "@/lib/zakat/reminders";
import { quickInput } from "./calculator";
import { WhySheet } from "./evidence";
import { Card, GhostButton, Label, MoneyField, Muted, PrimaryButton, Sheet } from "./ui";

type Update = (fn: (s: ZakatState) => ZakatState) => void;

export const DISCLAIMER = "This calculator follows the documented positions of each school. For your specific situation, ask a qualified scholar you trust.";

export function useResult(s: ZakatState) {
  return useMemo(() => {
    const input = s.mode === "quick" ? quickInput(s.input) : s.input;
    const prices = currentPrices(s);
    const settings = settingsFor(s);
    return { input, prices, settings, result: calculateZakat(input, getRules(s.madhab, s.custom), prices, settings) };
  }, [s]);
}

async function shareSummary(s: ZakatState, r: Result) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d")!;
  const css = getComputedStyle(document.documentElement);
  ctx.fillStyle = css.getPropertyValue("--background").trim() || "#fff";
  ctx.fillRect(0, 0, 1080, 1080);
  ctx.fillStyle = css.getPropertyValue("--foreground").trim() || "#000";
  ctx.textAlign = "center";
  ctx.font = "600 44px system-ui";
  ctx.fillText("Zakat summary", 540, 220);
  ctx.font = "800 120px system-ui";
  ctx.fillText(money(r.zakatCents, s.currency), 540, 420);
  ctx.font = "400 40px system-ui";
  ctx.fillText(`2.5% of ${money(r.zakatableCents, s.currency)} zakatable wealth`, 540, 510);
  ctx.fillText(`View: ${getRules(s.madhab, s.custom).name}`, 540, 600);
  const h = hijriOf(new Date());
  ctx.fillText(`Calculated ${new Date().toLocaleDateString()} (${h.year} AH)`, 540, 670);
  ctx.font = "400 30px system-ui";
  ctx.fillText("Sahih Al-Adhkar", 540, 960);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
  if (!blob) return;
  const file = new File([blob], "zakat-summary.png", { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: "Zakat summary" }).catch(() => {});
  } else {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "zakat-summary.png";
    a.click();
  }
}

export function Results({ s, update }: { s: ZakatState; update: Update }) {
  const { input, prices, settings, result: r } = useResult(s);
  const [why, setWhy] = useState<string | null>(null);
  const [compare, setCompare] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payAmt, setPayAmt] = useState(0);
  const [payNote, setPayNote] = useState("");
  const c = s.currency;
  const g = nisabGrams(s);
  const rateLabel = s.calendar === "gregorian" ? "2.577%" : "2.5%";

  const comparisons = useMemo(
    () => COMPARE_IDS.map((id) => ({ id, name: getRules(id).name, r: calculateZakat(input, getRules(id), prices, settings) })),
    [input, prices, settings],
  );
  const differs = new Set(comparisons.map((x) => x.r.zakatCents)).size > 1;

  if (!prices.goldPerGram) {
    return <Card><Muted>Waiting for live gold and silver prices. You can enter your own prices in the Tools tab.</Muted></Card>;
  }

  return (
    <div className="space-y-3">
      <Card className="text-center">
        {r.status === "due" && (
          <>
            <Label>Your zakat</Label>
            <div className="mt-1 text-4xl font-extrabold">{money(r.zakatCents, c)}</div>
            <Muted className="mt-1">{rateLabel} of {money(r.zakatableCents, c)} zakatable wealth</Muted>
            <Muted className="mt-1">Pay in gold: {r.payInGoldGrams.toFixed(2)} g of 24k gold</Muted>
            {r.advancedCents > 0 && <Muted className="mt-1">Includes {money(r.advancedCents, c)} paid in advance.</Muted>}
          </>
        )}
        {r.status === "below_nisab" && (
          <>
            <div className="text-lg font-bold">Your wealth is below nisab, so zakat is not due this year.</div>
            <Muted className="mt-1">You are {money(r.shortfallCents, c)} below the nisab of {money(r.nisabCents, c)}.</Muted>
          </>
        )}
        {r.status === "not_due_child" && <div className="text-lg font-bold">In the Hanafi school, zakat is not due on a child's wealth.</div>}
        {r.status === "hawl_restarted" && (
          <>
            <div className="text-lg font-bold">Your zakat year restarted, so zakat is not due today.</div>
            <Muted className="mt-1">Your new zakat date is one Hijri year after the day your wealth went back above nisab{input.backAboveDate ? ` (${input.backAboveDate})` : ""}.</Muted>
          </>
        )}
        <Muted className="mt-2">Nisab: {money(r.nisabCents, c)} by {r.nisabBasisUsed} · {g.label}</Muted>
      </Card>

      <Card className="space-y-1">
        <Label>Breakdown</Label>
        {r.lines.filter((l) => l.included || l.excluded).map((l) => (
          <div key={l.key} className="flex min-h-[40px] items-center justify-between gap-2 border-b py-1.5 last:border-0" style={{ borderColor: "var(--border)" }}>
            <span className="text-[13px]">{l.label}</span>
            <span className="flex items-center gap-2">
              <span className={`text-[13px] font-semibold ${l.included < 0 ? "text-destructive" : ""}`}>
                {l.included === 0 && l.excluded ? `Excluded ${money(l.excluded, c)}` : money(l.included, c)}
              </span>
              {l.whyKey && (
                <button type="button" onClick={() => setWhy(l.whyKey!)} className="min-h-[32px] rounded-full px-2.5 text-[11px] font-semibold" style={{ background: "color-mix(in oklab, var(--accent) 14%, transparent)", color: "var(--accent)" }}>
                  Why?
                </button>
              )}
            </span>
          </div>
        ))}
        {r.notes.map((n) => <Muted key={n} className="pt-1">{n}</Muted>)}
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <GhostButton onClick={() => {
          update((x) => ({ ...x, history: [{ id: uid(), date: new Date().toISOString(), hijriYear: hijriOf(new Date()).year, madhab: x.madhab, zakatCents: r.zakatCents, currency: c, input }, ...x.history] }));
          toast.success("Calculation saved on this device");
        }}>Save this calculation</GhostButton>
        <GhostButton onClick={() => { setPayAmt(r.zakatCents); setPayOpen(true); }}>Record a payment</GhostButton>
        <GhostButton onClick={async () => {
          if (!s.zakatDate) return toast("Set your zakat date in settings first.");
          const ok = await rescheduleZakatReminders(s);
          toast(ok ? "Reminders set for your next zakat date" : "Reminders work in the phone app");
        }}>Set reminder for next year</GhostButton>
        <GhostButton onClick={() => void shareSummary(s, r)}>Share summary</GhostButton>
      </div>

      <GhostButton className="w-full" onClick={() => setCompare(!compare)}>{compare ? "Hide comparison" : "Compare schools and scholars"}</GhostButton>
      {compare && (
        <div>
          <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 md:grid md:grid-cols-3">
            {comparisons.map((x) => (
              <div key={x.id} className="min-w-[160px] snap-start rounded-2xl p-3" style={{ border: `1.5px solid ${x.id === s.madhab ? "var(--accent)" : "var(--border)"}`, background: "var(--surface, var(--card))" }}>
                <div className="text-[13px] font-bold">{x.name}</div>
                <div className={`mt-1 text-xl font-extrabold ${differs ? "" : "opacity-80"}`}>{money(x.r.zakatCents, c)}</div>
                <Muted>{x.r.status === "due" ? `On ${money(x.r.zakatableCents, c)}` : x.r.status === "below_nisab" ? "Below nisab" : x.r.status === "not_due_child" ? "Not due on a child" : "Year restarted"}</Muted>
                <div className="mt-1 space-y-0.5 text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                  <div>Jewelry worn: {getRules(x.id).womensWornJewelryZakatable ? "counts" : "exempt"}</div>
                  <div>Debts: {getRules(x.id).debtDeduction === "none" ? "not deducted" : getRules(x.id).debtDeduction === "due_before_zakat_date_only" ? "due ones only" : "deducted"}</div>
                  <div>Gold with silver: {{ value: "by value", parts: "by parts", none: "not combined" }[getRules(x.id).combineGoldSilver]}</div>
                </div>
              </div>
            ))}
          </div>
          <Muted className="mt-1">When scholars differ, follow the view you are convinced is closest to the evidence, or the scholar you trust. Paying the higher amount is the more cautious choice.</Muted>
        </div>
      )}

      <Muted className="text-center">{DISCLAIMER}</Muted>

      <WhySheet whyKey={why} madhab={s.madhab} onClose={() => setWhy(null)} />
      <Sheet open={payOpen} onClose={() => setPayOpen(false)} title="Record a payment">
        <div className="space-y-3">
          <MoneyField label="Amount" currency={c} value={payAmt} onChange={setPayAmt} />
          <label className="block">
            <span className="text-[13px] font-semibold">Note</span>
            <input className="mt-1 min-h-[48px] w-full rounded-2xl bg-transparent px-3 text-sm" style={{ border: "1px solid var(--border)" }} placeholder="Masjid, Family in need" value={payNote} onChange={(e) => setPayNote(e.target.value)} />
          </label>
          <PrimaryButton className="w-full" disabled={!payAmt} onClick={() => {
            update((x) => ({ ...x, payments: [{ id: uid(), amountCents: payAmt, date: new Date().toISOString().slice(0, 10), note: payNote, hijriYear: hijriOf(new Date()).year }, ...x.payments] }));
            setPayOpen(false);
            setPayNote("");
            toast.success("Payment recorded");
          }}>Save payment</PrimaryButton>
        </div>
      </Sheet>
    </div>
  );
}
