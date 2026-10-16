import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Loader2, Pause, Play, X } from "lucide-react";
import { findReciter, reciterName, reciterPhoto } from "@/lib/quran";
import { quranPlayer, useQuranPlayer } from "@/lib/quran-player";
import { triggerHaptic } from "@/lib/theme";

/** Floating pill that keeps Quran recitation reachable on every page. */
export function QuranMiniPlayer() {
  const p = useQuranPlayer();
  const navigate = useNavigate();
  const loc = useRouterState({ select: (s) => s.location });
  const onReader = loc.pathname === "/app/quran" && Number((loc.search as { s?: number }).s) === p.chapter && !(loc.search as { view?: string }).view;
  const started = p.playing || p.loading || p.cur > 0;
  if (!p.chapter || (onReader ? p.panelOpen : !started)) return null;
  const r = findReciter(p.reciterId);
  const photo = reciterPhoto(r);
  const open = () => {
    void triggerHaptic("light");
    quranPlayer.setPanel(true);
    if (!onReader) void navigate({ to: "/app/quran", search: { s: p.chapter! } });
  };
  return (
    <div className="quran-mini" role="group" aria-label="Quran player">
      <button className="quran-mini-main" onClick={open} aria-label={`Open player, ${p.chapterName}`}>
        <span className="quran-mini-photo">{photo ? <img src={photo} alt="" /> : reciterName(r).slice(0, 1)}{p.playing && <i className="quran-mini-dot" />}</span>
        <span className="min-w-0 text-left"><span className="block truncate text-[13px] font-semibold">{p.chapterName}</span><span className="quran-muted block truncate text-[10.5px]">{reciterName(r)}</span></span>
      </button>
      <button className="quran-mini-btn" aria-label={p.playing ? "Pause" : "Play"} onClick={() => { void triggerHaptic("light"); quranPlayer.toggle(); }}>
        {p.loading && !p.playing ? <Loader2 size={16} className="animate-spin" /> : p.playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" style={{ marginLeft: 2 }} />}
      </button>
      {!p.playing && <button className="quran-mini-btn is-ghost" aria-label="Stop and close" onClick={() => quranPlayer.stop()}><X size={15} /></button>}
    </div>
  );
}
