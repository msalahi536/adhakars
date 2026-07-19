import { createFileRoute, Link } from "@tanstack/react-router";
import { ArcsTexture, MarketingLayout } from "@/components/marketing/MarketingLayout";
import appScreenshot from "@/assets/app-screenshot.png.asset.json";
import {
  Sunrise,
  Moon,
  Hand,
  BedDouble,
  Compass,
  CircleDot,
  BookPlus,
  ShieldCheck,
  BookOpen,
  Lock,
  WifiOff,
  UserX,
  Ban,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sahih Al-Adhkar, Authentic daily remembrance of Allah" },
      {
        name: "description",
        content:
          "A calm, offline friendly companion for the daily remembrance of Allah, sourced from the Sunnah. Free, no ads, no tracking.",
      },
      { property: "og:title", content: "Sahih Al-Adhkar" },
      {
        property: "og:description",
        content: "Authentic daily remembrance of Allah, sourced from the Sunnah.",
      },
    ],
  }),
  component: HomePage,
});

// Design tokens for this page. Reused inline so the whole file stays a single unit.
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

const FEATURES = [
  {
    Icon: Sunrise,
    title: "Morning and Evening",
    body: "The full daily remembrances, between Fajr and sunrise, and 'Asr and Maghrib.",
    featured: true,
  },
  {
    Icon: Hand,
    title: "After Salah",
    body: "The adhkar after each of the five prayers, with counters that follow the Sunnah.",
  },
  {
    Icon: BedDouble,
    title: "Sleep and Wake",
    body: "What to say before sleep and upon waking, gathered in one gentle flow.",
  },
  {
    Icon: Compass,
    title: "Qibla Finder",
    body: "A precise compass with calibration, calculated entirely on your device.",
  },
  {
    Icon: CircleDot,
    title: "Tasbih Counter",
    body: "A quiet counter for your own dhikr, with haptics and a lifetime total.",
  },
  {
    Icon: BookPlus,
    title: "Your Own Adhkar",
    body: "Save the du'a and dhikr you return to most, kept on your device.",
  },
];

const SOURCES = ["Bukhari", "Muslim", "Abu Dawud", "Tirmidhi", "Nasa'i", "Ibn Majah"];

