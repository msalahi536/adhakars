import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitSuggestion } from "@/lib/suggestions.functions";
import { Portal } from "@/components/Portal";

export function SuggestColorSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const send = useServerFn(submitSuggestion);
  const [body, setBody] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const close = () => {
    setBody("");
    setContact("");
    setDone(false);
    setError(null);
    onClose();
  };

  const submit = async () => {
    if (!body.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await send({ data: { kind: "color", body: body.trim(), contact: contact.trim() || null } });
      if (res.ok) setDone(true);
      else setError("Could not send. Try again.");
    } catch {
      setError("Could not send. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Portal>
    <div
      className="fixed inset-0 flex items-end justify-center"
      style={{ zIndex: 200, background: "rgba(28,32,24,0.38)", backdropFilter: "blur(8px)" }}
      onClick={close}
    >
      <div
        className="w-full max-w-md rounded-t-3xl p-5"
        style={{
          background: "var(--surface-card)",
          color: "var(--foreground)",
          paddingBottom: "calc(28px + env(safe-area-inset-bottom))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="label-caps mb-2 opacity-70">Suggest a colour</div>
        {done ? (
          <>
            <p className="mb-4 text-sm opacity-80">
              Jazakum Allahu khayran, your suggestion was sent.
            </p>
            <button
              onClick={close}
              className="w-full rounded-full py-3 text-sm font-semibold"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              Done
            </button>
          </>
        ) : (
          <>
            <p className="mb-3 text-sm opacity-80">
              Tell us the colour or theme you'd like to see added.
            </p>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="e.g. a warm desert sunset theme"
              className="mb-3 w-full rounded-2xl p-3 text-base outline-none"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
                fontSize: 16,
              }}
            />
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Email (optional)"
              className="mb-3 w-full rounded-2xl px-3 py-3 outline-none"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
                fontSize: 16,
              }}
            />
            {error && <p className="mb-2 text-xs" style={{ color: "#c0392b" }}>{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={close}
                className="flex-1 rounded-full py-3 text-sm font-semibold"
                style={{ background: "var(--muted)", color: "var(--foreground)" }}
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={busy || !body.trim()}
                className="flex-1 rounded-full py-3 text-sm font-semibold disabled:opacity-50"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                {busy ? "Sending…" : "Send"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
    </Portal>
  );
}
