import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen, Check, ChevronLeft, ChevronRight, CircleAlert, Droplets, FileText, Flower2, Hand, Lock,
  Moon, MoonStar, Play, Search, Share2, ShieldCheck, Sparkles, Star, Stethoscope, Sun,
  Sunrise, Users, X,
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

// ================= shared bits =================

function Ring({ done, total, size = 84 }: { done: number; total: number; size?: number }) {
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const p = total ? done / total : 0;
  return (
    <div className="rq-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="color-mix(in oklab, var(--foreground) 10%, transparent)" strokeWidth={7} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" strokeWidth={7} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - p)} transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset .5s ease" }} />
      </svg>
      <div className="rq-ring-label">
        <strong>{done}</strong>
        <span>of {total}</span>
      </div>
    </div>
  );
}

const GROUP_ICONS = [Sun, Sunrise, MoonStar, Star, Moon];

function useChecklist() {
  const [done, setDone] = useState<Set<string>>(() => new Set(getRuqyahChecklist()));
  useEffect(() => {
    const r = () => setDone(new Set(getRuqyahChecklist()));
    window.addEventListener("adhkar:ruqyah-update", r);
    return () => window.removeEventListener("adhkar:ruqyah-update", r);
  }, []);
  const total = RUQYAH_CHECKLIST.reduce((n, g) => n + g.items.length, 0);
  const count = RUQYAH_CHECKLIST.reduce((n, g) => n + g.items.filter((i) => done.has(i.id)).length, 0);
  return { done, total, count };
}

// ================= DAILY =================

function DailyView() {
  const { done, total, count } = useChecklist();
  const [openGroup, setOpenGroup] = useState<string | null>(RUQYAH_CHECKLIST[0].group);
  const listRef = useRef<HTMLDivElement>(null);
  const complete = count === total;
  const started = count > 0;

  return (
    <>
      <div className="period-card rq-hero">
        {complete ? (
          <div className="rq-hero-done">
            <Sparkles size={20} className="rq-sparkle" />
            <Ring done={count} total={total} size={104} />
            <h2 className="rq-hero-title">All done today!</h2>
            <p className="period-muted text-sm">May Allah keep you and your loved ones protected always.</p>
            <button className="rq-btn-primary" onClick={() => { listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); void triggerHaptic("light"); }}>
              View checklist
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="rq-icon-circle mb-3"><Flower2 size={20} /></div>
                <h2 className="rq-hero-title text-left">{started ? "Today’s protection" : "Daily Protection"}</h2>
                <p className="period-muted mt-1 text-sm leading-relaxed">
                  {started
                    ? "Keep going! May Allah keep you protected always."
                    : <>Protection is a daily practice, not a crisis response. Here’s what the Prophet <span className="period-saw">ﷺ</span> did every day.</>}
                </p>
              </div>
              <Ring done={count} total={total} />
            </div>
            {!started && (
              <button className="rq-btn-primary mt-4 w-full" onClick={() => { listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); void triggerHaptic("light"); }}>
                Start today
              </button>
            )}
          </>
        )}
      </div>

      <div ref={listRef} className="space-y-3 scroll-mt-4">
        {RUQYAH_CHECKLIST.map((g, gi) => {
          const groupDone = g.items.filter((i) => done.has(i.id)).length;
          const allDone = groupDone === g.items.length;
          const isOpen = openGroup === g.group;
          const Icon = GROUP_ICONS[gi] ?? Sun;
          return (
            <div key={g.group} className="period-card rq-group">
              <button className="rq-group-head" aria-expanded={isOpen}
                onClick={() => { setOpenGroup(isOpen ? null : g.group); void triggerHaptic("light"); }}>
                <span className={`rq-check-circle ${allDone ? "is-on" : ""}`}>{allDone && <Check size={13} strokeWidth={3} />}</span>
                <Icon size={17} className="rq-group-icon" />
                <span className="flex-1 text-left text-[15px] font-semibold">{g.group === "After each obligatory prayer" ? "After each Salah" : g.group}</span>
                <span className="period-muted text-xs font-semibold">{groupDone}/{g.items.length}</span>
                <ChevronRight size={16} className={`rq-group-chevron ${isOpen ? "is-open" : ""}`} />
              </button>
              {isOpen && (
                <ul className="rq-group-items">
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
              )}
            </div>
          );
        })}
      </div>

      <div className="period-callout is-grey flex gap-2">
        <Stethoscope size={16} className="mt-0.5 flex-none" />
        <span>Every item on this list is authentic and requires no specialist. This is what was transmitted — it is simple enough that you do it yourself.</span>
      </div>
    </>
  );
}

