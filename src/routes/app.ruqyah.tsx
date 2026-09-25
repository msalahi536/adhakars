import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen, Check, ChevronLeft, ChevronRight, CircleAlert, Lock, Share2, ShieldCheck, Stethoscope, X,
} from "lucide-react";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { triggerHaptic } from "@/lib/theme";
import { getRuqyahChecklist, toggleRuqyahCheck } from "@/lib/ruqyah";
import type { SunnahItem } from "@/data/period-sunnah";
import {
  BUKHARI_5675, CONDITION_LIST, MUSLIM_2186, MYTHS, RAQI_FLAGS, RUQYAH_CHECKLIST, RUQYAH_DISCLAIMER,
  RUQYAH_SECTIONS, SELF_STEPS, VERSES, type RuqyahSection,
} from "@/data/ruqyah";

export const Route = createFileRoute("/app/ruqyah")({
  head: () => ({
    meta: [
      { title: "Ruqyah Companion, Sahih Al-Adhkar" },
      { name: "description", content: "Daily protection checklist, a guided self-ruqyah and verified guidance on what ruqyah is and is not." },
      { property: "og:title", content: "Ruqyah Companion, Sahih Al-Adhkar" },
      { property: "og:description", content: "Authentic ruqyah as the Prophet ﷺ transmitted it — simple, self-performed, every source verified." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RuqyahCompanion,
});

const saw = (t: string) => t.split("ﷺ").flatMap((part, i) => (i ? [<span key={i} className="period-saw"><span className="period-saw">ﷺ</span></span>, part] : [part]));

type Tab = "daily" | "ruqyah" | "verses" | "learn";
const TABS: { id: Tab; label: string }[] = [
  { id: "daily", label: "Daily" },
  { id: "ruqyah", label: "Ruqyah" },
  { id: "verses", label: "Verses" },
  { id: "learn", label: "Learn" },
];

function RuqyahCompanion() {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("daily");
  useEffect(() => setMounted(true), []);
  return (
    <>
      <header className="page-header period-header relative overflow-hidden" style={{ background: "var(--grad-header)", color: "var(--header-fg)" }}>
        <HeaderBackButton />
        <div className="relative mx-auto max-w-md px-16 pb-4 pt-7 text-center">
          <div className="label-caps" style={{ color: "var(--header-sub)", opacity: 1 }}>Ruqyah Companion</div>
          <h1 className="app-page-title mt-2">Protected</h1>
        </div>
        <div className="period-tabs mx-auto max-w-md" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? "is-active" : ""}
              onClick={() => { setTab(t.id); void triggerHaptic("light"); document.querySelector(".period-scroll-area")?.scrollTo({ top: 0 }); }}>
              {t.label}
            </button>
          ))}
        </div>
      </header>
      <main className="scroll-area period-scroll-area">
        <div className="mx-auto max-w-md space-y-4 px-5 pb-8 pt-4">
          {mounted && tab === "daily" && <DailyView />}
          {mounted && tab === "ruqyah" && <RuqyahView />}
          {mounted && tab === "verses" && <VersesView />}
          {mounted && tab === "learn" && <LearnView />}
          <div className="period-callout is-grey flex gap-2">
            <Stethoscope size={16} className="mt-0.5 flex-none" />
            <span>{saw(RUQYAH_DISCLAIMER)}</span>
          </div>
          <p className="period-muted flex items-center justify-center gap-1 pt-1 text-[11px]"><Lock size={11} /> Private — stored only on your device</p>
        </div>
      </main>
    </>
  );
}

// ================= DAILY =================

