import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import logoAsset from "@/assets/logo.png.asset.json";
import appScreenshot from "@/assets/app-screenshot.png.asset.json";


const NAV = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/download", label: "Download" },
  { to: "/donate", label: "Donate" },
] as const;

export function MarketingLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    // Force marketing pages to always use the dawn theme regardless of app state
    document.documentElement.setAttribute("data-theme", "dawn");
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#FAF6EC",
        color: "#1F3D2B",
        fontFamily: "'Hanken Grotesk', 'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <header
        className="fixed inset-x-0 top-0 z-50 transition-all"
        style={{
          background: scrolled ? "rgba(250, 246, 236, 0.92)" : "rgba(250, 246, 236, 0.6)",
          backdropFilter: "blur(14px) saturate(180%)",
          WebkitBackdropFilter: "blur(14px) saturate(180%)",
          borderBottom: scrolled ? "1px solid rgba(31, 61, 43, 0.08)" : "1px solid transparent",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-10 md:py-5">
          <Link
            to="/"
            className="flex items-center gap-2"
            style={{ color: "#1F3D2B" }}
          >
            <BrandMark />
            <span
              className="text-base font-semibold tracking-tight md:text-lg"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Sahih Al-Adhkar
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: true }}
                className="text-sm font-medium transition-opacity hover:opacity-100"
                style={{ color: "#1F3D2B", opacity: 0.7 }}
                activeProps={{ style: { color: "#1F3D2B", opacity: 1 } }}
              >
                {n.label}
              </Link>
            ))}
            <Link
              to="/app"
              className="rounded-full px-5 py-2.5 text-sm font-semibold transition-transform active:scale-95"
              style={{ background: "#1F3D2B", color: "#FAF6EC" }}
            >
              Open app
            </Link>
          </nav>

          <button
            type="button"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full md:hidden"
            style={{ background: "rgba(31, 61, 43, 0.08)", color: "#1F3D2B" }}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {open && (
          <div
            className="border-t md:hidden"
            style={{
              borderColor: "rgba(31, 61, 43, 0.08)",
              background: "rgba(250, 246, 236, 0.98)",
            }}
          >
            <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className="rounded-xl px-3 py-3 text-base font-medium"
                  style={{ color: "#1F3D2B" }}
                >
                  {n.label}
                </Link>
              ))}
              <Link
                to="/app"
                className="mt-2 rounded-full px-5 py-3 text-center text-base font-semibold"
                style={{ background: "#1F3D2B", color: "#FAF6EC" }}
              >
                Open app
              </Link>
            </div>
          </div>
        )}
      </header>

      <main style={{ paddingTop: 72 }}>{children}</main>

      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer
      className="mt-24 border-t"
      style={{ borderColor: "rgba(31, 61, 43, 0.1)", background: "#F3EEDC" }}
    >
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-10">
        <div className="grid gap-10 md:grid-cols-[1.4fr,1fr,1fr]">
          <div>
            <div className="flex items-center gap-2">
              <BrandMark />
              <span
                className="text-lg font-semibold"
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              >
                Sahih Al-Adhkar
              </span>
            </div>
            <p
              className="mt-3 max-w-sm text-sm leading-relaxed"
              style={{ color: "rgba(31, 61, 43, 0.72)" }}
            >
              Authentic daily remembrance of Allah, sourced from the Sunnah.
              Free, offline friendly, and private by design.
            </p>
          </div>
          <div>
            <div
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(31, 61, 43, 0.55)" }}
            >
              Explore
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/" style={{ color: "#1F3D2B" }}>Home</Link></li>
              <li><Link to="/about" style={{ color: "#1F3D2B" }}>About</Link></li>
              <li><Link to="/download" style={{ color: "#1F3D2B" }}>Download</Link></li>
              <li><Link to="/donate" style={{ color: "#1F3D2B" }}>Donate</Link></li>
              <li><Link to="/app" style={{ color: "#1F3D2B" }}>Open app</Link></li>
            </ul>
          </div>
          <div>
            <div
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(31, 61, 43, 0.55)" }}
            >
              Legal
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/privacy" style={{ color: "#1F3D2B" }}>Privacy Policy</Link></li>
              <li><Link to="/terms" style={{ color: "#1F3D2B" }}>Terms of Service</Link></li>
              <li>
                <a href="mailto:msalahi536@gmail.com" style={{ color: "#1F3D2B" }}>
                  msalahi536@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div
          className="mt-10 border-t pt-6 text-xs"
          style={{ borderColor: "rgba(31, 61, 43, 0.1)", color: "rgba(31, 61, 43, 0.55)" }}
        >
          © {new Date().getFullYear()} Sahih Al-Adhkar. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

