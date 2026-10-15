import { AudioLines, BellRing, BookOpen, Grid2X2, MoonStar, ShieldCheck } from "lucide-react";
import logo from "@/assets/logo-mark.png.asset.json";
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
    icon: AudioLines,
    title: "Recitations added",
  },
  {
    icon: Grid2X2,
    title: "iPhone home screen widgets added",
  },
  {
    icon: BellRing,
    title: "Adhan added",
  },
  {
    icon: MoonStar,
    title: "New logo",
  },
  { icon: BookOpen, title: "New adhkars" },
  { icon: ShieldCheck, title: "Ruqyah companion" },
];

export function WhatsNewDialog({ open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="update-dialog grid max-h-[82dvh] w-[calc(100%_-_32px)] max-w-[410px] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-3xl border-border/60 bg-card p-0 text-card-foreground shadow-[0_24px_80px_-12px_hsl(var(--foreground)/0.25)] [&>button:last-child]:hidden">
        <DialogHeader className="px-6 pb-4 pt-6 text-left">
          <img src={logo.url} alt="Sahih Al-Adhkar logo" className="mb-3 h-12 w-12 rounded-2xl object-cover shadow-sm ring-1 ring-border/60" />
          <p className="label-caps text-accent">Latest update</p>
          <DialogTitle className="font-display text-[30px] font-semibold leading-tight">What’s new</DialogTitle>
          <DialogDescription className="pt-1 text-sm leading-6 text-muted-foreground">
            A little more for your daily remembrance.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 space-y-1.5 overflow-y-auto overscroll-contain px-4 py-2" style={{ WebkitOverflowScrolling: "touch" }}>
          {updates.map(({ icon: Icon, title }) => (
            <div key={title} className="flex items-center gap-3 rounded-2xl bg-muted/40 px-3 py-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card text-accent shadow-sm ring-1 ring-border/50">
                <Icon size={17} strokeWidth={1.7} />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 pb-6 pt-4">
          <p className="mb-1 text-center text-sm font-medium text-card-foreground">And much more.</p>
          <p className="mb-4 text-center text-xs leading-5 text-muted-foreground">Make sure to update your app to enjoy everything new.</p>
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