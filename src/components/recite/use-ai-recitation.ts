import { useEffect, useRef, useState } from "react";
import type { ListenSession, CheckResult } from "@/lib/hifz-ai";
import { checkerDownloaded } from "@/lib/hifz-ai/assets";
import { play as feedback } from "@/lib/hifzHaptics";
import { mapAiWords, newMistakes } from "./ai-feedback";

export type AiRange = { sura: number; first: number; last: number };
function friendlyError(error: unknown) {
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "Microphone access is off. Allow it in your browser or phone settings, then retry.";
  if (name === "NotFoundError") return "We couldn’t find a microphone. Connect one, then retry.";
  return "The recitation checker couldn’t start or finish. Check your connection for the download, then retry.";
}
export function useAiRecitation(page: number, enabled: boolean, keys: string[]) {
  const [phase, setPhase] = useState<"idle" | "download" | "loading" | "listening" | "stopping" | "finished" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState("");
  const session = useRef<ListenSession | null>(null);
  const cleanup = useRef<Promise<unknown>>(Promise.resolve());
  const generation = useRef(0);
  const starting = useRef(false);
  const previous = useRef<ReturnType<typeof mapAiWords>["statuses"]>({});
  const pendingRange = useRef<AiRange[] | null>(null);
  const capture = useRef<MediaStream | null>(null);
  const wordKeys = useRef(keys); wordKeys.current = keys;
  useEffect(() => {
    setPhase("idle"); setResult(null); setError(""); previous.current = {};
    return () => {
      generation.current++;
      capture.current?.getTracks().forEach((t) => t.stop()); capture.current = null;
      const current = session.current; session.current = null;
      current?.stream.getTracks().forEach((t) => t.stop());
      if (current) cleanup.current = current.stop().catch(() => undefined);
      setStream(null);
    };
  }, [page, enabled]);
  const receive = (value: CheckResult) => {
    const { statuses } = mapAiWords(value, wordKeys.current);
    for (const event of newMistakes(previous.current, statuses)) feedback(event);
    previous.current = statuses; setResult(value);
  };
  async function begin(ranges: AiRange[]) {
    if (starting.current || session.current) return;
    starting.current = true;
    const id = generation.current;
    setPhase("loading"); setError(""); setProgress(0); setResult(null); previous.current = {};
    try {
      // Ask from the user's start/consent gesture, before model preparation.
      const mic = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: false, noiseSuppression: true, autoGainControl: true } });
      if (id !== generation.current) { mic.getTracks().forEach((t) => t.stop()); return; }
      capture.current = mic;
      await cleanup.current;
      if (id !== generation.current) return;
      const ai = await import("@/lib/hifz-ai");
      await ai.prepareChecker((p) => { if (id === generation.current) setProgress(p); });
      if (id !== generation.current) return;
      const range = ranges[0];
      if (!range) throw new Error("No passage selected");
      const current = await ai.startListening({ ...range, passages: ranges, stream: mic,
        onProgress: setProgress,
        onUpdate: (value) => { if (id === generation.current) receive(value); },
        onError: (error) => { if (id === generation.current) { capture.current?.getTracks().forEach((t) => t.stop()); capture.current = null; session.current = null; setStream(null); setError(friendlyError(error)); setPhase("error"); } },
      });
      if (id !== generation.current) { await current.stop(); return; }
      session.current = current; setStream(current.stream); setPhase("listening"); feedback("micStart");
    } catch (error) {
      if (id === generation.current) { capture.current?.getTracks().forEach((t) => t.stop()); capture.current = null; }
      if (id === generation.current) { setError(friendlyError(error)); setPhase("error"); }
    } finally { starting.current = false; }
  }
  async function request(range: AiRange | AiRange[]) {
    const ranges = Array.isArray(range) ? range : [range];
    pendingRange.current = ranges;
    if (await checkerDownloaded()) await begin(ranges);
    else setPhase("download");
  }
  async function stop() {
    const current = session.current;
    if (!current) return;
    const id = generation.current;
    session.current = null; setPhase("stopping"); setStream(null); feedback("micStop");
    try {
      const finalizing = current.stop();
      cleanup.current = finalizing.catch(() => undefined);
      const final = await finalizing;
      capture.current = null;
      if (id === generation.current) { receive(final); setPhase("finished"); }
    } catch (error) {
      if (id === generation.current) { setError(friendlyError(error)); setPhase("error"); }
    }
  }
  return { phase, progress, stream, result, error, request, stop,
    reset: () => { setResult(null); setPhase("idle"); previous.current = {}; },
    confirm: () => pendingRange.current ? begin(pendingRange.current) : Promise.resolve(),
    cancel: () => setPhase("idle"),
  };
}