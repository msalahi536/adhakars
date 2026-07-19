import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArcsTexture,
  MarketingLayout,
} from "@/components/marketing/MarketingLayout";
import { Heart, ArrowRight, ServerCog, Ban, Lock, HandHeart, Bell } from "lucide-react";

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

const IMPACT = [
  {
    Icon: HandHeart,
    title: "Keeps the app free",
    body: "No paywalls, no premium tier. Every feature stays available to everyone.",
  },
  {
    Icon: ServerCog,
    title: "Covers hosting",
    body: "Servers, domains, and app store fees, so the project can quietly keep running.",
  },
  {
    Icon: Ban,
    title: "No ads, ever",
    body: "This will never be funded by ads or sponsored content of any kind.",
  },
  {
    Icon: Lock,
    title: "No data sold",
    body: "Your practice stays on your device. Your support keeps it that way.",
  },
];

export const Route = createFileRoute("/donate")({
  head: () => ({
    meta: [
      { title: "Support this project, Sahih Al-Adhkar" },
      {
        name: "description",
        content:
          "Sahih Al-Adhkar is free. If it has benefited you, a donation helps cover hosting and keeps the work going, as sadaqah jariyah, in sha' Allah.",
      },
      { property: "og:title", content: "Support Sahih Al-Adhkar" },
      { property: "og:description", content: "This app is free. Support keeps it going." },
    ],
  }),
  component: DonatePage,
});

