/** Ephemeral capture. The owner must discard the blob when its result closes. */
export function captureRecording(stream: MediaStream) {
  if (typeof MediaRecorder === "undefined") return null;
  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(stream);
  let pending: Promise<Blob | null> | null = null;
  let resolvePending: ((blob: Blob | null) => void) | null = null;
  let discarded = false;
  const settle = (blob: Blob | null) => {
    resolvePending?.(blob); resolvePending = null;
    recorder.onstop = null; recorder.onerror = null; recorder.ondataavailable = null;
    chunks.length = 0;
  };
  recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  recorder.start(250);
  return {
    finish() {
      pending ??= new Promise<Blob | null>((resolve) => {
        resolvePending = resolve;
        if (discarded || recorder.state === "inactive") { settle(null); return; }
        recorder.onstop = () => settle(chunks.length ? new Blob(chunks, { type: recorder.mimeType }) : null);
        recorder.onerror = () => { if (recorder.state !== "inactive") recorder.stop(); settle(null); };
        recorder.stop();
      });
      return pending;
    },
    discard() {
      discarded = true; settle(null);
      if (recorder.state !== "inactive") recorder.stop();
    },
  };
}