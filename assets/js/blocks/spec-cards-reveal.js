import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);






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

    gsap.set(wrap, { opacity: 0 });
    gsap.set(cards, {
      opacity: 0,
      y: 72,
      rotateY: 18,
      rotateZ: -1.4,
      scale: 0.92,
      transformOrigin: "50% 100%",
      filter: "blur(10px)",
    });

    tl.to(wrap, {
      opacity: 1,
      duration: 0.2,
      ease: "power1.out",
    }).to(
      cards,
      {
        opacity: 1,
        y: 0,
        rotateY: 0,
        rotateZ: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 1.15,
        stagger: {
          each: 0.08,
          from: "start",
        },
        ease: "power4.out",
      },
      0,
    );
  }, root);

  requestAnimationFrame(() => {
    ScrollTrigger.refresh();
  });

  return () => ctx.revert();
}
