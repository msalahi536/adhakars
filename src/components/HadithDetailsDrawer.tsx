import { BookOpen, X } from "lucide-react";
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

function DetailSection({ title, children }: { title: string; children?: string }) {
  if (!children) return null;

  return (
    <section className="space-y-2">
      <h3 className="label-caps" style={{ color: "var(--accent)" }}>{title}</h3>
      <p className="whitespace-pre-line text-sm leading-7">{children}</p>
    </section>
  );
}

export function HadithDetailsDrawer({ dhikr, open, onOpenChange }: Props) {
  const details = dhikr.details;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="hadith-details-drawer grid max-h-[78dvh] w-[calc(100%-32px)] max-w-[420px] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground shadow-2xl [&>button:last-child]:hidden"
      >
        <DialogHeader className="relative border-b border-border px-5 pb-4 pt-5 text-left">
          <div className="flex items-start gap-3 pr-10">
            <span
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"
            >
              <BookOpen size={17} strokeWidth={1.6} />
            </span>
            <div className="min-w-0">
              <DialogTitle className="font-serif text-xl leading-6">{dhikr.title}</DialogTitle>
              <DialogDescription className="mt-1.5 text-xs leading-5 text-muted-foreground">
                {dhikr.source}
              </DialogDescription>
            </div>
          </div>
          <DialogClose
            aria-label="Close hadith details"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X size={17} />
          </DialogClose>
        </DialogHeader>

        <div
          className="hide-scrollbar min-h-0 space-y-6 overflow-y-auto overscroll-contain px-5 pb-6 pt-5"
          style={{ WebkitOverflowScrolling: "touch" }}
          data-no-swipe
        >
          <section className="space-y-3">
            <h3 className="label-caps" style={{ color: "var(--accent)" }}>Arabic</h3>
            <p className="arabic whitespace-pre-line text-right text-[24px] leading-[2.05]" lang="ar" dir="rtl">{dhikr.arabic}</p>
          </section>

          <DetailSection title="Transliteration" children={dhikr.transliteration} />
          <DetailSection title="Translation" children={dhikr.translation} />
          <DetailSection title="Grading" children={details?.grading} />
          <DetailSection title="Reward · In short" children={details?.reward} />
          <DetailSection title="Full narration" children={details?.narration} />
          {details?.narrationArabic && (
            <section className="space-y-3">
              <h3 className="label-caps" style={{ color: "var(--accent)" }}>Full narration · Arabic</h3>
              <p className="arabic whitespace-pre-line text-right text-[22px] leading-[2]" lang="ar" dir="rtl">{details.narrationArabic}</p>
            </section>
          )}

          {details?.notes?.map((note, index) => (
            <DetailSection key={`${dhikr.id}-note-${index}`} title={index === 0 ? "Notes" : `Note ${index + 1}`} children={note} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}