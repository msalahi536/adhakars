import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArcsTexture,
  IPhoneFrame,
  MarketingLayout,
} from "@/components/marketing/MarketingLayout";
import {
  BookOpen,
  ShieldCheck,
  Lock,
  WifiOff,
  Heart,
  Mail,
  ArrowRight,
  Sparkles,
} from "lucide-react";

// ---------- shared design tokens (matched to home) ----------
const GREEN = "#1F3D2B";
const GREEN_DEEP = "#183020";
const GREEN_SOFT = "#2E5A3F";
const CREAM = "#FAF6EC";
const CREAM_CARD = "#FFFFFF";
const CREAM_DEEP = "#F3EEDC";
const GOLD = "#C9A84C";
const GOLD_DEEP = "#8B7326";
const INK = "#1F3D2B";
const SERIF = "'Fraunces', Georgia, serif";
const ARABIC = "'Amiri', 'Scheherazade New', serif";
const RADIUS = { pill: "999px", card: "20px", block: "28px", cta: "32px" };
const SHADOW_CARD =
  "0 1px 0 rgba(31,61,43,0.04), 0 8px 24px -12px rgba(31,61,43,0.10), 0 24px 48px -28px rgba(31,61,43,0.14)";
const SHADOW_CARD_HOVER =
  "0 1px 0 rgba(31,61,43,0.05), 0 12px 32px -14px rgba(31,61,43,0.14), 0 32px 60px -32px rgba(31,61,43,0.20)";

const SOURCES = ["Bukhari", "Muslim", "Abu Dawud", "Tirmidhi", "Nasa'i", "Ibn Majah"];

