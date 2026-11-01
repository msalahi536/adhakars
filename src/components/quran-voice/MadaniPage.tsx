import { memo, useLayoutEffect, useRef } from "react";
import { AyahMarker, MushafFrame, MushafLabel, MushafPageNumber, SurahCartouche, toArabicDigits } from "@/components/mushaf/MushafPage";
import type { RecitePage } from "@/lib/recite/model";
import type { Chapter } from "@/lib/quran";
import { madaniSlots } from "./page-layout";

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
      apply(lo);
      el.style.setProperty("--qv-line-height", `${el.querySelector<HTMLElement>(".qv-slot")?.clientHeight ?? 24}px`);
      ready();
    };
    fit(); const observer = new ResizeObserver(fit); observer.observe(el);
    return () => observer.disconnect();
  }, [page, font, ready]);
  const first = page.verses[0];
  return <div className="qv-madani-page">
    <div className="qv-page-labels"><MushafLabel text={`الجزء ${toArabicDigits(first?.juz ?? 1)}`} height={24} /><MushafLabel text={`سُورَةُ ${chapters.find((c) => c.id === first?.chapter)?.name_arabic ?? ""}`} height={24} /></div>
    <MushafFrame scale={.5} className="qv-frame"><div ref={body} className={`qv-madani-body ${page.page <= 2 ? "qv-opening-page" : ""}`} style={{fontFamily:font}} data-page={page.page}>
      {madaniSlots(page).map(({line,header,basmala,words}) => {
        if (header) return <div key={line} data-line={line} className="qv-slot qv-cartouche"><SurahCartouche name={`سُورَةُ ${chapters.find((c) => c.id === header)?.name_arabic ?? ""}`} height={48} /></div>;
        if (basmala) return <div key={line} data-line={line} className="qv-slot qv-bismillah" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>;
        return <div key={line} data-line={line} className="qv-slot qv-madani-line" dir="rtl">{words.map((w) => w.end ? <span key={w.key} className="qv-ayah-marker"><AyahMarker number={Number(w.verse.split(":")[1])} size={18} /></span> : <span key={w.key} data-follow-word={w.key}>{w.glyph}</span>)}</div>;
      })}
    </div></MushafFrame><div className="qv-page-number"><MushafPageNumber page={page.page} height={24} /></div>
  </div>;
});