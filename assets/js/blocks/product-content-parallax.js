import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initProductContentParallax(root = document) {
  const sections = Array.from(root.querySelectorAll(".isg-product-content"));
  if (!sections.length) return () => {};

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return () => {};

  const MAX_BLUR_PX = 4.5;
  /** @type {ScrollTrigger[]} */
  const triggers = [];

  sections.forEach((section) => {
    const inner = section.querySelector(".isg-product-content__inner");
    if (!(inner instanceof HTMLElement)) return;

    gsap.set(inner, {
      y: 0,
      filter: "blur(0px)",
      willChange: "filter",
    });

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      scrub: 0.6,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        // 0->1->0 curve: blur appears while scrolling through the section
        const p = self.progress;
        const envelope = Math.sin(p * Math.PI);
        const blur = Math.max(0, envelope * MAX_BLUR_PX);
        gsap.set(inner, { filter: `blur(${blur.toFixed(3)}px)` });
      },
      onLeave: () => gsap.set(inner, { filter: "blur(0px)" }),
      onLeaveBack: () => gsap.set(inner, { filter: "blur(0px)" }),
    });
    triggers.push(st);
  });

  return () => {
    triggers.forEach((st) => st.kill());
    triggers.length = 0;
    sections.forEach((section) => {
      section.querySelectorAll(".isg-product-content__inner").forEach((node) => {
        gsap.set(node, { clearProps: "transform,y,filter,willChange" });
      });
    });
  };
}
