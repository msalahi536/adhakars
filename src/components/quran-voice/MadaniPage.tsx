import { memo, useLayoutEffect, useRef } from "react";
import { AyahMarker, MushafFrame, MushafLabel, MushafPageNumber, SurahCartouche, toArabicDigits } from "@/components/mushaf/MushafPage";
import type { RecitePage } from "@/lib/recite/model";
import type { Chapter } from "@/lib/quran";

/** Only page/font changes render this component. Live word positions mutate classes outside React. */
export const MadaniPage = memo(function MadaniPage({ page, font, chapters, ready }: {
  page: RecitePage; font: string; chapters: Chapter[]; ready: () => void;
}) {
  const body = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const el = body.current; if (!el) return;
    const fit = () => {
      const lines = [...el.querySelectorAll<HTMLElement>(".qv-madani-line")];
      let lo = 1, hi = Math.min(el.clientWidth, (el.clientHeight - 16) / 15 * .82);
      const apply = (size: number) => el.style.setProperty("--qv-glyph-size", `${size}px`);
      for (let n = 0; n < 18; n++) {
        const mid = (lo + hi) / 2; apply(mid);
        if (lines.every((line) => [...line.children].reduce((w, word) => w + word.getBoundingClientRect().width, 0) <= line.clientWidth)) lo = mid;
        else hi = mid;
      }
      apply(lo); ready();
    };
    fit(); const observer = new ResizeObserver(fit); observer.observe(el);
    return () => observer.disconnect();
  }, [page, font, ready]);
  const first = page.verses[0];
  return <div className="qv-madani-page">
    <div className="qv-page-labels"><MushafLabel text={`الجزء ${toArabicDigits(first?.juz ?? 1)}`} height={24} /><MushafLabel text={`سُورَةُ ${chapters.find((c) => c.id === first?.chapter)?.name_arabic ?? ""}`} height={24} /></div>
    <MushafFrame scale={.5} className="qv-frame"><div ref={body} className="qv-madani-body" style={{fontFamily:font, gridTemplateRows:Array.from({length:15},(_,i)=>page.verses.some((v)=>v.number===1 && v.words[0]?.line===i+3)?"48px":"minmax(0,1fr)").join(" ")}}>
      {Array.from({length:15}, (_, i) => {
        const line = i + 1;
        const start = page.verses.find((v) => v.number === 1 && v.words[0]?.line === line + 2);
        if (start) return <div key={line} className="qv-cartouche"><SurahCartouche name={`سُورَةُ ${chapters.find((c) => c.id === start.chapter)?.name_arabic ?? ""}`} height={48} /></div>;
        const bismillah = page.verses.find((v) => v.number === 1 && v.chapter !== 9 && v.chapter !== 1 && v.words[0]?.line === line + 1);
        if (bismillah) return <div key={line} className="qv-bismillah" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>;
        return <div key={line} className="qv-madani-line" dir="rtl">{page.verses.flatMap((v) => v.words).filter((w) => w.line === line).map((w) => w.end ? <span key={w.key} className="qv-ayah-marker"><AyahMarker number={Number(w.verse.split(":")[1])} size={18} /></span> : <span key={w.key} data-follow-word={w.key}>{w.glyph}</span>)}</div>;
      })}
    </div></MushafFrame><div className="qv-page-number"><MushafPageNumber page={page.page} height={24} /></div>
  </div>;
});