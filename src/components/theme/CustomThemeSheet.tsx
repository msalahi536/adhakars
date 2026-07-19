// Three-control custom theme sheet: Top bar, Background, Accent.
// Each swatch opens a color wheel; text colors auto-derive & auto-contrast.

import { useEffect, useRef, useState } from "react";
import { MiniPreview } from "./MiniPreview";
import { clampSeed, hexToHsl, hslToHex, type Mode, type CustomOverrides } from "@/lib/theming";

type Target = "header" | "background" | "accent";

type Props = {
  open: boolean;
  initial: { seed: string; triplet: CustomOverrides };
  mode: Mode;
  onClose: () => void;
  onApply: (triplet: Required<Pick<CustomOverrides, "header" | "background" | "accent">> & { seed: string }) => void;
};

const DEFAULTS: Record<Target, string> = {
  header: "#c9a84c",
  background: "#f7f2e6",
  accent: "#c9a84c",
};

const LABELS: Record<Target, { title: string; sub: string }> = {
  header: { title: "Top bar", sub: "Colored header at the top of every page" },
  background: { title: "Background", sub: "The wall behind the content" },
  accent: { title: "Accent", sub: "Rings, buttons, active nav icon" },
};

export function CustomThemeSheet({ open, initial, mode, onClose, onApply }: Props) {
  const [previewMode, setPreviewMode] = useState<Mode>(mode);
  const [header, setHeader] = useState(initial.triplet.header ?? initial.seed ?? DEFAULTS.header);
  const [background, setBackground] = useState(initial.triplet.background ?? DEFAULTS.background);
  const [accent, setAccent] = useState(initial.triplet.accent ?? initial.seed ?? DEFAULTS.accent);
  const [editing, setEditing] = useState<Target | null>(null);

  useEffect(() => {
    if (!open) return;
    setPreviewMode(mode);
    setHeader(initial.triplet.header ?? initial.seed ?? DEFAULTS.header);
    setBackground(initial.triplet.background ?? DEFAULTS.background);
    setAccent(initial.triplet.accent ?? initial.seed ?? DEFAULTS.accent);
    setEditing(null);
  }, [open, initial.seed, initial.triplet.header, initial.triplet.background, initial.triplet.accent, mode]);

  const values: Record<Target, string> = { header, background, accent };
  const setValue = (t: Target, v: string) => {
    if (t === "header") setHeader(v);
    else if (t === "background") setBackground(v);
    else setAccent(v);
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface)",
          color: "var(--foreground)",
          width: "100%",
          maxWidth: 480,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: "18px 20px calc(env(safe-area-inset-bottom) + 20px)",
          maxHeight: "92vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border)" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Custom theme</h3>
          <button
            onClick={onClose}
            style={{ background: "transparent", fontSize: 22, lineHeight: 1, color: "var(--foreground)" }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* live preview */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          <MiniPreview
            seed={accent}
            mode={previewMode}
            custom={{ header, background, accent }}
            width={190}
            height={310}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10, fontSize: 12 }}>
          {(["light", "dark"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setPreviewMode(m)}
              style={{
                padding: "4px 12px",
                borderRadius: 999,
                fontWeight: 700,
                background: previewMode === m ? "var(--accent)" : "var(--muted)",
                color: previewMode === m ? "var(--accent-foreground)" : "var(--foreground)",
              }}
            >
              {m === "light" ? "Light" : "Dark"}
            </button>
          ))}
        </div>

        {/* three controls */}
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          {(["header", "background", "accent"] as Target[]).map((t) => (
            <button
              key={t}
              onClick={() => setEditing(t)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 16,
                background: "var(--muted)",
                border: "1px solid var(--border)",
                width: "100%",
                textAlign: "left",
                color: "var(--foreground)",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: values[t],
                  border: "2px solid var(--surface-card)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{LABELS[t].title}</div>
                <div style={{ fontSize: 11, opacity: 0.65 }}>{LABELS[t].sub}</div>
              </div>
              <div style={{ fontSize: 11, fontFamily: "monospace", opacity: 0.65 }}>
                {values[t].toUpperCase()}
              </div>
            </button>
          ))}
        </div>

        <p style={{ fontSize: 11, opacity: 0.6, marginTop: 12, textAlign: "center" }}>
          Text colors are chosen automatically to stay readable against your picks.
        </p>

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: 999,
              fontWeight: 700,
              background: "var(--muted)",
              color: "var(--foreground)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onApply({ header, background, accent, seed: accent })}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: 999,
              fontWeight: 700,
              background: "var(--accent)",
              color: "var(--accent-foreground)",
            }}
          >
            Apply
          </button>
        </div>

        {editing && (
          <ColorWheelModal
            title={LABELS[editing].title}
            value={values[editing]}
            onCancel={() => setEditing(null)}
            onDone={(hex) => {
              setValue(editing, hex);
              setEditing(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

// ------- inner: color wheel modal -------

function ColorWheelModal({
  title,
  value,
  onDone,
  onCancel,
}: {
  title: string;
  value: string;
  onDone: (hex: string) => void;
  onCancel: () => void;
}) {
  const [seed, setSeedState] = useState(value);
  const [hex, setHex] = useState(value);
  const wheelRef = useRef<HTMLDivElement>(null);

  const [h, s, l] = hexToHsl(seed);

  const pickFromWheel = (clientX: number, clientY: number) => {
    const el = wheelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const angle = (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI;
    const hue = (angle + 360) % 360;
    const next = clampSeed(hslToHex(hue, Math.max(0.35, s), Math.max(0.45, Math.min(0.62, l))));
    setSeedState(next);
    setHex(next);
  };

  const updateSoftness = (t: number) => {
    const nextS = 0.82 - t * (0.82 - 0.15);
    const next = clampSeed(hslToHex(h, nextS, l));
    setSeedState(next);
    setHex(next);
  };
  const softness = 1 - Math.min(1, Math.max(0, (s - 0.15) / (0.82 - 0.15)));

  const wheelSize = 170;
  const knobAngle = (h * Math.PI) / 180;
  const knobX = wheelSize / 2 + Math.cos(knobAngle) * (wheelSize / 2 - 12);
  const knobY = wheelSize / 2 + Math.sin(knobAngle) * (wheelSize / 2 - 12);

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 210,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface)",
          color: "var(--foreground)",
          width: "min(360px, calc(100% - 32px))",
          borderRadius: 24,
          padding: 20,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>{title}</div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            ref={wheelRef}
            onPointerDown={(e) => {
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
              pickFromWheel(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (e.buttons !== 1 && e.pressure === 0) return;
              pickFromWheel(e.clientX, e.clientY);
            }}
            style={{
              width: wheelSize,
              height: wheelSize,
              borderRadius: "50%",
              background:
                "conic-gradient(from 0deg, #ff3b3b, #ffb03b, #f8ff3b, #7dff3b, #3bffcf, #3ba7ff, #7d3bff, #ff3bd0, #ff3b3b)",
              position: "relative",
              boxShadow: "inset 0 0 0 8px var(--surface)",
              touchAction: "none",
              cursor: "crosshair",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: knobX - 10,
                top: knobY - 10,
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: seed,
                border: "3px solid #fff",
                boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7, marginBottom: 6 }}>SOFTNESS</div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={softness}
            onChange={(e) => updateSoftness(parseFloat(e.target.value))}
            style={{ width: "100%", accentColor: seed }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: seed, border: "1px solid var(--border)" }} />
          <input
            value={hex}
            onChange={(e) => {
              const v = e.target.value.trim();
              setHex(v);
              if (/^#?[0-9a-fA-F]{6}$/.test(v)) {
                const norm = v.startsWith("#") ? v : "#" + v;
                setSeedState(clampSeed(norm));
              }
            }}
            placeholder="#c9a84c"
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 10,
              background: "var(--background)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
              fontFamily: "monospace",
              fontSize: 13,
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 999,
              fontWeight: 700,
              background: "var(--muted)",
              color: "var(--foreground)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onDone(seed)}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 999,
              fontWeight: 700,
              background: "var(--accent)",
              color: "var(--accent-foreground)",
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
