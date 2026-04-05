import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const GROUP_SELECTOR = ".isg-about-text-grid__left, .isg-about-text-grid__right, .isg-product-content__col";

function collectRevealNodes(group) {
  return Array.from(group.querySelectorAll(".isg-body, .isg-body-lg")).filter((node) => node instanceof HTMLElement);
}

export function initBodyCopyReveal(root = document) {
  const groups = Array.from(root.querySelectorAll(GROUP_SELECTOR)).filter((node) => node instanceof HTMLElement);
  if (!groups.length) return () => {};

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cleanups = [];

  groups.forEach((group) => {
    const nodes = collectRevealNodes(group);
    if (!nodes.length) return;

    if (reduced) {
      gsap.set(nodes, { clearProps: "opacity,visibility,transform,y,willChange" });
      return;
    }

    gsap.set(nodes, {
      autoAlpha: 0,
      y: 24,
      willChange: "transform, opacity",
    });

    const tl = gsap.timeline({ paused: true });
    tl.to(nodes, {
      autoAlpha: 1,
      y: 0,
      duration: 1.02,
      stagger: 0.12,
      ease: "power2.out",
      overwrite: true,
      delay: 0.22,
    });

    const st = ScrollTrigger.create({
      trigger: group,
      start: "top 88%",
      once: true,
      invalidateOnRefresh: true,
      onEnter: () => tl.play(0),
    });

    cleanups.push(() => st.kill());
    cleanups.push(() => tl.kill());
  });

  return () => {
    cleanups.forEach((fn) => fn());
    groups.forEach((group) => {
      collectRevealNodes(group).forEach((node) => {
        gsap.set(node, { clearProps: "opacity,visibility,transform,y,willChange" });
      });
    });
  };
}
