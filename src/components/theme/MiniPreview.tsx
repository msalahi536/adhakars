// Faithful mini preview of a real app screen using a supplied token map.
// Mirrors the real Morning Adhkar screen: header (label + title + gear +
// progress bar), the "1 / 14" pill, the dhikr card (listen button + source
// caps, Arabic RTL, transliteration, source pill, big counter ring, target
// line), the arrows + dots row, and the labelled 5-tab bottom nav.

import type { Mode, CustomOverrides } from "@/lib/theming";
import { deriveTokens, sectionSeedFor } from "@/lib/theming";

type Props = {
  seed: string;
  mode: Mode;
  custom?: CustomOverrides;
  section?: "morning" | "evening" | "salah";
  presetId?: string;
  width?: number;
  height?: number;
};

const LABELS: Record<string, { caps: string; title: string }> = {
  morning: { caps: "BETWEEN FAJR & SUNRISE", title: "Morning Adhkar" },
  evening: { caps: "BETWEEN ASR & MAGHRIB", title: "Evening Adhkar" },
  salah: { caps: "AFTER EVERY PRAYER", title: "After Salah" },
};

const NAV = ["Morning", "Evening", "Salah", "Tasbih", "More"];

export function MiniPreview({
  seed,
  mode,
  custom,
  section = "morning",
  presetId = "",
  width = 200,
  height = 340,
}: Props) {
  const sectionSeed = sectionSeedFor(presetId, seed, section);
  const t = deriveTokens({ seed: sectionSeed, mode, custom });
  const meta = LABELS[section];
  const s = width / 200; // scale factor against the 200px reference design

  const px = (v: number) => v * s;

  return (
    <div
      style={{
        width,
        height,
        borderRadius: px(34),
        padding: px(6),
        background: "linear-gradient(180deg,#2a2a2c 0%,#141416 100%)",
        boxShadow: "0 22px 44px -20px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.08) inset",
        position: "relative",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: px(28),
          overflow: "hidden",
          background: t["--background"],
          color: t["--foreground"],
          fontFamily: "'Hanken Grotesk', 'Plus Jakarta Sans', system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* status bar + header share one continuous gradient */}
        <div
          style={{
            background: t["--grad-header"],
            color: t["--header-fg"],
            position: "relative",
          }}
        >
          <div
            style={{
              height: px(24),
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              paddingBottom: px(3),
            }}
          >
            <div
              style={{ width: px(42), height: px(11), borderRadius: px(6), background: "#0a0a0a" }}
            />
          </div>

          {/* header */}
          <div
            style={{
              padding: `${px(9)}px ${px(13)}px ${px(11)}px`,
              position: "relative",
            }}
          >

          <div
            style={{
              position: "absolute",
              top: px(8),
              right: px(11),
              width: px(20),
              height: px(20),
              borderRadius: "50%",
              background: `color-mix(in oklab, ${t["--header-fg"]} 16%, transparent)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: px(8),
                height: px(8),
                borderRadius: "50%",
                border: `${Math.max(1, px(1.4))}px solid ${t["--header-fg"]}`,
              }}
            />
          </div>
          <div style={{ fontSize: px(6.4), letterSpacing: "0.16em", fontWeight: 800, opacity: 0.92 }}>
            {meta.caps}
          </div>
          <div style={{ fontSize: px(14), fontWeight: 800, marginTop: px(2), letterSpacing: "-0.01em" }}>
            {meta.title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: px(6), marginTop: px(8) }}>
            <div
              style={{
                flex: 1,
                height: px(3),
                borderRadius: px(3),
                background: `color-mix(in oklab, ${t["--header-fg"]} 24%, transparent)`,
                overflow: "hidden",
              }}
            >
              <div style={{ width: "0%", height: "100%", background: t["--accent"] }} />
            </div>
            <div style={{ fontSize: px(6.5), fontWeight: 700, opacity: 0.9 }}>0 / 14</div>
          </div>
          </div>
        </div>


        {/* progress pill */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: px(7) }}>
          <span
            style={{
              fontSize: px(6.5),
              fontWeight: 700,
              padding: `${px(2)}px ${px(9)}px`,
              borderRadius: 999,
              background: t["--surface-card"],
              color: t["--card-foreground"],
              border: `1px solid ${t["--border"]}`,
            }}
          >
            1 / 14
          </span>
        </div>

        {/* body: dhikr card */}
        <div style={{ padding: `${px(7)}px ${px(10)}px 0`, flex: 1, display: "flex" }}>
          <div
            style={{
              flex: 1,
              borderRadius: px(18),
              padding: px(10),
              background: t["--surface-card"],
              color: t["--card-foreground"],
              border: `1px solid ${t["--border"]}`,
              boxShadow: t["--card-shadow"],
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* listen button + title caps */}
            <div style={{ display: "flex", alignItems: "center", gap: px(6) }}>
              <div
                style={{
                  width: px(18),
                  height: px(18),
                  borderRadius: "50%",
                  background: t["--accent"],
                  color: t["--accent-foreground"],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: px(8),
                  fontWeight: 800,
                }}
              >
                ♪
              </div>
              <div
                style={{
                  fontSize: px(6.6),
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  color: t["--card-foreground"],
                }}
              >
                SAYYIDUL ISTIGHFAR
              </div>
            </div>

            {/* Arabic */}
            <div
              style={{
                fontFamily: "'Scheherazade New', 'Amiri', serif",
                fontSize: px(12.5),
                lineHeight: 1.85,
                direction: "rtl",
                textAlign: "right",
                marginTop: px(7),
                color: t["--card-foreground"],
              }}
            >
              اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ
            </div>

            {/* transliteration */}
            <div
              style={{
                fontSize: px(6.2),
                fontStyle: "italic",
                lineHeight: 1.6,
                color: t["--translit"],
                textAlign: "center",
                marginTop: px(6),
              }}
            >
              Allaahuma anta rabbee laailaaha illa ant, khalaqtanee wa ana
              'abduk, wa ana 'ala 'ahdika wa wa'adika masta ta'tu
            </div>

            <div style={{ flex: 1 }} />

            {/* source pill + counter ring */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: px(6) }}>
              <div>
                <span
                  style={{
                    fontSize: px(6),
                    padding: `${px(2)}px ${px(7)}px`,
                    borderRadius: 999,
                    background: t["--source-bg"],
                    color: t["--source-fg"],
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  Sahih al-Bukhari 6306
                </span>
                <div style={{ fontSize: px(6), opacity: 0.6, marginTop: px(4) }}>Target · 1x</div>
              </div>
              <div
                style={{
                  width: px(48),
                  height: px(48),
                  borderRadius: "50%",
                  background: `conic-gradient(${t["--ring-fill"]} 0 0%, ${t["--ring-track"]} 0% 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: px(39),
                    height: px(39),
                    borderRadius: "50%",
                    background: t["--surface-card"],
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: t["--count-fg"],
                    lineHeight: 1,
                  }}
                >
                  <span style={{ fontWeight: 800, fontSize: px(14) }}>0</span>
                  <span style={{ fontSize: px(5.5), opacity: 0.6 }}>/1</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* arrows + dots */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: `${px(7)}px ${px(12)}px`,
          }}
        >
          {[0, 1].map((i) => (
            <div
              key={i}
              style={{
                width: px(20),
                height: px(20),
                borderRadius: "50%",
                background: t["--arrow-bg"],
                color: t["--arrow-fg"],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: px(8),
                order: i === 0 ? 0 : 2,
              }}
            >
              {i === 0 ? "‹" : "›"}
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: px(3), order: 1 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === 0 ? px(9) : px(3),
                  height: px(3),
                  borderRadius: 999,
                  background: i === 0 ? t["--dot-active"] : t["--dot-inactive"],
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ height: px(8) }} />

      </div>
    </div>
  );
}