// ================= RUQYAH (landing + guides) =================

function RuqyahView() {
  const [mode, setMode] = useState<"landing" | "self" | "others">("landing");
  if (mode === "self") return <SelfGuide onBack={() => setMode("landing")} />;
  if (mode === "others") return <OthersGuide onBack={() => setMode("landing")} />;
  return (
    <>
      <div className="period-card rq-landing-card">
        <div className="rq-icon-circle mb-3"><Hand size={20} /></div>
        <h2 className="rq-hero-title text-left">Self-Ruqyah</h2>
        <p className="period-muted mt-1 text-sm leading-relaxed">
          Ruqyah as the Prophet <span className="period-saw">ﷺ</span> transmitted it is short, simple, and performed by a person on themselves. It needs no specialist, no fee, no diagnosis and no secret knowledge.
        </p>
        <span className="rq-pill mt-3">{SELF_STEPS.length} simple steps</span>
        <button className="rq-btn-primary mt-4 w-full" onClick={() => { setMode("self"); void triggerHaptic("light"); }}>
          Begin guide <ChevronRight size={16} />
        </button>
      </div>

      <div className="period-card rq-landing-card">
        <div className="rq-icon-circle mb-3"><Users size={20} /></div>
        <h2 className="rq-hero-title text-left">Ruqyah for Others</h2>
        <p className="period-muted mt-1 text-sm leading-relaxed">The method and authentic du‘as for performing ruqyah on someone else.</p>
        <button className="rq-btn-outline mt-4 w-full" onClick={() => { setMode("others"); void triggerHaptic("light"); }}>
          View guide <ChevronRight size={16} />
        </button>
      </div>

      <div className="period-callout is-amber flex gap-2 font-semibold">
        <Stethoscope size={16} className="mt-0.5 flex-none" />
        <span>See a doctor for anything medical. Ruqyah accompanies treatment; it does not replace it.</span>
      </div>
    </>
  );
}

function BackLink({ onBack, label = "Back" }: { onBack: () => void; label?: string }) {
  return (
    <button className="rq-back-link" onClick={() => { onBack(); void triggerHaptic("light"); }}>
      <ChevronLeft size={16} /> {label}
    </button>
  );
}

