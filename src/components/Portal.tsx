import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Renders children into document.body so overlays escape any transformed or
 * backdrop-filtered ancestor (iOS Safari makes those a containing block for
 * position: fixed, which pushes sheets behind page content).
 */
export const Portal = ({ children }: { children: ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || typeof document === "undefined") return null;
  return createPortal(children, document.body);
};
