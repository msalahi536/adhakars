import React, { useEffect, useRef, useState } from "react";
import { BookOpen, Hand, Compass, Bell, Sparkles, Shield } from "lucide-react";
import {
  requestNotificationPermission,
  checkNotificationPermission,
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

const BenefitsList = () => {
  const listClass = "mt-2 space-y-1 text-[13px] leading-snug";
  const itemClass = "flex items-start gap-2";
  const dotClass = "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full";
  const sectionClass = "mt-3";
  const headingClass = "label-caps flex items-center gap-2";
  return (
    <div className="max-h-[38vh] overflow-y-auto pr-1">
      <div className={sectionClass}>
        <div className={headingClass} style={{ color: "var(--accent)" }}>
          <Sparkles size={14} strokeWidth={2.2} />
          INCREASES YOU IN
        </div>
        <ul className={listClass} style={{ color: "var(--muted-foreground)" }}>
          <li className={itemClass}>
            <span className={dotClass} style={{ background: "var(--accent)" }} />
            Eman and Closeness to Allah
          </li>
          <li className={itemClass}>
            <span className={dotClass} style={{ background: "var(--accent)" }} />
            Allah Remembering you
          </li>
          <li className={itemClass}>
            <span className={dotClass} style={{ background: "var(--accent)" }} />
            Tranquility of the Heart
          </li>
          <li className={itemClass}>
            <span className={dotClass} style={{ background: "var(--accent)" }} />
            Wealth and Good Health
          </li>
          <li className={itemClass}>
            <span className={dotClass} style={{ background: "var(--accent)" }} />
            Good Deeds and Rewards
          </li>
          <li className={itemClass}>
            <span className={dotClass} style={{ background: "var(--accent)" }} />
            Blessings in all Affairs
          </li>
          <li className={itemClass}>
            <span className={dotClass} style={{ background: "var(--accent)" }} />
            Means of Entering Jannah
          </li>
          <li className={itemClass}>
            <span className={dotClass} style={{ background: "var(--accent)" }} />
            Sins Forgiven and Erased
          </li>
          <li className={itemClass}>
            <span className={dotClass} style={{ background: "var(--accent)" }} />
            Contentment in all Affairs
          </li>
          <li className={itemClass}>
            <span className={dotClass} style={{ background: "var(--accent)" }} />
            Strengthening of the Body
          </li>
        </ul>
      </div>
      <div className={sectionClass}>
        <div className={headingClass} style={{ color: "var(--accent)" }}>
          <Shield size={14} strokeWidth={2.2} />
          PROTECTS YOU FROM
        </div>
        <ul className={listClass} style={{ color: "var(--muted-foreground)" }}>
          <li className={itemClass}>
            <span className={dotClass} style={{ background: "var(--accent)" }} />
            All types of Evil and Harm
          </li>
          <li className={itemClass}>
            <span className={dotClass} style={{ background: "var(--accent)" }} />
            The Shaytan and his Devils
          </li>
          <li className={itemClass}>
            <span className={dotClass} style={{ background: "var(--accent)" }} />
            The Hellfire
          </li>
          <li className={itemClass}>
            <span className={dotClass} style={{ background: "var(--accent)" }} />
            Depression, Anxiety &amp; Grief
          </li>
          <li className={itemClass}>
            <span className={dotClass} style={{ background: "var(--accent)" }} />
            Evil Eye &amp; Magic
          </li>
          <li className={itemClass}>
            <span className={dotClass} style={{ background: "var(--accent)" }} />
            Illnesses
          </li>
          <li className={itemClass}>
            <span className={dotClass} style={{ background: "var(--accent)" }} />
            Laziness &amp; Procrastination
          </li>
          <li className={itemClass}>
            <span className={dotClass} style={{ background: "var(--accent)" }} />
            Poverty
          </li>
          <li className={itemClass}>
            <span className={dotClass} style={{ background: "var(--accent)" }} />
            Disbelief
          </li>
          <li className={itemClass}>
            <span className={dotClass} style={{ background: "var(--accent)" }} />
            Evil Whispers
          </li>
        </ul>
      </div>
    </div>
  );
};

type Slide = {
  Icon: typeof BookOpen;
  label: string;
  title: string;
  body: string | React.ReactNode;
};

const SLIDES: Slide[] = [
  {
    Icon: BookOpen,
    label: "Welcome",
    title: "How Adhkar Benefits You",
    body: <BenefitsList />,
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
  const [notifStatus, setNotifStatus] = useState<
    "idle" | "granted" | "denied" | "unavailable" | "error"
  >("idle");
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

  const withTimeout = async <T,>(p: Promise<T>, ms: number): Promise<T | "timeout"> => {
    let t: ReturnType<typeof setTimeout>;
    return Promise.race([
      p,
      new Promise<"timeout">((res) => {
        t = setTimeout(() => res("timeout"), ms);
      }),
    ]).finally(() => clearTimeout(t!)) as Promise<T | "timeout">;
  };

  const enableReminders = async () => {
    setNotifBusy(true);
    try {
      if (!isNativePlatform()) {
        setNotifStatus("unavailable");
        return;
      }
      const raced = await withTimeout(requestNotificationPermission(), 12000);
      let granted = false;
      let reason: string | undefined;
      if (raced === "timeout") {
        // The native dialog may resolve late; fall back to reading the state.
        granted = await withTimeout(checkNotificationPermission(), 4000).then(
          (r) => r === true,
        );
        reason = granted ? undefined : "denied";
      } else if (raced.granted) {
        granted = true;
      } else {
        reason = raced.reason;
      }


      if (granted) {
        const prefs = getNotificationPrefs();
        const updated = {
          ...prefs,
          reminders: prefs.reminders.map((r) => ({ ...r, enabled: true })),
        };
        setNotificationPrefs(updated);
        setNotifStatus("granted");
        // Never block the UI on scheduling.
        void applyReminders(updated).catch(() => {});

      } else if (reason === "denied") {
        setNotifStatus("denied");
      } else {
        setNotifStatus("unavailable");
      }

    } catch {
      setNotifStatus("error");
    } finally {
      setNotifBusy(false);
    }
  };


  const notifMessage: Record<string, string> = {
    granted:
      "Reminders are on. Morning and evening, right on time. You can change the times in Settings.",
    denied:
      "Notifications are turned off for this app. You can allow them later in your device settings, then enable reminders in Settings.",
    unavailable:
      "Reminders are available in the mobile app. Everything else works right here.",
    error: "Something went wrong. You can try again from Settings at any time.",
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
  const slide = SLIDES[index];
  const Icon = slide.Icon;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-center"
      style={{
        background: "color-mix(in oklab, var(--background) 45%, transparent)",
        backdropFilter: "blur(6px) saturate(120%)",
        color: "var(--foreground)",
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Popup card, centered */}
      <div className="px-4">

        <div
          key={index}
          className="mx-auto w-full max-w-md rounded-[24px] p-5"
          style={{
            background: "color-mix(in oklab, var(--card) 88%, transparent)",
            border: "1px solid color-mix(in oklab, var(--border) 80%, transparent)",
            boxShadow: "0 18px 50px rgba(0,0,0,0.22)",
            backdropFilter: "blur(18px) saturate(140%)",
            color: "var(--foreground)",
            animation: "onb-pop 260ms ease-out",
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
              style={{
                background: "color-mix(in oklab, var(--accent) 18%, transparent)",
                color: "var(--accent)",
              }}
            >
              <Icon size={22} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="label-caps" style={{ color: "var(--accent)" }}>
                {slide.label}
              </div>
              <h2 className="mt-0.5 text-lg font-bold leading-tight">
                {slide.title}
              </h2>
            </div>
          </div>
          {typeof slide.body === "string" ? (
            <p
              className="mt-3 text-[14px] leading-relaxed"
              style={{ color: "var(--muted-foreground)" }}
            >
              {slide.body}
            </p>
          ) : (
            <div className="mt-2">{slide.body}</div>
          )}

          <div className="mt-4 max-h-[34vh] overflow-y-auto pr-1">

          {isLast ? (
            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={enableReminders}
                disabled={notifBusy || notifStatus === "granted"}
                className="w-full rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-70"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-foreground)",
                }}
              >
                {notifBusy
                  ? "Requesting permission..."
                  : notifStatus === "granted"
                    ? "Reminders enabled"
                    : notifStatus === "idle"
                      ? "Enable Reminders"
                      : "Try again"}
              </button>
              {notifStatus !== "idle" && !notifBusy && (
                <p
                  className="px-1 text-[13px] leading-snug"
                  style={{
                    color:
                      notifStatus === "granted"
                        ? "var(--accent)"
                        : "var(--muted-foreground)",
                  }}
                >
                  {notifMessage[notifStatus]}
                </p>
              )}
              <button
                type="button"
                onClick={finish}
                className="w-full rounded-full px-5 py-2.5 text-sm font-semibold"
                style={
                  notifStatus === "granted"
                    ? {
                        background: "color-mix(in oklab, var(--accent) 16%, transparent)",
                        color: "var(--foreground)",
                        border: "1px solid color-mix(in oklab, var(--accent) 45%, transparent)",
                      }
                    : { background: "transparent", color: "var(--foreground)" }
                }
              >
                {notifStatus === "idle"
                  ? "Maybe later"
                  : notifStatus === "granted"
                    ? "Continue to app"
                    : "Continue"}
              </button>

            </div>
          ) : (
            <button
              type="button"
              onClick={next}
              className="mt-4 w-full rounded-full px-5 py-3 text-sm font-semibold"
              style={{
                background: "var(--accent)",
                color: "var(--accent-foreground)",
              }}
            >
              Continue
            </button>
          )}

          <div className="mt-4 flex items-center justify-center gap-2">
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
        </div>

        <div className="mx-auto mt-4 flex w-full max-w-md items-center justify-center">
          <button
            type="button"
            onClick={finish}
            className="rounded-full px-4 py-2 text-xs font-semibold"
            style={{
              background: "color-mix(in oklab, var(--foreground) 8%, transparent)",
              color: "var(--foreground)",
            }}
          >
            Skip onboarding
          </button>
        </div>
      </div>


      <style>{`@keyframes onb-pop{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

