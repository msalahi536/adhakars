import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArcsTexture,
  IPhoneFrame,
  MarketingLayout,
} from "@/components/marketing/MarketingLayout";
import {
  Apple,
  Play,
  ArrowRight,
  Share,
  MoreVertical,
  Plus,
  ShieldCheck,
  WifiOff,
  Lock,
  Ban,
  Bell,
} from "lucide-react";

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
const RADIUS = { pill: "999px", card: "20px", block: "28px", cta: "32px" };
const SHADOW_CARD =
  "0 1px 0 rgba(31,61,43,0.04), 0 8px 24px -12px rgba(31,61,43,0.10), 0 24px 48px -28px rgba(31,61,43,0.14)";
const SHADOW_CARD_HOVER =
  "0 1px 0 rgba(31,61,43,0.05), 0 12px 32px -14px rgba(31,61,43,0.14), 0 32px 60px -32px rgba(31,61,43,0.20)";

const TRUST = [
  { Icon: Heart2Icon, label: "Free forever" },
  { Icon: Ban, label: "No ads" },
  { Icon: Lock, label: "No tracking" },
  { Icon: WifiOff, label: "Works offline" },
];

function Heart2Icon(props: { size?: number }) {
  return <ShieldCheck size={props.size} />;
}

export const Route = createFileRoute("/download")({
  head: () => ({
    meta: [
      { title: "Download, Sahih Al-Adhkar" },
      {
        name: "description",
        content:
          "Use Sahih Al-Adhkar right in your browser today, or install it to your home screen. Native apps for iPhone and Android are on the way.",
      },
      { property: "og:title", content: "Get Sahih Al-Adhkar" },
      { property: "og:description", content: "Free, offline friendly, no accounts." },
    ],
  }),
  component: DownloadPage,
});