function BrandMark() {
  return (
    <img
      src={logoAsset.url}
      alt="Sahih Al-Adhkar logo"
      width={32}
      height={32}
      className="h-8 w-8 rounded-lg"
      style={{ boxShadow: "0 6px 18px rgba(31, 61, 43, 0.22)" }}
    />
  );
}

/**
 * Faint concentric arcs pattern used as a subtle texture in section
 * backgrounds and the hero, echoing the app's HeaderPatterns.
 */
export function ArcsTexture({
  className,
  opacity = 0.06,
  color = "#1F3D2B",
}: {
  className?: string;
  opacity?: number;
  color?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 800 800"
      className={className}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity }}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="arcsFade" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <g stroke={color} strokeWidth="1" fill="none" opacity="0.9">
        {Array.from({ length: 14 }).map((_, i) => (
          <circle key={i} cx="400" cy="400" r={40 + i * 40} stroke="url(#arcsFade)" />
        ))}
      </g>
    </svg>
  );
}

/**
 * iPhone-style frame wrapping the app screenshot. Used across marketing pages
 * so hero/product visuals stay perfectly consistent with the home page.
 */
export function IPhoneFrame({
  src = appScreenshot.url,
  width = "min(340px, 82vw)",
  alt = "Sahih Al-Adhkar app screenshot",
}: {
  src?: string;
  width?: string;
  alt?: string;
}) {
  const INK = "#1F3D2B";
  const CREAM = "#FAF6EC";
  return (
    <div
      className="relative"
      style={{
        width,
        aspectRatio: "9 / 19.5",
        filter:
          "drop-shadow(0 40px 60px rgba(31,61,43,0.28)) drop-shadow(0 12px 24px rgba(31,61,43,0.16))",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          borderRadius: 52,
          background:
            "linear-gradient(160deg, #1c1c1e 0%, #0a0a0b 45%, #1c1c1e 100%)",
          padding: 10,
          boxShadow:
            "inset 0 0 0 1.5px rgba(255,255,255,0.09), inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.6)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            borderRadius: 52,
            background:
              "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.06) 30%, transparent 55%, rgba(255,255,255,0.04) 78%, transparent 100%)",
            zIndex: 3,
          }}
        />
        <div
          className="relative h-full w-full overflow-hidden"
          style={{
            borderRadius: 44,
            background: CREAM,
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.6)",
          }}
        >
          <img
            src={src}
            alt={alt}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top center",
            }}
          />
          <div
            className="relative flex items-center justify-between"
            style={{
              padding: "14px 26px 4px",
              color: INK,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
              zIndex: 2,
            }}
          >
            <span style={{ letterSpacing: 0.2 }}>9:41</span>
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 10,
                transform: "translateX(-50%)",
                width: 96,
                height: 28,
                borderRadius: 999,
                background: "#0a0a0b",
                boxShadow: "0 1px 2px rgba(0,0,0,0.35)",
              }}
            />
            <div className="flex items-center gap-1.5">
              <svg width="16" height="11" viewBox="0 0 14 10">
                <rect x="0" y="7" width="2.5" height="3" rx="0.6" fill={INK} />
                <rect x="3.5" y="5" width="2.5" height="5" rx="0.6" fill={INK} />
                <rect x="7" y="3" width="2.5" height="7" rx="0.6" fill={INK} />
                <rect x="10.5" y="1" width="2.5" height="9" rx="0.6" fill={INK} />
              </svg>
              <svg width="15" height="11" viewBox="0 0 13 10" fill="none">
                <path d="M6.5 8.5a1 1 0 100-2 1 1 0 000 2z" fill={INK} />
                <path
                  d="M2 4.5a7 7 0 019 0M3.7 6.2a4.5 4.5 0 015.6 0"
                  stroke={INK}
                  strokeWidth="1.1"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <svg width="24" height="11" viewBox="0 0 22 10">
                <rect x="0.5" y="0.5" width="18" height="9" rx="2" fill="none" stroke={INK} strokeOpacity="0.5" />
                <rect x="2" y="2" width="13" height="6" rx="1" fill={INK} />
                <rect x="19.5" y="3" width="1.5" height="4" rx="0.5" fill={INK} opacity="0.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

