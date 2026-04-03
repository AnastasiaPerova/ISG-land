import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Анимации появления секций; перед повторным init вызывайте dispose из main.
 */
export function initScrollReveal(root = document) {
  const tweens = [];
  const reveal = (el) => {
    const tw = gsap.from(el, {
      opacity: 0,
      y: 48,
      duration: 0.85,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start: "top 92%",
        toggleActions: "play none none none",
        invalidateOnRefresh: true,
      },
    });
    tweens.push(tw);
  };

  root.querySelectorAll("[data-isg-block]").forEach((el) => {
    if (el.classList.contains("isg-digits-section")) return;
    if (el.hasAttribute("data-isg-app-scroll")) return;
    if (el.classList.contains("isg-about-intro-block")) return;
    if (el.classList.contains("isg-about-gallery-block")) return;
    /* Секции с intro pin + буквенной заливкой — иначе родитель остаётся opacity:0 и «ломает» скролл */
    if (el.querySelector("[data-isg-intro-scroll]")) return;

    reveal(el);
  });

  root.querySelectorAll(".isg-quality-wrapper").forEach((el) => {
    if (el.classList.contains("isg-section-surface")) return;
    reveal(el);
  });

  return () => {
    tweens.forEach((tw) => {
      tw.scrollTrigger?.kill();
      tw.kill();
    });
  };
}
