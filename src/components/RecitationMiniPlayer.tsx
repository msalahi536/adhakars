import { useEffect } from "react";
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
  const shown = !!player.track && !open;
  // Quran player moves up to sit above this bar.
  useEffect(() => {
    document.body.classList.toggle("has-adhkar-mini", shown);
    return () => document.body.classList.remove("has-adhkar-mini");
  }, [shown]);
  const track = player.track;
  if (!track || open) return null;
  void q;
  return (
    <MiniPlayerPill
      className="is-adhkar"
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
