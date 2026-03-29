import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getLenis } from "./smooth-scroll.js";

/**
 * Футер «под» страницей: fixed внизу, #isg-main с z-index выше;
 * спейсер задаёт длину прокрутки = высоте футера (подстройка через ResizeObserver).
 */
export function initFooterReveal(root = document) {
  const footer = root.querySelector("#isg-footer");
  const spacer = root.querySelector("[data-isg-footer-spacer]");
  if (!footer || !spacer) return () => {};

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return () => {};

  const apply = () => {
    const h = footer.offsetHeight;
    spacer.style.height = `${Math.ceil(h)}px`;
    getLenis()?.resize();
    ScrollTrigger.refresh();
  };

  apply();

  /** @type {ResizeObserver | undefined} */
  let ro;
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(() => apply());
    ro.observe(footer);
  }

  window.addEventListener("resize", apply);
  const onLoad = () => apply();
  window.addEventListener("load", onLoad);

  requestAnimationFrame(() => {
    requestAnimationFrame(apply);
  });

  return () => {
    window.removeEventListener("resize", apply);
    window.removeEventListener("load", onLoad);
    ro?.disconnect();
    spacer.style.height = "";
  };
}
