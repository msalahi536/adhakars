import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

export type HifzEvent = "reveal" | "wrong" | "skip" | "small" | "unsure" | "drift" | "ayahComplete" | "pageComplete" | "sessionComplete" | "milestone" | "micStart" | "micStop" | "pageTurn";
type Step = "selection" | "Light" | "Medium" | "Heavy" | "Success";
export const PATTERNS: Record<HifzEvent, { steps: Step[]; gap: number }> = {
  reveal: { steps: ["selection"], gap: 70 }, wrong: { steps: ["Heavy", "Heavy"], gap: 70 },
  skip: { steps: ["Heavy", "Light"], gap: 70 }, small: { steps: ["Medium"], gap: 70 }, unsure: { steps: ["Light"], gap: 70 },
  drift: { steps: ["Heavy", "Heavy", "Heavy"], gap: 60 }, ayahComplete: { steps: ["Light", "Medium"], gap: 90 },
  pageComplete: { steps: ["Success"], gap: 70 }, sessionComplete: { steps: ["Success", "Heavy"], gap: 300 },
  milestone: { steps: ["Light", "Medium", "Heavy", "Success"], gap: 110 },
  micStart: { steps: ["Medium"], gap: 70 }, micStop: { steps: ["Light"], gap: 70 }, pageTurn: { steps: ["selection"], gap: 70 },
};
const priority: Partial<Record<HifzEvent, number>> = { wrong: 5, skip: 4, drift: 3, small: 2, unsure: 1 };
type Timer = ReturnType<typeof setTimeout>;
type Driver = {
  now: () => number; schedule: (fn: () => void, delay: number) => Timer; clear: (id: Timer) => void;
  available: () => boolean; step: (step: Step) => Promise<void>;
  pulse: (event: HifzEvent) => void; sound: (event: HifzEvent) => void; stopSound: () => void;
};
// Injectable clock/device driver tests the patterns without requiring native hardware.
export function createHifzFeedback(driver: Driver) {
  let settings = { haptics: true, sounds: false };
  let timers: Timer[] = [];
  let batch: Timer | undefined;
  let pending: HifzEvent | undefined;
  let lastMistake = -Infinity;
  let generation = 0;
  const cancelPattern = () => { generation++; timers.forEach(driver.clear); timers = []; driver.stopSound(); };
  const start = (event: HifzEvent) => {
    cancelPattern();
    if (settings.sounds) driver.sound(event);
    if (!settings.haptics) return;
    if (!driver.available()) { driver.pulse(event); return; }
    const token = generation;
    let failed = false;
    const step = (value: Step) => {
      if (token !== generation || failed) return;
      void driver.step(value).catch(() => {
        if (token !== generation || failed) return;
        failed = true; timers.forEach(driver.clear); timers = []; driver.pulse(event);
      });
    };
    const pattern = PATTERNS[event];
    pattern.steps.forEach((value, index) => {
      if (index === 0) step(value);
      else timers.push(driver.schedule(() => step(value), index * pattern.gap));
    });
  };
  const cancel = () => {
    cancelPattern();
    if (batch !== undefined) driver.clear(batch);
    batch = undefined; pending = undefined;
  };
  return {
    configure(value: Partial<typeof settings>) { settings = { ...settings, ...value }; cancel(); },
    cancel,
    play(event: HifzEvent) {
      const rank = priority[event];
      if (rank !== undefined) {
        if (driver.now() - lastMistake < 1500) return;
        if (!pending || rank > (priority[pending] ?? 0)) pending = event;
        if (batch === undefined) batch = driver.schedule(() => {
          const winner = pending;
          batch = undefined; pending = undefined;
          if (winner) { lastMistake = driver.now(); start(winner); }
        }, 0);
        return;
      }
      cancel(); start(event);
    },
  };
}
let effectAudio: HTMLAudioElement | undefined;
const feedback = createHifzFeedback({
  now: () => Date.now(), schedule: (fn, delay) => setTimeout(fn, delay), clear: (id) => clearTimeout(id),
  available: () => {
    if (typeof navigator === "undefined" || !Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable("Haptics")) return false;
    return !(/iPad/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1));
  },
  step: (step) => step === "selection" ? Haptics.selectionChanged() : step === "Success" ? Haptics.notification({ type: NotificationType.Success }) : Haptics.impact({ style: ImpactStyle[step] }),
  pulse: (event) => { if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("hifz:feedback-pulse", { detail: event })); },
  sound: (event) => {
    if (typeof Audio === "undefined") return;
    effectAudio = new Audio(`/sounds/${event}.wav`); effectAudio.volume = 0.3;
    void effectAudio.play().catch(() => { /* Feedback must never interrupt recitation. */ });
  },
  stopSound: () => { effectAudio?.pause(); effectAudio = undefined; },
});
export const play = feedback.play;
export const configureHifzFeedback = feedback.configure;
export const cancelHifzFeedback = feedback.cancel;
