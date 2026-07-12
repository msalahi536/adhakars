import { useEffect, useState } from "react";
import { useNavigate, createFileRoute } from "@tanstack/react-router";
import { Mail, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GirihStarPattern } from "@/components/HeaderPatterns";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — My Adhkar" }] }),
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted && data.user) {
        navigate({ to: "/my-adhkar", replace: true });
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        navigate({ to: "/my-adhkar", replace: true });
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo:
            typeof window !== "undefined" ? `${window.location.origin}/my-adhkar` : undefined,
        },
      });
      if (error) throw error;
      setStatus("sent");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not send the sign-in link.";
      setErrorMsg(message);
      setStatus("error");
    }
  };

  return (
    <>
      <header
        className="page-header relative overflow-hidden"
        style={{ background: "var(--grad-header)", color: "var(--header-fg)" }}
      >
        <GirihStarPattern />
        <button
          type="button"
          onClick={() => navigate({ to: "/more" })}
          aria-label="Back"
          className="absolute z-10 flex items-center justify-center rounded-full transition-transform active:scale-90"
          style={{
            top: "calc(env(safe-area-inset-top) + 10px)",
            left: 12,
            width: 36,
            height: 36,
            color: "currentColor",
            background: "color-mix(in oklab, currentColor 14%, transparent)",
            border: "none",
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div className="relative mx-auto max-w-md px-5 pb-5 pt-5" style={{ paddingLeft: 60, paddingRight: 60 }}>
          <div className="label-caps" style={{ color: "var(--header-sub)", opacity: 1 }}>
            My Adhkar
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Sign in</h1>
          <p className="mt-2 text-xs opacity-90">Save your own adhkar and sync across devices.</p>
        </div>
      </header>

      <main className="scroll-area">
        <div className="mx-auto max-w-md px-4 py-6">
          <form
            onSubmit={submit}
            className="rounded-[24px] p-5"
            style={{
              background: "var(--surface, var(--card))",
              border: "1px solid var(--border)",
              boxShadow: "var(--card-shadow, 0 4px 16px rgba(0,0,0,0.06))",
              color: "var(--foreground)",
            }}
          >
            <label className="label-caps mb-2 block" htmlFor="email-input">
              Email address
            </label>
            <input
              id="email-input"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              disabled={status === "sending"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-2xl px-4 py-3 text-[15px] outline-none"
              style={{
                background: "var(--background)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            />

            <button
              type="submit"
              disabled={status === "sending" || !email.trim()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-bold transition active:scale-[0.98] disabled:opacity-60"
              style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
            >
              <Mail size={16} />
              {status === "sending" ? "Sending…" : "Email me a sign-in link"}
            </button>

            {status === "sent" && (
              <p
                className="mt-4 rounded-xl px-3 py-2 text-xs"
                style={{
                  background: "color-mix(in oklab, var(--accent) 12%, transparent)",
                  color: "var(--foreground)",
                }}
              >
                Check <strong>{email.trim()}</strong> for a sign-in link. Open it on this device to
                continue.
              </p>
            )}
            {status === "error" && (
              <p
                className="mt-4 rounded-xl px-3 py-2 text-xs"
                style={{
                  background: "color-mix(in oklab, #d94b4b 15%, transparent)",
                  color: "#a11e1e",
                }}
              >
                {errorMsg}
              </p>
            )}

            <p className="mt-5 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
              No password needed. We'll send a one-tap sign-in link to your email.
            </p>
          </form>
        </div>
      </main>
    </>
  );
}
