import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen, Check, ChevronLeft, ChevronRight, CircleAlert, Compass, GraduationCap, Landmark,
  MapPin, RotateCcw, Sparkles, UserRound, WifiOff, X,
} from "lucide-react";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { triggerHaptic } from "@/lib/theme";
import { getHajjState, setHajjState, type HajjMode } from "@/lib/hajj";
import type { SunnahItem } from "@/data/period-sunnah";
import {
  ACCEPTED_HAJJ, BUKHARI_1189, BUKHARI_1520, BUKHARI_1521, BUKHARI_1773, INNOVATIONS, MADINAH_NOT_SUNNAH,
  MADINAH_TODO, MIQAT, MIQAT_LIST, MUSLIM_1297, PREP_CHECKLIST, QUICK_DUAS, QURAN_2_197, RETURN_DUA,
  STATIONS, TRAVEL_DUA, WOMEN_GROUPS, WOMEN_TEXT, type Station,
} from "@/data/hajj";

export const Route = createFileRoute("/app/hajj")({
  head: () => ({
    meta: [
      { title: "Hajj & Umrah Companion, Sahih Al-Adhkar" },
      { name: "description", content: "Station-by-station Hajj and Umrah guide with authentic du‘as, checklists and circuit counter." },
      { property: "og:title", content: "Hajj & Umrah Companion, Sahih Al-Adhkar" },
      { property: "og:description", content: "Take your rites from the Prophet ﷺ — every source verified, works offline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HajjCompanion,
});

const saw = (t: string) => t.split("ﷺ").flatMap((part, i) => (i ? [<span key={i} className="period-saw">ﷺ</span>, part] : [part]));

type Tab = "prepare" | "guide" | "duas" | "learn";

function useHajj() {
  const [s, set] = useState(getHajjState);
  const update = (p: Parameters<typeof setHajjState>[0]) => set(setHajjState(p));
  return [s, update] as const;
}

function HajjCompanion() {
  const [mounted, setMounted] = useState(false);
  const [state, update] = useHajj();
  const [tab, setTab] = useState<Tab>("prepare");
  useEffect(() => setMounted(true), []);
  useEffect(() => { if (state.mode === "learn" && (tab === "guide" || tab === "prepare")) setTab("learn"); }, [state.mode, tab]);

  const tabs: { id: Tab; label: string }[] = state.mode === "learn"
    ? [{ id: "learn", label: "Learn" }, { id: "duas", label: "Du‘as" }]
    : [{ id: "prepare", label: "Prepare" }, { id: "guide", label: "Guide" }, { id: "duas", label: "Du‘as" }, { id: "learn", label: "Learn" }];

  const go = (t: Tab) => { setTab(t); void triggerHaptic("light"); document.querySelector(".period-scroll-area")?.scrollTo({ top: 0 }); };

  return (
    <>
      <header className="page-header period-header rq-header relative overflow-hidden" style={{ background: "var(--grad-header)", color: "var(--header-fg)" }}>
        <HeaderBackButton />
        <div className="relative mx-auto max-w-md px-16 pb-4 pt-7 text-center">
          <div className="label-caps" style={{ color: "var(--header-sub)", opacity: 1 }}>Hajj & Umrah Companion</div>
          <h1 className="app-page-title mt-2">Labbayk</h1>
        </div>
        {mounted && state.mode && (
          <div className="period-tabs mx-auto max-w-md" role="tablist">
            {tabs.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? "is-active" : ""} onClick={() => go(t.id)}>{t.label}</button>
            ))}
          </div>
        )}
      </header>
      <main className="scroll-area period-scroll-area rq-scroll-area">
        <div className="mx-auto max-w-md space-y-4 px-5 pb-8 pt-4">
          {mounted && !state.mode && <ModeSelect onPick={(m) => { update({ mode: m }); setTab(m === "learn" ? "learn" : "prepare"); }} />}
          {mounted && state.mode && (
            <>
              <div className="hj-mode-bar">
                <span>Preparing for <strong>{state.mode === "hajj" ? "Hajj" : state.mode === "umrah" ? "‘Umrah" : "Just learning"}</strong></span>
                <button onClick={() => { update({ mode: null }); void triggerHaptic("light"); }}>Change</button>
              </div>
              {tab === "prepare" && <PrepareView checks={state.checks} onToggle={(id) => toggle(id)} />}
              {tab === "guide" && <GuideView mode={state.mode} />}
              {tab === "duas" && <DuasView />}
              {tab === "learn" && <LearnView />}
              <p className="hj-offline"><WifiOff size={14} /> All content in this guide is stored on your device. It works without internet — you won’t need data at the Haram.</p>
            </>
          )}
        </div>
      </main>
    </>
  );

  function toggle(id: string) {
    const set = new Set(getHajjState().checks);
    set.has(id) ? set.delete(id) : set.add(id);
    update({ checks: [...set] });
    void triggerHaptic("light");
  }
}

function ModeSelect({ onPick }: { onPick: (m: HajjMode) => void }) {
  const opts: { id: HajjMode; title: string; sub: string; Icon: typeof Landmark }[] = [
    { id: "umrah", title: "‘Umrah", sub: "Ihram, tawaf, sa‘i and completing ‘Umrah", Icon: Landmark },
    { id: "hajj", title: "Hajj", sub: "The full journey, with ‘Umrah within it", Icon: Compass },
    { id: "learn", title: "Just learning", sub: "All knowledge sections, without the guides", Icon: GraduationCap },
  ];
  return (
    <>
      <div className="period-card rq-hero text-center">
        <h2 className="rq-hero-title">What are you preparing for?</h2>
        <p className="period-muted mt-1 text-sm">You can change this any time.</p>
      </div>
      <div className="space-y-3">
        {opts.map((o) => (
          <button key={o.id} className="period-card hj-mode-tile" onClick={() => { onPick(o.id); void triggerHaptic("medium"); }}>
            <span className="rq-icon-circle"><o.Icon size={20} /></span>
            <span className="flex-1 text-left">
              <span className="block text-[16px] font-bold">{o.title}</span>
              <span className="period-muted block text-xs">{o.sub}</span>
            </span>
            <ChevronRight size={18} className="opacity-60" />
          </button>
        ))}
      </div>
    </>
  );
}

// ================= shared =================

function DuaCard({ item }: { item: SunnahItem }) {
  return (
    <article className="period-card hj-dua">
      <h3 className="text-[15px] font-bold">{saw(item.title)}</h3>
      <div className="period-source mt-1"><BookOpen size={12} /> {item.source}</div>
      {item.arabic && <p className="arabic mt-3 whitespace-pre-line text-right text-[21px] leading-[1.95]" lang="ar" dir="rtl">{item.arabic}</p>}
      {item.transliteration && <p className="adhkar-transliteration mt-2 !text-left text-[13px]">{item.transliteration}</p>}
      {item.translation && <p className="mt-2 text-sm leading-relaxed">{saw(item.translation)}</p>}
      {item.narration && <details className="adhkar-commentary"><summary>Full narration</summary><p className="pb-1 text-sm">{saw(item.narration)}</p></details>}
      {item.notes?.map((n, i) => <div key={i} className="period-callout is-grey mt-3">{saw(n)}</div>)}
      {item.callout && (
        <div className={`period-callout mt-3 ${item.callout.tone === "amber" ? "is-amber" : "is-grey"}`}>
          <strong>{item.callout.label}</strong> — {saw(item.callout.text)}
        </div>
      )}
    </article>
  );
}

function CheckRow({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <li className="rq-check-item">
      <div className="period-check-row">
        <button className={`period-check ${on ? "is-on" : ""}`} aria-pressed={on} aria-label={label} onClick={onToggle}>
          {on && <Check size={14} strokeWidth={2.6} />}
        </button>
        <span className="flex-1 text-sm leading-snug">{saw(label)}</span>
      </div>
    </li>
  );
}

function NotSunnah({ text, label = "Not from the Sunnah" }: { text: string; label?: string }) {
  return (
    <details className="hj-not-sunnah">
      <summary><CircleAlert size={15} /> {label}<ChevronRight size={15} className="hj-chev" /></summary>
      <p>{saw(text)}</p>
    </details>
  );
}

// ================= PREPARE =================

function PrepareView({ checks, onToggle }: { checks: string[]; onToggle: (id: string) => void }) {
  const done = PREP_CHECKLIST.filter((_, i) => checks.includes(`prep-${i}`)).length;
  return (
    <>
      <div className="rq-intro-note">
        <span className="rq-intro-icon"><Sparkles size={20} /></span>
        <p>Learn the rites before you arrive. This is the single most useful preparation.</p>
      </div>
      <section className="period-card">
        <div className="flex items-center justify-between">
          <h2 className="rq-hero-title text-left">Before departing</h2>
          <span className="rq-pill">{done} of {PREP_CHECKLIST.length}</span>
        </div>
        <div className="rq-group-progress mt-3"><i style={{ width: `${(done / PREP_CHECKLIST.length) * 100}%` }} /></div>
        <ul className="mt-2">
          {PREP_CHECKLIST.map((l, i) => <CheckRow key={i} label={l} on={checks.includes(`prep-${i}`)} onToggle={() => onToggle(`prep-${i}`)} />)}
        </ul>
      </section>
      <div className="label-caps px-1">What Hajj erases, and what it earns</div>
      <DuaCard item={BUKHARI_1521} />
      <DuaCard item={BUKHARI_1773} />
      <div className="label-caps px-1">Conduct</div>
      <DuaCard item={QURAN_2_197} />
      <div className="label-caps px-1">For the journey</div>
      <DuaCard item={TRAVEL_DUA} />
      <DuaCard item={RETURN_DUA} />
    </>
  );
}

// ================= GUIDE =================

function GuideView({ mode }: { mode: HajjMode }) {
  const [state, update] = useHajj();
  const list = mode === "hajj" ? STATIONS : STATIONS.filter((s) => !s.hajj);
  const idx = Math.min(state.station, list.length - 1);
  const st = list[idx];
  const stationDone = (s: Station) => s.checklist.every((_, i) => state.checks.includes(`${s.id}-${i}`));

  const goTo = (i: number) => {
    update({ station: i });
    void triggerHaptic("light");
    document.querySelector(".period-scroll-area")?.scrollTo({ top: 0, behavior: "smooth" });
  };
  const toggle = (id: string) => {
    const set = new Set(state.checks);
    set.has(id) ? set.delete(id) : set.add(id);
    update({ checks: [...set] });
    void triggerHaptic("light");
  };

  const umrahEnd = st.id === "halq";

  return (
    <>
      <nav className="hj-track" aria-label="Journey progress">
        {list.map((s, i) => (
          <button key={s.id} className={`hj-track-step ${i === idx ? "is-current" : ""} ${stationDone(s) ? "is-done" : ""}`} onClick={() => goTo(i)}>
            <span className="hj-track-dot">{stationDone(s) ? <Check size={11} strokeWidth={3} /> : i + 1}</span>
            <span className="hj-track-label">{s.day ?? s.name}</span>
          </button>
        ))}
      </nav>

      <section key={st.id} className="period-card hj-station rq-view-transition">
        <div className="hj-station-num">Station {idx + 1} of {list.length}</div>
        <h2 className="hj-station-name">{st.name}</h2>
        <p className="period-muted text-sm">{st.subtitle}</p>
        <div className="hj-location"><MapPin size={13} /> {st.location}</div>
        {st.intro && <p className="mt-3 text-sm leading-relaxed">{saw(st.intro)}</p>}
        <ul className="mt-3">
          {st.checklist.map((l, i) => <CheckRow key={i} label={l} on={state.checks.includes(`${st.id}-${i}`)} onToggle={() => toggle(`${st.id}-${i}`)} />)}
        </ul>
        {st.notes?.map((n, i) => <div key={i} className="period-callout is-grey mt-3">{saw(n)}</div>)}
      </section>

      {st.counter && (
        <CircuitCounter
          kind={st.counter}
          value={state.counters[st.id] ?? 0}
          onChange={(v) => update({ counters: { ...state.counters, [st.id]: v } })}
        />
      )}

      {st.miqat && (
        <section className="period-card">
          <h3 className="text-[15px] font-bold">The five mawaqit</h3>
          <ul className="hj-miqat mt-2">
            {MIQAT_LIST.map((m) => <li key={m.name}><strong>{m.name}</strong><span>{m.for}</span></li>)}
          </ul>
        </section>
      )}
      {st.miqat && <DuaCard item={MIQAT} />}
      {st.items.map((it) => <DuaCard key={it.id} item={it} />)}
      {st.notSunnah && <NotSunnah text={st.notSunnah} />}

      {umrahEnd && (
        <section className="period-card hj-complete">
          <Sparkles size={22} className="rq-sparkle" />
          <h3 className="rq-hero-title">Your ‘Umrah is complete</h3>
          <p className="period-muted text-sm">All prohibitions of ihram are now lifted. May Allah accept it from you.</p>
        </section>
      )}

      <div className="flex gap-3">
        <button className="rq-btn-outline flex-1" disabled={idx === 0} onClick={() => goTo(idx - 1)}><ChevronLeft size={16} /> Back</button>
        {idx < list.length - 1 ? (
          <button className="rq-btn-primary flex-1" onClick={() => goTo(idx + 1)}>
            {umrahEnd ? "Continue to Hajj" : "Next station"} <ChevronRight size={16} />
          </button>
        ) : (
          <button className="rq-btn-primary flex-1" onClick={() => goTo(0)}><RotateCcw size={15} /> Start over</button>
        )}
      </div>

      <div className="period-card hj-links">
        <p className="text-sm">The morning and evening adhkar still apply during the journey.</p>
        <div className="mt-3 flex gap-2">
          <Link to="/app" className="rq-btn-outline flex-1">Morning</Link>
          <Link to="/app/evening" className="rq-btn-outline flex-1">Evening</Link>
          <Link to="/app/tasbih" className="rq-btn-outline flex-1">Tasbih</Link>
        </div>
      </div>
    </>
  );
}

function CircuitCounter({ kind, value, onChange }: { kind: "tawaf" | "sai" | "wada"; value: number; onChange: (v: number) => void }) {
  const total = 7;
  const done = value >= total;
  const size = 168, r = 70, c = 2 * Math.PI * r;
  const dir = kind === "sai" ? (done ? "Complete at Marwah" : value % 2 === 0 ? "Safa → Marwah" : "Marwah → Safa") : done ? "Seven circuits complete" : "Anticlockwise from the Black Stone";
  const tap = () => {
    if (done) return;
    const v = value + 1;
    onChange(v);
    void triggerHaptic(v >= total ? "heavy" : "medium");
  };
  return (
    <section className="period-card hj-counter">
      <div className="label-caps">{kind === "sai" ? "Sa‘i circuits" : "Tawaf circuits"}</div>
      <button className="hj-counter-ring" onClick={tap} aria-label="Next circuit" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={84} cy={84} r={r} fill="none" stroke="color-mix(in oklab, var(--foreground) 10%, transparent)" strokeWidth={9} />
          <circle cx={84} cy={84} r={r} fill="none" stroke="var(--accent)" strokeWidth={9} strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - value / total)} transform="rotate(-90 84 84)" style={{ transition: "stroke-dashoffset .45s ease" }} />
        </svg>
        <span className="hj-counter-label">
          {done ? <Check size={34} strokeWidth={2.4} /> : <strong>{value + 1}</strong>}
          <span>{done ? "Done" : `of ${total}`}</span>
        </span>
      </button>
      <p className="hj-counter-dir">{dir}</p>
      <div className="hj-counter-pips">{Array.from({ length: total }, (_, i) => <i key={i} className={i < value ? "is-on" : ""} />)}</div>
      <div className="mt-3 flex justify-center gap-2">
        <button className="hj-mini-btn" disabled={value === 0} onClick={() => { onChange(value - 1); void triggerHaptic("light"); }}>Undo</button>
        <button className="hj-mini-btn" disabled={value === 0} onClick={() => { onChange(0); void triggerHaptic("light"); }}><X size={13} /> Reset</button>
      </div>
      <p className="period-muted mt-2 text-xs">Tap the circle as you finish each circuit.</p>
    </section>
  );
}

