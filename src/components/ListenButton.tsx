import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ListMusic, Pause, Play, Volume2 } from "lucide-react";
import { Portal } from "./Portal";
import { usePlaylist } from "./RecitationPlaylist";
import { recitationPlayer, usePlayer, useRecitationMap, type Track } from "@/lib/recitation-player";

type Props = {
  dhikrId: string;
  size?: number;
  title?: string;
};

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

export function ListenButton({ dhikrId, size = 32, title }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const map = useRecitationMap();
  const player = usePlayer();
  const playlist = usePlaylist();

  const rec = map?.[dhikrId];
  const name = title ?? playlist?.items.find((i) => i.id === dhikrId)?.title ?? rec?.name ?? "Recitation";
  const isThis = player.track?.dhikrId === dhikrId;
  const playing = isThis && player.playing;

  const queueTracks: Track[] = playlist && map
    ? playlist.items.flatMap((i) => (map[i.id] ? [{ dhikrId: i.id, title: i.title, url: map[i.id].url }] : []))
    : [];
  const queueActive = !!playlist && player.queueLabel === playlist.label && player.queue.length > 0;

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const w = 236;
    setPos({ left: Math.max(10, Math.min(r.left, window.innerWidth - w - 10)), top: r.bottom + 8 });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: Event) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener("pointerdown", onDoc);
    window.addEventListener("resize", close);
    return () => { document.removeEventListener("pointerdown", onDoc); window.removeEventListener("resize", close); };
  }, [open]);

  const onPlay = () => {
    if (!rec) return;
    if (isThis) recitationPlayer.toggle();
    else recitationPlayer.playOne({ dhikrId, title: name, url: rec.url });
  };

  const onPlayAll = () => {
    if (!playlist || !queueTracks.length) return;
    if (queueActive) { recitationPlayer.toggle(); return; }
    const start = Math.max(0, queueTracks.findIndex((t) => t.dhikrId === dhikrId));
    recitationPlayer.playAll(queueTracks, playlist.label, start);
  };

  return (
    <div className="listen-button-wrap relative shrink-0" data-no-swipe style={{ width: size, height: size }}>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        aria-label="play recitation"
        aria-expanded={open}
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

      {open && pos && (
        <Portal>
          <div
            ref={popRef}
            role="dialog"
            aria-label="Recitation player"
            data-no-swipe
            className="rec-pop"
            style={{ left: pos.left, top: pos.top }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rec-pop-row">
              <button
                type="button"
                className="rec-pop-play"
                onClick={onPlay}
                disabled={!rec}
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" style={{ marginLeft: 2 }} />}
              </button>
              <div className="min-w-0 flex-1">
                <div className="rec-pop-title">{name}</div>
                <div className="rec-pop-sub">{rec ? "Imam Taha Hassane" : map ? "Recitation coming soon" : "Loading…"}</div>
              </div>
            </div>

            {rec && (
              <div className="rec-pop-scrub">
                <input
                  type="range"
                  min={0}
                  max={isThis && player.duration ? player.duration : 1}
                  step={0.1}
                  value={isThis ? player.current : 0}
                  disabled={!isThis}
                  onChange={(e) => recitationPlayer.seek(Number(e.target.value))}
                  aria-label="Seek"
                  style={{ ["--p" as string]: `${isThis && player.duration ? (player.current / player.duration) * 100 : 0}%` }}
                />
                <div className="rec-pop-times">
                  <span>{fmt(isThis ? player.current : 0)}</span>
                  <span>{fmt(isThis ? player.duration : 0)}</span>
                </div>
              </div>
            )}

            {playlist && queueTracks.length > 0 && (
              <button type="button" className="rec-pop-all" onClick={onPlayAll}>
                {queueActive && player.playing ? <Pause size={12} /> : <ListMusic size={12} />}
                {queueActive
                  ? `${player.playing ? "Pause" : "Resume"} ${playlist.label} · ${player.queueIndex + 1}/${player.queue.length}`
                  : `Play all ${playlist.label}`}
              </button>
            )}
          </div>
        </Portal>
      )}
    </div>
  );
}
