import { useEffect, useState } from "react";
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
  const [lift, setLift] = useState<number | null>(null);
  // Sit just above the Quran player (full or mini) so both stay usable.
  useEffect(() => {
    const measure = () => {
      const q = document.querySelector<HTMLElement>(".quran-player:not(.rec-panel), .mini-pill:not(.is-adhkar)");
      const r = q?.getBoundingClientRect();
      setLift(r && r.height ? window.innerHeight - r.top + 8 : null);
    };
    measure();
    const id = window.setInterval(measure, 300);
    return () => window.clearInterval(id);
  }, []);
  const track = player.track;
  if (!track || open) return null;
  void q;
  return (
    <MiniPlayerPill
      className="is-adhkar"
      style={lift != null ? { bottom: lift } : undefined}
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
