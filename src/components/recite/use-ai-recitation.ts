import { useEffect, useRef, useState } from "react";
import type { ListenSession, CheckResult } from "@/lib/hifz-ai";
import { checkerDownloaded } from "@/lib/hifz-ai/assets";
import { play as feedback } from "@/lib/hifzHaptics";
import { mapAiWords, newMistakes } from "./ai-feedback";
import { captureRecording } from "./recording";

export type AiRange = { sura: number; first: number; last: number };
function friendlyError(error: unknown) {
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "Microphone access is off. Allow it in your browser or phone settings, then retry.";
  if (name === "NotFoundError") return "We couldn’t find a microphone. Connect one, then retry.";
  return "The recitation checker couldn’t start or finish. Check your connection for the download, then retry.";
}
export function useAiRecitation(page: number, enabled: boolean, keys: string[], retainStream = false) {
  const [phase, setPhase] = useState<"idle" | "download" | "loading" | "listening" | "stopping" | "finished" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState("");
  const [recording, setRecording] = useState<Blob | null>(null);
  const recorder = useRef<ReturnType<typeof captureRecording>>(null);
  const keep = useRef(retainStream); keep.current = retainStream;
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
      recorder.current?.discard(); recorder.current = null;
      if (keep.current) return;
      capture.current?.getTracks().forEach((t) => t.stop()); capture.current = null;
      const current = session.current; session.current = null;
      current?.stream.getTracks().forEach((t) => t.stop());
      if (current) cleanup.current = current.stop().catch(() => undefined);
      setStream(null);
    };
  }, [page, enabled]);
  useEffect(() => () => {
    generation.current++;
    recorder.current?.discard();
    capture.current?.getTracks().forEach((t) => t.stop());
    const current = session.current; session.current = null;
    if (current) void current.stop().catch(() => undefined);
  }, []);
  const receive = (value: CheckResult) => {
    const { statuses } = mapAiWords(value, wordKeys.current);
    for (const event of newMistakes(previous.current, statuses)) feedback(event);
    previous.current = statuses; setResult(value);
  };
  async function begin(ranges: AiRange[]) {
    if (starting.current || session.current) return;
    starting.current = true;
    const id = generation.current;
    setPhase("loading"); setError(""); setProgress(0); setResult(null); setRecording(null); previous.current = {};
    try {
      // Ask from the user's start/consent gesture, before model preparation.
      const mic = capture.current?.getAudioTracks().some((t) => t.readyState === "live") ? capture.current : await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: false, noiseSuppression: true, autoGainControl: true } });
      if (id !== generation.current) { mic.getTracks().forEach((t) => t.stop()); return; }
      capture.current = mic;
      mic.getAudioTracks().forEach((t) => { t.enabled = true; });
      await cleanup.current;
      if (id !== generation.current) return;
      const ai = await import("@/lib/hifz-ai");
      await ai.prepareChecker((p) => { if (id === generation.current) setProgress(p); });
      if (id !== generation.current) return;
      const range = ranges[0];
      if (!range) throw new Error("No passage selected");
      // A cloned track lets the engine stop its session without killing our retained mic.
      const engineStream = keep.current ? mic.clone() : mic;
      try { recorder.current = captureRecording(mic); } catch { recorder.current = null; }
      const current = await ai.startListening({ ...range, passages: ranges, stream: engineStream,
        onProgress: setProgress,
        onUpdate: (value) => { if (id === generation.current) receive(value); },
        onError: (error) => { if (id === generation.current) { capture.current?.getTracks().forEach((t) => t.stop()); capture.current = null; session.current = null; setStream(null); setError(friendlyError(error)); setPhase("error"); } },
      });
      if (id !== generation.current) { await current.stop(); return; }
      session.current = current; setStream(mic); setPhase("listening"); feedback("micStart");
    } catch (error) {
      recorder.current?.discard(); recorder.current = null;
      if (id === generation.current) { capture.current?.getTracks().forEach((t) => t.stop()); capture.current = null; }
      if (id === generation.current) { setError(friendlyError(error)); setPhase("error"); }
    } finally { starting.current = false; }
  }
  async function request(range: AiRange | AiRange[]) {
    const ranges = Array.isArray(range) ? range : [range];
    pendingRange.current = ranges;
    if (await checkerDownloaded()) { await begin(ranges); return "started" as const; }
    setPhase("download"); return "download" as const;
  }
  async function stop() {
    const current = session.current;
    if (!current) return;
    const id = generation.current;
    session.current = null; setPhase("stopping"); setStream(null); feedback("micStop");
    try {
      const recordingDone = recorder.current?.finish() ?? Promise.resolve(null);
      recorder.current = null;
      const finalizing = current.stop();
      cleanup.current = finalizing.catch(() => undefined);
      const final = await finalizing;
      const blob = await recordingDone;
      if (!keep.current) capture.current = null;
      if (id === generation.current) { setRecording(blob); receive(final); setPhase("finished"); }
      return final;
    } catch (error) {
      if (id === generation.current) { setError(friendlyError(error)); setPhase("error"); }
    }
  }
  return { phase, progress, stream, result, error, recording, request, stop,
    pauseStream: () => capture.current?.getAudioTracks().forEach((t) => { t.enabled = false; }),
    discardRecording: () => setRecording(null),
    reset: () => { setRecording(null); setResult(null); setPhase("idle"); previous.current = {}; },
    confirm: () => pendingRange.current ? begin(pendingRange.current) : Promise.resolve(),
    cancel: () => {
      generation.current++;
      recorder.current?.discard(); recorder.current = null; setRecording(null);
      capture.current?.getTracks().forEach((t) => t.stop()); capture.current = null;
      const current = session.current; session.current = null;
      if (current) cleanup.current = current.stop().catch(() => undefined);
      setStream(null); setResult(null); setPhase("idle");
    },
  };
}