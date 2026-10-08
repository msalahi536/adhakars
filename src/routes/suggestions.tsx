import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { listSuggestions, type SuggestionRow } from "@/lib/suggestions.functions";

export const Route = createFileRoute("/suggestions")({
  head: () => ({
    meta: [
      { title: "Suggestions, Sahih Al-Adhkar" },
      { name: "description", content: "Private suggestions inbox for Sahih Al-Adhkar." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Suggestions, Sahih Al-Adhkar" },
      { property: "og:description", content: "Private suggestions inbox." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SuggestionsPage,
});

function SuggestionsPage() {
  const load = useServerFn(listSuggestions);
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [items, setItems] = useState<SuggestionRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const unlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(false);
    try {
      const res = await load({ data: { password } });
      if (res.ok) {
        setItems(res.items);
        setUnlocked(true);
      } else setError(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  if (!unlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5efe3] p-6">
        <form onSubmit={unlock} className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-sm">
          <h1 className="mb-4 text-xl font-semibold text-[#3c5438]">Suggestions</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="Password"
            className="mb-3 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
            style={{ fontSize: 16 }}
          />
          {error && <p className="mb-3 text-sm text-red-600">Incorrect password</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-[#70815d] py-3 font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Checking…" : "Enter"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5efe3] p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-1 text-2xl font-semibold text-[#3c5438]">Suggestions</h1>
        <p className="mb-5 text-sm text-black/60">{items.length} total</p>
        {items.length === 0 && <p className="text-sm text-black/60">Nothing yet.</p>}
        <ul className="space-y-3">
          {items.map((s) => (
            <li key={s.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-1 flex items-center justify-between text-xs text-black/50">
                <span className="rounded-full bg-[#70815d]/10 px-2 py-0.5 font-semibold text-[#3c5438]">
                  {s.kind}
                </span>
                <span>{new Date(s.created_at).toLocaleString()}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-black/80">{s.body}</p>
              {s.contact && <p className="mt-2 text-xs text-black/50">{s.contact}</p>}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
