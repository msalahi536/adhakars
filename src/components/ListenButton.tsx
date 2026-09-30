// ============= Full file contents =============
import { useLayoutEffect, useRef } from "react";
import { Volume2 } from "lucide-react";
import { usePlaylist } from "./RecitationPlaylist";
import { recitationPlayer, usePlayer, useRecitationMap, type Track } from "@/lib/recitation-player";
import { setAnchor, setPopupOpen, usePopupOpen } from "@/lib/recitation-popup";

type Props = {
  dhikrId: string;
  size?: number;
  title?: string;
};

export function ListenButton({ dhikrId, size = 32, title }: Props) {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const map = useRecitationMap();
  const player = usePlayer();
  const playlist = usePlaylist();
  const open = usePopupOpen();

  const rec = map?.[dhikrId];
  const name = title ?? playlist?.items.find((i) => i.id === dhikrId)?.title ?? rec?.name ?? "Recitation";
  const isThis = player.track?.dhikrId === dhikrId;
  const playing = isThis && player.playing;

  const queueTracks: Track[] = playlist && map
    ? playlist.items.flatMap((i) => (map[i.id] ? [{ dhikrId: i.id, title: i.title, url: map[i.id].url }] : []))
    : [];

  const isOpen = open?.openerId === dhikrId;

  useLayoutEffect(() => {
    setAnchor(dhikrId, btnRef.current);
    return () => setAnchor(dhikrId, null);
  }, [dhikrId]);

  return (
    <div className="listen-button-wrap relative shrink-0" data-no-swipe style={{ width: size, height: size }}>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setPopupOpen(isOpen ? null : { openerId: dhikrId, title: name, tracks: queueTracks, label: playlist?.label ?? null });
        }}
        aria-label="play recitation"
        aria-expanded={isOpen}
        className="flex items-center justify-center rounded-full transition-transform active:scale-95"
        style={{
          width: size,
          height: size,
          background: "var(--index-badge-bg, var(--accent))",
          color: "var(--index-badge-fg, var(--accent-foreground))",
        }}
      >
        {playing ? (
          <span className="rec-eq" aria-hidden>
            {player.levels.map((level, index) => <i key={index} style={{ height: `${Math.round(level * 100)}%` }} />)}
          </span>
        ) : <Volume2 size={Math.round(size * 0.5)} strokeWidth={1.75} />}
      </button>
    </div>
  );
}
