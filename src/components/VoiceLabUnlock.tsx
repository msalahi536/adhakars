import { useRef } from "react";
import { useNavigate } from "@tanstack/react-router";

/** Version value that opens the hidden Voice Lab after 7 quick taps. */
export function VoiceLabUnlock({ version }: { version: string }) {
  const navigate = useNavigate();
  const taps = useRef<number[]>([]);
  const onTap = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 3000), now];
    if (taps.current.length >= 7) { taps.current = []; void navigate({ to: "/app/voice-lab" }); }
  };
  return <span onClick={onTap} className="select-none text-sm opacity-70">{version}</span>;
}