function HomePage() {
  return (
    <MarketingLayout>
      <style>{`
        .lift { transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 220ms ease; }
        .lift:hover { transform: translateY(-3px); box-shadow: ${SHADOW_CARD_HOVER}; }
        .btn-primary { transition: transform 160ms ease, box-shadow 220ms ease, background 220ms ease; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 14px 32px -12px rgba(31,61,43,0.42), 0 4px 10px rgba(31,61,43,0.16); }
        .btn-ghost { transition: transform 160ms ease, border-color 220ms ease, background 220ms ease; }
        .btn-ghost:hover { transform: translateY(-1px); border-color: rgba(31,61,43,0.38); background: #FFFFFF; }
        html { scroll-behavior: smooth; }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden">
        <ArcsTexture opacity={0.05} />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(1200px 500px at 85% -10%, rgba(201,168,76,0.14), transparent 60%), radial-gradient(900px 400px at 10% 110%, rgba(31,61,43,0.06), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-[1200px] px-6 pb-24 pt-16 md:px-10 md:pb-40 md:pt-28 lg:grid lg:grid-cols-[1.1fr,1fr] lg:items-center lg:gap-16">
          <div>

            <h1
              className="mt-8"
              style={{
                fontFamily: SERIF,
                fontWeight: 500,
                fontVariationSettings: "'opsz' 144",
                fontSize: "clamp(3rem, 7.2vw, 5.75rem)",
                lineHeight: 0.98,
                letterSpacing: "-0.025em",
                color: INK,
              }}
            >
              Authentic remembrance,
              <br />
              <span style={{ fontStyle: "italic", color: GREEN_SOFT }}>every day.</span>
            </h1>

            <p
              className="mt-7 max-w-[36rem]"
              style={{
                color: "rgba(31, 61, 43, 0.72)",
                fontSize: "1.125rem",
                lineHeight: 1.6,
              }}
            >
              A calm, offline companion for the daily adhkar. Every dhikr is
              sourced to the Sunnah, and your practice stays entirely on your
              device.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                to="/app"
                className="btn-primary inline-flex items-center gap-2"
                style={{
                  background: GREEN,
                  color: CREAM,
                  padding: "16px 26px",
                  borderRadius: RADIUS.pill,
                  fontWeight: 600,
                  fontSize: 15,
                  letterSpacing: "-0.01em",
                  boxShadow:
                    "0 10px 24px -10px rgba(31,61,43,0.36), 0 2px 6px rgba(31,61,43,0.12)",
                }}
              >
                Open the app
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/download"
                className="btn-ghost"
                style={{
                  border: "1px solid rgba(31,61,43,0.2)",
                  background: "rgba(255,255,255,0.6)",
                  color: INK,
                  padding: "15px 24px",
                  borderRadius: RADIUS.pill,
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                Download
              </Link>
            </div>

            <div
              className="mt-10 flex flex-wrap items-center gap-6 text-xs"
              style={{ color: "rgba(31,61,43,0.55)", letterSpacing: "0.02em" }}
            >
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={14} style={{ color: GOLD_DEEP }} /> Sourced to authentic hadith
              </span>
              <span className="inline-flex items-center gap-1.5">
                <WifiOff size={14} style={{ color: GOLD_DEEP }} /> Works offline
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Lock size={14} style={{ color: GOLD_DEEP }} /> No accounts
              </span>
            </div>
          </div>

          <div className="mt-16 flex items-center justify-center lg:mt-0">
            <img
              src={appScreenshot.url}
              alt="Sahih Al-Adhkar app screenshot showing Morning Adhkar"
              style={{
                width: "min(340px, 82vw)",
                height: "auto",
                borderRadius: 44,
                boxShadow:
                  "0 40px 60px rgba(31,61,43,0.28), 0 12px 24px rgba(31,61,43,0.16)",
              }}
            />
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="relative" style={{ background: CREAM_DEEP }}>
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
              Everything you return to
            </div>
            <h2
              className="mt-4"
              style={{
                fontFamily: SERIF,
                fontWeight: 500,
                fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                color: INK,
              }}
            >
              A calm, complete companion
              <br />
              for daily dhikr.
            </h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-6">
            {FEATURES.map(({ Icon, title, body, featured }, i) => (
              <div
                key={title}
                className="lift"
                style={{
                  gridColumn: featured ? "span 6" : "span 3",
                  background: featured
                    ? `linear-gradient(135deg, ${CREAM_CARD} 0%, #FFFDF6 100%)`
                    : CREAM_CARD,
                  border: "1px solid rgba(31, 61, 43, 0.08)",
                  borderRadius: RADIUS.block,
                  boxShadow: SHADOW_CARD,
                  padding: featured ? "36px" : "28px",
                }}
                // On lg screens: featured spans 3, others span 3
                {...(i === 0
                  ? { "data-featured": "true" }
                  : {})}
              >
                <div className={featured ? "md:flex md:items-start md:gap-8" : ""}>
                  <div
                    className="grid place-items-center"
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background:
                        "linear-gradient(135deg, rgba(201,168,76,0.22) 0%, rgba(201,168,76,0.10) 100%)",
                      color: GOLD_DEEP,
                      border: "1px solid rgba(201,168,76,0.22)",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={22} strokeWidth={1.75} />
                  </div>
                  <div className={featured ? "mt-6 md:mt-0" : "mt-6"}>
                    <h3
                      style={{
                        fontFamily: SERIF,
                        fontWeight: 600,
                        fontSize: featured ? "1.65rem" : "1.25rem",
                        letterSpacing: "-0.01em",
                        color: INK,
                        lineHeight: 1.15,
                      }}
                    >
                      {title}
                    </h3>
                    <p
                      className="mt-2"
                      style={{
                        color: "rgba(31,61,43,0.68)",
                        fontSize: featured ? "1rem" : "0.925rem",
                        lineHeight: 1.6,
                        maxWidth: featured ? "42rem" : undefined,
                      }}
                    >
                      {body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SOURCES (green) ================= */}
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
        <div className="relative mx-auto grid max-w-[1200px] gap-16 px-6 py-28 md:grid-cols-2 md:items-center md:px-10 md:py-36">
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
              Built on authentic sources
            </div>
            <h2
              className="mt-4"
              style={{
                fontFamily: SERIF,
                fontWeight: 500,
                fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                color: CREAM,
              }}
            >
              Every dhikr shows its reference,
              <br />
              <span style={{ fontStyle: "italic", color: "rgba(250,246,236,0.75)" }}>
                so you can verify it.
              </span>
            </h2>
            <p
              className="mt-6 max-w-xl"
              style={{
                color: "rgba(250, 246, 236, 0.72)",
                fontSize: "1.0625rem",
                lineHeight: 1.65,
              }}
            >
              Nothing is added to the Sunnah. Each remembrance is presented with
              its source, its authenticity, and the times it is said, so you can
              be at ease with what you recite.
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
            <p
              className="mt-6 text-xs"
              style={{ color: "rgba(250,246,236,0.55)", letterSpacing: "0.02em" }}
            >
              Reviewed against classical hadith collections.
            </p>
          </div>

          {/* Sample citation card */}
          <div
            style={{
              borderRadius: RADIUS.block,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.02) 100%)",
              border: "1px solid rgba(201, 168, 76, 0.22)",
              padding: "36px 32px",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.06), 0 30px 60px -30px rgba(0,0,0,0.5)",
            }}
          >
            <div
              className="flex items-center justify-between"
              style={{ color: GOLD, fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase" }}
            >
              <span>Sample</span>
              <span style={{ color: "rgba(250,246,236,0.45)" }}>Morning</span>
            </div>

            <div
              dir="rtl"
              className="mt-8"
              style={{
                fontFamily: ARABIC,
                fontWeight: 400,
                fontSize: "clamp(2rem, 3.6vw, 2.75rem)",
                lineHeight: 2.05,
                color: CREAM,
                letterSpacing: 0,
              }}
            >
              اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا
            </div>

            <div
              className="mt-6"
              style={{
                color: "rgba(250,246,236,0.55)",
                fontStyle: "italic",
                fontSize: "0.9rem",
              }}
            >
              Allahumma bika asbahna wa bika amsayna
            </div>
            <div
              className="mt-3"
              style={{
                color: "rgba(250,246,236,0.82)",
                fontSize: "0.975rem",
                lineHeight: 1.6,
              }}
            >
              O Allah, by You we have entered the morning and by You we have
              entered the evening.
            </div>

            <div
              className="mt-8 flex items-center justify-between border-t pt-6"
              style={{ borderColor: "rgba(201,168,76,0.18)" }}
            >
              <span
                className="inline-flex items-center gap-2 rounded-full"
                style={{
                  background: "rgba(201, 168, 76, 0.14)",
                  border: "1px solid rgba(201,168,76,0.32)",
                  color: GOLD,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                }}
              >
                <BookOpen size={12} />
                Sahih, Tirmidhi 3391
              </span>
              <span style={{ color: "rgba(250,246,236,0.5)", fontSize: 12 }}>
                Said once
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= PRIVACY ================= */}
      <section>
        <div className="mx-auto max-w-[1200px] px-6 py-28 md:px-10 md:py-36">
          <div className="grid gap-16 md:grid-cols-[1fr,1.15fr] md:items-start">
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
                Private by design
              </div>
              <h2
                className="mt-4"
                style={{
                  fontFamily: SERIF,
                  fontWeight: 500,
                  fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                  color: INK,
                }}
              >
                Free. No ads.
                <br />
                <span style={{ fontStyle: "italic", color: GREEN_SOFT }}>
                  No tracking. No accounts.
                </span>
              </h2>
              <p
                className="mt-6 max-w-xl"
                style={{
                  color: "rgba(31, 61, 43, 0.7)",
                  fontSize: "1.0625rem",
                  lineHeight: 1.65,
                }}
              >
                Your counts, your streaks, and your own adhkar stay on your
                device. Nothing is uploaded. Nothing is watched.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { Icon: Lock, title: "Stored on device", body: "Your progress lives only on your phone." },
                { Icon: UserX, title: "No accounts", body: "There is nothing to sign up for." },
                { Icon: Ban, title: "No ads, no upsells", body: "The whole app is free." },
                { Icon: WifiOff, title: "Works offline", body: "Open it anywhere and it just works." },
              ].map(({ Icon, title, body }) => (
                <div
                  key={title}
                  className="lift"
                  style={{
                    background: CREAM_CARD,
                    border: "1px solid rgba(31, 61, 43, 0.08)",
                    borderRadius: RADIUS.card,
                    padding: "22px",
                    boxShadow: SHADOW_CARD,
                  }}
                >
                  <div
                    className="grid place-items-center"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "rgba(201,168,76,0.14)",
                      color: GOLD_DEEP,
                      border: "1px solid rgba(201,168,76,0.2)",
                    }}
                  >
                    <Icon size={16} strokeWidth={2} />
                  </div>
                  <div
                    className="mt-4"
                    style={{
                      fontFamily: SERIF,
                      fontWeight: 600,
                      fontSize: "1.05rem",
                      color: INK,
                      letterSpacing: "-0.005em",
                    }}
                  >
                    {title}
                  </div>
                  <p
                    className="mt-1.5"
                    style={{
                      color: "rgba(31,61,43,0.65)",
                      fontSize: "0.875rem",
                      lineHeight: 1.55,
                    }}
                  >
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="px-6 pb-28 md:px-10">
        <div
          className="relative mx-auto max-w-[1200px] overflow-hidden text-center"
          style={{
            borderRadius: RADIUS.cta,
            background: `linear-gradient(135deg, ${GREEN_DEEP} 0%, ${GREEN_SOFT} 100%)`,
            color: CREAM,
            padding: "72px 24px",
            boxShadow:
              "0 40px 80px -30px rgba(31,61,43,0.5), 0 12px 30px -8px rgba(31,61,43,0.28)",
          }}
        >
          <ArcsTexture opacity={0.07} color={GOLD} />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(500px 260px at 50% 0%, rgba(201,168,76,0.14), transparent 60%)",
            }}
          />
          <div className="relative mx-auto max-w-3xl px-2 md:px-8">
            <div
              style={{
                color: GOLD,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
              }}
            >
              Begin today
            </div>
            <h2
              className="mt-5"
              style={{
                fontFamily: SERIF,
                fontWeight: 500,
                fontSize: "clamp(2rem, 4.8vw, 3.5rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
              }}
            >
              Begin, and let today be
              <br />
              <span style={{ fontStyle: "italic", color: "rgba(250,246,236,0.85)" }}>
                a day of remembrance.
              </span>
            </h2>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link
                to="/download"
                className="btn-primary inline-flex items-center gap-2"
                style={{
                  background: GOLD,
                  color: GREEN_DEEP,
                  padding: "16px 28px",
                  borderRadius: RADIUS.pill,
                  fontWeight: 700,
                  fontSize: 15,
                  boxShadow:
                    "0 12px 28px -12px rgba(201,168,76,0.55), 0 2px 6px rgba(0,0,0,0.15)",
                }}
              >
                Download
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/app"
                className="btn-ghost"
                style={{
                  border: "1px solid rgba(250,246,236,0.32)",
                  background: "rgba(250,246,236,0.06)",
                  color: CREAM,
                  padding: "15px 26px",
                  borderRadius: RADIUS.pill,
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                Open the app
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

/* ============================================================
   Phone mockup, rendered as live HTML.
   ============================================================ */
function PhoneMockup() {
  return (
    <div
      className="relative"
      style={{
        width: "min(340px, 82vw)",
        aspectRatio: "9 / 19.5",
        filter:
          "drop-shadow(0 40px 60px rgba(31,61,43,0.28)) drop-shadow(0 12px 24px rgba(31,61,43,0.16))",
      }}
    >
      {/* Outer bezel */}
      <div
        className="absolute inset-0"
        style={{
          borderRadius: 52,
          background:
            "linear-gradient(160deg, #1c1c1e 0%, #0a0a0b 45%, #1c1c1e 100%)",
          padding: 10,
          boxShadow:
            "inset 0 0 0 1.5px rgba(255,255,255,0.09), inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.6)",
        }}
      >
        {/* Side glare */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            borderRadius: 52,
            background:
              "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.06) 30%, transparent 55%, rgba(255,255,255,0.04) 78%, transparent 100%)",
          }}
        />
        {/* Screen */}
        <div
          className="relative flex h-full w-full flex-col overflow-hidden"
          style={{
            borderRadius: 44,
            background: CREAM,
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.6)",
          }}
        >
          {/* Status bar */}
          <div
            className="relative flex items-center justify-between"
            style={{
              padding: "12px 22px 4px",
              color: INK,
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
            }}
          >
            <span style={{ letterSpacing: 0.2 }}>9:41</span>
            {/* Dynamic island */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 8,
                transform: "translateX(-50%)",
                width: 88,
                height: 24,
                borderRadius: 999,
                background: "#0a0a0b",
              }}
            />
            <div className="flex items-center gap-1.5">
              {/* signal */}
              <svg width="14" height="10" viewBox="0 0 14 10">
                <rect x="0" y="7" width="2.5" height="3" rx="0.6" fill={INK} />
                <rect x="3.5" y="5" width="2.5" height="5" rx="0.6" fill={INK} />
                <rect x="7" y="3" width="2.5" height="7" rx="0.6" fill={INK} />
                <rect x="10.5" y="1" width="2.5" height="9" rx="0.6" fill={INK} />
              </svg>
              {/* wifi */}
              <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                <path d="M6.5 8.5a1 1 0 100-2 1 1 0 000 2z" fill={INK} />
                <path
                  d="M2 4.5a7 7 0 019 0M3.7 6.2a4.5 4.5 0 015.6 0"
                  stroke={INK}
                  strokeWidth="1.1"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              {/* battery */}
              <svg width="22" height="10" viewBox="0 0 22 10">
                <rect
                  x="0.5"
                  y="0.5"
                  width="18"
                  height="9"
                  rx="2"
                  fill="none"
                  stroke={INK}
                  strokeOpacity="0.5"
                />
                <rect x="2" y="2" width="13" height="6" rx="1" fill={INK} />
                <rect x="19.5" y="3" width="1.5" height="4" rx="0.5" fill={INK} opacity="0.5" />
              </svg>
            </div>
          </div>

          {/* Header block */}
          <div
            className="relative overflow-hidden"
            style={{
              margin: "18px 14px 0",
              padding: "20px 20px 22px",
              borderRadius: 24,
              background: `linear-gradient(140deg, #d9b968 0%, #c19a3c 100%)`,
              color: "#2d1f00",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.28), 0 10px 24px -10px rgba(201,168,76,0.5)",
            }}
          >
            <ArcsTexture opacity={0.08} color={GREEN} />
            <div className="relative">
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  opacity: 0.72,
                }}
              >
                Morning
              </div>
              <div
                className="mt-1"
                style={{
                  fontFamily: SERIF,
                  fontWeight: 600,
                  fontSize: 22,
                  letterSpacing: "-0.015em",
                  lineHeight: 1.1,
                }}
              >
                Morning Adhkar
              </div>
              <div
                className="mt-4 flex items-center gap-2 text-[9px] font-semibold"
                style={{ opacity: 0.7 }}
              >
                <span>4 of 8</span>
                <span
                  className="h-1 flex-1 overflow-hidden rounded-full"
                  style={{ background: "rgba(45,31,0,0.18)" }}
                >
                  <span
                    className="block h-full rounded-full"
                    style={{ width: "50%", background: "#1F3D2B" }}
                  />
                </span>
              </div>
            </div>
          </div>

          {/* Dhikr cards */}
          <div className="flex flex-1 flex-col gap-3 px-3.5 pt-4">
            <MiniCard
              arabic="سُبْحَانَ اللَّهِ وَبِحَمْدِهِ"
              translit="SubhanAllahi wa bihamdih"
              source="Bukhari 6405"
              count="33 / 100"
              highlighted
            />
            <MiniCard
              arabic="الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ"
              translit="Alhamdu lillahi rabbil-'alamin"
              source="Qur'an 1:2"
              count="3 / 3"
              faded
            />
          </div>

          {/* Bottom nav */}
          <div
            className="mt-2 grid grid-cols-5 items-center border-t"
            style={{
              borderColor: "rgba(31,61,43,0.06)",
              background: "rgba(250,246,236,0.98)",
              padding: "10px 6px 14px",
            }}
          >
            {[
              { Ic: Sunrise, label: "Morning", active: true },
              { Ic: Moon, label: "Evening" },
              { Ic: Hand, label: "Salah" },
              { Ic: CircleDot, label: "Tasbih" },
              { Ic: BookOpen, label: "More" },
            ].map(({ Ic, label, active }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1"
                style={{ color: active ? GOLD_DEEP : "rgba(31,61,43,0.42)" }}
              >
                <Ic size={15} strokeWidth={active ? 2.2 : 1.75} />
                <span
                  style={{
                    fontSize: 8.5,
                    fontWeight: active ? 700 : 500,
                    letterSpacing: "0.02em",
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniCard({
  arabic,
  translit,
  source,
  count,
  highlighted,
  faded,
}: {
  arabic: string;
  translit: string;
  source: string;
  count: string;
  highlighted?: boolean;
  faded?: boolean;
}) {
  return (
    <div
      style={{
        borderRadius: 18,
        background: "#FFFFFF",
        border: highlighted
          ? "1px solid rgba(201,168,76,0.4)"
          : "1px solid rgba(31,61,43,0.07)",
        padding: "14px 14px 12px",
        boxShadow: highlighted
          ? "0 6px 16px -8px rgba(201,168,76,0.35)"
          : "0 2px 8px -4px rgba(31,61,43,0.08)",
        opacity: faded ? 0.72 : 1,
      }}
    >
      <div
        dir="rtl"
        style={{
          fontFamily: ARABIC,
          fontWeight: 400,
          fontSize: 22,
          lineHeight: 2,
          color: INK,
        }}
      >
        {arabic}
      </div>
      <div
        className="mt-1"
        style={{
          fontSize: 9.5,
          fontStyle: "italic",
          color: "rgba(31,61,43,0.55)",
          letterSpacing: 0.1,
        }}
      >
        {translit}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span
          style={{
            background: "rgba(201,168,76,0.14)",
            border: "1px solid rgba(201,168,76,0.28)",
            color: GOLD_DEEP,
            fontSize: 8.5,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 999,
            letterSpacing: "0.04em",
          }}
        >
          {source}
        </span>
        <span
          style={{
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: 12,
            color: INK,
            letterSpacing: "-0.01em",
          }}
        >
          {count}
        </span>
      </div>
    </div>
  );
}
