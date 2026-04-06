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
      const content = section.querySelector(":scope .isg-intro-section__content");
      if (
        !(section instanceof HTMLElement) ||
        !(mediaInner instanceof HTMLElement) ||
        !(content instanceof HTMLElement)
      ) {
        return null;
      }
      return { section, mediaInner, content };
    })
    .filter(Boolean);

  if (!pairs.length) return () => {};

  const tick = () => {
    const vh = window.innerHeight || 1;

    pairs.forEach(({ section, mediaInner, content }) => {
      const rect = section.getBoundingClientRect();
      const progress = clamp01((vh - rect.top) / (vh + rect.height));
      const eased = smoothstep(progress);
      const maxOffset = Math.max(56, Math.min(124, rect.height * 0.11));
      const contentMaxOffset = Math.max(28, Math.min(84, rect.height * 0.07));
      const y = (0.5 - eased) * maxOffset * 2;
      const contentY = -eased * contentMaxOffset;

      gsap.set(mediaInner, {
        y,
        force3D: true,
      });
      gsap.set(content, {
        y: contentY,
        force3D: true,
      });

      if (rect.bottom > 0 && rect.top < vh) {
        mediaInner.style.willChange = "transform";
        content.style.willChange = "transform";
      } else {
        mediaInner.style.removeProperty("will-change");
        content.style.removeProperty("will-change");
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
    pairs.forEach(({ mediaInner, content }) => {
      gsap.set(mediaInner, { clearProps: "transform,y,willChange" });
      gsap.set(content, { clearProps: "transform,y,willChange" });
    });
  });

  return () => disposers.forEach((dispose) => dispose());
}
