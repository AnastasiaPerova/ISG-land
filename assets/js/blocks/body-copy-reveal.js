import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const BODY_SELECTOR = ".isg-body, .isg-body-lg";

function getRevealConfig(node) {
  return {
    y: 36,
    filter: "blur(6px)",
    duration: 1.28,
    ease: "power3.out",
    delay: 0.08,
    start: "top 94%",
  };
}

export function initBodyCopyReveal(root = document) {
  const nodes = Array.from(root.querySelectorAll(BODY_SELECTOR)).filter(
    (node) => node instanceof HTMLElement && !node.closest(".isg-intro-section"),
  );
  if (!nodes.length) return () => {};

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cleanups = [];

  nodes.forEach((node) => {
    const config = getRevealConfig(node);

    if (reduced) {
      gsap.set(node, { clearProps: "opacity,visibility,transform,y,filter,willChange" });
      return;
    }

    gsap.set(node, {
      autoAlpha: 0,
      y: config.y,
      filter: config.filter,
      willChange: "transform, opacity, filter",
    });

    const tween = gsap.to(node, {
      autoAlpha: 1,
      y: 0,
      filter: "blur(0px)",
      duration: config.duration,
      ease: config.ease,
      delay: config.delay,
      paused: true,
      overwrite: true,
    });

    const st = ScrollTrigger.create({
      trigger: node,
      start: config.start,
      once: true,
      invalidateOnRefresh: true,
      onEnter: () => tween.play(0),
    });

    cleanups.push(() => st.kill());
    cleanups.push(() => tween.kill());
  });

  return () => {
    cleanups.forEach((fn) => fn());
    nodes.forEach((node) => {
      gsap.set(node, { clearProps: "opacity,visibility,transform,y,filter,willChange" });
    });
  };
}
