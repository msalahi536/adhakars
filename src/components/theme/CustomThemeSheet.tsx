// Three-control custom theme sheet: Top bar, Background, Accent.
// Each swatch opens a color wheel; text colors auto-derive & auto-contrast.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        touchAction: "none",
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
          maxHeight: "88dvh",
          overflowY: "auto",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-y",
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
    </div>,
    document.body,
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
  const [seed, setSeedState] = useState(clampSeed(value));
  const [hex, setHex] = useState(clampSeed(value));
  const wheelRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const [h, s, l] = hexToHsl(seed);

  const S_MIN = 0.18;
  const S_MAX = 0.82;
  const L_MIN = 0.32;
  const L_MAX = 0.75;

  const commit = (hue: number, sat: number, light: number) => {
    const next = hslToHex(
      (hue + 360) % 360,
      Math.min(S_MAX, Math.max(S_MIN, sat)),
      Math.min(L_MAX, Math.max(L_MIN, light)),
    );
    setSeedState(next);
    setHex(next);
  };

  // Pick anywhere inside the disc: angle sets hue, distance from the centre
  // sets saturation (centre = muted, edge = vivid).
  const pickFromWheel = (clientX: number, clientY: number) => {
    const el = wheelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const radius = rect.width / 2;
    const dist = Math.min(1, Math.hypot(dx, dy) / radius);
    // conic-gradient starts at 12 o'clock; atan2 starts at 3 o'clock
    const hue = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    commit(hue, S_MIN + dist * (S_MAX - S_MIN), l);
  };

  const updateLightness = (t: number) => commit(h, s, L_MIN + t * (L_MAX - L_MIN));
  const lightness = Math.min(1, Math.max(0, (l - L_MIN) / (L_MAX - L_MIN)));

  const wheelSize = 220;
  const wheelR = wheelSize / 2;
  const satT = Math.min(1, Math.max(0, (s - S_MIN) / (S_MAX - S_MIN)));
  const knobAngle = (h * Math.PI) / 180;
  const knobX = wheelR + Math.cos(knobAngle) * satT * (wheelR - 6);
  const knobY = wheelR + Math.sin(knobAngle) * satT * (wheelR - 6);

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
              dragging.current = true;
              (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
              pickFromWheel(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (!dragging.current) return;
              pickFromWheel(e.clientX, e.clientY);
            }}
            onPointerUp={() => { dragging.current = false; }}
            onPointerCancel={() => { dragging.current = false; }}
            style={{
              width: wheelSize,
              height: wheelSize,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 50% 50%, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 72%), conic-gradient(from 0deg, #ff3b3b, #ffb03b, #f8ff3b, #7dff3b, #3bffcf, #3ba7ff, #7d3bff, #ff3bd0, #ff3b3b)",
              position: "relative",
              boxShadow: "0 2px 10px rgba(0,0,0,0.18)",
              touchAction: "none",
              cursor: "crosshair",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: knobX - 11,
                top: knobY - 11,
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: seed,
                border: "3px solid #fff",
                boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>
        <div style={{ fontSize: 11, opacity: 0.6, marginTop: 8, textAlign: "center" }}>
          Drag anywhere in the circle. Centre is soft, edge is vivid.
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7, marginBottom: 6 }}>BRIGHTNESS</div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={lightness}
            onChange={(e) => updateLightness(parseFloat(e.target.value))}
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
