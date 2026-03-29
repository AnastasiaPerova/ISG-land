import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Product intro: у каждой `.isg-spec-card` своё появление — каскад по очереди
 * (timeline + offset), без scrub. `immediateRender: false`, чтобы до триггера
 * карточки не были скрыты.
 */
export function initSpecCardsReveal(root = document) {
  const wrap = root.querySelector(".isg-product-intro .isg-spec-cards");
  if (!wrap) return () => {};

  const cards = Array.from(wrap.querySelectorAll(".isg-spec-card"));
  if (!cards.length) return () => {};

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return () => {};

  const ctx = gsap.context(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrap,
        start: "top bottom-=10%",
        toggleActions: "play none none none",
        invalidateOnRefresh: true,
      },
      defaults: { immediateRender: false },
    });

    const step = 0.13;
    cards.forEach((card, i) => {
      tl.from(
        card,
        {
          autoAlpha: 0,
          y: 48,
          scale: 0.9,
          duration: 0.75,
          ease: "power3.out",
        },
        i * step,
      );
    });
  }, root);

  requestAnimationFrame(() => {
    ScrollTrigger.refresh();
  });

  return () => ctx.revert();
}
