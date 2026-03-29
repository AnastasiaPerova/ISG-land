import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** @type {InstanceType<typeof Lenis> | null} */
let lenisInstance = null;

export function getLenis() {
  return lenisInstance;
}

/**
 * Плавный скролл Lenis + ScrollTrigger.update.
 * Без scrollerProxy: Lenis обновляет rootElement.scrollTop — ScrollTrigger остаётся на нативном скролле.
 */
export function initLenisSmoothScroll() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    lenisInstance = null;
    return () => {};
  }

  const lenis = new Lenis({
    duration: 1.12,
    easing: (t) => 1 - (1 - t) ** 3,
    smoothWheel: true,
    smoothTouch: false,
    wheelMultiplier: 1,
    touchMultiplier: 1,
    autoResize: true,
  });

  lenisInstance = lenis;

  lenis.on("scroll", ScrollTrigger.update);

  const tickerCb = (time) => {
    lenis.raf(time * 1000);
  };
  gsap.ticker.add(tickerCb);
  gsap.ticker.lagSmoothing(0);

  const onResize = () => {
    lenis.resize();
  };
  window.addEventListener("resize", onResize);

  requestAnimationFrame(() => {
    lenis.resize();
    ScrollTrigger.refresh();
  });

  return () => {
    window.removeEventListener("resize", onResize);
    gsap.ticker.remove(tickerCb);
    lenis.destroy();
    lenisInstance = null;
    ScrollTrigger.refresh();
  };
}
