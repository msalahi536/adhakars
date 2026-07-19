// A tiny phone frame that renders using a supplied token map (not global CSS
// vars), so it can preview a candidate theme without applying globally.

import type { Mode } from "@/lib/theming";
import { deriveTokens, deriveSectionSeed } from "@/lib/theming";

type Props = {
  seed: string;
  mode: Mode;
  section?: "morning" | "evening" | "salah";
  width?: number;
  height?: number;
};

export function MiniPreview({
  seed,
  mode,
  section = "morning",
  width = 200,
  height = 340,
}: Props) {
  const sectionSeed = deriveSectionSeed(seed, section);
  const t = deriveTokens({ seed: sectionSeed, mode });

  return (
    <div
      style={{
        width,
        height,
        borderRadius: 34,
        padding: 8,
        background: "linear-gradient(180deg,#3a3a3d 0%,#1c1c1e 100%)",
        boxShadow: "0 20px 40px -20px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.06) inset",
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
        {/* status bar / dynamic island */}
        <div
          style={{
            height: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            background: t["--header-from"],
          }}
        >
          <div style={{ width: 44, height: 12, borderRadius: 6, background: "#0a0a0a" }} />
        </div>

        {/* header */}
        <div
          style={{
            padding: "10px 14px 14px",
            background: t["--grad-header"],
            color: t["--header-fg"],
          }}
        >
          <div style={{ fontSize: 8, letterSpacing: "0.15em", fontWeight: 700, opacity: 0.9 }}>
            {section === "morning" ? "MORNING" : section === "evening" ? "EVENING" : "SALAH"}
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, marginTop: 2 }}>
            {section === "morning" ? "Morning Adhkar" : section === "evening" ? "Evening Adhkar" : "After Salah"}
          </div>
          <div
            style={{
              marginTop: 8,
              height: 4,
              borderRadius: 3,
              background: `color-mix(in oklab, ${t["--header-fg"]} 22%, transparent)`,
              overflow: "hidden",
            }}
          >
            <div style={{ width: "35%", height: "100%", background: t["--accent"] }} />
          </div>
        </div>

        {/* card */}
        <div style={{ padding: 10, flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              borderRadius: 14,
              padding: 10,
              background: t["--surface-card"],
              color: t["--card-foreground"],
              border: `1px solid ${t["--border"]}`,
              boxShadow: t["--card-shadow"],
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                fontSize: 9,
                padding: "2px 8px",
                borderRadius: 999,
                background: t["--source-bg"],
                color: t["--source-fg"],
              }}
            >
              Sahih
            </span>
            <div
              style={{
                fontFamily: "'Scheherazade New', 'Amiri', serif",
                fontSize: 20,
                lineHeight: 1.4,
                direction: "rtl",
                textAlign: "center",
                marginTop: 2,
              }}
            >
              بِسْمِ ٱللَّٰهِ
            </div>
            <div style={{ fontSize: 8, fontStyle: "italic", color: t["--translit"] }}>
              bismillah
            </div>
            {/* ring */}
            <div
              style={{
                width: 54,
                height: 54,
                marginTop: 4,
                borderRadius: "50%",
                position: "relative",
                background: `conic-gradient(${t["--ring-fill"]} 0 40%, ${t["--ring-track"]} 40% 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  background: t["--surface-card"],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: t["--count-fg"],
                  fontWeight: 800,
                  fontSize: 14,
                }}
              >
                12
              </div>
            </div>
          </div>
        </div>

        {/* nav */}
        <div
          style={{
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            background: t["--nav-bg"],
            borderTop: `1px solid ${t["--nav-border"]}`,
            fontSize: 7,
            fontWeight: 700,
          }}
        >
          {["Morning", "Evening", "Salah", "Tasbih", "More"].map((l, i) => (
            <span key={l} style={{ color: i === 0 ? t["--nav-active"] : t["--nav-inactive"] }}>
              {l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
