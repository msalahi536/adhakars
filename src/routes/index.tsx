import { createFileRoute, Link } from "@tanstack/react-router";
import { ArcsTexture, MarketingLayout } from "@/components/marketing/MarketingLayout";
import {
  Sunrise,
  Moon,
  Hand,
  BedDouble,
  Compass,
  CircleDot,
  BookPlus,
  Shield,
  BookOpen,
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

const FEATURES = [
  {
    Icon: Sunrise,
    title: "Morning and Evening Adhkar",
    body: "The full daily remembrances, between Fajr and sunrise, and 'Asr and Maghrib.",
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

function HomePage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <ArcsTexture opacity={0.07} />
        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-16 md:grid md:grid-cols-[1.15fr,1fr] md:gap-14 md:px-10 md:pb-28 md:pt-24">
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-widest"
              style={{
                borderColor: "rgba(31, 61, 43, 0.18)",
                background: "rgba(255, 255, 255, 0.5)",
                color: "#1F3D2B",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "#C9A84C" }}
              />
              From the Sunnah
            </div>
            <h1
              className="mt-6 text-5xl leading-[1.02] tracking-tight md:text-7xl"
              style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500, color: "#1F3D2B" }}
            >
              Sahih Al-Adhkar
            </h1>
            <p
              className="mt-6 max-w-xl text-lg leading-relaxed md:text-xl"
              style={{ color: "rgba(31, 61, 43, 0.78)" }}
            >
              Authentic daily remembrance of Allah, sourced from the Sunnah.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/app"
                className="rounded-full px-7 py-4 text-base font-semibold transition-transform active:scale-[0.98]"
                style={{
                  background: "#1F3D2B",
                  color: "#FAF6EC",
                  boxShadow: "0 12px 32px rgba(31, 61, 43, 0.22)",
                }}
              >
                Open the app
              </Link>
              <Link
                to="/download"
                className="rounded-full border px-7 py-4 text-base font-semibold transition-transform active:scale-[0.98]"
                style={{
                  borderColor: "rgba(31, 61, 43, 0.2)",
                  background: "#FFFFFF",
                  color: "#1F3D2B",
                }}
              >
                Download
              </Link>
            </div>
          </div>

          {/* App preview */}
          <div className="mt-14 flex items-center justify-center md:mt-0">
            <HeroPreview />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-10 md:py-28">
          <div className="max-w-2xl">
            <div
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: "#C9A84C" }}
            >
              Everything you return to
            </div>
            <h2
              className="mt-3 text-4xl leading-tight tracking-tight md:text-5xl"
              style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
            >
              A calm, complete companion for daily dhikr.
            </h2>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ Icon, title, body }) => (
              <div
                key={title}
                className="rounded-3xl p-7 transition-transform"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(31, 61, 43, 0.08)",
                  boxShadow: "0 8px 30px rgba(31, 61, 43, 0.05)",
                }}
              >
                <div
                  className="grid h-12 w-12 place-items-center rounded-2xl"
                  style={{
                    background: "rgba(201, 168, 76, 0.14)",
                    color: "#8B7326",
                  }}
                >
                  <Icon size={22} strokeWidth={2} />
                </div>
                <h3
                  className="mt-6 text-xl"
                  style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600 }}
                >
                  {title}
                </h3>
                <p
                  className="mt-2 text-sm leading-relaxed"
                  style={{ color: "rgba(31, 61, 43, 0.7)" }}
                >
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Authentic sources */}
      <section
        className="relative overflow-hidden"
        style={{ background: "#1F3D2B", color: "#FAF6EC" }}
      >
        <ArcsTexture opacity={0.1} color="#C9A84C" />
        <div className="relative mx-auto grid max-w-6xl gap-14 px-5 py-24 md:grid-cols-2 md:items-center md:px-10 md:py-32">
          <div>
            <div
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: "#C9A84C" }}
            >
              <BookOpen size={14} />
              Built on authentic sources
            </div>
            <h2
              className="mt-4 text-4xl leading-tight tracking-tight md:text-5xl"
              style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
            >
              Every dhikr shows its reference, so you can verify it.
            </h2>
            <p
              className="mt-6 max-w-xl text-base leading-relaxed md:text-lg"
              style={{ color: "rgba(250, 246, 236, 0.78)" }}
            >
              Nothing is added to the Sunnah. Each remembrance is presented
              with its source, its authenticity, and the times it is said,
              so you can be at ease with what you recite.
            </p>
          </div>
          <div
            className="rounded-3xl p-6 md:p-8"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(201, 168, 76, 0.2)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#C9A84C" }}
            >
              Sample
            </div>
            <div
              dir="rtl"
              className="mt-4 text-3xl leading-loose md:text-4xl"
              style={{ fontFamily: "'Scheherazade New', 'Amiri', serif", color: "#FAF6EC" }}
            >
              اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا
            </div>
            <div className="mt-4 text-sm" style={{ color: "rgba(250, 246, 236, 0.7)" }}>
              O Allah, by You we have entered the morning and by You we have entered the evening.
            </div>
            <div
              className="mt-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "rgba(201, 168, 76, 0.18)", color: "#C9A84C" }}
            >
              Sahih, Tirmidhi 3391
            </div>
          </div>
        </div>
      </section>

      {/* Private by design */}
      <section>
        <div className="mx-auto max-w-6xl px-5 py-24 md:px-10 md:py-32">
          <div className="grid gap-14 md:grid-cols-[1fr,1.1fr] md:items-center">
            <div>
              <div
                className="text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: "#C9A84C" }}
              >
                Private by design
              </div>
              <h2
                className="mt-3 text-4xl leading-tight tracking-tight md:text-5xl"
                style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
              >
                Free. No ads. No tracking. No accounts.
              </h2>
              <p
                className="mt-6 max-w-xl text-base leading-relaxed md:text-lg"
                style={{ color: "rgba(31, 61, 43, 0.72)" }}
              >
                Your counts, your streaks, and your own adhkar stay on your
                device. Nothing is uploaded. Nothing is watched.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { title: "Stored on device", body: "Your progress lives only on your phone." },
                { title: "No accounts", body: "There is nothing to sign up for." },
                { title: "No ads, no upsells", body: "The whole app is free." },
                { title: "Works offline", body: "Open it anywhere and it just works." },
              ].map((c) => (
                <div
                  key={c.title}
                  className="rounded-2xl p-5"
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid rgba(31, 61, 43, 0.08)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Shield size={16} style={{ color: "#C9A84C" }} />
                    <span
                      className="text-sm font-semibold"
                      style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                    >
                      {c.title}
                    </span>
                  </div>
                  <p
                    className="mt-2 text-sm leading-relaxed"
                    style={{ color: "rgba(31, 61, 43, 0.7)" }}
                  >
                    {c.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-5 pb-24 md:px-10">
        <div
          className="relative mx-auto max-w-6xl overflow-hidden rounded-[36px] px-6 py-14 text-center md:px-14 md:py-20"
          style={{
            background: "linear-gradient(135deg, #1F3D2B 0%, #2E5A3F 100%)",
            color: "#FAF6EC",
          }}
        >
          <ArcsTexture opacity={0.08} color="#C9A84C" />
          <div className="relative">
            <h2
              className="mx-auto max-w-2xl text-4xl leading-tight tracking-tight md:text-5xl"
              style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
            >
              Begin, and let today be a day of remembrance.
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/download"
                className="rounded-full px-7 py-4 text-base font-semibold"
                style={{ background: "#C9A84C", color: "#1F3D2B" }}
              >
                Download
              </Link>
              <Link
                to="/app"
                className="rounded-full border px-7 py-4 text-base font-semibold"
                style={{
                  borderColor: "rgba(250, 246, 236, 0.35)",
                  color: "#FAF6EC",
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

function HeroPreview() {
  return (
    <div
      className="relative w-full max-w-[340px]"
      style={{ aspectRatio: "9 / 18" }}
    >
      <div
        className="absolute inset-0 rounded-[44px]"
        style={{
          background: "linear-gradient(135deg, #1F3D2B 0%, #2E5A3F 100%)",
          padding: 10,
          boxShadow:
            "0 40px 80px -20px rgba(31, 61, 43, 0.4), 0 12px 30px rgba(31, 61, 43, 0.2)",
        }}
      >
        <div
          className="relative flex h-full flex-col overflow-hidden rounded-[36px]"
          style={{ background: "#FAF6EC" }}
        >
          {/* Phone header */}
          <div
            className="relative overflow-hidden px-5 pb-6 pt-8"
            style={{
              background: "linear-gradient(135deg, #e8c97a 0%, #d4a843 100%)",
              color: "#2d1f00",
            }}
          >
            <ArcsTexture opacity={0.18} color="#1F3D2B" />
            <div className="relative">
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                Morning
              </div>
              <div
                className="mt-1 text-2xl"
                style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600 }}
              >
                Morning Adhkar
              </div>
              <div className="mt-3 h-1.5 rounded-full" style={{ background: "rgba(45,31,0,0.15)" }}>
                <div className="h-full w-1/2 rounded-full" style={{ background: "#1F3D2B" }} />
              </div>
            </div>
          </div>
          {/* Card */}
          <div className="flex flex-1 flex-col gap-3 p-4">
            <div
              className="rounded-2xl p-4"
              style={{ background: "#FFFFFF", border: "1px solid rgba(31,61,43,0.08)" }}
            >
              <div
                dir="rtl"
                className="text-xl leading-loose"
                style={{ fontFamily: "'Scheherazade New', serif", color: "#1F3D2B" }}
              >
                سُبْحَانَ اللَّهِ وَبِحَمْدِهِ
              </div>
              <div
                className="mt-2 text-[10px]"
                style={{ color: "rgba(31,61,43,0.6)" }}
              >
                SubhanAllahi wa bihamdih
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span
                  className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
                  style={{ background: "rgba(201,168,76,0.18)", color: "#8B7326" }}
                >
                  Bukhari
                </span>
                <span
                  className="text-xs font-bold"
                  style={{ color: "#1F3D2B" }}
                >
                  33 / 100
                </span>
              </div>
            </div>
            <div
              className="rounded-2xl p-4"
              style={{ background: "#FFFFFF", border: "1px solid rgba(31,61,43,0.08)", opacity: 0.85 }}
            >
              <div
                dir="rtl"
                className="text-lg leading-loose"
                style={{ fontFamily: "'Scheherazade New', serif", color: "#1F3D2B" }}
              >
                الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span
                  className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
                  style={{ background: "rgba(201,168,76,0.18)", color: "#8B7326" }}
                >
                  Qur'an 1:2
                </span>
                <span className="text-xs font-bold" style={{ color: "#1F3D2B" }}>
                  3 / 3
                </span>
              </div>
            </div>
          </div>
          {/* Fake bottom nav */}
          <div
            className="grid grid-cols-5 gap-1 border-t px-2 py-2"
            style={{ borderColor: "rgba(31,61,43,0.08)", background: "rgba(250,246,236,0.98)" }}
          >
            {[Sunrise, Moon, Hand, CircleDot, BookOpen].map((Ic, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-0.5"
                style={{ color: i === 0 ? "#C9A84C" : "rgba(31,61,43,0.5)" }}
              >
                <Ic size={14} />
                <span className="text-[8px] font-semibold">·</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
