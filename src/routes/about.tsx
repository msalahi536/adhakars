import { createFileRoute } from "@tanstack/react-router";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { HeaderSettingsButton } from "@/components/HeaderSettingsButton";
import { ConcentricCirclesPattern } from "@/components/HeaderPatterns";
import { Heart, Mail } from "lucide-react";

// TODO: Replace with real donation URL when available.
const DONATE_URL = "#";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About & Support, My Adhkar" },
      {
        name: "description",
        content:
          "About the My Adhkar project, how to support it, and how to get in touch.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <>
      <header
        className="page-header relative overflow-hidden"
        style={{ background: "var(--grad-header)", color: "var(--header-fg)" }}
      >
        <ConcentricCirclesPattern />
        <HeaderBackButton />
        <HeaderSettingsButton />
        <div
          className="relative mx-auto max-w-md px-4 pb-5 pt-4"
          style={{ paddingLeft: 60, paddingRight: 60 }}
        >
          <div className="label-caps" style={{ color: "var(--header-sub)", opacity: 1 }}>
            Information
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">About &amp; Support</h1>
        </div>
      </header>

      <main className="scroll-area">
        <div className="mx-auto max-w-md px-4 py-4 space-y-4">
          <section
            className="rounded-[24px] p-5"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <h2 className="label-caps mb-2">About the project</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
              My Adhkar is a simple, offline-friendly companion for daily
              remembrance of Allah. Every dhikr, du'a, and adhkar in this app
              is sourced directly from authentic hadith or the Qur'an — no
              weak or fabricated narrations.
            </p>
            <p
              className="mt-3 text-xs leading-relaxed"
              style={{ color: "var(--muted-foreground)" }}
            >
              Based on the authentic adhkar compiled by Shaykh Abdul Aziz
              At-Tarefe, compiled by Yasser Peerun.
            </p>
          </section>

          <section
            className="rounded-[24px] p-5"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <h2 className="label-caps mb-2">Support this project</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
              This app is completely free with no ads and no tracking. If it
              has benefited you, a small donation helps cover hosting, keeps
              development going, and supports future features — all as
              ṣadaqah jāriyah, in shā' Allāh.
            </p>
            <a
              href={DONATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold"
              style={{
                background: "linear-gradient(135deg, #c9a84c, #b8923a)",
                color: "#ffffff",
              }}
            >
              <Heart size={16} strokeWidth={2.4} />
              Donate
            </a>
            <div
              className="mt-2 text-[11px]"
              style={{ color: "var(--muted-foreground)" }}
            >
              {/* TODO: replace # with the real donation URL */}
              Donation link coming soon.
            </div>
          </section>

          <section
            className="rounded-[24px] p-5"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <h2 className="label-caps mb-2">Contact &amp; feedback</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
              Spotted an error in an adhkar? Have a feature idea? Want to
              share how the app has helped you? I'd love to hear from you.
            </p>
            <a
              href="mailto:msalahi536@gmail.com"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold"
              style={{
                background: "var(--accent)",
                color: "var(--accent-foreground)",
              }}
            >
              <Mail size={16} strokeWidth={2.4} />
              msalahi536@gmail.com
            </a>
            <div
              className="mt-2 text-center text-[11px]"
              style={{ color: "var(--muted-foreground)" }}
            >
              Mohammad Salahi
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
