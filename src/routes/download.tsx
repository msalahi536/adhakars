import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout, ArcsTexture } from "@/components/marketing/MarketingLayout";
import { Apple, Play, QrCode } from "lucide-react";

// TODO: Replace with real App Store link when available.
const APPLE_STORE_URL = "#";
// TODO: Replace with real Google Play link when available.
const GOOGLE_PLAY_URL = "#";

export const Route = createFileRoute("/download")({
  head: () => ({
    meta: [
      { title: "Download, Sahih Al-Adhkar" },
      {
        name: "description",
        content: "Get Sahih Al-Adhkar on iPhone, Android, or use it right in your browser. Free, no ads, no tracking.",
      },
      { property: "og:title", content: "Get Sahih Al-Adhkar" },
      { property: "og:description", content: "Free, no ads, no tracking." },
    ],
  }),
  component: DownloadPage,
});

function DownloadPage() {
  return (
    <MarketingLayout>
      <section className="relative overflow-hidden">
        <ArcsTexture opacity={0.06} />
        <div className="relative mx-auto max-w-5xl px-5 pb-24 pt-16 md:px-10 md:pt-24">
          <div className="text-center">
            <div
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: "#C9A84C" }}
            >
              Download
            </div>
            <h1
              className="mt-3 text-5xl leading-tight tracking-tight md:text-6xl"
              style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
            >
              Get Sahih Al-Adhkar
            </h1>
            <p
              className="mx-auto mt-5 max-w-xl text-lg"
              style={{ color: "rgba(31, 61, 43, 0.75)" }}
            >
              Free, no ads, no tracking.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {/* iPhone card */}
            <a
              href={APPLE_STORE_URL}
              aria-label="Download for iPhone (TODO: store link)"
              className="group relative flex flex-col justify-between overflow-hidden rounded-[32px] p-8 transition-transform active:scale-[0.99] md:p-10"
              style={{
                background: "linear-gradient(135deg, #1F3D2B 0%, #2E5A3F 100%)",
                color: "#FAF6EC",
                minHeight: 260,
                boxShadow: "0 20px 60px rgba(31, 61, 43, 0.25)",
              }}
            >
              <ArcsTexture opacity={0.08} color="#C9A84C" />
              <div className="relative flex items-center gap-3">
                <div
                  className="grid h-12 w-12 place-items-center rounded-2xl"
                  style={{ background: "rgba(250, 246, 236, 0.14)" }}
                >
                  <Apple size={26} />
                </div>
                <div className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#C9A84C" }}>
                  iOS
                </div>
              </div>
              <div className="relative">
                <div
                  className="text-3xl"
                  style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
                >
                  Download for iPhone
                </div>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
                  style={{ background: "rgba(201, 168, 76, 0.22)", color: "#C9A84C" }}
                >
                  TODO, App Store link coming
                </div>
              </div>
            </a>

            {/* Android card */}
            <a
              href={GOOGLE_PLAY_URL}
              aria-label="Download for Android (TODO: store link)"
              className="group relative flex flex-col justify-between overflow-hidden rounded-[32px] p-8 transition-transform active:scale-[0.99] md:p-10"
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(31, 61, 43, 0.1)",
                color: "#1F3D2B",
                minHeight: 260,
                boxShadow: "0 20px 60px rgba(31, 61, 43, 0.08)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="grid h-12 w-12 place-items-center rounded-2xl"
                  style={{ background: "rgba(31, 61, 43, 0.08)" }}
                >
                  <Play size={24} style={{ color: "#1F3D2B" }} />
                </div>
                <div
                  className="text-sm font-semibold uppercase tracking-widest"
                  style={{ color: "#8B7326" }}
                >
                  Android
                </div>
              </div>
              <div>
                <div
                  className="text-3xl"
                  style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
                >
                  Download for Android
                </div>
                <div
                  className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
                  style={{ background: "rgba(201, 168, 76, 0.18)", color: "#8B7326" }}
                >
                  TODO, Google Play link coming
                </div>
              </div>
            </a>
          </div>

          {/* Browser option */}
          <div
            className="mt-10 flex flex-col items-center justify-between gap-4 rounded-3xl p-6 md:flex-row md:p-8"
            style={{
              background: "#F3EEDC",
              border: "1px solid rgba(31, 61, 43, 0.08)",
            }}
          >
            <div>
              <div
                className="text-xl"
                style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600 }}
              >
                Or use it right in your browser
              </div>
              <div className="mt-1 text-sm" style={{ color: "rgba(31, 61, 43, 0.7)" }}>
                Works on any modern phone or desktop, no install needed.
              </div>
            </div>
            <Link
              to="/app"
              className="rounded-full px-6 py-3 text-sm font-semibold"
              style={{ background: "#1F3D2B", color: "#FAF6EC" }}
            >
              Open the app
            </Link>
          </div>

          {/* QR placeholder */}
          <div className="mt-10 flex justify-center">
            <div
              className="flex flex-col items-center gap-3 rounded-3xl p-8 text-center"
              style={{
                background: "#FFFFFF",
                border: "1px dashed rgba(31, 61, 43, 0.25)",
              }}
            >
              <div
                className="grid h-32 w-32 place-items-center rounded-2xl"
                style={{ background: "rgba(31, 61, 43, 0.05)", color: "rgba(31, 61, 43, 0.4)" }}
                aria-label="QR code placeholder"
              >
                <QrCode size={72} strokeWidth={1.2} />
              </div>
              <div
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "rgba(31, 61, 43, 0.6)" }}
              >
                TODO, QR code image
              </div>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