function DownloadPage() {
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
        <div className="relative mx-auto max-w-[1200px] px-6 pb-20 pt-16 md:px-10 md:pb-24 md:pt-24 lg:grid lg:grid-cols-[1.15fr,1fr] lg:items-center lg:gap-16">
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
              Download
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
              Available today,
              <br />
              <span style={{ fontStyle: "italic", color: GREEN_SOFT }}>
                right in your browser.
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
              Open the app now on any modern phone or computer. Nothing to
              install, no account needed. Native apps for iPhone and Android
              are on the way.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
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
                  boxShadow:
                    "0 10px 24px -10px rgba(31,61,43,0.36), 0 2px 6px rgba(31,61,43,0.12)",
                }}
              >
                Open the app now
                <ArrowRight size={16} />
              </Link>
              <a
                href="#install"
                className="btn-ghost inline-flex items-center gap-2"
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
                Install to home screen
              </a>
            </div>

            <div
              className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs"
              style={{ color: "rgba(31,61,43,0.6)", letterSpacing: "0.02em" }}
            >
              {TRUST.map(({ Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5">
                  <Icon size={14} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-14 flex items-center justify-center lg:mt-0">
            <IPhoneFrame />
          </div>
        </div>
      </section>

      {/* ================= NATIVE APPS (coming) ================= */}
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
              Native apps
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
              Coming to the App Store
              <br />
              <span style={{ fontStyle: "italic", color: GREEN_SOFT }}>
                and Google Play.
              </span>
            </h2>
            <p
              className="mt-5 max-w-xl"
              style={{ color: "rgba(31,61,43,0.68)", fontSize: "1.0625rem", lineHeight: 1.65 }}
            >
              Native builds are in review. Until they land, the web app runs
              the same on every device, and installs to your home screen with
              the same feel.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {/* iOS */}
            <div
              className="lift relative flex flex-col justify-between overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${GREEN_DEEP} 0%, ${GREEN_SOFT} 100%)`,
                color: CREAM,
                minHeight: 260,
                borderRadius: RADIUS.block,
                padding: "34px",
                boxShadow: SHADOW_CARD,
              }}
            >
              <ArcsTexture opacity={0.07} color={GOLD} />
              <div className="relative flex items-center gap-3">
                <div
                  className="grid h-12 w-12 place-items-center rounded-2xl"
                  style={{ background: "rgba(250,246,236,0.14)", border: "1px solid rgba(201,168,76,0.28)" }}
                >
                  <Apple size={24} />
                </div>
                <div
                  style={{
                    color: GOLD,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                  }}
                >
                  iPhone and iPad
                </div>
              </div>
              <div className="relative mt-8">
                <div
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 500,
                    fontSize: "1.7rem",
                    lineHeight: 1.15,
                    letterSpacing: "-0.015em",
                  }}
                >
                  Coming to the App Store.
                </div>
                <p
                  className="mt-3 max-w-md"
                  style={{ color: "rgba(250,246,236,0.72)", fontSize: "0.95rem", lineHeight: 1.6 }}
                >
                  In the meantime, add the web app to your home screen for the
                  same one tap experience.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <a
                    href="#install"
                    className="btn-primary inline-flex items-center gap-2"
                    style={{
                      background: GOLD,
                      color: GREEN_DEEP,
                      padding: "12px 20px",
                      borderRadius: RADIUS.pill,
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    Install on iPhone
                    <ArrowRight size={14} />
                  </a>
                  <a
                    href="mailto:msalahi536@gmail.com?subject=Notify%20me%20when%20iOS%20is%20live"
                    className="inline-flex items-center gap-2"
                    style={{
                      color: "rgba(250,246,236,0.85)",
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: "underline",
                      textUnderlineOffset: 4,
                    }}
                  >
                    <Bell size={13} />
                    Notify me at launch
                  </a>
                </div>
              </div>
            </div>

            {/* Android */}
            <div
              className="lift relative flex flex-col justify-between overflow-hidden"
              style={{
                background: CREAM_CARD,
                color: INK,
                minHeight: 260,
                borderRadius: RADIUS.block,
                padding: "34px",
                boxShadow: SHADOW_CARD,
                border: "1px solid rgba(31,61,43,0.08)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="grid h-12 w-12 place-items-center rounded-2xl"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(201,168,76,0.22) 0%, rgba(201,168,76,0.10) 100%)",
                    border: "1px solid rgba(201,168,76,0.22)",
                    color: GOLD_DEEP,
                  }}
                >
                  <Play size={22} />
                </div>
                <div
                  style={{
                    color: GOLD_DEEP,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                  }}
                >
                  Android
                </div>
              </div>
              <div className="mt-8">
                <div
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 500,
                    fontSize: "1.7rem",
                    lineHeight: 1.15,
                    letterSpacing: "-0.015em",
                    color: INK,
                  }}
                >
                  Coming to Google Play.
                </div>
                <p
                  className="mt-3 max-w-md"
                  style={{ color: "rgba(31,61,43,0.68)", fontSize: "0.95rem", lineHeight: 1.6 }}
                >
                  Android users can install the web app straight from Chrome,
                  and get a proper icon on the home screen right away.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <a
                    href="#install"
                    className="btn-primary inline-flex items-center gap-2"
                    style={{
                      background: GREEN,
                      color: CREAM,
                      padding: "12px 20px",
                      borderRadius: RADIUS.pill,
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    Install on Android
                    <ArrowRight size={14} />
                  </a>
                  <a
                    href="mailto:msalahi536@gmail.com?subject=Notify%20me%20when%20Android%20is%20live"
                    className="inline-flex items-center gap-2"
                    style={{
                      color: "rgba(31,61,43,0.7)",
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: "underline",
                      textUnderlineOffset: 4,
                    }}
                  >
                    <Bell size={13} />
                    Notify me at launch
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= INSTALL AS APP ================= */}
      <section id="install">
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
              Install as an app
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
              A real app icon,
              <br />
              <span style={{ fontStyle: "italic", color: GREEN_SOFT }}>
                without the wait.
              </span>
            </h2>
            <p
              className="mt-5 max-w-xl"
              style={{ color: "rgba(31,61,43,0.68)", fontSize: "1.0625rem", lineHeight: 1.65 }}
            >
              Two taps and the app lives on your home screen. It opens
              fullscreen, works offline, and feels the same as the native
              version.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <InstallCard
              badge="iPhone and iPad"
              title="Add to Home Screen"
              steps={[
                { Icon: Share, text: "Open the app in Safari, then tap the Share icon." },
                { Icon: Plus, text: "Choose \"Add to Home Screen\", then tap Add." },
              ]}
            />
            <InstallCard
              badge="Android"
              title="Install app"
              steps={[
                { Icon: MoreVertical, text: "Open the app in Chrome, then tap the menu." },
                { Icon: Plus, text: "Choose \"Install app\" and confirm." },
              ]}
            />
          </div>
        </div>
      </section>

      {/* ================= TRUST STRIP + FINAL CTA ================= */}
      <section className="px-6 pb-28 md:px-10">
        <div
          className="relative mx-auto max-w-[1200px] overflow-hidden text-center"
          style={{
            borderRadius: RADIUS.cta,
            background: `linear-gradient(135deg, ${GREEN_DEEP} 0%, ${GREEN_SOFT} 100%)`,
            color: CREAM,
            padding: "68px 24px",
            boxShadow:
              "0 40px 80px -30px rgba(31,61,43,0.5), 0 12px 30px -8px rgba(31,61,43,0.28)",
          }}
        >
          <ArcsTexture opacity={0.07} color={GOLD} />
          <div className="relative mx-auto max-w-3xl">
            <div
              style={{
                color: GOLD,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
              }}
            >
              Free, offline, private
            </div>
            <h2
              className="mt-5"
              style={{
                fontFamily: SERIF,
                fontWeight: 500,
                fontSize: "clamp(2rem, 4.6vw, 3.25rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
              }}
            >
              Open it now, in sha' Allah,
              <br />
              <span style={{ fontStyle: "italic", color: "rgba(250,246,236,0.85)" }}>
                let today be a day of dhikr.
              </span>
            </h2>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link
                to="/app"
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
                Open the app
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/donate"
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
                Support the project
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

function InstallCard({
  badge,
  title,
  steps,
}: {
  badge: string;
  title: string;
  steps: { Icon: React.ComponentType<{ size?: number }>; text: string }[];
}) {
  return (
    <div
      className="lift"
      style={{
        background: CREAM_CARD,
        border: "1px solid rgba(31,61,43,0.08)",
        borderRadius: RADIUS.block,
        padding: "30px",
        boxShadow: SHADOW_CARD,
      }}
    >
      <div
        style={{
          color: GOLD_DEEP,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
        }}
      >
        {badge}
      </div>
      <div
        className="mt-3"
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: "1.4rem",
          letterSpacing: "-0.01em",
          color: INK,
        }}
      >
        {title}
      </div>
      <ol className="mt-6 space-y-4">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-4">
            <div
              className="grid place-items-center"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(201,168,76,0.14)",
                border: "1px solid rgba(201,168,76,0.22)",
                color: GOLD_DEEP,
                flexShrink: 0,
              }}
            >
              <s.Icon size={16} />
            </div>
            <div className="flex-1">
              <div
                className="text-xs font-semibold"
                style={{ color: GOLD_DEEP, letterSpacing: "0.14em" }}
              >
                STEP {i + 1}
              </div>
              <div
                className="mt-1"
                style={{ color: "rgba(31,61,43,0.78)", fontSize: "0.95rem", lineHeight: 1.55 }}
              >
                {s.text}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
