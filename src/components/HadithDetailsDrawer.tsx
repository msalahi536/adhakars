import { useState } from "react";
import { Award, BookOpen, Check, ChevronRight, Copy, X } from "lucide-react";
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

const cardStyle: React.CSSProperties = {
  background: "color-mix(in oklab, var(--foreground) 4%, transparent)",
  border: "1px solid color-mix(in oklab, var(--foreground) 9%, transparent)",
};

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        }).catch(() => {});
      }}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
      style={{ background: "color-mix(in oklab, var(--foreground) 7%, transparent)" }}
    >
      {done ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

function Label({ children }: { children: string }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "color-mix(in oklab, var(--accent) 80%, var(--muted-foreground))" }}>
      {children}
    </h3>
  );
}

function TextCard({ title, text, arabic, copy }: { title: string; text?: string; arabic?: boolean; copy?: boolean }) {
  if (!text) return null;
  return (
    <section className="rounded-[20px] px-4 pb-4 pt-3.5" style={cardStyle}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <Label>{title}</Label>
        {copy && <CopyBtn text={text} label={title.toLowerCase()} />}
      </div>
      {arabic ? (
        <p className="arabic whitespace-pre-line text-center text-[25px] leading-[2.05]" lang="ar" dir="rtl">{text}</p>
      ) : (
        <p className="whitespace-pre-line text-[14.5px] leading-7 text-foreground/90">{text}</p>
      )}
    </section>
  );
}

function RowPill({ icon, text, open, onClick }: { icon: React.ReactNode; text: string; open?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-full py-2 pl-2 pr-4 text-left"
      style={cardStyle}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground/80" style={{ background: "color-mix(in oklab, var(--foreground) 7%, transparent)" }}>
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-[14.5px] text-foreground/90">{text}</span>
      <ChevronRight size={16} className={`shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
    </button>
  );
}

export function HadithDetailsDrawer({ dhikr, open, onOpenChange }: Props) {
  const details = dhikr.details;
  const [showGrading, setShowGrading] = useState(false);
  const [showNarration, setShowNarration] = useState(false);
  const hasNarration = !!(details?.narration || details?.narrationArabic);
  const gradeShort = details?.grading?.split(/[.\n]/)[0]?.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="hadith-details-drawer grid max-h-[82dvh] w-[calc(100%_-_28px)] max-w-[420px] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-[30px] border-border bg-card p-0 text-card-foreground shadow-2xl [&>button:last-child]:hidden"
      >
        <DialogHeader className="relative px-5 pb-3 pt-3 text-left">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted-foreground/30" />
          <div className="flex items-center gap-3.5 pr-11">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
              style={{ background: "color-mix(in oklab, var(--accent) 55%, var(--card))", color: "var(--card)" }}
            >
              <BookOpen size={19} strokeWidth={1.7} />
            </span>
            <div className="min-w-0">
              <DialogTitle className="font-serif text-[21px] leading-[1.2]">{dhikr.title}</DialogTitle>
              <DialogDescription className="mt-1 text-xs leading-5 text-muted-foreground">
                {dhikr.source}
              </DialogDescription>
            </div>
          </div>
          <DialogClose
            aria-label="Close hadith details"
            className="absolute right-4 top-5 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ background: "color-mix(in oklab, var(--foreground) 7%, transparent)" }}
          >
            <X size={16} />
          </DialogClose>
        </DialogHeader>

        <div
          className="hide-scrollbar min-h-0 space-y-3 overflow-y-auto overscroll-contain px-4 pb-6 pt-2"
          style={{ WebkitOverflowScrolling: "touch" }}
          data-no-swipe
        >
          <TextCard title="Arabic" text={dhikr.arabic} arabic copy />
          <TextCard title="Transliteration" text={dhikr.transliteration} copy />
          <TextCard title="Translation" text={dhikr.translation} copy />
          <TextCard title="Reward · In short" text={details?.reward} />

          {details?.grading && (
            <section className="space-y-2 pt-2">
              <div className="px-1"><Label>Grading</Label></div>
              <RowPill icon={<Award size={16} strokeWidth={1.6} />} text={gradeShort || details.grading} open={showGrading} onClick={() => setShowGrading((v) => !v)} />
              {showGrading && <p className="whitespace-pre-line px-2 text-[13.5px] leading-6 text-muted-foreground">{details.grading}</p>}
            </section>
          )}

          {hasNarration && (
            <section className="space-y-2 pt-2">
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

          {details?.notes?.map((note, index) => (
            <TextCard key={`${dhikr.id}-note-${index}`} title={index === 0 ? "Notes" : `Note ${index + 1}`} text={note} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
