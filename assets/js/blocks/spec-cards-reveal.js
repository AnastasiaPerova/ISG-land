import gsap from "gsap";
import { getLenis } from "./smooth-scroll.js";

const RANGE_START_FRAC = 0.92;
const RANGE_END_FRAC = 0.38;

/**
 * Карточки `.isg-spec-cards` в product intro — прогресс от позиции в вьюпорте.
 * Привязка к событию Lenis (`scroll`), без ScrollTrigger (иначе с smooth-scroll часто не видно эффекта).
 */
export function initSpecCardsReveal(root = document) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** @type { HTMLElement[] } */
  const cards = [];
  root.querySelectorAll(".isg-product-intro .isg-spec-cards").forEach((container) => {
    gsap.utils.toArray(container.children).forEach((el) => {
      if (el instanceof HTMLElement && el.classList.contains("isg-spec-card")) {
        cards.push(el);
      }
    });
  });

  if (!cards.length) {
    return () => {};
  }

  if (reduced) {
    return () => {};
  }

  const tick = () => {
    const vh = window.innerHeight || 1;
    const rangeStart = vh * RANGE_START_FRAC;
    const rangeEnd = vh * RANGE_END_FRAC;
    const denom = Math.max(1e-6, rangeStart - rangeEnd);

    cards.forEach((card) => {
      const top = card.getBoundingClientRect().top;
      let u = (rangeStart - top) / denom;
      u = Math.max(0, Math.min(1, u));
      const t = u * u * (3 - 2 * u);
      const inv = 1 - t;

      gsap.set(card, {
        opacity: t,
        y: 44 * inv,
        rotateX: -12 * inv,
        scale: 0.94 + 0.06 * t,
        transformPerspective: 1100,
        transformOrigin: "50% 82%",
        force3D: true,
      });
    });
  };

  const lenis = getLenis();
  if (lenis) {
    lenis.on("scroll", tick);
  } else {
    window.addEventListener("scroll", tick, { passive: true });
  }
  window.addEventListener("resize", tick);

  requestAnimationFrame(() => {
    requestAnimationFrame(tick);
  });

  if (document.fonts?.ready) {
    document.fonts.ready.then(tick).catch(() => {});
  }

  return () => {
    if (lenis) {
      lenis.off("scroll", tick);
    } else {
      window.removeEventListener("scroll", tick);
    }
    window.removeEventListener("resize", tick);
    gsap.set(cards, { clearProps: "opacity,transform" });
  };
}
