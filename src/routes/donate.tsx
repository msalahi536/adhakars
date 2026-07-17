import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout, ArcsTexture } from "@/components/marketing/MarketingLayout";
import { Heart } from "lucide-react";

// TODO: Replace with real donation URL when available.
const DONATE_URL = "#";

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
      <section className="relative overflow-hidden">
        <ArcsTexture opacity={0.06} />
        <div className="relative mx-auto max-w-3xl px-5 pb-20 pt-16 text-center md:px-10 md:pb-28 md:pt-24">
          <div
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: "#C9A84C" }}
          >
            Sadaqah jariyah
          </div>
          <h1
            className="mt-3 text-5xl leading-tight tracking-tight md:text-6xl"
            style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
          >
            Support this project
          </h1>
          <p
            className="mx-auto mt-8 max-w-xl text-lg leading-relaxed"
            style={{ color: "rgba(31, 61, 43, 0.82)" }}
          >
            This app is free. There are no ads and nothing is sold. If it
            has benefited you, a donation helps cover hosting and keeps the
            work going, as sadaqah jariyah, in sha' Allah.
          </p>
          <p
            className="mx-auto mt-5 max-w-xl text-base leading-relaxed"
            style={{ color: "rgba(31, 61, 43, 0.7)" }}
          >
            And if you are not able to give, please make du'a for this project
            and for everyone who uses it. That is a support worth more than
            any amount.
          </p>

          <div className="mt-12 flex flex-col items-center gap-3">
            <a
              href={DONATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-full px-9 py-4 text-base font-semibold transition-transform active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #C9A84C 0%, #B8923A 100%)",
                color: "#1F3D2B",
                boxShadow: "0 16px 40px rgba(201, 168, 76, 0.35)",
              }}
            >
              <Heart size={18} strokeWidth={2.4} />
              Donate
            </a>
            <div
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(31, 61, 43, 0.55)" }}
            >
              TODO, donation link coming soon
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