function SelfGuide({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(0);
  const s = SELF_STEPS[step];
  const last = SELF_STEPS.length - 1;
  const go = (n: number) => { setStep(n); void triggerHaptic("light"); };
  return (
    <>
      <BackLink onBack={onBack} label="Ruqyah" />
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
          <button className="rq-btn-outline flex-1" disabled={step === 0} onClick={() => go(step - 1)}>
            <ChevronLeft size={16} /> Back
          </button>
          <button className="rq-btn-primary flex-1" onClick={() => go(step === last ? 0 : step + 1)}>
            {step === last ? "Start again" : <>Next <ChevronRight size={16} /></>}
          </button>
        </div>
      </div>
      <div className="period-callout is-amber flex gap-2 font-semibold">
        <Stethoscope size={16} className="mt-0.5 flex-none" />
        <span>See a doctor for anything medical. Ruqyah accompanies treatment; it does not replace it.</span>
      </div>
    </>
  );
}

function OthersGuide({ onBack }: { onBack: () => void }) {
  return (
    <>
      <BackLink onBack={onBack} label="Ruqyah" />
      <div className="period-card">
        <div className="rq-icon-circle mb-3"><Users size={20} /></div>
        <h2 className="rq-hero-title text-left">Ruqyah for Others</h2>
        <p className="period-muted mt-1 text-sm leading-relaxed">
          The right hand, placed on the person, with this du‘a. This is the standard form when performing ruqyah for someone else.
        </p>
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
  const [query, setQuery] = useState("");
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const q = query.trim().toLowerCase();
  const list = VERSES.map((v, i) => ({ v, i })).filter(({ v }) =>
    !q || v.title.toLowerCase().includes(q) || v.source.toLowerCase().includes(q) || v.tag.toLowerCase().includes(q));

  if (openIdx !== null) return <VerseDetail idx={openIdx} onBack={() => setOpenIdx(null)} />;

  return (
    <>
      <label className="rq-search">
        <Search size={16} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search verses…" aria-label="Search verses" />
      </label>
      <p className="period-callout is-grey">No fixed sequence is reported. These are what the Sunnah names, in the order most commonly used.</p>
      <div className="space-y-3">
        {list.map(({ v, i }) => (
          <button key={v.title} className="period-card rq-verse-row" onClick={() => { setOpenIdx(i); void triggerHaptic("light"); }}>
            <span className="period-acc-num">{i + 1}</span>
            <span className="flex-1 text-left">
              <span className="block text-[15px] font-bold">{saw(v.title)}</span>
              <span className="period-source mt-1"><BookOpen size={12} /> {v.source}</span>
              <span className="rq-tag mt-2">{v.tag}</span>
            </span>
            <ChevronRight size={17} className="rq-group-chevron" />
          </button>
        ))}
        {list.length === 0 && <p className="period-muted px-1 text-sm">No verses match “{query}”.</p>}
      </div>
      <p className="period-muted px-1 text-sm">Any of the Qur’an, in truth — Allah says of it that it is shifāʾ, a healing.</p>
      <div className="period-callout is-amber">
        <strong>On fixed counts</strong> — Only the counts actually reported are prescribed: three times for the Mu‘awwidhat at night, three and seven for the pain du‘a, seven for the du‘a over the sick. Counts such as “Surah al-Baqarah 7 times” or “313 repetitions” have no basis. Restricting a dhikr to a number not reported is itself an innovation.
      </div>
    </>
  );
}

function VerseDetail({ idx, onBack }: { idx: number; onBack: () => void }) {
  const v = VERSES[idx];
  const item = v.item;
  const play = () => {
    if (!item?.arabic) return;
    try {
      const u = new SpeechSynthesisUtterance(item.arabic);
      u.lang = "ar-SA";
      u.rate = 0.85;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch { /* unsupported */ }
  };
  const share = async () => {
    const lines = [v.title, v.source, ""];
    if (item?.arabic) lines.push(item.arabic, "");
    if (item?.transliteration) lines.push(item.transliteration, "");
    if (item?.translation) lines.push(item.translation, "");
    lines.push(v.note, "", "— Sahih Al-Adhkar");
    const text = lines.join("\n");
    try {
      if (navigator.share) await navigator.share({ title: v.title, text });
      else { await navigator.clipboard.writeText(text); alert("Copied to clipboard"); }
    } catch { /* cancelled */ }
  };
  return (
    <>
      <BackLink onBack={onBack} label="Verses" />
      <div className="period-card">
        <div className="flex items-start gap-3">
          <span className="period-acc-num">{idx + 1}</span>
          <div className="flex-1">
            <h2 className="text-[17px] font-bold">{saw(v.title)}</h2>
            <div className="period-source mt-1"><BookOpen size={12} /> {v.source}</div>
          </div>
          <span className="rq-tag">{v.tag}</span>
        </div>
        {item?.arabic && <p className="arabic mt-4 whitespace-pre-line text-right text-[22px] leading-[1.95]" lang="ar" dir="rtl">{item.arabic}</p>}
        {item?.transliteration && <p className="adhkar-transliteration mt-3 !text-left text-[13px]">{item.transliteration}</p>}
        <div className="mt-4 flex gap-2">
          <button className="rq-btn-outline flex-1" onClick={play} disabled={!item?.arabic}><Play size={15} /> Play</button>
          <button className="rq-btn-outline flex-1" onClick={share}><Share2 size={15} /> Share</button>
        </div>
        {item?.translation && (
          <details className="adhkar-commentary mt-3" open={false}>
            <summary>Translation</summary>
            <p className="pb-1 text-sm">{saw(item.translation)}</p>
          </details>
        )}
        <details className="adhkar-commentary mt-2">
          <summary>Benefits &amp; Virtues</summary>
          <p className="pb-1 text-sm">{saw(v.note)}</p>
          {item?.notes?.map((n, i) => <p key={i} className="period-muted pb-1 text-sm leading-relaxed">{saw(n)}</p>)}
        </details>
        {v.to && <Link to={v.to} className="period-link mt-3">Open in Morning Adhkar <ChevronRight size={14} /></Link>}
      </div>
    </>
  );
}

// ================= LEARN =================

const SECTION_META: Record<string, { icon: typeof BookOpen; sub: string }> = {
  what: { icon: BookOpen, sub: "A simple and authentic practice" },
  seventy: { icon: Users, sub: "Who enters Paradise without reckoning" },
  method: { icon: Hand, sub: "How he performed ruqyah" },
  remedies: { icon: Droplets, sub: "Water, oil, the evil eye and more" },
  "not-sunnah": { icon: X, sub: "Common misconceptions" },
  myths: { icon: FileText, sub: "Clear guidance" },
};

function LearnView() {
  const [openId, setOpenId] = useState<string | null>(null);
  const section = RUQYAH_SECTIONS.find((s) => s.id === openId);
  if (section) return <LearnArticle section={section} onBack={() => setOpenId(null)} />;
  return (
    <>
      <div className="period-card rq-landing-card">
        <div className="rq-icon-circle mb-3"><BookOpen size={20} /></div>
        <h2 className="rq-hero-title text-left">Learn About Ruqyah</h2>
        <p className="period-muted mt-1 text-sm leading-relaxed">
          Authentic knowledge to help you understand ruqyah, its rulings, and what the Sunnah teaches.
        </p>
      </div>
      <div className="period-card p-0">
        {RUQYAH_SECTIONS.map((s, i) => {
          const meta = SECTION_META[s.id] ?? { icon: BookOpen, sub: "" };
          const Icon = meta.icon;
          return (
            <button key={s.id} className={`rq-learn-row ${i > 0 ? "rq-learn-row-border" : ""}`}
              onClick={() => { setOpenId(s.id); void triggerHaptic("light"); }}>
              <span className="rq-icon-circle rq-icon-circle-sm"><Icon size={17} /></span>
              <span className="flex-1 text-left">
                <span className="block text-[15px] font-semibold">{saw(s.title)}</span>
                {meta.sub && <span className="period-muted block text-xs">{meta.sub}</span>}
              </span>
              <ChevronRight size={17} className="rq-group-chevron" />
            </button>
          );
        })}
      </div>
    </>
  );
}

function LearnArticle({ section: s, onBack }: { section: RuqyahSection; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <BackLink onBack={onBack} label="Learn" />
      <div className="period-card">
        <h2 className="rq-hero-title text-left">{saw(s.title)}</h2>
        {s.intro && <p className="period-muted mt-2 text-sm leading-relaxed">{saw(s.intro)}</p>}
        {s.id === "what" && (
          <div className="period-card rq-conditions mt-4">
            <div className="period-eyebrow flex items-center gap-2"><ShieldCheck size={15} /> Three Conditions</div>
            <ol className="mt-3 space-y-3">
              {CONDITION_LIST.map((c, i) => (
                <li key={c} className="flex items-start gap-3">
                  <span className="period-acc-num">{i + 1}</span>
                  <span className="flex-1 text-sm leading-snug">{c}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
        {s.id === "what" && (
          <div className="period-callout is-amber mt-3">
            <strong>Important</strong> — Ruqyah must meet all three conditions. Anything that does not is not permissible.
          </div>
        )}
      </div>
      {s.items.map((it) => (
        <div key={it.id} className="period-card">
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
      {s.myths && <div className="period-card"><Myths /></div>}
      <button className="period-link" onClick={() => shareSection(s)}><Share2 size={14} /> Share this section</button>
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
