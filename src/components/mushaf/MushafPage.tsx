/*
 * Themed mushaf ornaments built from the artwork in /public/mushaf/<theme>-<mode>/.
 *
 *   <MushafThemeProvider theme="rose" mode="evening">   // wraps the recite page
 *     <MushafLabel text="الجزء ٢٩" />
 *     <MushafFrame> ...15 lines... </MushafFrame>
 *     <MushafPageNumber page={562} />
 *   </MushafThemeProvider>
 *
 * theme: original | rose | twilight | ocean | emerald | sand | midnight | darkred
 * mode:  morning | evening   (follow the app's Display style: page-based / always morning / always evening)
 */
import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import manifest from "./mushaf-manifest.json";

export type MushafThemeId = keyof typeof manifest;
export type MushafMode = "morning" | "evening";

type Entry = {
  slice: { x: number; y: number };
  ovalRatio: number;
  cartoucheRatio: number;
  markerRatio: number;
  tokens: Record<string, string>;
};

type MushafCtx = { base: string; entry: Entry };
const Ctx = createContext<MushafCtx | null>(null);

const toArabicDigits = (n: number | string) =>
  String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);

export function getMushafTheme(theme: string, mode: MushafMode) {
  const all = manifest as unknown as Record<string, Record<string, Entry>>;
  const id = all[theme] ? theme : "original";
  const m = all[id][mode] ? mode : "morning";
  return { base: `/mushaf/${id}-${m}`, entry: all[id][m] };
}

/** Wrap the whole recite page. Sets every --m-* color for the chosen theme. */
export function MushafThemeProvider({
  theme,
  mode,
  children,
  className = "",
  style,
}: {
  theme: string;
  mode: MushafMode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const value = getMushafTheme(theme, mode);
  return (
    <Ctx.Provider value={value}>
      <div
        className={className}
        style={{ ...(value.entry.tokens as CSSProperties), background: "var(--m-bg)", color: "var(--m-ink)", ...style }}
      >
        {children}
      </div>
    </Ctx.Provider>
  );
}

const useMushaf = (): MushafCtx => {
  const v = useContext(Ctx) as MushafCtx | null;
  if (!v) throw new Error("Mushaf components must be inside <MushafThemeProvider>");
  return v;
};

/**
 * The page frame. `scale` = CSS px per artwork px (0.42 fits a ~360px wide phone page).
 * Corners never stretch; only the straight edges repeat.
 */
export function MushafFrame({
  children,
  scale = 0.42,
  className = "",
  style,
}: {
  children: ReactNode;
  scale?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const { base, entry } = useMushaf();
  const { x, y } = entry.slice;
  return (
    <div
      className={`relative ${className}`}
      style={{
        boxSizing: "border-box",
        borderStyle: "solid",
        borderWidth: `${y * scale}px ${x * scale}px`,
        borderImage: `url(${base}/frame.webp) ${y} ${x} fill / ${y * scale}px ${x * scale}px / 0 round`,
        ...style,
      }}
    >
      <div className="absolute inset-0 flex flex-col">{children}</div>
    </div>
  );
}

/** Surah title cartouche (put it at the top of the frame when a surah starts on the page). */
export function SurahCartouche({ name, height = 42 }: { name: string; height?: number }) {
  const { base } = useMushaf();
  return (
    <div
      className="relative w-full grid place-items-center"
      style={{
        height,
        backgroundImage: `url(${base}/cartouche.webp)`,
        backgroundSize: "100% 100%",
        fontFamily: "var(--m-font-quran, serif)",
        fontSize: height * 0.46,
        color: "var(--m-ink)",
      }}
    >
      {name}
    </div>
  );
}

/** Oval label: juz / surah name at the top of the screen. */
export function MushafLabel({ text, height = 30 }: { text: string; height?: number }) {
  const { base, entry } = useMushaf();
  return (
    <span
      className="inline-grid place-items-center"
      style={{
        height,
        width: height * entry.ovalRatio,
        backgroundImage: `url(${base}/oval.webp)`,
        backgroundSize: "100% 100%",
        fontFamily: "var(--m-font-quran, serif)",
        fontSize: height * 0.48,
        color: "var(--m-ink)",
      }}
    >
      {text}
    </span>
  );
}

/** Page number badge. Place it centered so it overlaps the bottom edge of the frame. */
export function MushafPageNumber({ page, height = 26 }: { page: number; height?: number }) {
  return <MushafLabel text={toArabicDigits(page)} height={height} />;
}

/** Ayah end marker with the Arabic number inside. `done` makes it glow softly. */
export function AyahMarker({ number, size = 24, done = false }: { number: number; size?: number; done?: boolean }) {
  const { base, entry } = useMushaf();
  return (
    <span
      className="inline-grid place-items-center align-middle transition-[filter] duration-500"
      style={{
        width: size,
        height: size * entry.markerRatio,
        backgroundImage: `url(${base}/marker.webp)`,
        backgroundSize: "100% 100%",
        fontSize: size * 0.42,
        color: "var(--m-ink)",
        filter: done ? "drop-shadow(0 0 4px var(--m-gold))" : undefined,
      }}
    >
      <span style={{ marginTop: size * 0.05 }}>{toArabicDigits(number)}</span>
    </span>
  );
}

export { toArabicDigits };
