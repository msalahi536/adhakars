// Faithful mini preview of a real app screen using a supplied token map.
// Mirrors real layout: header (label + title + progress bar), dhikr card
// (source pill, Arabic RTL, transliteration, target line, counter ring),
// and 5-icon bottom nav.

import type { Mode, CustomOverrides } from "@/lib/theming";
import { deriveTokens, deriveSectionSeed } from "@/lib/theming";

type Props = {
  seed: string;
  mode: Mode;
  custom?: CustomOverrides;
  section?: "morning" | "evening" | "salah";
  width?: number;
  height?: number;
};

const LABELS: Record<string, { caps: string; title: string }> = {
  morning: { caps: "BETWEEN FAJR & SUNRISE", title: "Morning Adhkar" },
  evening: { caps: "BETWEEN ASR & MAGHRIB", title: "Evening Adhkar" },
  salah:   { caps: "AFTER EVERY PRAYER",     title: "After Salah" },
};

// A minimal 5-icon nav row matching the real BottomNav shape.
function NavIcon({ color, active }: { color: string; active?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: 3,
          background: active ? color : "transparent",
          border: active ? "none" : `1.2px solid ${color}`,
          opacity: active ? 1 : 0.9,
        }}
      />
    </div>
  );
}

export function MiniPreview({
  seed,
  mode,
  custom,
  section = "morning",
  width = 200,
  height = 340,
}: Props) {
  const sectionSeed = deriveSectionSeed(seed, section);
  const t = deriveTokens({ seed: sectionSeed, mode, custom });
  const meta = LABELS[section];

  return (
    <div
      style={{
        width,
        height,
        borderRadius: 34,
        padding: 7,
        background: "linear-gradient(180deg,#2a2a2c 0%,#141416 100%)",
        boxShadow: "0 22px 44px -20px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.08) inset",
        position: "relative",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 28,
          overflow: "hidden",
          background: t["--background"],
          color: t["--foreground"],
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* dynamic island bar (tinted with header for realism) */}
        <div
          style={{
            height: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: t["--header-from"],
            position: "relative",
          }}
        >
          <div style={{ width: 44, height: 10, borderRadius: 5, background: "#0a0a0a" }} />
        </div>

        {/* header */}
        <div
          style={{
            padding: "10px 14px 12px",
            background: t["--grad-header"],
            color: t["--header-fg"],
          }}
        >
          <div style={{ fontSize: 7, letterSpacing: "0.16em", fontWeight: 800, opacity: 0.9 }}>
            {meta.caps}
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, marginTop: 2, letterSpacing: "-0.01em" }}>
            {meta.title}
          </div>
          <div
            style={{
              marginTop: 8,
              height: 3,
              borderRadius: 3,
              background: `color-mix(in oklab, ${t["--header-fg"]} 22%, transparent)`,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ width: "38%", height: "100%", background: t["--accent"], borderRadius: 3 }} />
          </div>
        </div>

        {/* body: dhikr card */}
        <div style={{ padding: 10, flex: 1, display: "flex" }}>
          <div
            style={{
              flex: 1,
              borderRadius: 16,
              padding: "10px 10px 8px",
              background: t["--surface-card"],
              color: t["--card-foreground"],
              border: `1px solid ${t["--border"]}`,
              boxShadow: t["--card-shadow"],
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              position: "relative",
            }}
          >
            {/* source pill */}
            <span
              style={{
                fontSize: 7.5,
                padding: "2px 8px",
                borderRadius: 999,
                background: t["--source-bg"],
                color: t["--source-fg"],
                fontWeight: 600,
                letterSpacing: "0.02em",
              }}
            >
              Sahih al-Bukhari 6306
            </span>
            <div
              style={{
                fontFamily: "'Scheherazade New', 'Amiri', serif",
                fontSize: 22,
                lineHeight: 1.5,
                direction: "rtl",
                textAlign: "center",
                marginTop: 1,
                color: t["--card-foreground"],
              }}
            >
              اللّٰهُمَّ أَنْتَ رَبِّي
            </div>
            <div style={{ fontSize: 8, fontStyle: "italic", color: t["--translit"], textAlign: "center" }}>
              allāhumma anta rabbī
            </div>

            {/* counter ring */}
            <div
              style={{
                width: 58,
                height: 58,
                marginTop: 4,
                borderRadius: "50%",
                position: "relative",
                background: `conic-gradient(${t["--ring-fill"]} 0 42%, ${t["--ring-track"]} 42% 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: "50%",
                  background: t["--surface-card"],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: t["--count-fg"],
                  fontWeight: 800,
                  fontSize: 15,
                }}
              >
                3
              </div>
            </div>
            <div style={{ fontSize: 7.5, opacity: 0.65, marginTop: -2 }}>Target 3 times</div>
          </div>
        </div>

        {/* bottom nav — 5 icons matching the real app */}
        <div
          style={{
            height: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            background: t["--nav-bg"],
            borderTop: `1px solid ${t["--nav-border"]}`,
            padding: "0 12px",
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <NavIcon
              key={i}
              color={i === 0 ? t["--nav-active"] : t["--nav-inactive"]}
              active={i === 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
