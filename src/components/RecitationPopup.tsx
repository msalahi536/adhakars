import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Clock, MoreHorizontal, Pause, Play, SkipBack, SkipForward, Square } from "lucide-react";
import imamTaha from "@/assets/imam-taha.png.asset.json";
import { Portal } from "./Portal";
import { closePopup, usePopupOpen } from "@/lib/recitation-popup";
import { recitationPlayer, usePlayer } from "@/lib/recitation-player";

const RATES = [0.75, 1, 1.25, 1.5, 2];
const SLEEP: { label: string; v: number | "track" | null }[] = [
  { label: "Off", v: null }, { label: "5 minutes", v: 5 }, { label: "15 minutes", v: 15 },
  { label: "30 minutes", v: 30 }, { label: "1 hour", v: 60 }, { label: "End of this recitation", v: "track" },
];

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

// One full player for card recitations, styled like the Quran player.
// Minimizing hides it; the mini pill then keeps playback reachable.
export function RecitationPopup() {
  const open = usePopupOpen();
  const player = usePlayer();
  const [menu, setMenu] = useState<null | "main" | "sleep" | "speed">(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [, tick] = useState(0);
  useEffect(() => {
    if (!menu) return;
    const close = (e: PointerEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(null); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menu]);
  useEffect(() => {
    if (typeof player.sleep !== "number") return;
    const id = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [player.sleep]);
  if (!open) return null;
  const sleepLeft = typeof player.sleep === "number"
    ? `${Math.max(0, Math.ceil((player.sleep - Date.now()) / 60000))} min left`
    : player.sleep === "track" ? "End of this recitation" : null;

  const track = player.track;
  const queueActive = player.queue.length > 0;
  const openerTrack = open.track ?? open.tracks.find((t) => t.dhikrId === open.openerId) ?? null;
  const openerInQueue = queueActive && player.queue.some((t) => t.dhikrId === open.openerId);
  // The card this popup was opened from differs from the recitation loaded.
  const mismatch = !!track && track.dhikrId !== open.openerId;
  const switchTo = () => {
    if (!openerTrack) return;
    const qi = openerInQueue ? player.queue.findIndex((t) => t.dhikrId === open.openerId) : -1;
    if (qi >= 0) recitationPlayer.playAll(player.queue, player.queueLabel ?? open.label ?? "recitations", qi);
    else recitationPlayer.playOne(openerTrack, open.label ?? null);
  };
  const playing = player.playing;
  const showOpener = !track || (mismatch && !playing);
  const name = (showOpener ? open.title : track?.title) ?? "Recitation";
  const hasAudio = !!track || !!openerTrack;
  const cur = showOpener ? 0 : player.current;
  const dur = showOpener ? 0 : player.duration;

  const byTrack = track ? open.tracks.findIndex((t) => t.dhikrId === track.dhikrId) : -1;
  const byOpener = open.tracks.findIndex((t) => t.dhikrId === open.openerId);
  const listIndex = showOpener ? byOpener : (byTrack >= 0 ? byTrack : byOpener);
  const canPrev = queueActive ? player.queueIndex > 0 : listIndex > 0;
  const canNext = queueActive ? player.queueIndex < player.queue.length - 1 : listIndex >= 0 && listIndex < open.tracks.length - 1;
  const step = (d: number) => {
    let t: typeof track = null;
    if (queueActive) {
      t = player.queue[player.queueIndex + d] ?? null;
      if (d < 0) recitationPlayer.previous(); else recitationPlayer.next();
    } else {
      t = open.tracks[listIndex + d] ?? null;
      if (t) recitationPlayer.playOne(t, open.label ?? null);
    }
    // Skipping makes the new card the one this popup is "about", so no switch prompt.
    if (t) setPopupOpen({ ...open, openerId: t.dhikrId, title: t.title, track: t });
  };

  const onPlay = () => {
    if (showOpener && openerTrack) switchTo();
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
          <div className="qp-menu-wrap" ref={menuRef}>
            <button type="button" className="quran-speed qp-speed" aria-label={`Playback speed ${player.rate}x`} onClick={() => setMenu(menu === "speed" ? null : "speed")}>{player.rate}x <ChevronDown size={14} /></button>
            <button type="button" className="quran-player-x qp-more" aria-label="More options" onClick={() => setMenu(menu === "main" || menu === "sleep" ? null : "main")}><MoreHorizontal size={18} /></button>
            {menu === "speed" && (
              <div className="qp-pop qp-pop-speed" role="menu">
                {RATES.map((r) => (
                  <button key={r} type="button" role="menuitemradio" aria-checked={player.rate === r} className={`qp-pop-row ${player.rate === r ? "is-on" : ""}`} onClick={() => { recitationPlayer.setRate(r); setMenu(null); }}>
                    <span className="flex-1">{r}x</span>{player.rate === r && <Check size={15} />}
                  </button>
                ))}
              </div>
            )}
            {menu === "main" && (
              <div className="qp-pop" role="menu">
                <button type="button" className="qp-pop-row" onClick={() => setMenu("sleep")}>
                  <Clock size={19} className="qp-ic" />
                  <span className="flex-1 text-left text-[14px]">Sleep timer{sleepLeft && <span className="quran-muted block text-[11.5px]">{sleepLeft}</span>}</span>
                  <ChevronRight size={16} className="quran-muted" />
                </button>
              </div>
            )}
            {menu === "sleep" && (
              <div className="qp-pop" role="menu">
                <button type="button" className="qp-pop-row qp-pop-back" onClick={() => setMenu("main")}><ChevronLeft size={16} /><span className="flex-1 text-left text-[14px] font-medium">Sleep timer</span></button>
                {SLEEP.map((o) => {
                  const on = o.v === null ? player.sleep === null : o.v === "track" ? player.sleep === "track" : false;
                  return (
                    <button key={o.label} type="button" role="menuitemradio" aria-checked={on} className={`qp-pop-row ${on ? "is-on" : ""}`} onClick={() => { recitationPlayer.setSleep(o.v); setMenu(null); }}>
                      <span className="flex-1 text-left text-[14px]">{o.label}</span>{on && <Check size={15} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
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
          <button type="button" className="rec-pop-switch" onClick={switchTo}>
            Play this card instead
          </button>
        )}

        <div className="quran-controls rec-panel-controls">
          <button type="button" onClick={() => step(-1)} disabled={!canPrev} aria-label="Previous recitation"><SkipBack size={22} fill="currentColor" /></button>
          <button type="button" className="quran-play" onClick={onPlay} disabled={!hasAudio} aria-label={playing && !showOpener ? "Pause" : "Play"}>
            {playing && !showOpener ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" style={{ marginLeft: 3 }} />}
          </button>
          <button type="button" onClick={() => step(1)} disabled={!canNext} aria-label="Next recitation"><SkipForward size={22} fill="currentColor" /></button>
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
            {queueActive && <Square size={11} fill="currentColor" />}
            <span className="rec-pop-all-tx">{queueActive ? `End ${open.label}` : `Play all ${open.label}`}</span>
            {!queueActive && <ChevronRight size={16} className="rec-panel-chev" />}
          </button>
        )}
      </div>
    </Portal>
  );
}
