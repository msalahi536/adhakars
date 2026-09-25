import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Ban, BookOpen, Check, ChevronLeft, ChevronRight, CircleAlert, Minus, Moon, Plus, Sparkles, Sunrise, Sunset,
} from "lucide-react";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { triggerHaptic } from "@/lib/theme";
import type { SunnahItem } from "@/data/period-sunnah";
import {
  ARAFAH, ARAFAH_DIFF_NOTE, ASHURA, BEED, BUKHARI_1909, BUKHARI_2014, DAWUD, DOES_NOT_BREAK, DOUBT_TEXT, EIDS_TEXT,
  EXCUSED_NOTE, FORGETFUL, FRIDAY, HIJRI_MONTHS, IFTAR, IFTAR_DUA, IMSAK_TEXT, INTENTION, MON_THU, MUHARRAM, SHAWWAL,
  SUHOOR, TASHRIQ, THREE_DAYS, WEAK_IFTAR_TEXT,
} from "@/data/fasting";
import {
  FASTING_EVENT, FAST_TYPE_LABELS, addDaysKey, clearLog, dayInfo, effectiveLog, excuseDay, getFastingState, keyOf,
  localHijri, logFast, logWarnings, nextRecommended, parseKey, qadaOwed, ramadanInfo, setFastingState, shawwalProgress,
  stats, suggestedType, todayKey, upcomingSpecial, type DayInfo, type ExcuseReason, type FastType, type FastingState,
} from "@/lib/fasting";
import { rescheduleFastingNotifications } from "@/lib/fasting-notifications";
import { fetchDay, formatCountdown, getPrayerSettings, slotsForDay } from "@/lib/prayer-times";

