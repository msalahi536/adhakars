import { useEffect, useRef, useState } from "react";
import { MiniPreview } from "./MiniPreview";
import { clampSeed, hexToHsl, hslToHex, type Mode } from "@/lib/theming";

type Props = {
  open: boolean;
  initialSeed: string;
  mode: Mode;
  onClose: () => void;
  onApply: (hex: string) => void;
};

export function ThemePicker({ open, initialSeed, mode, onClose, onApply }: Props) {
  const [seed, setSeed] = useState(initialSeed);
  const [previewMode, setPreviewMode] = useState<Mode>(mode);
  const [hex, setHex] = useState(initialSeed);
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setSeed(initialSeed);
      setHex(initialSeed);
      setPreviewMode(mode);
    }
  }, [open, initialSeed, mode]);

  const [h, s, l] = hexToHsl(seed);

  const pickFromWheel = (clientX: number, clientY: number) => {
    const el = wheelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const hue = (angle + 360) % 360;
    const next = clampSeed(hslToHex(hue, Math.max(0.35, s), Math.max(0.45, Math.min(0.6, l))));
    setSeed(next);
    setHex(next);
  };

  const updateSoftness = (t: number) => {
    // t: 0 = vivid, 1 = muted
    const nextS = 0.78 - t * (0.78 - 0.28);
    const next = clampSeed(hslToHex(h, nextS, l));
    setSeed(next);
    setHex(next);
  };
  const softness = 1 - (s - 0.28) / (0.78 - 0.28);

  const wheelSize = 160;
  const knobAngle = (h * Math.PI) / 180;
  const knobX = wheelSize / 2 + Math.cos(knobAngle) * (wheelSize / 2 - 12);
  const knobY = wheelSize / 2 + Math.sin(knobAngle) * (wheelSize / 2 - 12);

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
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Custom color</h3>
          <button
            onClick={onClose}
            style={{ background: "transparent", fontSize: 22, lineHeight: 1, color: "var(--foreground)" }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          <div style={{ position: "relative" }}>
            <MiniPreview seed={seed} mode={previewMode} width={180} height={300} />
          </div>
        </div>

        {/* light/dark toggle for preview */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 6,
            marginTop: 10,
            fontSize: 12,
          }}
        >
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

        {/* hue wheel */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
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

        {/* softness */}
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.7, marginBottom: 6 }}>
            SOFTNESS
          </div>
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

        {/* hex */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: seed, border: "1px solid var(--border)" }} />
          <input
            value={hex}
            onChange={(e) => {
              const v = e.target.value.trim();
              setHex(v);
              if (/^#?[0-9a-fA-F]{6}$/.test(v)) {
                const norm = v.startsWith("#") ? v : "#" + v;
                setSeed(clampSeed(norm));
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
              fontSize: 14,
            }}
          />
        </div>

        {/* actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
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
            onClick={() => onApply(seed)}
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
      </div>
    </div>
  );
}
