import { useEffect, useState } from "react";

const UPDATE_VERSION = "v2-sleep-qibla";
const UPDATE_KEY = "updateSeen";

export function UpdatePopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const seen = window.localStorage.getItem(UPDATE_KEY);
      if (seen !== UPDATE_VERSION) setOpen(true);
    } catch {
      /* noop */
    }
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(UPDATE_KEY, UPDATE_VERSION);
    } catch {
      /* noop */
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-end justify-center px-4 pb-24 sm:items-center sm:pb-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={dismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-[24px] shadow-2xl"
        style={{
          background: "linear-gradient(155deg, #1f3d2b 0%, #2d5a3d 60%, #1a3325 100%)",
          color: "#ffffff",
        }}
      >
        <div className="px-6 pt-6">
          <div
            className="inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
            style={{ background: "#c9a84c", color: "#1f3d2b" }}
          >
            New Update
          </div>
          <h2 className="mt-3 text-2xl font-bold leading-tight">
            Sleep, Wake & Qibla — now built in ✨
          </h2>
          <p className="mt-2 text-sm opacity-90">
            A big update with new tabs, smoother cards, and a Qibla finder inside the app.
          </p>
        </div>

        <ul className="mt-5 space-y-3 px-6 text-sm">
          {[
            { emoji: "🌙", title: "Sleep & Wake Adhkar", desc: "Toggle between the two — 17 sleep adhkar + 7 wake adhkar, all sahih." },
            { emoji: "🧭", title: "Qibla Finder", desc: "Find the direction of the Ka'bah from anywhere." },
            { emoji: "🔄", title: "Restart on last card", desc: "Finish a set? Tap 'Start Over' or jump to the next set." },
            { emoji: "📖", title: "Physical sunnan cards", desc: "Every set now opens with the adab the Prophet ﷺ practiced." },
            { emoji: "🐛", title: "Card rendering fixes", desc: "Smoother scrolling and cleaner transitions." },
          ].map((f) => (
            <li key={f.title} className="flex items-start gap-3">
              <span className="mt-0.5 text-xl leading-none">{f.emoji}</span>
              <div>
                <div className="font-semibold">{f.title}</div>
                <div className="text-xs opacity-80">{f.desc}</div>
              </div>
            </li>
          ))}
        </ul>

        <div className="px-6 pb-6 pt-5">
          <button
            onClick={dismiss}
            className="w-full rounded-full py-3 text-sm font-bold transition-transform active:scale-[0.98]"
            style={{ background: "#c9a84c", color: "#1f3d2b" }}
          >
            Got it — JazakAllah khayr
          </button>
        </div>
      </div>
    </div>
  );
}
