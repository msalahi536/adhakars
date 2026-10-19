import { useNavigate, useRouterState } from "@tanstack/react-router";
import { findReciter, reciterName, reciterPhoto } from "@/lib/quran";
import { quranPlayer, useQuranPlayer } from "@/lib/quran-player";
import { triggerHaptic } from "@/lib/theme";
import { useFacePulse } from "@/lib/face-pulse";
import { MiniPlayerPill } from "./MiniPlayerPill";

/** Floating pill that keeps Quran recitation reachable on every page. */
export function QuranMiniPlayer() {
  const p = useQuranPlayer();
  const navigate = useNavigate();
  const loc = useRouterState({ select: (s) => s.location });
  const onReader = loc.pathname === "/app/quran" && Number((loc.search as { s?: number }).s) === p.chapter && !(loc.search as { view?: string }).view;
  const started = p.playing || p.loading || p.cur > 0;
  if (!p.chapter || (onReader ? p.panelOpen : !started)) return null;
  const r = findReciter(p.reciterId);
  return (
    <MiniPlayerPill
      label="Quran player"
      title={p.chapterName}
      subtitle={reciterName(r)}
      photo={reciterPhoto(r)}
      initial={reciterName(r).slice(0, 1)}
      playing={p.playing}
      loading={p.loading}
      onOpen={() => {
        void triggerHaptic("light");
        quranPlayer.setPanel(true);
        if (!onReader) void navigate({ to: "/app/quran", search: { s: p.chapter! } });
      }}
      onToggle={() => { void triggerHaptic("light"); quranPlayer.toggle(); }}
      onClose={() => quranPlayer.stop()}
    />
  );
}

/** Tiny reciter face for the full-screen reader; tapping grows it into the mini player. */
export function QuranFaceBubble({ onOpen }: { onOpen: () => void }) {
  const p = useQuranPlayer();
  const pulseRef = useFacePulse<HTMLButtonElement>(p.playing);
  if (!p.chapter) return null;
  const r = findReciter(p.reciterId);
  const photo = reciterPhoto(r);
  return (
    <button ref={pulseRef} className="quran-face" aria-label={`Show player, ${p.chapterName}`} onClick={() => { void triggerHaptic("light"); onOpen(); }}>
      {photo ? <img src={photo} alt="" /> : <span>{reciterName(r).slice(0, 1)}</span>}
    </button>
  );
}
