export function initSectionSurfaceOverlap(root = document) {
  const sections = Array.from(root.querySelectorAll(".isg-section-surface"));
  if (!sections.length) return () => {};

  sections.forEach((section) => {
    if (!(section instanceof HTMLElement)) return;
    section.removeAttribute("data-isg-surface-overlap");
    section.style.removeProperty("--isg-section-surface-progress");
    section.style.removeProperty("will-change");
  });

  return () => {
    sections.forEach((section) => {
      if (!(section instanceof HTMLElement)) return;
      section.removeAttribute("data-isg-surface-overlap");
      section.style.removeProperty("--isg-section-surface-progress");
      section.style.removeProperty("will-change");
    });
  };
}
