import { useEffect, useRef, useState } from "react";
import { Loader2, Pause, Volume2 } from "lucide-react";

/**
 * Audio recitations by dhikr id. Populate this map when audio files are added.
 * Example: { "morning-ayatul-kursi": "/audio/morning-ayatul-kursi.mp3" }
 */
export const RECITATION_AUDIO: Record<string, string> = {};

type Props = {
  dhikrId: string;
  size?: number;
};

type PlayState = "idle" | "loading" | "playing";

export function ListenButton({ dhikrId, size = 32 }: Props) {
  const src = RECITATION_AUDIO[dhikrId];
  const available = Boolean(src);
  const [state, setState] = useState<PlayState>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop and reset when the card switches to a different dhikr.
  useEffect(() => {
    return () => {
      const a = audioRef.current;
      if (a) {
        a.pause();
        a.src = "";
      }
      audioRef.current = null;
    };
  }, [dhikrId]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!available) return;

    let a = audioRef.current;
    if (!a) {
      a = new Audio(src);
      audioRef.current = a;
      a.addEventListener("waiting", () => setState("loading"));
      a.addEventListener("playing", () => setState("playing"));
      a.addEventListener("pause", () => setState("idle"));
      a.addEventListener("ended", () => setState("idle"));
      a.addEventListener("error", () => setState("idle"));
    }

    if (state === "playing" || state === "loading") {
      a.pause();
      setState("idle");
      return;
    }

    setState("loading");
    a.play().catch(() => setState("idle"));
  };

  const iconSize = Math.round(size * 0.5);
  const Icon =
    state === "loading" ? Loader2 : state === "playing" ? Pause : Volume2;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!available}
      aria-label={
        available
          ? state === "playing"
            ? "pause recitation"
            : "play recitation"
          : "recitation not available"
      }
      aria-disabled={!available}
      data-no-swipe
      className="flex shrink-0 items-center justify-center rounded-full transition-transform active:scale-95"
      style={{
        width: size,
        height: size,
        background: "var(--index-badge-bg, var(--accent))",
        color: "var(--index-badge-fg, var(--accent-foreground))",
        opacity: available ? 1 : 0.4,
        cursor: available ? "pointer" : "not-allowed",
      }}
    >
      <Icon
        size={iconSize}
        strokeWidth={2.4}
        className={state === "loading" ? "animate-spin" : ""}
      />
    </button>
  );
}