export const Route = createFileRoute("/app/fasting")({
  head: () => ({
    meta: [
      { title: "Fasting Companion, Sahih Al-Adhkar" },
      { name: "description", content: "Hijri fasting calendar, Ramadan tracker, suhoor and iftar times with authentic narrations." },
      { property: "og:title", content: "Fasting Companion, Sahih Al-Adhkar" },
      { property: "og:description", content: "Voluntary fasts, forbidden days and Ramadan — every source verified." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FastingCompanion,
});

const saw = (t: string) => t.split("ﷺ").flatMap((part, i) => (i ? [<span key={i} className="period-saw">ﷺ</span>, part] : [part]));
const hijriLabel = (d: number, m: number) => `${d} ${HIJRI_MONTHS[m - 1]}`;
const niceDate = (k: string, opts: Intl.DateTimeFormatOptions = { weekday: "long", month: "short", day: "numeric" }) =>
  parseKey(k).toLocaleDateString(undefined, opts);

type Tab = "calendar" | "ramadan" | "log" | "learn";

function useFasting() {
  const [s, set] = useState<FastingState>(getFastingState);
  useEffect(() => {
    const r = () => set(getFastingState());
    window.addEventListener(FASTING_EVENT, r);
    window.addEventListener("period:update", r);
    return () => { window.removeEventListener(FASTING_EVENT, r); window.removeEventListener("period:update", r); };
  }, []);
  return s;
}

function FastingCompanion() {
  const [mounted, setMounted] = useState(false);
  const s = useFasting();
  const [tab, setTab] = useState<Tab>("calendar");
  useEffect(() => setMounted(true), []);
  useEffect(() => { if (mounted) void rescheduleFastingNotifications(); }, [mounted, s]);
  useEffect(() => { if (mounted && localHijri(todayKey(), s.offset).m === 9) setTab("ramadan"); }, [mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (t: Tab) => { setTab(t); void triggerHaptic("light"); document.querySelector(".period-scroll-area")?.scrollTo({ top: 0 }); };
  const tabs: { id: Tab; label: string }[] = [
    { id: "calendar", label: "Calendar" }, { id: "ramadan", label: "Ramadan" }, { id: "log", label: "Log" }, { id: "learn", label: "Learn" },
  ];

  return (
    <>
      <header className="page-header period-header rq-header relative overflow-hidden" style={{ background: "var(--grad-header)", color: "var(--header-fg)" }}>
        <HeaderBackButton />
        <div className="relative mx-auto max-w-md px-16 pb-4 pt-7 text-center">
          <div className="label-caps" style={{ color: "var(--header-sub)", opacity: 1 }}>Fasting Companion</div>
          <h1 className="app-page-title mt-2">Sawm</h1>
        </div>
        <div className="period-tabs mx-auto max-w-md" role="tablist">
          {tabs.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? "is-active" : ""} onClick={() => go(t.id)}>{t.label}</button>
          ))}
        </div>
      </header>
      <main className="scroll-area period-scroll-area rq-scroll-area">
        <div className="mx-auto max-w-md space-y-4 px-5 pb-8 pt-4">
          {mounted && (
            <div className="rq-view-transition space-y-4" key={tab}>
              {tab === "calendar" && <CalendarView s={s} />}
              {tab === "ramadan" && <RamadanView s={s} />}
              {tab === "log" && <LogView s={s} />}
              {tab === "learn" && <LearnView />}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

// ================= shared =================

function DuaCard({ item, weak }: { item: SunnahItem; weak?: boolean }) {
  return (
    <article className={`period-card fs-dua ${weak ? "is-weak" : ""}`}>
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

function Amber({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="period-callout is-amber"><strong>{label}</strong> — {children}</div>;
}

function usePrayerDay() {
  const [times, setTimes] = useState<{ fajr: Date; maghrib: Date } | null>(null);
  const [noLoc, setNoLoc] = useState(false);
  useEffect(() => {
    const settings = getPrayerSettings();
    if (!settings.location) { setNoLoc(true); return; }
    void fetchDay(new Date(), settings).then((d) => {
      if (!d) return;
      const slots = slotsForDay(d);
      const fajr = slots.find((x) => x.id === "fajr")?.at;
      const maghrib = slots.find((x) => x.id === "maghrib")?.at;
      if (fajr && maghrib) setTimes({ fajr, maghrib });
    });
  }, []);
  return { times, noLoc };
}

const fmtTime = (d: Date) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

// ================= CALENDAR =================

function CalendarView({ s }: { s: FastingState }) {
  const today = todayKey();
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1, 12); });
  const [open, setOpen] = useState<string | null>(null);
  const th = localHijri(today, s.offset);
  const next = useMemo(() => nextRecommended(s), [s]);
  const special = useMemo(() => upcomingSpecial(s), [s]);
  const shawwal = shawwalProgress(s);

  const cells = useMemo(() => {
    const y = month.getFullYear(), m = month.getMonth();
    const first = new Date(y, m, 1, 12).getDay();
    const count = new Date(y, m + 1, 0).getDate();
    const out: (DayInfo | null)[] = Array.from({ length: first }, () => null);
    for (let d = 1; d <= count; d++) out.push(dayInfo(keyOf(new Date(y, m, d, 12)), s));
    return out;
  }, [month, s]);

  const hijriRange = (() => {
    const a = cells.find(Boolean)!, b = cells[cells.length - 1]!;
    const am = HIJRI_MONTHS[a.hijri.m - 1], bm = HIJRI_MONTHS[b.hijri.m - 1];
    return am === bm ? `${am} ${a.hijri.y}` : `${am} – ${bm} ${b.hijri.y} AH`;
  })();

  return (
    <>
      <MoonPrompt s={s} />

      <section className="period-card fs-today">
        <div className="fs-today-hijri">
          <span className="label-caps">Today · expected</span>
          <strong>{hijriLabel(th.d, th.m)} {th.y}</strong>
          <span className="fs-muted">{niceDate(today)}</span>
        </div>
        {next && (
          <button className="fs-next" onClick={() => setOpen(next.key)}>
            <Sparkles size={15} />
            <span>Next recommended fast: <strong>{niceDate(next.key, { weekday: "long", month: "short", day: "numeric" })}</strong></span>
            <ChevronRight size={15} />
          </button>
        )}
      </section>

      {special && (
        <section className="period-card fs-special">
          <div className="label-caps">In {special.inDays} {special.inDays === 1 ? "day" : "days"}</div>
          <h3>{special.info.tags.includes("arafah") ? "The Day of ‘Arafah" : "‘Ashura"} — {niceDate(special.info.key)}</h3>
          <DuaCard item={special.info.tags.includes("arafah") ? ARAFAH : ASHURA} />
        </section>
      )}

      {th.m === 10 && (
        <section className="period-card fs-counter">
          <div>
            <div className="label-caps">Six of Shawwal</div>
            <strong>{shawwal} of 6 completed</strong>
          </div>
          <div className="fs-dots">{Array.from({ length: 6 }, (_, i) => <span key={i} className={i < shawwal ? "is-on" : ""} />)}</div>
        </section>
      )}
      {th.m === 1 && <DuaCard item={MUHARRAM} />}
      {th.m === 12 && th.d <= 13 && (
        <Amber label="Dhul-Hijjah">‘Eid and the days of Tashriq (10–13) are blocked. The white days do not apply this month — the 13th is a day of Tashriq.</Amber>
      )}

      <section className="period-card fs-cal">
        <div className="period-calendar-heading">
          <button className="period-icon-btn" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1, 12))}><ChevronLeft size={18} /></button>
          <div className="text-center">
            <div className="period-calendar-month">{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</div>
            <div className="fs-muted mt-1 text-[11px]">{hijriRange}</div>
          </div>
          <button className="period-icon-btn" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1, 12))}><ChevronRight size={18} /></button>
        </div>
        <div className="fs-grid">
          {["S", "M", "T", "W", "T", "F", "S"].map((w, i) => <div key={i} className="fs-wd">{w}</div>)}
          {cells.map((c, i) => {
            if (!c) return <div key={`b${i}`} />;
            const log = effectiveLog(c.key, s);
            const cls = [
              "fs-day",
              `is-${c.kind}`,
              c.key === today ? "is-today" : "",
              log?.status === "fasted" ? "is-done" : "",
              log?.status === "excused" ? "is-excused" : "",
            ].join(" ");
            return (
              <button key={c.key} className={cls} onClick={() => { setOpen(c.key); void triggerHaptic("light"); }} aria-label={`${niceDate(c.key)}, ${hijriLabel(c.hijri.d, c.hijri.m)}`}>
                <span className="fs-g">{parseKey(c.key).getDate()}</span>
                <span className="fs-h">{c.hijri.d}</span>
                {log?.status === "fasted" && <Check size={10} strokeWidth={3} className="fs-check" />}
              </button>
            );
          })}
        </div>
        <div className="fs-legend">
          <span><i className="is-recommended" /> Recommended</span>
          <span><i className="is-special" /> Special</span>
          <span><i className="is-ramadan" /> Ramadan</span>
          <span><i className="is-forbidden" /> Forbidden</span>
          <span><i className="is-done" /> Fasted</span>
        </div>
        <p className="fs-muted mt-3 text-center text-[11px]">Hijri dates are expected (Umm al-Qura{s.offset ? `, ${s.offset > 0 ? "+" : ""}${s.offset} day` : ""}) until confirmed by your community.</p>
      </section>

      <CalendarSettings s={s} />

      {open && <DayDialog k={open} s={s} onClose={() => setOpen(null)} />}
    </>
  );
}

function MoonPrompt({ s }: { s: FastingState }) {
  const h = localHijri(todayKey(), s.offset);
  let which: { key: string; q: string } | null = null;
  if (h.m === 9 && h.d <= 3) which = { key: `${h.y}-9`, q: "Has your community announced the sighting of the Ramadan moon?" };
  else if ((h.m === 9 && h.d >= 28) || (h.m === 10 && h.d <= 2)) which = { key: `${h.y}-10`, q: "Has your community announced Eid?" };
  else if (h.m === 12 && h.d <= 3) which = { key: `${h.y}-12`, q: "Has your community announced the start of Dhul-Hijjah? Confirm or adjust the date." };
  if (!which || s.confirmed.includes(which.key)) return null;
  const confirm = () => setFastingState({ confirmed: [...s.confirmed, which!.key] });
  return (
    <section className="period-card fs-moon">
      <div className="flex items-start gap-3">
        <span className="fs-moon-icon"><Moon size={18} /></span>
        <div className="flex-1">
          <h3 className="text-[15px] font-bold">{which.q}</h3>
          <p className="fs-muted mt-1 text-xs">Today is expected to be {hijriLabel(h.d, h.m)}. Adjust if your local announcement differs.</p>
        </div>
      </div>
      <div className="fs-offset mt-3">
        <button aria-label="One day earlier" onClick={() => setFastingState({ offset: s.offset - 1 })} disabled={s.offset <= -2}><Minus size={14} /></button>
        <span>{s.offset === 0 ? "No adjustment" : `${s.offset > 0 ? "+" : ""}${s.offset} day${Math.abs(s.offset) > 1 ? "s" : ""}`}</span>
        <button aria-label="One day later" onClick={() => setFastingState({ offset: s.offset + 1 })} disabled={s.offset >= 2}><Plus size={14} /></button>
      </div>
      <button className="period-btn mt-3 w-full min-h-[42px]" onClick={confirm}>Confirm</button>
    </section>
  );
}

function CalendarSettings({ s }: { s: FastingState }) {
  return (
    <details className="period-card fs-settings">
      <summary>Calendar settings <ChevronRight size={15} className="hj-chev" /></summary>
      <div className="fs-set-row">
        <div><strong>Local sighting adjustment</strong><span>Shift Hijri dates −2 to +2 days. ‘Arafah always follows the Saudi date.</span></div>
        <div className="fs-offset">
          <button aria-label="Earlier" onClick={() => setFastingState({ offset: s.offset - 1 })} disabled={s.offset <= -2}><Minus size={14} /></button>
          <span>{s.offset > 0 ? "+" : ""}{s.offset}</span>
          <button aria-label="Later" onClick={() => setFastingState({ offset: s.offset + 1 })} disabled={s.offset >= 2}><Plus size={14} /></button>
        </div>
      </div>
      <label className="fs-set-row">
        <div><strong>Fast of Dawud</strong><span>Alternate days from today — the most beloved pattern, and the most demanding one allowed.</span></div>
        <input type="checkbox" className="fs-switch" checked={s.dawud.on} onChange={(e) => setFastingState({ dawud: { on: e.target.checked, start: e.target.checked ? todayKey() : null } })} />
      </label>
      <label className="fs-set-row">
        <div><strong>I am on Hajj this year</strong><span>The pilgrim at ‘Arafah does not fast.</span></div>
        <input type="checkbox" className="fs-switch" checked={s.onHajj} onChange={(e) => setFastingState({ onHajj: e.target.checked })} />
      </label>
      {s.dawud.on && <DuaCard item={DAWUD} />}
    </details>
  );
}

const TAG_TEXT: Partial<Record<string, string>> = {
  ramadan: "Ramadan — obligatory fast",
  arafah: "The Day of ‘Arafah (Saudi date)",
  "arafah-local": "Your local 9 Dhul-Hijjah",
  ashura: "‘Ashura — 10 Muharram",
  "ashura-9": "9 Muharram — the accompanying day to ‘Ashura",
  shawwal: "Shawwal — six days may be fasted",
  muharram: "Muharram — the best month for voluntary fasting",
  beed: "Ayyam al-Beed — a white day",
  monthu: "Monday / Thursday",
  dawud: "Your fast of Dawud day",
};

function DayDialog({ k, s, onClose }: { k: string; s: FastingState; onClose: () => void }) {
  const info = dayInfo(k, s);
  const log = effectiveLog(k, s);
  const [type, setType] = useState<FastType>(suggestedType(info));
  const [ackWarn, setAckWarn] = useState(false);
  const [intended, setIntended] = useState(false);
  const warnings = logWarnings(k, s);
  const isFuture = k > todayKey();
  const obligatory = type === "ramadan" || type === "qada";
  const needsIntent = obligatory && k === todayKey();

  const items: SunnahItem[] = [];
  if (info.tags.includes("tashriq")) items.push(TASHRIQ);
  if (info.tags.includes("ramadan")) items.push(BUKHARI_2014);
  if (info.tags.includes("arafah") || info.tags.includes("arafah-local")) items.push(ARAFAH);
  if (info.tags.includes("ashura") || info.tags.includes("ashura-9")) items.push(ASHURA);
  if (info.tags.includes("shawwal")) items.push(SHAWWAL);
  if (info.tags.includes("muharram")) items.push(MUHARRAM);
  if (info.tags.includes("beed")) items.push(BEED, THREE_DAYS);
  if (info.tags.includes("monthu")) items.push(MON_THU);
  if (info.tags.includes("dawud")) items.push(DAWUD);

  const save = () => { logFast(k, type); void triggerHaptic("success"); onClose(); };
  const excuse = (r: ExcuseReason) => { excuseDay(k, r); onClose(); };
  const canLog = !info.blocked && !isFuture && (warnings.length === 0 || ackWarn) && (!needsIntent || intended);
  const showArafahDiff = (info.tags.includes("arafah") && !(info.hijri.m === 12 && info.hijri.d === 9)) || info.tags.includes("arafah-local");

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="period-dialog fs-dialog [&>button:last-child]:hidden">
        <div className="period-dialog-head">
          <span className={`fs-dialog-dot is-${info.kind}`}>{info.blocked ? <Ban size={16} /> : <Moon size={16} />}</span>
          <span>
            <DialogTitle>{niceDate(k)}</DialogTitle>
            <DialogDescription>{hijriLabel(info.hijri.d, info.hijri.m)} {info.hijri.y} · expected</DialogDescription>
          </span>
        </div>
        <div className="period-dialog-scroll space-y-3">
          {info.tags.includes("eid-fitr") && <div className="fs-block"><Ban size={15} /><span><strong>‘Eid al-Fitr — fasting is forbidden.</strong> {EIDS_TEXT}</span></div>}
          {info.tags.includes("eid-adha") && <div className="fs-block"><Ban size={15} /><span><strong>‘Eid al-Adha — fasting is forbidden.</strong> {EIDS_TEXT}</span></div>}
          {info.tags.includes("tashriq") && <div className="fs-block"><Ban size={15} /><span><strong>A day of Tashriq — fasting is forbidden.</strong> “The days of Tashriq are days of eating and drinking” (Muslim 1141).</span></div>}

          {info.tags.filter((t) => TAG_TEXT[t]).length > 0 && (
            <ul className="fs-tags">{info.tags.filter((t) => TAG_TEXT[t]).map((t) => <li key={t} className={`is-${t}`}>{TAG_TEXT[t]}</li>)}</ul>
          )}
          {info.tags.includes("arafah") && s.onHajj && <Amber label="On Hajj">The pilgrim at ‘Arafah does not fast, since the Prophet ﷺ stood there not fasting.</Amber>}
          {showArafahDiff && <Amber label="Two possible dates">{ARAFAH_DIFF_NOTE}</Amber>}
          {info.tags.includes("ashura-9") && <p className="fs-muted text-xs">The 9th is fasted alongside the 10th, not as a separate fast.</p>}

          {items.map((it) => <DuaCard key={it.id} item={it} />)}

          {!info.blocked && warnings.includes("friday") && <DuaCard item={FRIDAY} />}
          {!info.blocked && warnings.includes("doubt") && <Amber label="The day of doubt">{DOUBT_TEXT}</Amber>}
        </div>

        {!info.blocked && (
          <div className="fs-log">
            {log ? (
              <div className="fs-logged">
                <span><Check size={14} /> {log.status === "fasted" ? `Fasted · ${FAST_TYPE_LABELS[log.type]}` : `Excused · ${log.reason}`}</span>
                {s.logs[k] && <button onClick={() => { clearLog(k); onClose(); }}>Remove</button>}
              </div>
            ) : isFuture ? (
              <p className="fs-muted text-center text-xs">You can log this fast on the day.</p>
            ) : (
              <>
                <select className="settings-select w-full" value={type} onChange={(e) => setType(e.target.value as FastType)} aria-label="Fast type">
                  {(Object.keys(FAST_TYPE_LABELS) as FastType[]).map((t) => <option key={t} value={t}>{FAST_TYPE_LABELS[t]}</option>)}
                </select>
                {warnings.length > 0 && (
                  <label className="fs-ack"><input type="checkbox" checked={ackWarn} onChange={(e) => setAckWarn(e.target.checked)} /> I have read the note above</label>
                )}
                {needsIntent && (
                  <label className="fs-ack"><input type="checkbox" checked={intended} onChange={(e) => setIntended(e.target.checked)} /> I formed the intention before Fajr</label>
                )}
                {!obligatory && k === todayKey() && <p className="fs-muted text-[11px]">A voluntary fast may be intended during the day, if nothing has been eaten or drunk since dawn.</p>}
                <button className="period-btn w-full min-h-[44px]" disabled={!canLog} onClick={save}>{k === todayKey() ? "I’m fasting today" : "I fasted this day"}</button>
                {info.tags.includes("ramadan") && (
                  <div className="fs-excuse">
                    <span>Excused</span>
                    {(["illness", "travel", "menstruation"] as ExcuseReason[]).map((r) => <button key={r} onClick={() => excuse(r)}>{r[0].toUpperCase() + r.slice(1)}</button>)}
                  </div>
                )}
              </>
            )}
          </div>
        )}
        <button className="fs-close" onClick={onClose}>Close</button>
      </DialogContent>
    </Dialog>
  );
}

// ================= RAMADAN =================

function RamadanView({ s }: { s: FastingState }) {
  const r = ramadanInfo(s);
  const owed = qadaOwed(s);
  const { times, noLoc } = usePrayerDay();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const today = todayKey();
  const todayLog = effectiveLog(today, s);

  const startsIn = useMemo(() => {
    if (r.active) return null;
    for (let i = 1; i < 360; i++) if (localHijri(addDaysKey(today, i), s.offset).m === 9) return { days: i, key: addDaysKey(today, i) };
    return null;
  }, [r.active, s.offset, today]);

  const toIftar = times ? times.maghrib.getTime() - now.getTime() : 0;
  const suhoorEnd = times ? new Date(times.fajr.getTime() - s.buffer * 60000) : null;

  return (
    <>
      <MoonPrompt s={s} />
      {r.active ? (
        <section className="period-card fs-ram-hero">
          <div className="label-caps">Ramadan · expected</div>
          <h2>Day {r.day} <span>of Ramadan</span></h2>
          <div className="fs-ram-stats">
            <div><strong>{r.fasted}</strong><span>Fasted</span></div>
            <div><strong>{r.remaining}</strong><span>Remaining</span></div>
            <div><strong>{owed}</strong><span>To make up</span></div>
          </div>
          {!todayLog ? (
            <div className="fs-ram-actions">
              <button className="period-btn" onClick={() => { logFast(today, "ramadan"); void triggerHaptic("success"); }}>I’m fasting today</button>
              <div className="fs-excuse">
                <span>Excused</span>
                {(["illness", "travel", "menstruation"] as ExcuseReason[]).map((x) => <button key={x} onClick={() => excuseDay(today, x)}>{x[0].toUpperCase() + x.slice(1)}</button>)}
              </div>
            </div>
          ) : (
            <p className="fs-ram-logged"><Check size={14} /> {todayLog.status === "fasted" ? "Today is logged as fasted" : "Today is excused — added to days to make up"}</p>
          )}
        </section>
      ) : (
        <section className="period-card fs-ram-hero">
          <div className="label-caps">Ramadan</div>
          <h2>{startsIn ? <>In {startsIn.days} <span>days</span></> : "Ramadan"}</h2>
          {startsIn && <p className="fs-muted text-sm">Expected to begin {niceDate(startsIn.key, { weekday: "long", month: "long", day: "numeric" })}, subject to sighting.</p>}
          {owed > 0 && <p className="fs-ram-logged mt-3">{owed} {owed === 1 ? "day" : "days"} to make up</p>}
        </section>
      )}

      {r.active && r.excused > 0 && <div className="period-callout is-grey">{EXCUSED_NOTE}</div>}

      <section className="period-card fs-times">
        {noLoc ? (
          <p className="text-sm">Set your location on the <Link to="/app/salah" className="font-bold" style={{ color: "var(--accent)" }}>Salah</Link> page to see suhoor and iftar times.</p>
        ) : !times ? (
          <p className="fs-muted text-sm">Loading today’s times…</p>
        ) : (
          <>
            {toIftar > 0 && (
              <div className="fs-countdown">
                <span className="label-caps">Iftar in</span>
                <strong>{formatCountdown(toIftar)}</strong>
              </div>
            )}
            <div className="fs-time-row">
              <div><Sunrise size={17} /><span>Suhoor ends</span><strong>{fmtTime(suhoorEnd!)}</strong></div>
              <div><Sunset size={17} /><span>Iftar</span><strong>{fmtTime(times.maghrib)}</strong></div>
            </div>
            <p className="fs-muted mt-2 text-center text-[11px]">
              Suhoor ends at Fajr, iftar at Maghrib{s.buffer ? ` · includes your ${s.buffer}-minute personal buffer (not from the Sunnah)` : ""}.
            </p>
          </>
        )}
      </section>

      {r.lastTen && (
        <section className="period-card fs-qadr">
          <div className="label-caps">The last ten nights</div>
          <p className="mt-1 text-sm leading-relaxed">Whoever stands in prayer on Laylat al-Qadr out of faith and seeking reward, his past sins are forgiven.</p>
          <div className="period-source mt-2"><BookOpen size={12} /> Bukhari 2014</div>
        </section>
      )}

      <div className="fs-section-label">Suhoor</div>
      <DuaCard item={SUHOOR} />
      <div className="fs-section-label">Iftar</div>
      <DuaCard item={IFTAR} />
      <DuaCard item={IFTAR_DUA} />
      <details className="period-card fs-weak">
        <summary><CircleAlert size={15} /> The popular one is weak <ChevronRight size={15} className="hj-chev" /></summary>
        <p>{WEAK_IFTAR_TEXT}</p>
        <p className="fs-muted mt-2 text-xs">Source: Abu Dawud 2358 · Da‘if (al-Albani)</p>
      </details>
      <DuaCard item={BUKHARI_2014} />

      <ReminderSettings s={s} />
    </>
  );
}

function ReminderSettings({ s }: { s: FastingState }) {
  return (
    <details className="period-card fs-settings">
      <summary>Suhoor & iftar reminders <ChevronRight size={15} className="hj-chev" /></summary>
      <label className="fs-set-row">
        <div><strong>Suhoor reminder</strong><span>{s.suhoorMins} minutes before Fajr on fasting days</span></div>
        <input type="checkbox" className="fs-switch" checked={s.suhoorReminder} onChange={(e) => setFastingState({ suhoorReminder: e.target.checked })} />
      </label>
      {s.suhoorReminder && (
        <div className="fs-set-row">
          <div><strong>Remind me</strong><span>Minutes before Fajr</span></div>
          <select className="settings-select" value={s.suhoorMins} onChange={(e) => setFastingState({ suhoorMins: Number(e.target.value) })}>
            {[15, 30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} min</option>)}
          </select>
        </div>
      )}
      <label className="fs-set-row">
        <div><strong>Iftar reminder</strong><span>At Maghrib on fasting days</span></div>
        <input type="checkbox" className="fs-switch" checked={s.iftarReminder} onChange={(e) => setFastingState({ iftarReminder: e.target.checked })} />
      </label>
      <div className="fs-set-row">
        <div><strong>Personal buffer (optional)</strong><span>Not from the Sunnah — shown only if you choose it.</span></div>
        <select className="settings-select" value={s.buffer} onChange={(e) => setFastingState({ buffer: Number(e.target.value) })}>
          {[0, 5, 10].map((m) => <option key={m} value={m}>{m ? `${m} min` : "None"}</option>)}
        </select>
      </div>
      <Amber label="There is no imsak in the Sunnah">{IMSAK_TEXT}</Amber>
      <p className="fs-muted text-[11px]">Reminders work in the installed app. Notifications must be allowed.</p>
    </details>
  );
}

