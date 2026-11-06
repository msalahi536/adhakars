import { Link, useRouterState } from "@tanstack/react-router";
import "./BottomNav.css";
import { useEffect, useState, type CSSProperties } from "react";
import {
  getLastMoreDestination, MORE_DESTINATION_EVENT, MORE_DESTINATIONS, type MoreDestination,
} from "@/lib/more-navigation";


type NavIconProps = { size?: number; strokeWidth?: number; style?: CSSProperties };

function SalahIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24">
      <path d="M12 2.5v1.5" />
      <path d="M12 4c-3 1.6-4.8 3.8-4.8 6.2h9.6C16.8 7.8 15 5.6 12 4z" />
      <path d="M5.5 21V12.5h13V21" />
      <path d="M3 21h18" />
      <path d="M10.2 21v-3.2a1.8 1.8 0 0 1 3.6 0V21" />
      <path d="M3.5 21v-7.5" />
      <path d="M3.5 13.5l.75-1.5.75 1.5" />
      <path d="M20.5 21v-7.5" />
      <path d="M19.75 13.5l.75-1.5.75 1.5" />
    </svg>
  );
}

export function TasbihIcon({ size = 22, strokeWidth = 1.5, style }: NavIconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" style={style}>
      <circle cx="12" cy="3" r="1.15" /><circle cx="17" cy="4.8" r="1.15" /><circle cx="20.2" cy="9" r="1.15" /><circle cx="20" cy="14.3" r="1.15" /><circle cx="16.6" cy="18.2" r="1.15" /><circle cx="11.5" cy="19.4" r="1.15" /><circle cx="6.8" cy="17.2" r="1.15" /><circle cx="4" cy="12.7" r="1.15" /><circle cx="4.7" cy="7.4" r="1.15" /><circle cx="8.2" cy="4" r="1.15" /><path d="M11.5 20.55v1.65M9.8 23h3.4" />
    </svg>
  );
}

function MorningIcon() {
  return <svg aria-hidden viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>;
}
function EveningIcon() {
  return <svg aria-hidden viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>;
}
function QuranIcon() {
  return <svg aria-hidden viewBox="0 0 24 24"><path d="M12 6.5C9.5 4.8 6 4.5 3 5.3v13c3-.8 6.5-.5 9 1.2 2.5-1.7 6-2 9-1.2v-13c-3-.8-6.5-.5-9 1.2z"/><path d="M12 6.5v13"/><path d="M1.5 7v12.8c3.5-.7 7-.3 10.5 1.4 3.5-1.7 7-2.1 10.5-1.4V7"/></svg>;
}
function MoreIcon() {
  return <svg aria-hidden viewBox="0 0 24 24"><circle cx="5.5" cy="12" r="1.1"/><circle cx="12" cy="12" r="1.1"/><circle cx="18.5" cy="12" r="1.1"/></svg>;
}

const tabs = [
  { to: "/app" as const, label: "Morning", Icon: MorningIcon },
  { to: "/app/evening" as const, label: "Evening", Icon: EveningIcon },
  { to: "/app/salah" as const, label: "Salah", Icon: SalahIcon },
  { to: "/app/quran" as const, label: "Quran", Icon: QuranIcon },
  { to: "/app/more" as const, label: "More", Icon: MoreIcon },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [moreDestination, setMoreDestination] = useState<MoreDestination>("/app/more");
  const moreNestedActive = MORE_DESTINATIONS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  useEffect(() => {
    const sync = () => setMoreDestination(getLastMoreDestination());
    sync();
    window.addEventListener(MORE_DESTINATION_EVENT, sync);
    return () => window.removeEventListener(MORE_DESTINATION_EVENT, sync);
  }, []);


  return (
    <div className="bn-wrap">
      <nav className="bn" aria-label="Main navigation">
        {tabs.map((t) => {
          const destination = t.to === "/app/more"
            ? (moreNestedActive && pathname !== "/app/more" ? "/app/more" : moreDestination)
            : t.to;
          return (
            <Link
              key={t.to}
              to={destination}
              activeOptions={{ exact: true, includeSearch: false }}
              className={({ isActive }) => `bn-tab ${isActive || (t.to === "/app/more" && moreNestedActive) ? "is-active" : ""}`}
            >
              {({ isActive }) => {
                const active = isActive || (t.to === "/app/more" && moreNestedActive);
                return (
                  <>
                    {active && <span aria-hidden className="bn-pill" />}
                    <t.Icon />
                    <span className="bn-label">{t.label}</span>
                    {active && <span aria-hidden className="bn-underline" />}
                  </>
                );
              }}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export const BottomNavigation = BottomNav;