function DonatePage() {
  return (
    <MarketingLayout>
      <style>{`
        .lift { transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 220ms ease; }
        .lift:hover { transform: translateY(-3px); box-shadow: ${SHADOW_CARD_HOVER}; }
        .btn-primary { transition: transform 160ms ease, box-shadow 220ms ease; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 16px 36px -12px rgba(201,168,76,0.55), 0 4px 10px rgba(31,61,43,0.16); }
      `}</style>

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden">
        <ArcsTexture opacity={0.05} />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(1100px 460px at 50% -10%, rgba(201,168,76,0.16), transparent 60%), radial-gradient(800px 380px at 10% 110%, rgba(31,61,43,0.06), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-[860px] px-6 pb-20 pt-16 text-center md:px-10 md:pb-24 md:pt-24">
          <div
            style={{
              color: GOLD_DEEP,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
            }}
          >
            Sadaqah jariyah
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
            Support this project,
            <br />
            <span style={{ fontStyle: "italic", color: GREEN_SOFT }}>
              as ongoing charity.
            </span>
          </h1>
          <p
            className="mx-auto mt-8 max-w-[36rem]"
            style={{
              color: "rgba(31,61,43,0.72)",
              fontSize: "1.125rem",
              lineHeight: 1.65,
            }}
          >
            This app is free. There are no ads and nothing is sold. If it has
            benefited you, a donation helps cover hosting and keeps the work
            going, in sha' Allah, as sadaqah jariyah for as long as it is used.
          </p>

          <div className="mt-12 flex flex-col items-center gap-4">
            <button
              type="button"
              disabled
              className="btn-primary inline-flex items-center gap-3"
              style={{
                background: `linear-gradient(135deg, ${GOLD} 0%, #B8923A 100%)`,
                color: GREEN_DEEP,
                padding: "18px 32px",
                borderRadius: RADIUS.pill,
                fontWeight: 700,
                fontSize: 16,
                letterSpacing: "-0.01em",
                boxShadow:
                  "0 16px 40px -12px rgba(201,168,76,0.55), 0 4px 10px rgba(31,61,43,0.14)",
                opacity: 0.95,
                cursor: "default",
              }}
              aria-disabled
            >
              <Heart size={18} strokeWidth={2.4} />
              Donate
            </button>
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest"
              style={{
                background: "rgba(201,168,76,0.14)",
                color: GOLD_DEEP,
                border: "1px solid rgba(201,168,76,0.28)",
                letterSpacing: "0.2em",
              }}
            >
              Donations opening soon, jazakAllahu khayran
            </div>
            <a
              href="mailto:msalahi536@gmail.com?subject=Notify%20me%20when%20donations%20open"
              className="inline-flex items-center gap-1.5 text-sm font-semibold"
              style={{
                color: GREEN_SOFT,
                textDecoration: "underline",
                textUnderlineOffset: 4,
              }}
            >
              <Bell size={13} />
              Let me know when it is live
            </a>
          </div>
        </div>
      </section>

      {/* ================= WHAT YOUR SUPPORT DOES ================= */}
      <section className="relative" style={{ background: CREAM_DEEP }}>
        <div className="mx-auto max-w-[1200px] px-6 py-24 md:px-10 md:py-28">
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
              What your support does
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
              Small, honest, and enough
              <br />
              <span style={{ fontStyle: "italic", color: GREEN_SOFT }}>
                to keep this alive.
              </span>
            </h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {IMPACT.map(({ Icon, title, body }) => (
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

      {/* ================= DU'A BLESSING (green band) ================= */}
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
              "radial-gradient(700px 300px at 50% 20%, rgba(201,168,76,0.10), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-[860px] px-6 py-24 text-center md:px-10 md:py-32">
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
            A du'a is enough
          </div>

          <div
            dir="rtl"
            className="mx-auto mt-10"
            style={{
              fontFamily: ARABIC,
              fontWeight: 400,
              fontSize: "clamp(1.75rem, 3.6vw, 2.6rem)",
              lineHeight: 1.9,
              color: CREAM,
              maxWidth: "38rem",
            }}
          >
            جَزَاكُمُ اللَّهُ خَيْرًا
          </div>
          <div
            className="mt-4 text-sm"
            style={{ color: "rgba(250,246,236,0.6)", fontStyle: "italic" }}
          >
            JazakumAllahu khayran
          </div>

          <div
            className="mx-auto mt-12 rounded-3xl"
            style={{
              border: "1px solid rgba(201,168,76,0.28)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.02) 100%)",
              padding: "32px 28px",
              maxWidth: "36rem",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          >
            <p
              style={{
                color: "rgba(250,246,236,0.9)",
                fontSize: "1.1rem",
                lineHeight: 1.75,
                fontFamily: SERIF,
                fontStyle: "italic",
                fontWeight: 400,
              }}
            >
              And if you are not able to give, please make du'a for this
              project and for everyone who uses it. That is a support worth
              more than any amount.
            </p>
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="px-6 pb-28 md:px-10">
        <div
          className="relative mx-auto max-w-[1200px] overflow-hidden text-center"
          style={{
            borderRadius: RADIUS.cta,
            background: `linear-gradient(135deg, ${CREAM_CARD} 0%, ${CREAM_DEEP} 100%)`,
            color: INK,
            padding: "60px 24px",
            boxShadow: SHADOW_CARD,
            border: "1px solid rgba(31,61,43,0.08)",
          }}
        >
          <div className="relative mx-auto max-w-2xl">
            <h3
              style={{
                fontFamily: SERIF,
                fontWeight: 500,
                fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                color: INK,
              }}
            >
              Whatever you can give,
              <br />
              <span style={{ fontStyle: "italic", color: GREEN_SOFT }}>
                it is received with gratitude.
              </span>
            </h3>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/app"
                className="inline-flex items-center gap-2"
                style={{
                  background: GREEN,
                  color: CREAM,
                  padding: "15px 26px",
                  borderRadius: RADIUS.pill,
                  fontWeight: 700,
                  fontSize: 14,
                  boxShadow:
                    "0 10px 24px -10px rgba(31,61,43,0.36), 0 2px 6px rgba(31,61,43,0.12)",
                }}
              >
                Open the app
                <ArrowRight size={15} />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2"
                style={{
                  border: "1px solid rgba(31,61,43,0.2)",
                  background: CREAM_CARD,
                  color: INK,
                  padding: "14px 24px",
                  borderRadius: RADIUS.pill,
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                About the project
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
