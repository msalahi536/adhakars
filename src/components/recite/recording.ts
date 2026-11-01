/** Ephemeral capture. The owner must discard the blob when its result closes. */
export function captureRecording(stream: MediaStream) {
  if (typeof MediaRecorder === "undefined") return null;
  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(stream);
  let pending: Promise<Blob | null> | null = null;
  recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  recorder.start(250);
  return {
    finish() {
      pending ??= new Promise<Blob | null>((resolve) => {
        if (recorder.state === "inactive") { resolve(null); return; }
        recorder.onstop = () => resolve(chunks.length ? new Blob(chunks, { type: recorder.mimeType }) : null);
        recorder.onerror = () => resolve(null);
        recorder.stop();
      });
      return pending;
    },
    discard() {
      recorder.ondataavailable = null; recorder.onstop = null;
      if (recorder.state !== "inactive") recorder.stop();
      chunks.length = 0;
    },
  };
}