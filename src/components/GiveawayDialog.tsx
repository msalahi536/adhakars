import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Award, BookOpen, Check, Copy, Gift, Layers, ListChecks, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  GOALS,
  completedGoals,
  getDeviceCode,
  getDhikr,
  getEntered,
  getStatus,
  getSurahs,
  onGiveawayChange,
  referralLink,
  setEntered,
  setStatus,
} from "@/lib/giveaway";
import { getReferralCount, submitGiveawayEntry } from "@/lib/giveaway.functions";

const LEVELS = [
  { name: "Level 1 · Beginner Foundations", books: "Thalāthat al-Uṣūl · Al-Qawā‘id al-Arba‘a · Nawāqiḍ al-Islām" },
  { name: "Level 2 · Core Knowledge", books: "Kashf ash-Shubuhāt · Kitāb al-Tawḥīd" },
  { name: "Level 3 · Advanced Beginner Studies", books: "Al-Uṣūl al-Sittah · Al-‘Aqīdah al-Wāsiṭiyyah" },
];
const FEATURES = [
  { Icon: BookOpen, t: "Guided, distraction-free reader" },
  { Icon: ListChecks, t: "Comprehension prompts & quizzes" },
  { Icon: Layers, t: "Spaced-repetition flashcards" },
  { Icon: Award, t: "A certificate for every level" },
];

