import { useEffect, useState } from "react";

export const HIFZ_BETA_KEY = "hifz_beta";
const CHANGE_EVENT = "hifz-beta-change";
export function setHifzBeta(enabled: boolean, storage?: Pick<Storage, "setItem">) {
  try { (storage ?? window.localStorage).setItem(HIFZ_BETA_KEY, enabled ? "1" : "0"); if (!storage) window.dispatchEvent(new Event(CHANGE_EVENT)); return true; } catch { return false; }
}
export function joinHifzBeta(code: string, storage?: Pick<Storage, "setItem">) {
  return code.trim().toUpperCase() === "HIFZBETA" && setHifzBeta(true, storage);
}
export function readHifzBeta(storage?: Pick<Storage, "getItem">): boolean {
  try { return (storage ?? window.localStorage).getItem(HIFZ_BETA_KEY) === "1"; }
  catch { return false; }
}
export function toggleHifzBeta(storage?: Pick<Storage, "getItem" | "setItem">): boolean {
  try {
    const target = storage ?? window.localStorage;
    const enabled = !readHifzBeta(target);
    target.setItem(HIFZ_BETA_KEY, enabled ? "1" : "0");
    if (!storage) window.dispatchEvent(new Event(CHANGE_EVENT));
    return enabled;
  } catch { return false; }
}
export function createHifzBetaTapCounter(toggle: () => void) {
  let count = 0;
  return () => { count++; if (count === 7) { count = 0; toggle(); } };
}
export function useHifzBeta() {
  const [enabled, setEnabled] = useState(false);
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    const sync = () => { setEnabled(readHifzBeta()); setChecked(true); };
    sync();
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(CHANGE_EVENT, sync); window.removeEventListener("storage", sync); };
  }, []);
  return { enabled, checked };
}