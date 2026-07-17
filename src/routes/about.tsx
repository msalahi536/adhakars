import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout, ArcsTexture } from "@/components/marketing/MarketingLayout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About, Sahih Al-Adhkar" },
      {
        name: "description",
        content:
          "Sahih Al-Adhkar is a simple, offline friendly companion for the daily remembrance of Allah, sourced from authentic narrations.",
      },
      { property: "og:title", content: "About Sahih Al-Adhkar" },
      {
        property: "og:description",
        content: "About the Sahih Al-Adhkar project and the sources behind it.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <MarketingLayout>
      <section className="relative overflow-hidden">
        <ArcsTexture opacity={0.06} />
        <div className="relative mx-auto max-w-3xl px-5 pb-16 pt-16 md:px-10 md:pb-24 md:pt-24">
          <div
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: "#C9A84C" }}
          >
            About
          </div>
          <h1
            className="mt-3 text-5xl leading-tight tracking-tight md:text-6xl"
            style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
          >
            About the project
          </h1>
          <p
            className="mt-8 text-lg leading-relaxed md:text-xl"
            style={{ color: "rgba(31, 61, 43, 0.82)" }}
          >
            Sahih Al-Adhkar is a simple, offline friendly companion for the
            daily remembrance of Allah. Every dhikr and du'a is taken from
            authentic narrations, with the source shown on each one so you
            can verify it yourself.
          </p>
          <p
            className="mt-6 text-base leading-relaxed"
            style={{ color: "rgba(31, 61, 43, 0.7)" }}
          >
            Based on the authentic adhkar compiled by Shaykh Abdul Aziz At-Tarefe.
          </p>

          <div
            className="mt-14 rounded-3xl p-7 md:p-9"
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(31, 61, 43, 0.08)",
              boxShadow: "0 10px 30px rgba(31, 61, 43, 0.05)",
            }}
          >
            <h2
              className="text-2xl"
              style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600 }}
            >
              Contact and feedback
            </h2>
            <p
              className="mt-3 text-sm leading-relaxed"
              style={{ color: "rgba(31, 61, 43, 0.72)" }}
            >
              Found a mistake in an adhkar? Have an idea for a feature? Want
              to share how the app has helped you? Please reach out.
            </p>
            <a
              href="mailto:msalahi536@gmail.com"
              className="mt-5 inline-flex rounded-full px-6 py-3 text-sm font-semibold"
              style={{ background: "#1F3D2B", color: "#FAF6EC" }}
            >
              msalahi536@gmail.com
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/app"
              className="rounded-full px-6 py-3 text-sm font-semibold"
              style={{ background: "#C9A84C", color: "#1F3D2B" }}
            >
              Open the app
            </Link>
            <Link
              to="/donate"
              className="rounded-full border px-6 py-3 text-sm font-semibold"
              style={{ borderColor: "rgba(31, 61, 43, 0.2)", color: "#1F3D2B" }}
            >
              Support the project
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