// ================= DUAS =================

function DuasView() {
  return (
    <>
      <div className="rq-intro-note">
        <span className="rq-intro-icon"><BookOpen size={20} /></span>
        <p>Every du‘a you need on the journey, in one place.</p>
      </div>
      {QUICK_DUAS.map((d) => <DuaCard key={d.id} item={d} />)}
    </>
  );
}

// ================= LEARN =================

function LearnView() {
  const [open, setOpen] = useState<string | null>(null);
  const sections: { id: string; title: string; sub: string; Icon: typeof BookOpen; body: React.ReactNode }[] = [
    { id: "rites", title: "Take your rites from me", sub: "The standard for the journey", Icon: BookOpen, body: <DuaCard item={MUSLIM_1297} /> },
    { id: "erases", title: "What Hajj erases", sub: "The reward and its two conditions", Icon: Sparkles, body: <><DuaCard item={BUKHARI_1521} /><DuaCard item={BUKHARI_1773} /><DuaCard item={QURAN_2_197} /></> },
    { id: "accepted", title: "The signs of an accepted Hajj", sub: "Bukhari 1773", Icon: Check, body: <div className="period-card"><p className="text-sm leading-relaxed">{ACCEPTED_HAJJ}</p></div> },
    {
      id: "madinah", title: "Madinah", sub: "Not a rite of Hajj", Icon: Landmark, body: (
        <>
          <div className="period-callout is-grey">Visiting Madinah is not a rite of Hajj. It has no bearing on the validity of the pilgrimage, and the journey is made to the Prophet’s <span className="period-saw">ﷺ</span> masjid rather than to his grave.</div>
          <DuaCard item={BUKHARI_1189} />
          <div className="period-card">
            <h3 className="text-[15px] font-bold">Once there</h3>
            <ul className="hj-bullets mt-2">{MADINAH_TODO.map((t) => <li key={t}>{saw(t)}</li>)}</ul>
          </div>
          <NotSunnah text={MADINAH_NOT_SUNNAH} label="Innovations in Madinah" />
        </>
      ),
    },
    {
      id: "women", title: "For women", sub: "Every ruling for her, in one place", Icon: UserRound, body: (
        <>
          <DuaCard item={BUKHARI_1520} />
          <div className="period-callout is-grey">{saw(WOMEN_TEXT)}</div>
          {WOMEN_GROUPS.map((g) => (
            <div key={g.title} className="period-card">
              <h3 className="text-[15px] font-bold">{g.title}</h3>
              <ul className="hj-bullets mt-2">{g.items.map((t) => <li key={t}>{saw(t)}</li>)}</ul>
            </div>
          ))}
        </>
      ),
    },
    {
      id: "innovations", title: "What is not from the Sunnah", sub: "Every addition, by place", Icon: CircleAlert, body: (
        <div className="space-y-2">
          {INNOVATIONS.map((x) => (
            <div key={x.place} className="period-callout is-amber"><strong>{x.place}</strong> — {saw(x.text)}</div>
          ))}
        </div>
      ),
    },
  ];
  return (
    <>
      <div className="period-card rq-hero">
        <div className="rq-icon-circle mb-3"><GraduationCap size={20} /></div>
        <h2 className="rq-hero-title text-left">Knowledge & reference</h2>
        <p className="period-muted mt-1 text-sm">The standard is simply what the Prophet <span className="period-saw">ﷺ</span> did.</p>
      </div>
      <div className="period-card rq-learn-list p-0">
        {sections.map((s, i) => {
          const isOpen = open === s.id;
          return (
            <div key={s.id} className={i > 0 ? "rq-learn-row-border" : ""}>
              <button className="rq-learn-row" aria-expanded={isOpen} onClick={() => { setOpen(isOpen ? null : s.id); void triggerHaptic("light"); }}>
                <span className="rq-icon-circle rq-icon-circle-sm"><s.Icon size={17} /></span>
                <span className="flex-1 text-left">
                  <span className="block text-[15px] font-semibold">{s.title}</span>
                  <span className="period-muted block text-xs">{s.sub}</span>
                </span>
                <ChevronRight size={17} className={`rq-group-chevron ${isOpen ? "is-open" : ""}`} />
              </button>
              <div className="rq-learn-content" aria-hidden={!isOpen}>
                <div><div className="hj-learn-body space-y-3">{s.body}</div></div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