// ================= LOG =================

function LogView({ s }: { s: FastingState }) {
  const st = stats(s);
  const owed = qadaOwed(s);
  const shawwal = shawwalProgress(s);
  const inShawwal = localHijri(todayKey(), s.offset).m === 10;
  const [filter, setFilter] = useState<FastType | "all">("all");
  const [open, setOpen] = useState<string | null>(null);

  const entries = Object.entries(s.logs)
    .filter(([, l]) => filter === "all" || (l.status === "fasted" && l.type === filter))
    .sort((a, b) => (a[0] < b[0] ? 1 : -1));
  const byMonth = entries.reduce<Record<string, typeof entries>>((acc, e) => { (acc[e[0].slice(0, 7)] ??= []).push(e); return acc; }, {});
  const today = todayKey();
  const todayInfo = dayInfo(today, s);

  return (
    <>
      <section className="period-card fs-log-hero">
        <div>
          <div className="label-caps">Today</div>
          <strong>{effectiveLog(today, s) ? "Logged" : todayInfo.blocked ? "Fasting is forbidden today" : "Not logged yet"}</strong>
        </div>
        {!todayInfo.blocked && <button className="period-btn" onClick={() => setOpen(today)}>{effectiveLog(today, s) ? "View" : "Log today"}</button>}
      </section>

      <div className="fs-stats">
        <div><strong>{st.totalYear}</strong><span>Fasts this year</span></div>
        <div><strong>{st.voluntaryMonth}</strong><span>Voluntary this month</span></div>
        <div><strong>{st.streak}</strong><span>Current streak</span></div>
        <div><strong>{owed}</strong><span>Qada’ remaining</span></div>
      </div>
      <p className="fs-muted text-center text-xs">Fasted {st.mondaysFasted} of {st.mondays} Mondays this month{inShawwal ? ` · Shawwal ${shawwal} of 6` : ""}</p>

      <div className="fs-chips">
        {(["all", ...Object.keys(FAST_TYPE_LABELS)] as (FastType | "all")[]).map((t) => (
          <button key={t} className={filter === t ? "is-active" : ""} onClick={() => setFilter(t)}>{t === "all" ? "All" : FAST_TYPE_LABELS[t]}</button>
        ))}
      </div>

      {entries.length === 0 ? (
        <section className="period-card text-center">
          <p className="text-sm font-semibold">No fasts logged yet</p>
          <p className="fs-muted mt-1 text-xs">Tap any day on the calendar to log a fast, including past days.</p>
        </section>
      ) : (
        Object.entries(byMonth).map(([m, list]) => (
          <section key={m} className="period-card fs-history">
            <div className="label-caps">{parseKey(`${m}-01`).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</div>
            <ul>
              {list.map(([k, l]) => {
                const h = localHijri(k, s.offset);
                return (
                  <li key={k}>
                    <button onClick={() => setOpen(k)}>
                      <span className={`fs-hist-dot ${l.status === "excused" ? "is-excused" : ""}`} />
                      <span className="flex-1 text-left"><strong>{niceDate(k, { weekday: "short", month: "short", day: "numeric" })}</strong><em>{hijriLabel(h.d, h.m)}</em></span>
                      <span className="fs-hist-type">{l.status === "fasted" ? FAST_TYPE_LABELS[l.type] : `Excused · ${l.reason}`}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
      {open && <DayDialog k={open} s={s} onClose={() => setOpen(null)} />}
    </>
  );
}

// ================= LEARN =================

type LearnSection = { id: string; title: string; body: React.ReactNode };

function LearnView() {
  const [open, setOpen] = useState<string | null>(null);
  const sections: LearnSection[] = [
    { id: "suhoor", title: "Suhoor — delay it", body: <><DuaCard item={SUHOOR} /><Amber label="There is no imsak in the Sunnah">{IMSAK_TEXT}</Amber></> },
    { id: "iftar", title: "Iftar — hasten it", body: <DuaCard item={IFTAR} /> },
    { id: "dua", title: "The iftar du‘a", body: <><DuaCard item={IFTAR_DUA} /><Amber label="The popular one is weak">{WEAK_IFTAR_TEXT}</Amber></> },
    { id: "intention", title: "Intention", body: <DuaCard item={INTENTION} /> },
    { id: "break", title: "What does not break the fast", body: <><DuaCard item={FORGETFUL} /><ul className="fs-list">{DOES_NOT_BREAK.map((x) => <li key={x}><Check size={13} /> {x}</li>)}</ul></> },
    { id: "earns", title: "What fasting Ramadan earns", body: <DuaCard item={BUKHARI_2014} /> },
    { id: "month", title: "Starting and ending the month", body: <DuaCard item={BUKHARI_1909} /> },
    { id: "voluntary", title: "The voluntary fasts", body: <>{[MON_THU, BEED, THREE_DAYS, ASHURA, ARAFAH, SHAWWAL, MUHARRAM, DAWUD].map((it) => <DuaCard key={it.id} item={it} />)}</> },
    { id: "forbidden", title: "Days fasting is forbidden or disliked", body: <><div className="fs-block"><Ban size={15} /><span><strong>The two ‘Eids — forbidden.</strong> {EIDS_TEXT}</span></div><DuaCard item={TASHRIQ} /><DuaCard item={FRIDAY} /><Amber label="The day of doubt">{DOUBT_TEXT}</Amber></> },
  ];
  return (
    <>
      <section className="period-card fs-learn-intro">
        <h2>Fasting in the Sunnah</h2>
        <p>Suhoor, iftar, intention and the fasts the Prophet ﷺ encouraged — every source verified.</p>
      </section>
      <div className="fs-learn-list">
        {sections.map((sec, i) => {
          const isOpen = open === sec.id;
          return (
            <div key={sec.id} className={`period-card fs-learn-row ${isOpen ? "is-open" : ""}`}>
              <button className="fs-learn-head" aria-expanded={isOpen} onClick={() => { setOpen(isOpen ? null : sec.id); void triggerHaptic("light"); }}>
                <span className="fs-learn-num">{i + 1}</span>
                <span className="flex-1 text-left">{sec.title}</span>
                <ChevronRight size={16} className="fs-learn-chev" />
              </button>
              <div className="fs-learn-body"><div><div className="space-y-3 pt-3">{isOpen && sec.body}</div></div></div>
            </div>
          );
        })}
      </div>
    </>
  );
}