function DailyView() {
  const [done, setDone] = useState<Set<string>>(() => new Set(getRuqyahChecklist()));
  useEffect(() => {
    const r = () => setDone(new Set(getRuqyahChecklist()));
    window.addEventListener("adhkar:ruqyah-update", r);
    return () => window.removeEventListener("adhkar:ruqyah-update", r);
  }, []);
  const total = RUQYAH_CHECKLIST.reduce((n, g) => n + g.items.length, 0);
  const count = RUQYAH_CHECKLIST.reduce((n, g) => n + g.items.filter((i) => done.has(i.id)).length, 0);
  return (
    <>
      <div className="period-banner">
        <ShieldCheck size={18} />
        <span>Protection is a daily practice, not a crisis response. Here’s what the Prophet <span className="period-saw">ﷺ</span> did every day.</span>
      </div>
      <div className="period-card">
        <div className="flex items-center justify-between">
          <div className="period-eyebrow">Daily Protection</div>
          <span className="period-muted text-xs font-semibold">{count} of {total} done today</span>
        </div>
        <div className="adhkar-progress-track mt-3 h-1.5 overflow-hidden rounded-full" style={{ background: "color-mix(in oklab, var(--foreground) 8%, transparent)" }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(count / total) * 100}%`, background: "var(--accent)" }} />
        </div>
        {count === total && (
          <p className="period-banner mt-3 text-sm">Every item done today. May Allah protect you and accept it from you.</p>
        )}
        {RUQYAH_CHECKLIST.map((g) => (
          <div key={g.group} className="mt-4">
            <div className="period-muted text-[11px] font-bold uppercase tracking-wider">{g.group}</div>
            <ul>
              {g.items.map((it) => {
                const on = done.has(it.id);
                return (
                  <li key={it.id} className="period-check-row">
                    <button className={`period-check ${on ? "is-on" : ""}`} aria-pressed={on} aria-label={it.label}
                      onClick={() => { toggleRuqyahCheck(it.id); void triggerHaptic("light"); }}>
                      {on && <Check size={14} strokeWidth={2.6} />}
                    </button>
                    <span className="flex-1 text-sm leading-snug">{saw(it.label)}</span>
                    {it.to && <Link to={it.to} className="period-icon-btn" aria-label={`Open ${it.label}`}><ChevronRight size={16} /></Link>}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <p className="period-callout is-grey">Every item on this list is authentic and requires no specialist. This is what was transmitted — it is simple enough that you do it yourself.</p>
    </>
  );
}

// ================= ACTIVE RUQYAH =================

function RuqyahView() {
  const [step, setStep] = useState(0);
  const s = SELF_STEPS[step];
  const last = SELF_STEPS.length - 1;
  const go = (n: number) => { setStep(n); void triggerHaptic("light"); };
  return (
    <>
      <div className="period-banner">
        <BookOpen size={18} />
        <span>Ruqyah as the Prophet <span className="period-saw">ﷺ</span> transmitted it is short, simple, and performed by a person on themselves. It needs no specialist, no fee, no diagnosis and no secret knowledge.</span>
      </div>
      <div className="period-card">
        <div className="flex items-center justify-between">
          <div className="period-eyebrow">Self-Ruqyah</div>
          <span className="period-muted text-xs font-semibold">Step {step + 1} of {SELF_STEPS.length}</span>
        </div>
        <div className="mt-3 flex gap-1">
          {SELF_STEPS.map((_, i) => (
            <button key={i} aria-label={`Step ${i + 1}`} onClick={() => go(i)} className="h-1.5 flex-1 rounded-full transition-colors"
              style={{ background: i <= step ? "var(--accent)" : "color-mix(in oklab, var(--foreground) 10%, transparent)" }} />
          ))}
        </div>
        <div key={step} className="animate-in fade-in slide-in-from-right-2 duration-300">
          <div className="mt-4 flex items-start gap-3">
            <span className="period-acc-num">{step + 1}</span>
            <p className="flex-1 text-[15px] font-semibold leading-snug">{saw(s.title)}</p>
          </div>
          {s.note && <p className="period-callout is-grey mt-3">{saw(s.note)}</p>}
          {s.item && <div className="mt-3"><DuaCard item={s.item} /></div>}
        </div>
        <div className="mt-5 flex gap-2">
          <button className="period-btn flex-1 !bg-transparent" style={{ border: "1px solid color-mix(in oklab, var(--accent) 40%, transparent)", color: "var(--accent)" }}
            disabled={step === 0} onClick={() => go(step - 1)}><ChevronLeft size={16} className="inline" /> Back</button>
          <button className="period-btn flex-1" onClick={() => go(step === last ? 0 : step + 1)}>
            {step === last ? "Start again" : <>Next <ChevronRight size={16} className="inline" /></>}
          </button>
        </div>
      </div>
      <div className="period-callout is-amber flex gap-2 font-semibold">
        <Stethoscope size={16} className="mt-0.5 flex-none" />
        <span>See a doctor for anything medical. Ruqyah accompanies treatment; it does not replace it.</span>
      </div>
      <div className="period-card">
        <div className="period-eyebrow">Ruqyah for Others</div>
        <p className="mt-2 text-sm">The right hand, placed on the person, with this du‘a. This is the standard form when performing ruqyah for someone else.</p>
        <div className="mt-3 space-y-3">
          <DuaCard item={BUKHARI_5675} />
          <DuaCard item={MUSLIM_2186} />
        </div>
      </div>
    </>
  );
}

// ================= VERSES =================

function VersesView() {
  return (
    <>
      <p className="period-callout is-grey">No fixed sequence is reported. These are what the Sunnah names, in the order most commonly used.</p>
      <div className="space-y-3">
        {VERSES.map((v, i) => (
          <div key={v.title} className="period-card">
            <div className="flex items-start gap-3">
              <span className="period-acc-num">{i + 1}</span>
              <div className="flex-1">
                <h3 className="text-[15px] font-bold">{saw(v.title)}</h3>
                <div className="period-source mt-1"><BookOpen size={12} /> {v.source}</div>
                <p className="mt-2 text-sm">{saw(v.note)}</p>
                {v.to && <Link to={v.to} className="period-link mt-2">Open in Morning Adhkar <ChevronRight size={14} /></Link>}
              </div>
            </div>
            {v.item && <details className="adhkar-commentary mt-2"><summary>Full narration</summary><div className="pt-2"><DuaCard item={v.item} bare /></div></details>}
          </div>
        ))}
      </div>
      <p className="period-muted px-1 text-sm">Any of the Qur’an, in truth — Allah says of it that it is shifāʾ, a healing.</p>
      <div className="period-callout is-amber">
        <strong>On fixed counts</strong> — Only the counts actually reported are prescribed: three times for the Mu‘awwidhat at night, three and seven for the pain du‘a, seven for the du‘a over the sick. Counts such as “Surah al-Baqarah 7 times” or “313 repetitions” have no basis. Restricting a dhikr to a number not reported is itself an innovation.
      </div>
    </>
  );
}

// ================= LEARN =================

function LearnView() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="period-learn-view space-y-4">
      <ConditionsTest />
      <div className="period-card period-learn-list">
        {RUQYAH_SECTIONS.map((s, idx) => {
          const isOpen = open === s.id;
          return (
            <section key={s.id} className={`period-learn-section ${isOpen ? "is-open" : ""}`}>
              <button className="period-acc-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : s.id)}>
                <span className="period-acc-num">{idx + 1}</span>
                <span className="flex-1 text-left text-[15px] font-semibold">{saw(s.title)}</span>
                <ChevronRight size={17} strokeWidth={1.8} />
              </button>
              {isOpen && (
                <div className="period-learn-body space-y-4">
                  {s.intro && <p className="period-muted text-sm">{saw(s.intro)}</p>}
                  {s.id === "what" && (
                    <div className="period-callout is-grey">
                      <strong>The three conditions</strong>
                      <ol className="mt-1 list-decimal space-y-1 pl-4">{CONDITION_LIST.map((c) => <li key={c}>{c}</li>)}</ol>
                    </div>
                  )}
                  {s.items.map((it) => (
                    <div key={it.id}>
                      <DuaCard item={it} bare />
                      {it.id === "raqi" && (
                        <ul className="mt-2 space-y-1.5">
                          {RAQI_FLAGS.map((f) => (
                            <li key={f} className="flex gap-2 text-sm"><X size={15} className="mt-0.5 flex-none" style={{ color: "var(--destructive)" }} /><span>{saw(f)}</span></li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                  {s.myths && <Myths />}
                  <button className="period-link" onClick={() => shareSection(s)}><Share2 size={14} /> Share this section</button>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Myths() {
  return (
    <div className="space-y-2">
      {MYTHS.map((m) => (
        <div key={m.myth} className="period-item">
          <p className="flex gap-2 text-sm font-semibold"><X size={15} className="mt-0.5 flex-none" style={{ color: "var(--destructive)" }} /><span>“{saw(m.myth)}”</span></p>
          <p className="mt-1.5 flex gap-2 text-sm"><Check size={15} className="mt-0.5 flex-none" style={{ color: "var(--accent)" }} /><span>{saw(m.truth)}</span></p>
        </div>
      ))}
    </div>
  );
}

const QUESTIONS = [
  { q: "Does it consist of the words of Allah, His names, or His attributes?", pass: "yes" },
  { q: "Is it in Arabic, or a language whose meaning is known?", pass: "yes" },
  { q: "Is it believed to work by itself, rather than only by the leave of Allah?", pass: "no" },
] as const;

function ConditionsTest() {
  const [answers, setAnswers] = useState<(("yes" | "no") | null)[]>([null, null, null]);
  const failed = answers.some((a, i) => a !== null && a !== QUESTIONS[i].pass);
  const complete = answers.every((a) => a !== null);
  return (
    <div className="period-card">
      <div className="period-eyebrow">Three Conditions Test</div>
      <p className="period-muted mt-1 text-xs">Check any practice, product or healer against the conditions (Ibn Hajar, Fath al-Bari 10/195).</p>
      <div className="mt-3 space-y-3">
        {QUESTIONS.map((q, i) => (
          <div key={q.q}>
            <p className="text-sm font-semibold">{i + 1}. {q.q}</p>
            <div className="mt-1.5 flex gap-2">
              {(["yes", "no"] as const).map((v) => (
                <button key={v} onClick={() => { const n = [...answers]; n[i] = v; setAnswers(n); void triggerHaptic("light"); }}
                  className="flex-1 rounded-full py-1.5 text-sm font-semibold capitalize transition-colors"
                  style={answers[i] === v
                    ? { background: "var(--accent)", color: "var(--accent-foreground, var(--background))" }
                    : { border: "1px solid color-mix(in oklab, var(--accent) 35%, transparent)", color: "var(--foreground)" }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {failed && (
        <p className="period-callout is-amber mt-3 flex gap-2"><CircleAlert size={16} className="mt-0.5 flex-none" />This practice does not meet the conditions agreed upon by the scholars.</p>
      )}
      {complete && !failed && (
        <p className="period-banner mt-3 text-sm"><Check size={16} />This meets the three conditions agreed upon by the scholars.</p>
      )}
      {answers.some((a) => a) && (
        <button className="period-link mt-2" onClick={() => setAnswers([null, null, null])}>Reset</button>
      )}
    </div>
  );
}

async function shareSection(s: RuqyahSection) {
  const lines = [s.title, ""];
  if (s.intro) lines.push(s.intro, "");
  for (const it of s.items) {
    lines.push(it.title, it.source);
    if (it.translation) lines.push(it.translation);
    it.notes?.forEach((n) => lines.push(n));
    if (it.callout) lines.push(`${it.callout.label} — ${it.callout.text}`);
    if (it.id === "raqi") RAQI_FLAGS.forEach((f) => lines.push(`• ${f}`));
    lines.push("");
  }
  if (s.myths) MYTHS.forEach((m) => lines.push(`Myth: ${m.myth}`, m.truth, ""));
  lines.push("— Sahih Al-Adhkar");
  const text = lines.join("\n");
  try {
    if (navigator.share) await navigator.share({ title: s.title, text });
    else { await navigator.clipboard.writeText(text); alert("Copied to clipboard"); }
  } catch { /* cancelled */ }
}

function DuaCard({ item, bare = false }: { item: SunnahItem; bare?: boolean }) {
  return (
    <article className={bare ? "" : "period-item"}>
      <h3 className="text-sm font-bold">{saw(item.title)}</h3>
      <div className="period-source mt-1"><BookOpen size={12} /> {item.source}</div>
      {item.arabic && <p className="arabic mt-3 whitespace-pre-line text-right text-[21px] leading-[1.95]" lang="ar" dir="rtl">{item.arabic}</p>}
      {item.transliteration && <p className="adhkar-transliteration mt-2 !text-left text-[13px]">{item.transliteration}</p>}
      {item.translation && <p className="mt-2 text-sm">{saw(item.translation)}</p>}
      {item.narration && (
        <details className="adhkar-commentary"><summary>Full narration</summary><p className="pb-1 text-sm">{saw(item.narration)}</p></details>
      )}
      {item.notes?.map((n, i) => <p key={i} className="period-muted mt-2 text-sm leading-relaxed">{saw(n)}</p>)}
      {item.callout && (
        <div className={`period-callout mt-3 ${item.callout.tone === "amber" ? "is-amber" : "is-grey"}`}>
          <strong>{item.callout.label}</strong> — {saw(item.callout.text)}
        </div>
      )}
    </article>
  );
}
