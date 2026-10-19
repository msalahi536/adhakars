import { useNavigate, useRouterState } from "@tanstack/react-router";
import { findReciter, reciterName, reciterPhoto } from "@/lib/quran";
import { quranPlayer, useQuranPlayer } from "@/lib/quran-player";
import { triggerHaptic } from "@/lib/theme";
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
