import imamTaha from "@/assets/imam-taha.png.asset.json";
import { recitationPlayer, usePlayer } from "@/lib/recitation-player";
import { setPopupOpen, usePopupOpen } from "@/lib/recitation-popup";
import { useQuranPlayer } from "@/lib/quran-player";
import { MiniPlayerPill } from "./MiniPlayerPill";

/** Minimized adhkar recitation player, shown while audio is loaded and the popup is closed. */
export function RecitationMiniPlayer() {
  const player = usePlayer();
  const open = usePopupOpen();
  const q = useQuranPlayer();
  const track = player.track;
  if (!track || open) return null;
  const quranShown = !!q.chapter && (q.playing || q.loading || q.cur > 0);
  return (
    <MiniPlayerPill
      className={quranShown ? "is-stacked" : ""}
      label="Recitation player"
      title={player.queueLabel ?? track.title}
      subtitle="Imam Taha Hassane"
      photo={imamTaha.url}
      playing={player.playing}
      levels={player.levels}
      onOpen={() => setPopupOpen({
        openerId: track.dhikrId, title: track.title,
        tracks: player.queue.length ? player.queue : [track],
        label: player.queueLabel, track,
      })}
      onToggle={() => recitationPlayer.toggle()}
      onClose={() => recitationPlayer.stop()}
    />
  );
}
