import { useState } from "react";
import { BookOpen, ChevronDown, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { triggerHaptic } from "@/lib/theme";
import {
  fertilityDay, getFertilitySettings, setFertilitySettings, type FertilityInfo, type FertilitySettings,
} from "@/lib/period";

type Dua = { title?: string; arabic?: string; transliteration?: string; translation: string; source: string; note?: string };

const INTIMACY_DUA: Dua = {
  title: "Recommended dua before intimacy",
  arabic: "بِسْمِ اللَّهِ، اللَّهُمَّ جَنِّبْنَا الشَّيْطَانَ، وَجَنِّبِ الشَّيْطَانَ مَا رَزَقْتَنَا",
  transliteration: "Bismillah, Allahumma jannibnash-shaytaan, wa jannibish-shaytaana ma razaqtana",
  translation: "\u201cIn the name of Allah. O Allah, keep the devil away from us, and keep the devil away from what You bless us with (offspring).\u201d",
  source: "Sahih al-Bukhari 6388, Sahih Muslim 1434",
  note: "The Prophet (peace be upon him) said: If anyone of you, when having relations with his wife, says this dua, and they are destined to have a child, Satan will never harm that child.",
};
const OFFSPRING_DUA: Dua = {
  title: "The dua for offspring",
  arabic: "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا",
  translation: "\u201cOur Lord, grant us from our spouses and offspring comfort to our eyes, and make us a leader for the righteous.\u201d",
  source: "Quran 25:74",
  note: "This is one of the qualities of the 'Ibad ar-Rahman (servants of the Most Merciful) described in Surah al-Furqan.",
};
const ZAKARIYYA_DUA: Dua = {
  title: "Dua of Zakariyya (peace be upon him)",
  arabic: "رَبِّ هَبْ لِي مِن لَّدُنكَ ذُرِّيَّةً طَيِّبَةً ۖ إِنَّكَ سَمِيعُ الدُّعَاءِ",
  transliteration: "Rabbi hab li min ladunka dhurriyyatan tayyibah, innaka sami'ud-du'a",
  translation: "\u201cMy Lord, grant me from Yourself a good offspring. Indeed, You are the Hearer of supplication.\u201d",
  source: "Quran 3:38",
  note: "The dua of Prophet Zakariyya when he asked Allah for a child, and Allah granted him Yahya (John).",
};
const TRUST: Dua = {
  title: "Trust in Allah's timing",
  translation: "\u201cTo Allah belongs the dominion of the heavens and the earth. He creates what He wills. He gives to whom He wills female children, and He gives to whom He wills males. Or He makes them both males and females, and He renders whom He wills barren. Indeed, He is Knowing and Competent.\u201d",
  source: "Quran 42:49-50",
  note: "A reminder that children are ultimately from Allah's decree, and placing trust in His wisdom.",
};

function DuaCard({ dua }: { dua: Dua }) {
  return (
    <article className="period-item">
      {dua.title && <h3 className="text-sm font-bold">{dua.title}</h3>}
      <div className="period-source mt-1"><BookOpen size={12} /> {dua.source}</div>
      {dua.arabic && <p className="arabic mt-3 text-right text-[21px] leading-[1.95]" lang="ar" dir="rtl">{dua.arabic}</p>}
      {dua.transliteration && <p className="adhkar-transliteration mt-2 !text-left text-[13px]">{dua.transliteration}</p>}
      <p className="mt-2 text-sm">{dua.translation}</p>
      {dua.note && <p className="period-muted mt-2 text-sm leading-relaxed">{dua.note}</p>}
    </article>
  );
}

function Row({ title, sub, checked, onChange }: { title: string; sub: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="fert-row">
      <span><strong>{title}</strong><small>{sub}</small></span>
      <Switch checked={checked} onCheckedChange={(v) => { onChange(v); void triggerHaptic("light"); }} />
    </label>
  );
}

const resched = () => void import("@/lib/smart-notifications").then((m) => m.rescheduleFertilityNotifications());

export function FertilitySettingsCard({ settings }: { settings: FertilitySettings }) {
  const [disclaimer, setDisclaimer] = useState(false);
  const update = (patch: Partial<FertilitySettings>) => { setFertilitySettings(patch); resched(); };
  return (
    <div className="period-card">
      <div className="period-eyebrow">Fertility Tracking</div>
      <Row title="Track Fertile Window" sub="Estimate your fertile days based on cycle data. This is an estimate only, not medical advice."
        checked={settings.enabled}
        onChange={(v) => { if (v && !getFertilitySettings().acknowledged) setDisclaimer(true); else update({ enabled: v }); }} />
      {settings.enabled && (
        <>
          <Row title="Fertile Window Alerts" sub="Get notified when your fertile window begins" checked={settings.alerts} onChange={(v) => update({ alerts: v })} />
          <Row title="Trying to Conceive" sub="Extra encouragement and duas for conception" checked={settings.ttc} onChange={(v) => update({ ttc: v })} />
        </>
      )}
      <Dialog open={disclaimer} onOpenChange={setDisclaimer}>
        <DialogContent className="period-dialog [&>button:last-child]:hidden">
          <div className="period-dialog-head">
            <span className="period-learn-book"><Info size={21} /></span>
            <span><DialogTitle>Before you begin</DialogTitle><DialogDescription>Fertility estimates</DialogDescription></span>
          </div>
          <p className="text-sm leading-relaxed">
            Fertility estimates are based on the calendar method and your logged cycle history. They are NOT a substitute for medical advice and should not be relied upon as contraception. Consult a healthcare provider for family planning guidance.
          </p>
          <Button className="period-btn w-full" onClick={() => { update({ enabled: true, acknowledged: true }); setDisclaimer(false); }}>I Understand</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function FertilityNotes({ info }: { info: FertilityInfo }) {
  if (info.status === "out-of-range")
    return <p className="period-prediction-note">Cycle length is outside typical range. Consult a healthcare provider for fertility guidance.</p>;
  if (info.status !== "ok") return null;
  return (
    <>
      {info.fewCycles && <p className="period-prediction-note">Fertility estimates are more accurate after 3+ tracked cycles.</p>}
      {info.variable && <p className="period-prediction-note">Your cycle length varies. Fertility estimates may be less accurate.</p>}
    </>
  );
}

const COPY = {
  fertile: ["Fertile Window", "You may be in your fertile window based on your cycle history."],
  peak: ["Peak Fertility", "These are typically your most fertile days this cycle."],
  ovulation: ["Estimated Ovulation Day", "Ovulation is estimated to occur around today based on your cycle length."],
} as const;

export function FertilityDayCard({ date, info, settings }: { date: string; info: FertilityInfo; settings: FertilitySettings }) {
  const kind = fertilityDay(date, info);
  if (!kind) return null;
  if (kind === "wait") {
    if (!settings.ttc) return null;
    return (
      <div className="period-card fert-card">
        <div className="period-section-title">The Two-Week Wait</div>
        <p className="period-muted mt-1 text-sm">Place your trust in Allah. Whatever He decrees is best.</p>
      </div>
    );
  }
  const [title, body] = COPY[kind];
  return (
    <div className="space-y-3">
      <div className="period-card fert-card">
        <div className="period-section-title">{title}</div>
        <p className="period-muted mt-1 text-sm">{body}</p>
        {settings.ttc && <p className="fert-warm mt-2">May Allah bless you with righteous offspring</p>}
      </div>
      <DuaCard dua={INTIMACY_DUA} />
      {settings.ttc && <DuaCard dua={OFFSPRING_DUA} />}
    </div>
  );
}

export function FertilityLearn() {
  const [open, setOpen] = useState(false);
  return (
    <div className="period-card">
      <button className="fert-learn-head" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="period-learn-book"><BookOpen size={18} /></span>
        <span className="flex-1 text-left"><strong>Understanding Fertility in Islam</strong></span>
        <ChevronDown size={18} style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform .2s" }} />
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <DuaCard dua={OFFSPRING_DUA} />
          <DuaCard dua={ZAKARIYYA_DUA} />
          <DuaCard dua={{ ...INTIMACY_DUA, title: "The dua before intimacy" }} />
          <DuaCard dua={TRUST} />
        </div>
      )}
    </div>
  );
}
