import gsap from "gsap";
import { getLenis } from "./smooth-scroll.js";

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(value) {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
}

export function initProductContentParallax(root = document) {
  const sections = Array.from(root.querySelectorAll(".isg-intro-section"));
  if (!sections.length) return () => {};

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return () => {};

  const pairs = sections
    .map((section) => {
      const mediaInner = section.querySelector(":scope > .isg-intro-media .isg-intro-media__inner");
      if (!(section instanceof HTMLElement) || !(mediaInner instanceof HTMLElement)) {
        return null;
      }
      return { section, mediaInner };
    })
    .filter(Boolean);

  if (!pairs.length) return () => {};

  const tick = () => {
    const vh = window.innerHeight || 1;

    pairs.forEach(({ section, mediaInner }) => {
      const rect = section.getBoundingClientRect();
      const progress = clamp01((vh - rect.top) / (vh + rect.height));
      const eased = smoothstep(progress);
      const maxOffset = Math.max(72, Math.min(160, rect.height * 0.14));
      const y = (0.5 - eased) * maxOffset * 2;

      gsap.set(mediaInner, {
        y,
        force3D: true,
      });

      if (rect.bottom > 0 && rect.top < vh) {
        mediaInner.style.willChange = "transform";
      } else {
        mediaInner.style.removeProperty("will-change");
      }
    });
  };

  const disposers = [];
  const lenis = getLenis();
  if (lenis) {
    lenis.on("scroll", tick);
    disposers.push(() => lenis.off("scroll", tick));
  } else {
    window.addEventListener("scroll", tick, { passive: true });
    disposers.push(() => window.removeEventListener("scroll", tick));
  }

  const onResize = () => tick();
  window.addEventListener("resize", onResize);
  disposers.push(() => window.removeEventListener("resize", onResize));

  requestAnimationFrame(() => {
    requestAnimationFrame(tick);
  });

  disposers.push(() => {
    pairs.forEach(({ mediaInner }) => {
      gsap.set(mediaInner, { clearProps: "transform,y,willChange" });
    });
  });

  return () => disposers.forEach((dispose) => dispose());
}
