import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Bell, BookOpen, Check, ChevronRight, Compass, Hand, HeartHandshake, Moon, Settings, ShieldCheck, Sunrise, Volume2, CalendarHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Portal } from "@/components/Portal";
import { GuidedTour } from "@/components/GuidedTour";
import morningScreen from "@/assets/experience-morning.png.asset.json";
import themeScreens from "@/assets/themes-phones.png.asset.json";
import { requestNotificationPermission, checkNotificationPermission, isNativePlatform, getNotificationPrefs, setNotificationPrefs, applyReminders } from "@/lib/notifications";

const FLAG_KEY = "adhkar:onboarded";
export const hasOnboarded = (): boolean => {
  if (typeof window === "undefined") return true;
  try { return localStorage.getItem(FLAG_KEY) === "1"; } catch { return true; }
};
const STEPS = [
  { label: "Welcome", title: "Sahih Al-Adhkar", body: "A quick look around your daily adhkar, prayer times, and settings." },
  { label: "Your daily remembrance", title: "Read. Listen. Remember.", body: "Swipe between adhkar and tap the counter as you recite. Use the speaker to listen, and open the source for the reference." },
  { label: "Explore More", title: "More for every part of life", body: "Salah brings prayer times and after-salah adhkar; Tasbih keeps your count. Open More for your library and companions." },
  { label: "Make it yours", title: "Find your focus", body: "Open Settings, then Appearance → Theme to choose your colors. Display style lets you follow each page, or keep morning or evening throughout." },
  { label: "At your own pace", title: "A gentle reminder", body: "Allow notifications for daily reminders. Choose your times in Settings, and your prayer alerts and reciters in Salah → Adhan Settings." },
];
const TOOLS = [
  { Icon: BookOpen, name: "Dua Library", detail: "50 authentic duas" },
  { Icon: Moon, name: "Sleep & Wake", detail: "End and begin your day" },
  { Icon: Compass, name: "Qibla", detail: "Find your direction" },
  { Icon: ShieldCheck, name: "Ruqyah", detail: "Protection & guidance" },
  { Icon: CalendarHeart, name: "Period", detail: "Your cycle companion" },
  { Icon: HeartHandshake, name: "Hajj & Umrah", detail: "Guidance for your journey" },
];

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [touring, setTouring] = useState(false);
  const [notifBusy, setNotifBusy] = useState(false);
  const [notifStatus, setNotifStatus] = useState<"idle" | "granted" | "denied" | "unavailable" | "error">("idle");
  const [native, setNative] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const finish = () => {
    try { localStorage.setItem(FLAG_KEY, "1"); } catch { /* Storage can be unavailable. */ }
    onDone();
  };
  const goTo = (i: number) => setIndex(Math.max(0, Math.min(STEPS.length - 1, i)));
  const finishTo = () => { finish(); };
  const next = () => index === STEPS.length - 1 ? finishTo() : index === 0 ? setTouring(true) : goTo(index + 1);
  useEffect(() => {
    setNative(isNativePlatform());
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => dialogRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);
  useEffect(() => { dialogRef.current?.querySelector(".onboarding-content")?.scrollTo(0, 0); }, [index]);
  const withTimeout = async <T,>(promise: Promise<T>, ms: number): Promise<T | "timeout"> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try { return await Promise.race([promise, new Promise<"timeout">((resolve) => { timer = setTimeout(() => resolve("timeout"), ms); })]); }
    finally { if (timer !== undefined) clearTimeout(timer); }
  };
  const enableReminders = async () => {
    setNotifBusy(true);
    try {
      if (!isNativePlatform()) { setNotifStatus("unavailable"); return; }
      const result = await withTimeout(requestNotificationPermission(), 12000);
      const granted = result === "timeout" ? (await withTimeout(checkNotificationPermission(), 4000)) === true : result.granted;
      if (granted) {
        const prefs = getNotificationPrefs();
        const updated = { ...prefs, reminders: prefs.reminders.map((r) => ({ ...r, enabled: true })) };
        setNotificationPrefs(updated);
        setNotifStatus("granted");
        void applyReminders(updated).catch(() => {});
      } else setNotifStatus(result === "timeout" || (result.granted === false && result.reason === "denied") ? "denied" : "unavailable");
    } catch { setNotifStatus("error"); }
    finally { setNotifBusy(false); }
  };
  const messages = {
    idle: native ? "Optional. You can change your choices at any time." : "Device reminders are available in the mobile app. You can start using everything else here.",
    granted: "Reminders are enabled. You can adjust them in Settings.",
    denied: "Notifications are off. Allow them in your device settings whenever you're ready.",
    unavailable: "Device reminders are available in the mobile app.",
    error: "Couldn't enable reminders. You can try again in Settings.",
  };
  const step = STEPS[index];
  if (touring) return <GuidedTour onSkip={finish} onDone={() => { setTouring(false); setIndex(4); }} />;
  return (
    <Portal>
      <div className="onboarding-overlay">
        <div ref={dialogRef} className={`onboarding-panel${index === 0 ? " onboarding-welcome" : ""}`} role="dialog" aria-modal="true" aria-labelledby="onboarding-title" tabIndex={-1}
          onKeyDown={(event) => {
            if (event.key === "Escape") { event.preventDefault(); finish(); }

            if (event.key === "Tab") {
              const controls = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex="0"]') ?? []);
              const first = controls[0]; const last = controls[controls.length - 1];
              if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last?.focus(); }
              else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
            }
          }}>
          <div className="onboarding-progress" aria-label={`Step ${index + 1} of ${STEPS.length}`}>
            {[0, 1, 2].map((i) => <span key={i} data-complete={i <= (index === 0 ? 0 : 2)} />)}
          </div>
          <div className="onboarding-content" onTouchStart={(e) => { start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
            onTouchEnd={(e) => {
              const origin = start.current; start.current = null;
              if (!origin || !e.changedTouches[0]) return;
              const dx = e.changedTouches[0].clientX - origin.x; const dy = e.changedTouches[0].clientY - origin.y;
              if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.5 && dx < 0 && index === 0) setTouring(true);
            }}>
            <div key={index} className="onboarding-step">
              {index !== 0 && <div className={`onboarding-visual onboarding-visual-${index}`}>
                {index === 1 && <><img className="onboarding-reading-screen" src={morningScreen.url} alt="Morning Adhkar with Arabic, translation, and a counter" /><div className="onboarding-reading-tools"><Volume2 /><span>Listen</span><Hand /><span>Count</span></div></>}
                {index === 2 && <div className="onboarding-tools">{TOOLS.map(({ Icon, name, detail }) => <div key={name}><Icon /><strong>{name}</strong><span>{detail}</span></div>)}</div>}
                {index === 3 && <><img className="onboarding-theme-screens" src={themeScreens.url} alt="Ocean, Rose, Midnight, and Sand app theme previews" /><div className="onboarding-path"><Settings size={14} /><span>Settings</span><ChevronRight size={12} /><span>Appearance</span><ChevronRight size={12} /><span>Theme</span></div></>}
                {index === 4 && <div className="onboarding-reminder"><Bell size={34} /><div><Sunrise /><span>Morning Adhkar</span><Check /></div><div><Moon /><span>Evening Adhkar</span><Check /></div></div>}
              </div>}
              <div className="onboarding-copy" aria-live="polite" aria-atomic="true"><p className="onboarding-eyebrow">{step.label}</p><h2 id="onboarding-title">{step.title}</h2><p>{step.body}</p></div>
              {index === 0 && <p className="onboarding-assurance"><ShieldCheck size={14} /> Authentic sources · Free · No accounts</p>}
              {index === 4 && <p className="onboarding-status" role="status">{messages[notifStatus]}</p>}
            </div>
          </div>
          <div className="onboarding-actions">
            <Button className="onboarding-primary" disabled={notifBusy} onClick={index === 4 && native && notifStatus !== "granted" ? enableReminders : next}>
              {notifBusy ? "Requesting permission…" : index === 0 ? "Show me around" : index !== 4 ? "Continue" : native && notifStatus !== "granted" ? notifStatus === "idle" ? "Enable reminders" : "Try again" : "Start my day"}
              {!notifBusy && (index === 4 && native && notifStatus !== "granted" ? <Bell /> : <ArrowRight />)}
            </Button>
            <div className="onboarding-secondary"><Button variant="ghost" className="onboarding-text-button" disabled={index === 0} onClick={() => index === 4 ? setTouring(true) : goTo(index - 1)}><ArrowLeft />Back</Button><span>{index === 0 ? 1 : 3} / 3</span><Button variant="ghost" className="onboarding-text-button" onClick={finish}>{index === 4 ? "Not now" : "Skip tour"}</Button></div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
