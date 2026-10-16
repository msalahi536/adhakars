import { AudioLines, BookOpen, Languages, Mail, Sparkles, Users } from "lucide-react";
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
  { icon: BookOpen, title: "The Holy Quran", body: "All 114 surahs, beautifully laid out to read anywhere." },
  { icon: Sparkles, title: "Word-by-word highlighting", body: "Follow every word as it's recited, verse by verse." },
  { icon: Languages, title: "Translation & transliteration", body: "Read along in English or transliteration as it plays." },
  { icon: Users, title: "350+ recitations", body: "From the world's most beloved reciters, with more coming soon." },
  { icon: AudioLines, title: "Listen anywhere", body: "Recitation keeps playing as you move around the app." },
];

export function WhatsNewDialog({ open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="update-dialog grid max-h-[82dvh] w-[calc(100%_-_32px)] max-w-[410px] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-3xl border-border/60 bg-card p-0 text-card-foreground shadow-[0_24px_80px_-12px_hsl(var(--foreground)/0.25)] [&>button:last-child]:hidden">
        <DialogHeader className="px-6 pb-4 pt-6 text-left">
          <img src={logo.url} alt="Sahih Al-Adhkar logo" className="mb-3 h-12 w-12 rounded-2xl object-cover shadow-sm ring-1 ring-border/60" />
          <p className="label-caps text-accent">New feature</p>
          <DialogTitle className="font-display text-[30px] font-semibold leading-tight">The Quran is here</DialogTitle>
          <DialogDescription className="pt-1 text-sm leading-6 text-muted-foreground">
            Read, listen and follow along with the words of Allah — now inside Sahih Al-Adhkar.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 space-y-1.5 overflow-y-auto overscroll-contain px-4 py-2" style={{ WebkitOverflowScrolling: "touch" }}>
          {updates.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex items-center gap-3 rounded-2xl bg-muted/40 px-3 py-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card text-accent shadow-sm ring-1 ring-border/50">
                <Icon size={17} strokeWidth={1.7} />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
                <p className="text-xs leading-5 text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 pb-6 pt-4">
          <p className="mb-4 flex items-start justify-center gap-1.5 text-center text-xs leading-5 text-muted-foreground">
            <Mail size={13} className="mt-1 shrink-0" />
            <span>
              This feature is brand new — if anything looks off, please let us know at{" "}
              <a href="mailto:msalahi536@gmail.com" className="font-medium text-accent">msalahi536@gmail.com</a>
            </span>
          </p>
          <Button className="h-11 w-full rounded-full" onClick={onClose}>
            Start reading
          </Button>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            Make sure your app is updated to enjoy everything new.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}