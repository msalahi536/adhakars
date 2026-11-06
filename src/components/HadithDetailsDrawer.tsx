import { useState } from "react";
import { Award, BookOpen, Check, ChevronRight, Copy, Gift, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Dhikr } from "@/data/adhkar";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  dhikr: Dhikr;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      variant="ghost"
      size="icon"
      type="button"
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        }).catch(() => {});
      }}
      className="hadith-icon-button h-8 w-8 shrink-0 rounded-full"
    >
      {done ? <Check size={14} /> : <Copy size={14} />}
    </Button>
  );
}

function Label({ children }: { children: string }) {
  return (
    <h3 className="hadith-section-label text-[11px] font-semibold uppercase tracking-normal">
      {children}
    </h3>
  );
}

function TextCard({ title, text, arabic, copy, icon }: { title: string; text?: string; arabic?: boolean; copy?: boolean; icon?: React.ReactNode }) {
  if (!text) return null;
  return (
    <section className="hadith-detail-section rounded-[24px] px-5 pb-4 pt-3.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {icon && <span className="hadith-icon-button flex h-8 w-8 shrink-0 items-center justify-center rounded-full">{icon}</span>}
          <Label>{title}</Label>
        </div>
        {copy && <CopyBtn text={text} label={title.toLowerCase()} />}
      </div>
      {arabic ? (
        <p className="hadith-detail-text arabic whitespace-pre-line py-1 text-center text-[27px] leading-[1.95]" lang="ar" dir="rtl">{text}</p>
      ) : (
        <p className="hadith-detail-text whitespace-pre-line text-[15px] leading-[1.65]">{text}</p>
      )}
    </section>
  );
}

function RowPill({ icon, text, open, onClick }: { icon: React.ReactNode; text: string; open?: boolean; onClick?: () => void }) {
  return (
    <Button
      variant="ghost"
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className="hadith-row-pill h-auto w-full justify-start gap-3 whitespace-normal rounded-full py-2 pl-2 pr-3 text-left font-normal"
    >
      <span className="hadith-icon-button flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
        {icon}
      </span>
      <span className="hadith-detail-text min-w-0 flex-1 text-[14px] leading-5">{text}</span>
      <ChevronRight size={16} className={`hadith-section-label shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
    </Button>
  );
}

export function HadithDetailsDrawer({ dhikr, open, onOpenChange }: Props) {
  const details = dhikr.details;
  const [showNarration, setShowNarration] = useState(false);
  const hasNarration = !!(details?.narration || details?.narrationArabic);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="hadith-details-drawer grid h-[min(92dvh,860px)] w-[calc(100%_-_24px)] max-w-[460px] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-[32px] p-0 [&>button:last-child]:hidden"
      >
        <DialogHeader className="relative px-6 pb-4 pt-4 text-left">
          <div className="hadith-sheet-handle mx-auto mb-6 h-[5px] w-12 rounded-full" />
          <div className="flex items-center gap-3">
            <span
              className="hadith-source-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            >
              <BookOpen size={21} strokeWidth={1.5} />
            </span>
            <div className="min-w-0">
              <DialogTitle className="sr-only">Hadith details</DialogTitle>
              <DialogDescription className="hadith-section-label text-[11px] leading-[1.65]">
                {dhikr.source}
              </DialogDescription>
            </div>
          </div>
          <DialogClose asChild>
          <Button variant="ghost" size="icon"
            aria-label="Close hadith details"
            className="hadith-icon-button absolute right-4 top-4 h-9 w-9 rounded-full"
          >
            <X size={16} />
          </Button>
          </DialogClose>
        </DialogHeader>

        <div
          className="hadith-detail-scroll hide-scrollbar min-h-0 space-y-4 overflow-y-auto overscroll-contain px-4 pb-6 pt-1"
          style={{ WebkitOverflowScrolling: "touch" }}
          data-no-swipe
        >
          <TextCard title="Reward · In short" text={details?.reward} icon={<Gift size={16} strokeWidth={1.6} />} />
          <TextCard title="Commentary" text={dhikr.commentary} icon={<MessageSquare size={16} strokeWidth={1.6} />} />
          <TextCard title="Grading" text={details?.grading?.split(/\s*·\s*/).join("\n")} icon={<Award size={16} strokeWidth={1.6} />} />

          {hasNarration && (
            <section className="hadith-detail-section space-y-2 rounded-[24px] p-3.5">
              <div className="px-1"><Label>Full narration</Label></div>
              <RowPill icon={<BookOpen size={16} strokeWidth={1.6} />} text={showNarration ? "Hide full hadith and narration" : "View full hadith and narration"} open={showNarration} onClick={() => setShowNarration((v) => !v)} />
              {showNarration && (
                <div className="space-y-3 pt-1">
                  <TextCard title="Narration" text={details?.narration} copy />
                  <TextCard title="Narration · Arabic" text={details?.narrationArabic} arabic copy />
                </div>
              )}
            </section>
          )}

          <TextCard title="Arabic" text={dhikr.arabic} arabic copy />
          <TextCard title="Transliteration" text={dhikr.transliteration} copy />
          <TextCard title="Translation" text={dhikr.translation} copy />

          {details?.notes?.map((note, index) => (
            <TextCard key={`${dhikr.id}-note-${index}`} title={index === 0 ? "Notes" : `Note ${index + 1}`} text={note} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
