import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function getHeaderScrollOffset() {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--isg-sticky-header-offset")
    .trim();
  const value = parseFloat(raw);
  return Number.isFinite(value) ? value : 88;
}

function getSurfaceTravel(section) {
  const overlap = Math.abs(parseFloat(getComputedStyle(section).marginTop) || 0);
  return Math.max(overlap * 8, window.innerHeight * 0.14, 120);
}

export function initSectionSurfaceOverlap(root = document) {
  const sections = Array.from(root.querySelectorAll(".isg-section-surface"));
  if (!sections.length) return () => {};

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  /** @type {gsap.core.Tween[]} */
  const tweens = [];

  sections.forEach((section) => {
    if (!(section instanceof HTMLElement)) return;

    if (reduced) {
      section.removeAttribute("data-isg-surface-overlap");
      section.style.removeProperty("--isg-section-surface-progress");
      return;
    }

    section.dataset.isgSurfaceOverlap = "1";

    const tween = gsap.fromTo(
      section,
      { "--isg-section-surface-progress": 0 },
      {
        "--isg-section-surface-progress": 1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: () => `top top+=${Math.round(getHeaderScrollOffset() + getSurfaceTravel(section))}`,
          scrub: 0.65,
          invalidateOnRefresh: true,
        },
      },
    );

    tweens.push(tween);
  });

  return () => {
    tweens.forEach((tween) => {
      tween.scrollTrigger?.kill();
      tween.kill();
    });

    sections.forEach((section) => {
      if (!(section instanceof HTMLElement)) return;
      section.style.removeProperty("--isg-section-surface-progress");
      section.style.removeProperty("will-change");
      delete section.dataset.isgSurfaceOverlap;
    });
  };
}
