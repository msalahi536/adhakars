import { useEffect, useRef, useState } from "react";
import { BookOpen, Hand, Compass, Bell } from "lucide-react";
import {
  requestNotificationPermission,
  isNativePlatform,
  getNotificationPrefs,
  setNotificationPrefs,
  applyReminders,
} from "@/lib/notifications";

const FLAG_KEY = "adhkar:onboarded";

export const hasOnboarded = (): boolean => {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(FLAG_KEY) === "1";
  } catch {
    return true;
  }
};

const markOnboarded = () => {
  try {
    localStorage.setItem(FLAG_KEY, "1");
  } catch {
    // ignore
  }
};

type Slide = {
  Icon: typeof BookOpen;
  label: string;
  title: string;
  body: string;
};

const SLIDES: Slide[] = [
  {
    Icon: BookOpen,
    label: "Welcome",
    title: "Authentic adhkar, every day",
    body: "Every dhikr is sourced from Sahih hadith or the Qur'an. Pure and trustworthy.",
  },
  {
    Icon: Hand,
    label: "How it works",
    title: "Tap to count, build streaks",
    body: "Tap the counter to record each dhikr. Hit daily targets and build streaks with consistency.",
  },
  {
    Icon: Compass,
    label: "Finding your way",
    title: "Five tabs, one More hub",
    body: "Morning · Evening · Salah · Tasbih · More. Sleep, Wake, Qibla and My Adhkar live under More.",
  },
  {
    Icon: Bell,
    label: "Reminders",
    title: "Never miss a session",
    body: "Enable daily reminders scheduled on your device. Morning and evening, right on time.",
  },
];

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [notifBusy, setNotifBusy] = useState(false);
  const [notifDone, setNotifDone] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const deltaX = useRef(0);

  const finish = () => {
    markOnboarded();
    onDone();
  };

  const goTo = (i: number) => {
    setIndex(Math.max(0, Math.min(SLIDES.length - 1, i)));
  };

  const next = () => {
    if (index >= SLIDES.length - 1) finish();
    else goTo(index + 1);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    deltaX.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startX.current == null) return;
    deltaX.current = e.touches[0].clientX - startX.current;
  };
  const onTouchEnd = () => {
    const dx = deltaX.current;
    startX.current = null;
    deltaX.current = 0;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) goTo(index + 1);
    else goTo(index - 1);
  };

  const enableReminders = async () => {
    setNotifBusy(true);
    try {
      if (!isNativePlatform()) {
        setNotifDone(true);
        return;
      }
      const granted = await requestNotificationPermission();
      if (granted) {
        const prefs = getNotificationPrefs();
        const updated = {
          ...prefs,
          morning: { ...prefs.morning, enabled: true },
          evening: { ...prefs.evening, enabled: true },
        };
        setNotificationPrefs(updated);
        await applyReminders(updated);
      }
      setNotifDone(true);
    } catch {
      setNotifDone(true);
    } finally {
      setNotifBusy(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(index + 1);
      if (e.key === "ArrowLeft") goTo(index - 1);
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const isLast = index === SLIDES.length - 1;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-6">
        <div className="text-xs font-semibold opacity-60">
          {index + 1} / {SLIDES.length}
        </div>
        <button
          type="button"
          onClick={finish}
          className="text-sm font-semibold opacity-70 active:opacity-100"
          style={{ color: "var(--foreground)" }}
        >
          Skip
        </button>
      </div>

      {/* Slides */}
      <div
        className="flex-1 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          ref={trackRef}
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {SLIDES.map((s, i) => {
            const Icon = s.Icon;
            return (
              <div
                key={i}
                className="flex h-full w-full shrink-0 items-center justify-center px-5"
              >
                <div
                  className="w-full max-w-md rounded-[24px] p-6"
                  style={{
                    background: "var(--surface, var(--card))",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--card-shadow, 0 4px 16px rgba(0,0,0,0.06))",
                    color: "var(--foreground)",
                  }}
                >
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl"
                    style={{
                      background: "color-mix(in oklab, var(--accent) 18%, transparent)",
                      color: "var(--accent)",
                    }}
                  >
                    <Icon size={30} strokeWidth={2.2} />
                  </div>
                  <div
                    className="label-caps mt-5"
                    style={{ color: "var(--accent)" }}
                  >
                    {s.label}
                  </div>
                  <h2 className="mt-1 text-2xl font-bold leading-tight">
                    {s.title}
                  </h2>
                  <p
                    className="mt-3 text-[15px] leading-relaxed"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {s.body}
                  </p>

                  {i === SLIDES.length - 1 && (
                    <div className="mt-6 space-y-2">
                      <button
                        type="button"
                        onClick={enableReminders}
                        disabled={notifBusy || notifDone}
                        className="w-full rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-70"
                        style={{
                          background: "var(--accent)",
                          color: "var(--accent-foreground)",
                        }}
                      >
                        {notifDone
                          ? isNativePlatform()
                            ? "Reminders enabled"
                            : "Available in the mobile app"
                          : notifBusy
                            ? "Requesting…"
                            : "Enable Reminders"}
                      </button>
                      <button
                        type="button"
                        onClick={finish}
                        className="w-full rounded-full px-5 py-3 text-sm font-semibold"
                        style={{
                          background: "transparent",
                          color: "var(--foreground)",
                        }}
                      >
                        Maybe later
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dots + primary action */}
      <div className="flex flex-col items-center gap-4 px-5 pb-8 pt-4">
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goTo(i)}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === index ? 20 : 6,
                background:
                  i === index
                    ? "var(--accent)"
                    : "color-mix(in oklab, var(--foreground) 20%, transparent)",
              }}
            />
          ))}
        </div>
        {!isLast && (
          <button
            type="button"
            onClick={next}
            className="w-full max-w-md rounded-full px-5 py-3 text-sm font-semibold"
            style={{
              background: "var(--accent)",
              color: "var(--accent-foreground)",
            }}
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
