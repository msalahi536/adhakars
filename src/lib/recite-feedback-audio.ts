// One gesture-unlocked output for delayed microphone and checker events.
export function createReciteFeedbackAudio(urls: Partial<Record<string, string>>, contextFactory: () => AudioContext) {
  let context: AudioContext | undefined;
  const buffers = new Map<string, Promise<AudioBuffer>>();
  const sources = new Set<AudioBufferSourceNode>();
  let generation = 0;
  let nextAt = 0;
  let queue = Promise.resolve();
  function load(url: string, ctx: AudioContext) {
    const cached = buffers.get(url);
    if (cached) return cached;
    const pending = fetch(url).then(response => {
      if (!response.ok) throw new Error("Feedback audio unavailable");
      return response.arrayBuffer();
    }).then(bytes => ctx.decodeAudioData(bytes)).catch(error => {
      buffers.delete(url);
      throw error;
    });
    buffers.set(url, pending);
    return pending;
  }
  function unlock() {
    try {
      context ??= contextFactory();
      const ctx = context;
      void ctx.resume().catch(() => undefined);
      for (const url of Object.values(urls)) if (url) void load(url, ctx).catch(() => undefined);
    } catch { /* Unsupported output must never block the mic. */ }
  }
  return {
    unlock,
    play(event: string) {
      const url = urls[event];
      if (!url) return;
      unlock();
      const ctx = context;
      if (!ctx) return;
      const token = generation;
      queue = queue.then(async () => {
        const buffer = await load(url, ctx);
        if (token !== generation) return;
        await ctx.resume();
        if (token !== generation) return;
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        gain.gain.value = 0.3;
        source.buffer = buffer;
        source.connect(gain); gain.connect(ctx.destination);
        sources.add(source);
        source.onended = () => { sources.delete(source); source.disconnect(); gain.disconnect(); };
        const at = Math.max(ctx.currentTime, nextAt);
        nextAt = at + buffer.duration;
        source.start(at);
      }).catch(() => undefined);
    },
    stop() {
      generation++; nextAt = 0; queue = Promise.resolve();
      for (const source of sources) source.stop();
      sources.clear();
    },
  };
}