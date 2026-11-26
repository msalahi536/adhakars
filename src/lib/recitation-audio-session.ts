import { Capacitor, registerPlugin } from "@capacitor/core";
import { useEffect } from "react";

interface AudioDriver { begin: () => Promise<void>; end: () => Promise<void> }
const native = registerPlugin<AudioDriver>("RecitationAudio");
type BrowserSession = { type: string };
let savedBrowserType: string | undefined;
function browserSession(): BrowserSession | undefined {
  return typeof navigator === "undefined" ? undefined : (navigator as Navigator & { audioSession?: BrowserSession }).audioSession;
}
const driver: AudioDriver = {
  async begin() {
    if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("RecitationAudio")) {
      await native.begin(); return;
    }
    const audio = browserSession();
    if (audio) { savedBrowserType = audio.type; try { audio.type = "play-and-record"; } catch { /* Unsupported Safari version. */ } }
  },
  async end() {
    if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("RecitationAudio")) {
      await native.end(); return;
    }
    const audio = browserSession();
    if (audio && savedBrowserType !== undefined && audio.type === "play-and-record") {
      try { audio.type = savedBrowserType; } catch { /* Browser controls routing. */ }
    }
    savedBrowserType = undefined;
  },
};

/** Serialized leases prevent page restarts and multiple mic views restoring each other's session. */
export function createRecitationAudioSession(audio: AudioDriver) {
  const owners = new Set<symbol>();
  let applied = false;
  let queue = Promise.resolve();
  const reconcile = () => {
    queue = queue.then(async () => {
      if (owners.size && !applied) { await audio.begin(); applied = true; }
      else if (!owners.size && applied) { await audio.end(); applied = false; }
    }).catch(() => undefined); // Audio routing must not block microphone access on old binaries.
    return queue;
  };
  return {
    async acquire() {
      const owner = Symbol(); owners.add(owner);
      await reconcile();
      return () => { owners.delete(owner); return reconcile(); };
    },
    clear() { owners.clear(); return reconcile(); },
  };
}
const session = createRecitationAudioSession(driver);
export async function withRecitationAudioSession<T>(action: () => Promise<T>): Promise<T> {
  const release = await session.acquire();
  try { return await action(); } finally { await release(); }
}
export function useRecitationAudioSession(active: boolean, stream: MediaStream | null = null) {
  useEffect(() => {
    if (!active) return;
    let disposed = false;
    let release: (() => Promise<void>) | undefined;
    void session.acquire().then(stop => { if (disposed) void stop(); else release = stop; });
    const end = () => { disposed = true; void release?.(); };
    const ended = () => { if (stream && !stream.getAudioTracks().some(t => t.readyState === "live")) end(); };
    const tracks = stream?.getAudioTracks() ?? [];
    tracks.forEach(t => t.addEventListener("ended", ended));
    window.addEventListener("pagehide", end);
    return () => { end(); tracks.forEach(t => t.removeEventListener("ended", ended)); window.removeEventListener("pagehide", end); };
  }, [active, stream]);
}
