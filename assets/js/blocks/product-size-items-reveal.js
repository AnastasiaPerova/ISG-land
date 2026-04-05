import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const SPEC_SELECTOR = ".isg-size-spec";
const ITEM_SELECTOR = ".isg-size-spec__item";

export function initProductSizeItemsReveal(root = document) {
  const specs = Array.from(root.querySelectorAll(SPEC_SELECTOR));
  if (!specs.length) return () => {};

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 900px)").matches;
  const cleanups = [];

  specs.forEach((spec) => {
    const items = Array.from(spec.querySelectorAll(ITEM_SELECTOR));
    if (!items.length) return;

    if (reduced || isMobile) {
      gsap.set(items, { clearProps: "opacity,visibility,transform,y,filter,willChange" });
      return;
    }

    gsap.set(items, {
      autoAlpha: 0,
      y: 24,
      filter: "blur(3px)",
      willChange: "transform, opacity, filter",
    });

    const tl = gsap.timeline({ paused: true });
    tl.to(items, {
      autoAlpha: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.72,
      stagger: 0.09,
      ease: "power2.out",
      overwrite: true,
    });

    const st = ScrollTrigger.create({
      trigger: spec,
      start: "top 82%",
      once: true,
      onEnter: () => tl.play(0),
    });

    cleanups.push(() => st.kill());
    cleanups.push(() => tl.kill());
  });

  return () => {
    cleanups.forEach((fn) => fn());
    specs.forEach((spec) => {
      spec.querySelectorAll(ITEM_SELECTOR).forEach((node) => {
        gsap.set(node, { clearProps: "opacity,visibility,transform,y,filter,willChange" });
      });
    });
  };
}
