import { ChevronDown, ListMusic, Pause, Play, Square } from "lucide-react";
import imamTaha from "@/assets/imam-taha.png.asset.json";
import { Portal } from "./Portal";
import { closePopup, usePopupOpen } from "@/lib/recitation-popup";
import { recitationPlayer, usePlayer } from "@/lib/recitation-player";

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

// One full player for card recitations, styled like the Quran player.
// Minimizing hides it; the mini pill then keeps playback reachable.
export function RecitationPopup() {
  const open = usePopupOpen();
  const player = usePlayer();
  if (!open) return null;

  const track = player.track;
  const queueActive = player.queue.length > 0;
  const openerTrack = open.track ?? open.tracks.find((t) => t.dhikrId === open.openerId) ?? null;
  const openerInQueue = queueActive && player.queue.some((t) => t.dhikrId === open.openerId);
  const mismatch = !!track && track.dhikrId !== open.openerId && !openerInQueue;
  const playing = player.playing;
  const showOpener = !track || (mismatch && !playing);
  const name = (showOpener ? open.title : track?.title) ?? "Recitation";
  const hasAudio = !!track || !!openerTrack;
  const cur = showOpener ? 0 : player.current;
  const dur = showOpener ? 0 : player.duration;

  const onPlay = () => {
    if (showOpener && openerTrack) recitationPlayer.playOne(openerTrack, open.label ?? null);
    else if (track) recitationPlayer.toggle();
  };

  return (
    <Portal>
      <div role="dialog" aria-label="Recitation player" data-no-swipe className="quran-player rec-panel" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <span className="qp-avatar"><img src={imamTaha.url} alt="" className="rec-panel-photo" /></span>
          <span className="min-w-0 flex-1">
            <span className="qp-title block truncate">{open.label && queueActive ? open.label : name}</span>
            <span className="quran-muted block truncate text-[13px]">{hasAudio ? (open.label && queueActive ? name : "Imam Taha Hassane") : "Recitation coming soon"}</span>
          </span>
          <button type="button" className="quran-player-x" aria-label="Minimize player" onClick={closePopup}><ChevronDown size={18} /></button>
        </div>

        {hasAudio && (
          <>
            <input className="quran-seek" type="range" min={0} max={dur || 1} step={0.1} value={cur} disabled={!dur} aria-label="Seek"
              style={{ ["--p" as string]: `${dur ? (cur / dur) * 100 : 0}%` }}
              onChange={(e) => recitationPlayer.seek(Number(e.target.value))} />
            <div className="quran-times"><span>{fmt(cur)}</span><span>{fmt(dur)}</span></div>
          </>
        )}

        {mismatch && playing && openerTrack && (
          <button type="button" className="rec-pop-switch" onClick={() => recitationPlayer.playOne(openerTrack, open.label ?? null)}>
            Play this card instead
          </button>
        )}

        <div className="quran-controls rec-panel-controls">
          <button type="button" className="quran-play" onClick={onPlay} disabled={!hasAudio} aria-label={playing && !showOpener ? "Pause" : "Play"}>
            {playing && !showOpener ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" style={{ marginLeft: 3 }} />}
          </button>
        </div>

        {open.label && open.tracks.length > 0 && (
          <button
            type="button"
            className="rec-pop-all"
            aria-label={queueActive ? `End ${open.label}` : `Play all ${open.label}`}
            onClick={() => {
              if (queueActive) { recitationPlayer.stop(); closePopup(); return; }
              recitationPlayer.playAll(open.tracks, open.label!, 0);
            }}
          >
            <span className="rec-pop-all-ic">{queueActive ? <Square size={11} fill="currentColor" /> : <ListMusic size={13} />}</span>
            <span className="rec-pop-all-div" aria-hidden />
            <span className="rec-pop-all-tx">{queueActive ? `End ${open.label}` : `Play all ${open.label}`}</span>
          </button>
        )}
      </div>
    </Portal>
  );
}