const PROMISE = [
  { Icon: ShieldCheck, title: "Authentic", body: "Every dhikr is traced to a hadith or verse, with the reference shown." },
  { Icon: Lock, title: "Private", body: "Your counts and streaks live only on your device. Nothing is uploaded." },
  { Icon: WifiOff, title: "Offline", body: "Open it anywhere. No signal needed, no interruptions." },
  { Icon: Heart, title: "Free", body: "No ads, no upsells, no accounts. It always will be." },
];

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About, Sahih Al-Adhkar" },
      {
        name: "description",
        content:
          "A calm, offline friendly companion for the daily remembrance of Allah, sourced from authentic narrations.",
      },
      { property: "og:title", content: "About Sahih Al-Adhkar" },
      {
        property: "og:description",
        content: "The intention, the sources, and the promise behind the project.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <MarketingLayout>
      <style>{`
        .lift { transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 220ms ease; }
        .lift:hover { transform: translateY(-3px); box-shadow: ${SHADOW_CARD_HOVER}; }
        .btn-primary { transition: transform 160ms ease, box-shadow 220ms ease; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 14px 32px -12px rgba(31,61,43,0.42), 0 4px 10px rgba(31,61,43,0.16); }
        .btn-ghost { transition: transform 160ms ease, border-color 220ms ease, background 220ms ease; }
        .btn-ghost:hover { transform: translateY(-1px); border-color: rgba(31,61,43,0.38); background: #FFFFFF; }
      `}</style>

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden">
        <ArcsTexture opacity={0.05} />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(1100px 460px at 85% -10%, rgba(201,168,76,0.14), transparent 60%), radial-gradient(800px 380px at 10% 110%, rgba(31,61,43,0.06), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-[1200px] px-6 pb-20 pt-16 md:px-10 md:pb-28 md:pt-24 lg:grid lg:grid-cols-[1.15fr,1fr] lg:items-center lg:gap-16">
          <div>
            <div
              style={{
                color: GOLD_DEEP,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
              }}
            >
              About
            </div>
            <h1
              className="mt-5"
              style={{
                fontFamily: SERIF,
                fontWeight: 500,
                fontVariationSettings: "'opsz' 144",
                fontSize: "clamp(2.75rem, 6.4vw, 5rem)",
                lineHeight: 1.02,
                letterSpacing: "-0.025em",
                color: INK,
              }}
            >
              A quiet home for
              <br />
              <span style={{ fontStyle: "italic", color: GREEN_SOFT }}>
                daily remembrance.
              </span>
            </h1>
            <p
              className="mt-7 max-w-[36rem]"
              style={{
                color: "rgba(31,61,43,0.72)",
                fontSize: "1.125rem",
                lineHeight: 1.6,
              }}
            >
              Sahih Al-Adhkar is a simple companion for the adhkar of the
              morning and evening, after salah, before sleep, and upon waking.
              Every dhikr is drawn from authentic narrations, presented plainly
              so nothing gets between you and the remembrance itself.
            </p>
          </div>

          <div className="mt-14 flex items-center justify-center lg:mt-0">
            <IPhoneFrame />
          </div>
        </div>
      </section>

      {/* ================= WHY THIS EXISTS ================= */}
      <section className="relative" style={{ background: CREAM_DEEP }}>
        <div className="mx-auto grid max-w-[1200px] gap-14 px-6 py-24 md:grid-cols-[1fr,1.2fr] md:px-10 md:py-32">
          <div>
            <div
              style={{
                color: GOLD_DEEP,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
              }}
            >
              Why this exists
            </div>
            <h2
              className="mt-4"
              style={{
                fontFamily: SERIF,
                fontWeight: 500,
                fontSize: "clamp(1.9rem, 3.8vw, 2.75rem)",
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
                color: INK,
              }}
            >
              Authentic remembrance,
              <br />
              <span style={{ fontStyle: "italic", color: GREEN_SOFT }}>
                made simple.
              </span>
            </h2>
          </div>
          <div className="space-y-5" style={{ color: "rgba(31,61,43,0.78)", fontSize: "1.0625rem", lineHeight: 1.7 }}>
            <p>
              Most days, the hardest part of dhikr is starting. We wanted a
              place that opened quickly, showed the words clearly, and asked
              nothing else of you. No accounts. No noise. No ads.
            </p>
            <p>
              The app is built around what is authentically transmitted from
              the Prophet, sallallahu 'alayhi wa sallam. Every remembrance
              carries its source so you can be at ease with what you say, and
              return to the reference whenever you wish.
            </p>
            <p>
              It stays on your device. Your counts, your streaks, your saved
              adhkar. Yours. In sha' Allah, a small tool that helps make the
              tongue moist with the remembrance of Allah.
            </p>
          </div>
        </div>
      </section>

      {/* ================= SOURCES (green band) ================= */}
      <section
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(180deg, ${GREEN_DEEP} 0%, ${GREEN} 60%, ${GREEN_DEEP} 100%)`,
          color: CREAM,
        }}
      >
        <ArcsTexture opacity={0.06} color={GOLD} />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(700px 300px at 20% 20%, rgba(201,168,76,0.10), transparent 60%)",
          }}
        />
        <div className="relative mx-auto grid max-w-[1200px] gap-14 px-6 py-24 md:grid-cols-[1fr,1fr] md:items-center md:px-10 md:py-32">
          <div>
            <div
              className="inline-flex items-center gap-2"
              style={{
                color: GOLD,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
              }}
            >
              <BookOpen size={14} strokeWidth={2} />
              Sources
            </div>
            <h2
              className="mt-4"
              style={{
                fontFamily: SERIF,
                fontWeight: 500,
                fontSize: "clamp(1.9rem, 4vw, 2.75rem)",
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
                color: CREAM,
              }}
            >
              Compiled from the classical
              <br />
              <span style={{ fontStyle: "italic", color: "rgba(250,246,236,0.78)" }}>
                collections of hadith.
              </span>
            </h2>
            <p
              className="mt-6 max-w-xl"
              style={{
                color: "rgba(250,246,236,0.72)",
                fontSize: "1.05rem",
                lineHeight: 1.7,
              }}
            >
              Every dhikr in the app is drawn from these primary sources. Where
              a remembrance has a specific grading, it is shown alongside the
              text so nothing is taken on trust.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {SOURCES.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center rounded-full"
                  style={{
                    border: "1px solid rgba(201,168,76,0.28)",
                    background: "rgba(201,168,76,0.08)",
                    color: "rgba(250,246,236,0.85)",
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: "0.02em",
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Quote / attribution panel */}
          <div
            style={{
              borderRadius: RADIUS.block,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.02) 100%)",
              border: "1px solid rgba(201,168,76,0.22)",
              padding: "40px 34px",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.06), 0 30px 60px -30px rgba(0,0,0,0.5)",
            }}
          >
            <div
              className="inline-flex items-center gap-2"
              style={{
                color: GOLD,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
              }}
            >
              <Sparkles size={12} />
              Compilation
            </div>
            <div
              dir="rtl"
              className="mt-6"
              style={{
                fontFamily: ARABIC,
                fontWeight: 400,
                fontSize: "clamp(1.6rem, 2.8vw, 2.2rem)",
                lineHeight: 1.9,
                color: CREAM,
              }}
            >
              مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ
            </div>
            <p
              className="mt-6"
              style={{
                color: "rgba(250,246,236,0.82)",
                fontSize: "1.02rem",
                lineHeight: 1.7,
                fontStyle: "italic",
              }}
            >
              Based on the authentic adhkar compiled by our team, cross-checked
              against the classical works of hadith so that nothing enters the
              app without a clear reference.
            </p>
            <div
              className="mt-8 border-t pt-6 text-sm"
              style={{ borderColor: "rgba(201,168,76,0.18)", color: "rgba(250,246,236,0.6)" }}
            >
              Reviewed continually. If you notice something in need of
              correction, please reach out below.
            </div>
          </div>
        </div>
      </section>

      {/* ================= PROMISE GRID ================= */}
      <section>
        <div className="mx-auto max-w-[1200px] px-6 py-24 md:px-10 md:py-32">
          <div className="max-w-2xl">
            <div
              style={{
                color: GOLD_DEEP,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
              }}
            >
              Our promise
            </div>
            <h2
              className="mt-4"
              style={{
                fontFamily: SERIF,
                fontWeight: 500,
                fontSize: "clamp(1.9rem, 4vw, 2.75rem)",
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
                color: INK,
              }}
            >
              Four things that will not change.
            </h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PROMISE.map(({ Icon, title, body }) => (
              <div
                key={title}
                className="lift"
                style={{
                  background: CREAM_CARD,
                  border: "1px solid rgba(31,61,43,0.08)",
                  borderRadius: RADIUS.card,
                  padding: "24px",
                  boxShadow: SHADOW_CARD,
                }}
              >
                <div
                  className="grid place-items-center"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background:
                      "linear-gradient(135deg, rgba(201,168,76,0.22) 0%, rgba(201,168,76,0.10) 100%)",
                    color: GOLD_DEEP,
                    border: "1px solid rgba(201,168,76,0.22)",
                  }}
                >
                  <Icon size={18} strokeWidth={1.8} />
                </div>
                <div
                  className="mt-5"
                  style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "1.1rem", color: INK }}
                >
                  {title}
                </div>
                <p
                  className="mt-1.5"
                  style={{ color: "rgba(31,61,43,0.66)", fontSize: "0.9rem", lineHeight: 1.6 }}
                >
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CONTACT + CTA ================= */}
      <section className="px-6 pb-28 md:px-10">
        <div
          className="relative mx-auto max-w-[1200px] overflow-hidden"
          style={{
            borderRadius: RADIUS.cta,
            background: `linear-gradient(135deg, ${GREEN_DEEP} 0%, ${GREEN_SOFT} 100%)`,
            color: CREAM,
            padding: "60px 28px",
            boxShadow:
              "0 40px 80px -30px rgba(31,61,43,0.5), 0 12px 30px -8px rgba(31,61,43,0.28)",
          }}
        >
          <ArcsTexture opacity={0.07} color={GOLD} />
          <div className="relative grid gap-12 md:grid-cols-[1.1fr,1fr] md:items-center md:gap-16">
            <div>
              <div
                style={{
                  color: GOLD,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                }}
              >
                Contact and feedback
              </div>
              <h3
                className="mt-4"
                style={{
                  fontFamily: SERIF,
                  fontWeight: 500,
                  fontSize: "clamp(1.75rem, 3.6vw, 2.5rem)",
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                }}
              >
                Found a mistake? Have an idea?
                <br />
                <span style={{ fontStyle: "italic", color: "rgba(250,246,236,0.82)" }}>
                  We would love to hear from you.
                </span>
              </h3>
              <p
                className="mt-5 max-w-lg"
                style={{ color: "rgba(250,246,236,0.72)", fontSize: "1rem", lineHeight: 1.65 }}
              >
                If you notice an error in an adhkar, want to suggest a feature,
                or simply want to share how the app has helped you, please
                write. Every message is read.
              </p>
              <a
                href="mailto:msalahi536@gmail.com"
                className="btn-primary mt-8 inline-flex items-center gap-2"
                style={{
                  background: GOLD,
                  color: GREEN_DEEP,
                  padding: "15px 24px",
                  borderRadius: RADIUS.pill,
                  fontWeight: 700,
                  fontSize: 14,
                  boxShadow:
                    "0 12px 28px -12px rgba(201,168,76,0.55), 0 2px 6px rgba(0,0,0,0.15)",
                }}
              >
                <Mail size={16} />
                msalahi536@gmail.com
              </a>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                to="/app"
                className="btn-primary inline-flex items-center justify-between"
                style={{
                  background: CREAM,
                  color: GREEN_DEEP,
                  padding: "18px 24px",
                  borderRadius: RADIUS.pill,
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                Open the app
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/donate"
                className="btn-ghost inline-flex items-center justify-between"
                style={{
                  border: "1px solid rgba(250,246,236,0.32)",
                  background: "rgba(250,246,236,0.06)",
                  color: CREAM,
                  padding: "17px 24px",
                  borderRadius: RADIUS.pill,
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                Support the project
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/download"
                className="btn-ghost inline-flex items-center justify-between"
                style={{
                  border: "1px solid rgba(250,246,236,0.22)",
                  background: "transparent",
                  color: "rgba(250,246,236,0.85)",
                  padding: "17px 24px",
                  borderRadius: RADIUS.pill,
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                Ways to install
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
