import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ListMusic, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { Portal } from "./Portal";
import { closePopup, getAnchor, usePopupOpen } from "@/lib/recitation-popup";
import { recitationPlayer, usePlayer } from "@/lib/recitation-player";

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

const POP_W = 264;

// One popup for the whole app. Anchored near the speaker button of the card
// that opened it, and follows the playing card as the playlist advances.
export function RecitationPopup() {
  const open = usePopupOpen();
  const player = usePlayer();
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const posRef = useRef<{ left: number; top: number } | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  const track = player.track;
  const queueActive = player.queue.length > 0;
  const listIndex = open
    ? queueActive
      ? -1
      : open.tracks.findIndex((t) => t.dhikrId === (track?.dhikrId ?? open.openerId))
    : -1;
  const canPrevious = queueActive ? player.queueIndex > 0 : listIndex > 0;
  const canNext = queueActive
    ? player.queueIndex < player.queue.length - 1
    : listIndex >= 0 && listIndex < (open?.tracks.length ?? 0) - 1;

  const name = track?.title ?? open?.title ?? "Recitation";
  const hasAudio = !!track;
  const playing = player.playing;

  const onPrevious = () => {
    if (queueActive) { recitationPlayer.previous(); return; }
    if (!open || listIndex <= 0) return;
    recitationPlayer.playAll(open.tracks, open.label ?? "recitations", listIndex - 1);
  };
  const onNext = () => {
    if (queueActive) { recitationPlayer.next(); return; }
    if (!open || listIndex < 0 || listIndex >= open.tracks.length - 1) return;
    recitationPlayer.playAll(open.tracks, open.label ?? "recitations", listIndex + 1);
  };

  useLayoutEffect(() => {
    posRef.current = pos;
  }, [pos]);

  useLayoutEffect(() => {
    if (!open) return;
    const anchor = getAnchor(track?.dhikrId ?? open.openerId);
    if (!anchor) return; // keep last position (e.g. user swiped away mid-listen)
    const r = anchor.getBoundingClientRect();
    const left = Math.max(10, Math.min(r.left, window.innerWidth - POP_W - 10));
    const next = { left, top: r.bottom + 8 };
    setPos(next);
    posRef.current = next;
  }, [open, track?.dhikrId]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: Event) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t)) return;
      closePopup();
    };
    const close = () => closePopup();
    document.addEventListener("pointerdown", onDoc);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onDoc);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  if (!open || !pos) return null;

  return (
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
        <div className="rec-pop-title">{name}</div>
        <div className="rec-pop-sub">{hasAudio ? "Imam Taha Hassane" : "Recitation coming soon"}</div>

        <div className="rec-pop-transport">
          <button type="button" className="rec-pop-skip" onClick={onPrevious} disabled={!canPrevious} aria-label="Previous recitation">
            <SkipBack size={15} fill="currentColor" />
          </button>
          <button
            type="button"
            className="rec-pop-play"
            onClick={() => hasAudio && recitationPlayer.toggle()}
            disabled={!hasAudio}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" style={{ marginLeft: 2 }} />}
          </button>
          <button type="button" className="rec-pop-skip" onClick={onNext} disabled={!canNext} aria-label="Next recitation">
            <SkipForward size={15} fill="currentColor" />
          </button>
        </div>

        {hasAudio && (
          <div className="rec-pop-scrub">
            <input
              type="range"
              min={0}
              max={player.duration || 1}
              step={0.1}
              value={player.current}
              disabled={!player.duration}
              onChange={(e) => recitationPlayer.seek(Number(e.target.value))}
              aria-label="Seek"
              style={{ ["--p" as string]: `${player.duration ? (player.current / player.duration) * 100 : 0}%` }}
            />
            <div className="rec-pop-times">
              <span>{fmt(player.current)}</span>
              <span>{fmt(player.duration)}</span>
            </div>
          </div>
        )}

        {open.label && open.tracks.length > 0 && (
          <button
            type="button"
            className="rec-pop-all"
            aria-label={queueActive ? `End ${open.label}` : `Play all ${open.label}`}
            onClick={() => {
              if (queueActive) { recitationPlayer.stop(); closePopup(); return; }
              if (open.tracks.length) recitationPlayer.playAll(open.tracks, open.label!, 0);
            }}
          >
            <span className="rec-pop-all-ic">
              {queueActive ? <Square size={11} fill="currentColor" /> : <ListMusic size={13} />}
            </span>
            <span className="rec-pop-all-div" aria-hidden />
            <span className="rec-pop-all-tx">
              {queueActive
                ? `End ${open.label.charAt(0).toUpperCase()}${open.label.slice(1)}`
                : `Play all ${open.label}`}
            </span>
          </button>
        )}
      </div>
    </Portal>
  );
}
