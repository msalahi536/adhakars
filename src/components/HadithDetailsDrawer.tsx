import { BookOpen, X } from "lucide-react";
import type { Dhikr } from "@/data/adhkar";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

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
    <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <DrawerContent
        className="hadith-details-drawer mx-auto max-h-[92dvh] max-w-lg overflow-hidden rounded-t-[24px]"
        style={{ background: "var(--card)", color: "var(--card-foreground)", borderColor: "var(--border)" }}
      >
        <DrawerHeader className="relative border-b px-6 pb-4 pt-5 text-left" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-start gap-3 pr-10">
            <span
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ background: "var(--index-badge-bg, var(--accent))", color: "var(--index-badge-fg, var(--accent-foreground))" }}
            >
              <BookOpen size={17} strokeWidth={1.6} />
            </span>
            <div className="min-w-0">
              <DrawerTitle className="font-serif text-xl leading-6">{dhikr.title}</DrawerTitle>
              <DrawerDescription className="mt-1.5 text-xs leading-5" style={{ color: "var(--muted-foreground)" }}>
                {dhikr.source}
              </DrawerDescription>
            </div>
          </div>
          <DrawerClose
            aria-label="Close hadith details"
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: "color-mix(in oklab, var(--foreground) 8%, transparent)" }}
          >
            <X size={17} />
          </DrawerClose>
        </DrawerHeader>

        <div
          className="hide-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-6 pb-[calc(env(safe-area-inset-bottom)+28px)] pt-5"
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
      </DrawerContent>
    </Drawer>
  );
}