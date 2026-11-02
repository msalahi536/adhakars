import { useEffect, useState } from "react";

export const QURAN_V2_KEY = "quran_v2";
const EVENT = "quran-v2-change";
export function readQuranV2(storage?: Pick<Storage, "getItem">) {
  try { return (storage ?? window.localStorage).getItem(QURAN_V2_KEY) === "1"; } catch { return false; }
}
export function toggleQuranV2(storage?: Pick<Storage, "getItem" | "setItem">) {
  try {
    const target = storage ?? window.localStorage;
    const enabled = !readQuranV2(target);
    target.setItem(QURAN_V2_KEY, enabled ? "1" : "0");
    if (!storage) window.dispatchEvent(new Event(EVENT));
    return enabled;
  } catch { return false; }
}
/** A pause starts a fresh sequence; seven and ten remain part of the same sequence. */
export function createVersionTapCounter(hifz: () => void, quran: () => void, now = () => Date.now()) {
  let count = 0, previous = 0;
  return () => {
    const time = now();
    if (time - previous > 1800) count = 0;
    previous = time;
    count++;
    if (count === 7) hifz();
    if (count === 10) { quran(); count = 0; }
  };
}
export function useQuranV2() {
  const [enabled, setEnabled] = useState(false);
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    const sync = () => { setEnabled(readQuranV2()); setChecked(true); };
    sync(); window.addEventListener(EVENT, sync); window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVENT, sync); window.removeEventListener("storage", sync); };
  }, []);
  return { enabled, checked };
}