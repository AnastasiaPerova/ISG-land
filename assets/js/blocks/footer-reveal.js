import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getLenis } from "./smooth-scroll.js";





export function initFooterReveal(root = document) {
  const footer = root.querySelector("#isg-footer");
  const spacer = root.querySelector("[data-isg-footer-spacer]");
  if (!footer || !spacer) return () => {};

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const compact = window.matchMedia("(max-width: 1099px)");
  if (reduced || compact.matches) {
    spacer.style.height = "";
    return () => {};
  }

  const apply = () => {
    const h = footer.offsetHeight;
    spacer.style.height = `${Math.ceil(h)}px`;
    getLenis()?.resize();
    ScrollTrigger.refresh();
  };

  apply();

  
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
