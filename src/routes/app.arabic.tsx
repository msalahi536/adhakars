import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ChevronLeft, Volume2 } from "lucide-react";

export const Route = createFileRoute("/app/arabic")({
  head: () => ({
    meta: [
      { title: "Arabic Companion, Sahih Al-Adhkar" },
      { name: "description", content: "Learn to read Arabic from the letters to real Quran words, with audio." },
      { property: "og:title", content: "Arabic Companion, Sahih Al-Adhkar" },
      { property: "og:description", content: "Learn to read Arabic letter by letter, with tap-to-listen audio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ArabicCompanion,
});

type Letter = { ar: string; name: string; sound: string; group: "throat" | "heavy" | "other" };
const LETTERS: Letter[] = [
  { ar: "ا", name: "Alif", sound: "a", group: "throat" },
  { ar: "ب", name: "Bā’", sound: "b", group: "other" },
  { ar: "ت", name: "Tā’", sound: "t", group: "other" },
  { ar: "ث", name: "Thā’", sound: "th", group: "other" },
  { ar: "ج", name: "Jīm", sound: "j", group: "other" },
  { ar: "ح", name: "Ḥā’", sound: "ḥ", group: "throat" },
  { ar: "خ", name: "Khā’", sound: "kh", group: "heavy" },
  { ar: "د", name: "Dāl", sound: "d", group: "other" },
  { ar: "ذ", name: "Dhāl", sound: "dh", group: "other" },
  { ar: "ر", name: "Rā’", sound: "r", group: "other" },
  { ar: "ز", name: "Zāy", sound: "z", group: "other" },
  { ar: "س", name: "Sīn", sound: "s", group: "other" },
  { ar: "ش", name: "Shīn", sound: "sh", group: "other" },
  { ar: "ص", name: "Ṣād", sound: "ṣ", group: "heavy" },
  { ar: "ض", name: "Ḍād", sound: "ḍ", group: "heavy" },
  { ar: "ط", name: "Ṭā’", sound: "ṭ", group: "heavy" },
  { ar: "ظ", name: "Ẓā’", sound: "ẓ", group: "heavy" },
  { ar: "ع", name: "‘Ayn", sound: "‘", group: "throat" },
  { ar: "غ", name: "Ghayn", sound: "gh", group: "heavy" },
  { ar: "ف", name: "Fā’", sound: "f", group: "other" },
  { ar: "ق", name: "Qāf", sound: "q", group: "heavy" },
  { ar: "ك", name: "Kāf", sound: "k", group: "other" },
  { ar: "ل", name: "Lām", sound: "l", group: "other" },
  { ar: "م", name: "Mīm", sound: "m", group: "other" },
  { ar: "ن", name: "Nūn", sound: "n", group: "other" },
  { ar: "ه", name: "Hā’", sound: "h", group: "throat" },
  { ar: "و", name: "Wāw", sound: "w", group: "other" },
  { ar: "ي", name: "Yā’", sound: "y", group: "other" },
];

// Real Quran words; audio is Quran.com word-by-word recitation (surah_ayah_word).
const WORDS = [
  { ar: "قُلْ", tr: "qul", en: "say", id: "112_001_001" },
  { ar: "هُوَ", tr: "huwa", en: "He", id: "112_001_002" },
  { ar: "أَحَدٌ", tr: "aḥad", en: "One", id: "112_001_004" },
  { ar: "بِسْمِ", tr: "bismi", en: "in the name", id: "001_001_001" },
  { ar: "ٱلْحَمْدُ", tr: "al-ḥamdu", en: "all praise", id: "001_002_001" },
  { ar: "نَعْبُدُ", tr: "na‘budu", en: "we worship", id: "001_005_002" },
  { ar: "ٱقْرَأْ", tr: "iqra’", en: "read", id: "096_001_001" },
  { ar: "خَلَقَ", tr: "khalaqa", en: "created", id: "096_001_005" },
  { ar: "أَعُوذُ", tr: "a‘ūdhu", en: "I seek refuge", id: "113_001_002" },
  { ar: "ٱلنَّاسِ", tr: "an-nās", en: "mankind", id: "114_001_004" },
];

const VOWELS = [
  { mark: "َ", name: "Fatḥah", v: "a" },
  { mark: "ِ", name: "Kasrah", v: "i" },
  { mark: "ُ", name: "Ḍammah", v: "u" },
  { mark: "ْ", name: "Sukūn", v: "" },
];

// Letters and vowels use the device's Arabic voice (draft only: to be replaced by recorded audio).
function speakArabic(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ar-SA";
  u.rate = 0.7;
  const v = window.speechSynthesis.getVoices().find((x) => x.lang.startsWith("ar"));
  if (v) u.voice = v;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
  return !!v;
}

const TABS = ["Letters", "Vowels", "Shapes", "Words", "Quiz"] as const;
type Tab = (typeof TABS)[number];

function ArabicCompanion() {
  const [tab, setTab] = useState<Tab>("Letters");
  const audio = useRef<HTMLAudioElement | null>(null);
  const playWord = (id: string) => {
    audio.current?.pause();
    audio.current = new Audio(`https://audio.qurancdn.com/wbw/${id}.mp3`);
    void audio.current.play().catch(() => {});
  };

  return (
    <div className="min-h-screen bg-background px-4 pb-32 pt-[max(1rem,env(safe-area-inset-top))] text-foreground">
      <div className="mb-4 flex items-center gap-2">
        <Link to="/app/more" className="rounded-full p-2 hover:bg-muted" aria-label="Back">
          <ChevronLeft size={22} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Arabic Companion</h1>
          <p className="text-xs text-muted-foreground">Test draft — learn to read, step by step</p>
        </div>
      </div>

      <div className="mb-5 flex gap-1 overflow-x-auto rounded-full bg-muted p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 whitespace-nowrap rounded-full px-3 py-2 text-sm ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Letters" && <Letters />}
      {tab === "Vowels" && <Vowels />}
      {tab === "Shapes" && <Shapes />}
      {tab === "Words" && (
        <div className="grid grid-cols-2 gap-3">
          {WORDS.map((w) => (
            <button key={w.id} onClick={() => playWord(w.id)} className="rounded-2xl border border-border bg-card p-4 text-center active:scale-95">
              <div dir="rtl" className="font-quran text-4xl leading-relaxed" style={{ fontFamily: "'Amiri Quran', 'Amiri', serif" }}>{w.ar}</div>
              <div className="mt-1 text-sm font-medium">{w.tr}</div>
              <div className="text-xs text-muted-foreground">{w.en}</div>
              <Volume2 size={14} className="mx-auto mt-2 text-muted-foreground" />
            </button>
          ))}
          <p className="col-span-2 text-center text-xs text-muted-foreground">Word audio: real Quran recitation, word by word.</p>
        </div>
      )}
      {tab === "Quiz" && <Quiz />}
    </div>
  );
}

const arFont = { fontFamily: "'Amiri Quran', 'Amiri', serif" };

function Letters() {
  const [group, setGroup] = useState<"all" | "throat" | "heavy">("all");
  const [noVoice, setNoVoice] = useState(false);
  const list = LETTERS.filter((l) => group === "all" || l.group === group);
  return (
    <>
      <div className="mb-3 flex gap-2 text-xs">
        {(["all", "throat", "heavy"] as const).map((g) => (
          <button key={g} onClick={() => setGroup(g)} className={`rounded-full border px-3 py-1 ${group === g ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>
            {g === "all" ? "All 28" : g === "throat" ? "Throat letters" : "Heavy letters"}
          </button>
        ))}
      </div>
      {noVoice && <p className="mb-3 rounded-xl bg-muted p-3 text-xs">Your phone has no Arabic voice installed, so letters may sound off. Add Arabic in your phone's speech settings.</p>}
      <div dir="rtl" className="grid grid-cols-4 gap-2">
        {list.map((l) => (
          <button key={l.ar} onClick={() => setNoVoice(!speakArabic(l.ar))} className="rounded-2xl border border-border bg-card py-3 active:scale-95">
            <div className="text-4xl leading-snug" style={arFont}>{l.ar}</div>
            <div dir="ltr" className="text-[11px] text-muted-foreground">{l.name}</div>
          </button>
        ))}
      </div>
    </>
  );
}

function Vowels() {
  const [letter, setLetter] = useState(LETTERS[1]);
  return (
    <>
      <p className="mb-3 text-sm text-muted-foreground">Pick a letter, then tap a vowel to hear it change.</p>
      <div dir="rtl" className="mb-5 flex gap-2 overflow-x-auto pb-2">
        {LETTERS.map((l) => (
          <button key={l.ar} onClick={() => setLetter(l)} className={`min-w-11 rounded-xl border px-2 py-1 text-2xl ${letter.ar === l.ar ? "border-primary bg-primary/10" : "border-border"}`} style={arFont}>{l.ar}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {VOWELS.map((v) => (
          <button key={v.name} onClick={() => speakArabic(v.v ? letter.ar + v.mark : "أَ" + letter.ar + v.mark)} className="rounded-2xl border border-border bg-card p-4 active:scale-95">
            <div className="text-6xl leading-relaxed" style={arFont}>{v.v ? letter.ar + v.mark : "أَ" + letter.ar + v.mark}</div>
            <div className="text-sm font-medium">{v.name}</div>
            <div className="text-xs text-muted-foreground">{v.v ? letter.sound + v.v : "a" + letter.sound + " (stop)"}</div>
          </button>
        ))}
      </div>
    </>
  );
}

const NON_JOIN = new Set(["ا", "د", "ذ", "ر", "ز", "و"]);
function Shapes() {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-5 px-3 text-center text-[11px] text-muted-foreground">
        <span>Name</span><span>End</span><span>Middle</span><span>Start</span><span>Alone</span>
      </div>
      {LETTERS.map((l) => {
        const nj = NON_JOIN.has(l.ar);
        return (
          <div key={l.ar} className="grid grid-cols-5 items-center rounded-xl border border-border bg-card px-3 py-1 text-center">
            <span className="text-xs">{l.name}</span>
            {["ـ" + l.ar, nj ? "ـ" + l.ar : "ـ" + l.ar + "ـ", nj ? l.ar : l.ar + "ـ", l.ar].map((f, i) => (
              <span key={i} className="text-3xl leading-relaxed" style={arFont}>{f}</span>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function Quiz() {
  const [q, setQ] = useState(() => makeQ());
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  return (
    <div className="text-center">
      <p className="mb-2 text-sm text-muted-foreground">Score: {score}</p>
      <button onClick={() => speakArabic(q.answer.ar)} className="mx-auto mb-6 flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-primary-foreground">
        <Volume2 size={18} /> Play the sound
      </button>
      <p className="mb-3 text-sm">Which letter did you hear?</p>
      <div className="grid grid-cols-3 gap-3">
        {q.options.map((o) => {
          const state = picked && (o.ar === q.answer.ar ? "border-primary bg-primary/10" : o.ar === picked ? "border-destructive" : "");
          return (
            <button
              key={o.ar}
              disabled={!!picked}
              onClick={() => { setPicked(o.ar); if (o.ar === q.answer.ar) setScore((s) => s + 1); }}
              className={`rounded-2xl border border-border bg-card py-4 text-5xl leading-relaxed ${state || ""}`}
              style={arFont}
            >{o.ar}</button>
          );
        })}
      </div>
      {picked && (
        <div className="mt-5">
          <p className="mb-3 text-sm">{picked === q.answer.ar ? "Correct!" : `That was ${q.answer.name}.`}</p>
          <button onClick={() => { setQ(makeQ()); setPicked(null); }} className="rounded-full border border-border px-5 py-2 text-sm">Next →</button>
        </div>
      )}
    </div>
  );
}

function makeQ() {
  const shuffled = [...LETTERS].sort(() => Math.random() - 0.5).slice(0, 3);
  return { answer: shuffled[Math.floor(Math.random() * 3)], options: shuffled };
}
