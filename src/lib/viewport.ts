let viewportFixSetup = false;

export const setupViewportFix = () => {
  if (viewportFixSetup || typeof window === "undefined") return;
  viewportFixSetup = true;

  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  };

  setVH();

  window.addEventListener("resize", setVH);
  window.addEventListener("orientationchange", setVH);

  requestAnimationFrame(() => {
    requestAnimationFrame(setVH);
  });

  setTimeout(setVH, 100);
  setTimeout(setVH, 500);
};