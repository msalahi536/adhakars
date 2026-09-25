export const MORE_DESTINATIONS = [
  "/app/more",
  "/app/sleep",
  "/app/qibla",
  "/app/about",
  "/app/period",
  "/app/ruqyah",
  "/app/hajj",
  "/app/fasting",
] as const;

export type MoreDestination = (typeof MORE_DESTINATIONS)[number];

export const MORE_DESTINATION_KEY = "adhkar:more:last-destination";
export const MORE_DESTINATION_EVENT = "adhkar:more-destination-change";

export function isMoreDestination(pathname: string): pathname is MoreDestination {
  return MORE_DESTINATIONS.some((path) => pathname === path);
}

export function getLastMoreDestination(): MoreDestination {
  if (typeof window === "undefined") return "/app/more";
  const saved = window.sessionStorage.getItem(MORE_DESTINATION_KEY);
  return saved && isMoreDestination(saved) ? saved : "/app/more";
}

export function rememberMoreDestination(pathname: string) {
  if (!isMoreDestination(pathname) || pathname === "/app/more") return;
  window.sessionStorage.setItem(MORE_DESTINATION_KEY, pathname);
  window.dispatchEvent(new Event(MORE_DESTINATION_EVENT));
}