function Oath({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-muted/40 px-3 py-2.5 text-xs leading-5">
      <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}

function Bar({ label, value, goal, children }: { label: string; value: number; goal: number; children?: React.ReactNode }) {
  const done = value >= goal;
  return (
    <div className="rounded-2xl bg-muted/40 px-3 py-2.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">{label}</span>
        <span className="flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
          {done && <Check size={13} className="text-accent" />}
          {Math.min(value, goal)}/{goal}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border/60">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.min(100, (value / goal) * 100)}%` }} />
      </div>
      {children}
    </div>
  );
}

const GOAL_NAME: Record<string, string> = { surahs: "read 5 surahs", dhikr: "made 500 dhikr", referrals: "brought 5 people to the app" };

export function GiveawayDialog({ open, onClose, celebrate }: { open: boolean; onClose: () => void; celebrate?: string | null }) {
  const [status, setLocal] = useState(getStatus());
  useEffect(() => { if (celebrate) setMsg(null); }, [celebrate]);
  const [o1, setO1] = useState(false);
  const [o2, setO2] = useState(false);
  const [surahs, setSurahs] = useState(0);
  const [dhikr, setDhikr] = useState(0);
  const [refs, setRefs] = useState(0);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [entered, setEnt] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const countRefs = useServerFn(getReferralCount);
  const submit = useServerFn(submitGiveawayEntry);

  useEffect(() => {
    if (!open) return;
    const sync = () => {
      setLocal(getStatus());
      setSurahs(getSurahs().length);
      setDhikr(getDhikr());
      setEnt(getEntered());
    };
    sync();
    if (getStatus() === "joined") countRefs({ data: { code: getDeviceCode() } }).then((r) => setRefs(r.count)).catch(() => {});
    return onGiveawayChange(sync);
  }, [open, countRefs]);

  const goals = completedGoals({ surahs, dhikr, referrals: refs });
  const newGoals = goals.filter((g) => !entered.includes(g));
  const link = status === "joined" ? referralLink() : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };
  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: "Sahih Al-Adhkar", text: "Authentic daily adhkar & Quran — free, no ads.", url: link }).catch(() => {});
    } else void copy();
  };

  const onSubmit = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await submit({ data: { code: getDeviceCode(), email, surahs, dhikr } });
      if (r.ok) {
        setEntered(r.goals);
        setMsg(r.goals.length < 3 ? "Barakallahu feek! You can still finish the other goals for extra entries." : "Barakallahu feek! You have all 3 entries.");
      } else setMsg(r.error);
    } catch {
      setMsg("Please check your email and try again.");
    }
    setBusy(false);
  };

  return (
    <Dialog open={open} onOpenChange={(n) => !n && onClose()}>
      <DialogContent className="update-dialog grid max-h-[86dvh] w-[calc(100%_-_32px)] max-w-[410px] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-3xl border-border/60 bg-card p-0 text-card-foreground">
        <DialogHeader className="px-6 pb-3 pt-6 text-left">
          <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-muted/60 text-accent"><Gift size={20} strokeWidth={1.7} /></span>
          <p className="label-caps text-accent">Giveaway · ends Friday, Oct 23</p>
          <DialogTitle className="font-display text-[26px] font-semibold leading-tight">Win lifetime access to Ilm Guide</DialogTitle>
          <DialogDescription className="pt-1 text-sm leading-6 text-muted-foreground">
            A full $75+ curriculum of classical texts on Tawḥīd and ‘Aqīdah — yours for life.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 space-y-2 overflow-y-auto overscroll-contain px-4 py-2">
          {status !== "joined" ? (
            <>
              <div className="rounded-2xl bg-muted/40 px-4 py-3">
                <p className="label-caps mb-2 text-accent">What you'll study</p>
                <ul className="space-y-2">
                  {LEVELS.map((l) => (
                    <li key={l.name}>
                      <p className="text-[13px] font-semibold leading-5">{l.name}</p>
                      <p className="text-[11px] leading-4 text-muted-foreground">{l.books}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-border/50 pt-2.5">
                  {FEATURES.map(({ Icon, t }) => (
                    <span key={t} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Icon size={13} className="text-accent" strokeWidth={1.7} />{t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-muted/40 px-4 py-3">
                <p className="label-caps mb-1.5 text-accent">How to enter</p>
                <p className="text-xs leading-5">Finish any one goal: <b>5 surahs</b>, <b>500 dhikr</b> or <b>5 downloads</b>. Each goal you finish is another entry — up to 3.</p>
              </div>
              <Oath checked={o1} onChange={setO1}>I swear by Allah to truthfully complete the requirements and not cheat or deceive the counters.</Oath>
              <Oath checked={o2} onChange={setO2}>I swear by Allah to try to complete the entire Ilm Guide to the best of my ability.</Oath>
            </>
          ) : (
            <>
              {celebrate && (
                <div className="rounded-2xl bg-accent px-4 py-3 text-center text-accent-foreground">
                  <p className="text-base font-semibold">MashaAllah, congratulations! 🎉</p>
                  <p className="mt-0.5 text-xs leading-5 opacity-90">You {GOAL_NAME[celebrate] ?? "finished a goal"}. That's one more entry — submit it below.</p>
                </div>
              )}
              <p className="px-1 text-center text-[11px] leading-4 text-muted-foreground">Each goal is one entry, up to 3. You can submit after your first goal and add more later.</p>
              <Bar label="Read 5 surahs" value={surahs} goal={GOALS.surahs}>
                <p className="mt-1.5 text-[11px] text-muted-foreground">Listen to a full surah until it ends.</p>
              </Bar>
              <Bar label="Make 500 dhikr" value={dhikr} goal={GOALS.dhikr}>
                <p className="mt-1.5 text-[11px] text-muted-foreground">Every tap on adhkar cards and the Tasbih counts.</p>
              </Bar>
              <Bar label="5 people download" value={refs} goal={GOALS.referrals}>
                <div className="mt-2 flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate rounded-full bg-card px-3 py-1.5 text-[11px] text-muted-foreground ring-1 ring-border/60">{link}</span>
                  <button onClick={copy} aria-label="Copy your referral link" className="flex h-8 w-8 items-center justify-center rounded-full bg-card ring-1 ring-border/60">
                    {copied ? <Check size={14} className="text-accent" /> : <Copy size={14} />}
                  </button>
                  <button onClick={share} aria-label="Share your referral link" className="flex h-8 w-8 items-center justify-center rounded-full bg-card ring-1 ring-border/60">
                    <Share2 size={14} />
                  </button>
                </div>
              </Bar>
              {goals.length > 0 && (newGoals.length > 0 || !entered.length) && (
                <div className="space-y-2 rounded-2xl bg-muted/40 px-3 py-3">
                  <p className="text-sm font-semibold">
                    {entered.length ? "New goal complete — add it to your entry" : "Goal complete — enter the giveaway"}
                  </p>
                  {!entered.length && <p className="text-[11px] leading-4 text-muted-foreground">Submit now — you can still finish the other goals afterwards for extra entries.</p>}
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email"
                    maxLength={255}
                    className="h-10 w-full rounded-full bg-card px-4 text-sm outline-none ring-1 ring-border/60 focus:ring-accent"
                  />
                  <label className="flex items-start gap-2 text-[11px] leading-4 text-muted-foreground">
                    <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                    I agree to my email being recorded and used only to contact me if I win this giveaway.
                  </label>
                </div>
              )}
              {entered.length > 0 && !newGoals.length && (
                <p className="px-1 text-center text-xs text-accent">You're entered with {entered.length} of 3 {entered.length === 1 ? "entry" : "entries"}.{entered.length < 3 ? " Keep going — each goal you finish adds another entry. Come back here to add it." : " The winner will be contacted by email."}</p>
              )}
              {msg && <p className="px-1 text-center text-xs text-muted-foreground">{msg}</p>}
            </>
          )}
        </div>

        <div className="flex gap-2 px-5 pb-6 pt-3">
          {status !== "joined" ? (
            <>
              <Button variant="ghost" className="h-11 flex-1 rounded-full" onClick={() => { setStatus("declined"); onClose(); }}>
                No thanks
              </Button>
              <Button className="h-11 flex-[1.4] rounded-full" disabled={!o1 || !o2} onClick={() => { setStatus("joined"); setLocal("joined"); }}>
                Participate
              </Button>
            </>
          ) : goals.length > 0 && (newGoals.length > 0 || !entered.length) ? (
            <Button className="h-11 w-full rounded-full" disabled={!consent || !email.includes("@") || busy} onClick={onSubmit}>
              {busy ? "Submitting…" : "Submit entry"}
            </Button>
          ) : (
            <Button className="h-11 w-full rounded-full" onClick={onClose}>Keep going</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
