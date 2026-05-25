export function initViewportSizing() {
  if (typeof window === "undefined") return () => {};

  const update = () => {
    const height = Math.round(window.visualViewport?.height ?? window.innerHeight);
    document.documentElement.style.setProperty("--app-height", `${height}px`);
  };

  update();

  window.addEventListener("resize", update);
  window.addEventListener("orientationchange", update);
  window.visualViewport?.addEventListener("resize", update);
  window.visualViewport?.addEventListener("scroll", update);

  return () => {
    window.removeEventListener("resize", update);
    window.removeEventListener("orientationchange", update);
    window.visualViewport?.removeEventListener("resize", update);
    window.visualViewport?.removeEventListener("scroll", update);
  };
}