import { BookOpen, Compass, Palette, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onClose: () => void;
};

const updates = [
  {
    icon: BookOpen,
    title: "Expanded daily adhkar",
    description: "Complete Morning and Evening collections with carefully organized reading notes.",
  },
  {
    icon: ScrollText,
    title: "Full hadith details",
    description: "Open each reference for its narration, grading, reward, and notes—including the complete Three Quls.",
  },
  {
    icon: Palette,
    title: "New appearance themes",
    description: "Choose a new atmosphere for the whole app. Your appearance starts again with Original.",
  },
  {
    icon: Compass,
    title: "Clearer Qibla calibration",
    description: "A simpler guided motion makes compass preparation easier to understand.",
  },
];

export function WhatsNewDialog({ open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="update-dialog grid max-h-[82dvh] w-[calc(100%_-_32px)] max-w-[410px] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground shadow-2xl [&>button:last-child]:hidden">
        <DialogHeader className="border-b border-border px-6 pb-5 pt-6 text-left">
          <p className="label-caps text-accent">Latest update</p>
          <DialogTitle className="font-display text-[30px] font-semibold leading-tight">What’s new</DialogTitle>
          <DialogDescription className="pt-1 text-sm leading-6 text-muted-foreground">
            A more complete, considered Sahih Al-Adhkar experience.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 space-y-1 overflow-y-auto overscroll-contain px-4 py-3" style={{ WebkitOverflowScrolling: "touch" }}>
          {updates.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex gap-3 rounded-xl px-2 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-accent">
                <Icon size={17} strokeWidth={1.7} />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border px-5 pb-5 pt-4">
          <Button className="h-11 w-full rounded-full" onClick={onClose}>
            Continue
          </Button>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            Your progress and personal adhkar have been preserved.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}