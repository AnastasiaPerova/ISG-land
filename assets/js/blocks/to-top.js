import { getLenis } from "./smooth-scroll.js";

export function initToTop(root = document) {
  const btns = root.querySelectorAll("[data-isg-to-top]");
  if (!btns.length) return () => {};

  const onClick = () => {
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(0, { immediate: false });
    } else {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    }
  };

  btns.forEach((b) => b.addEventListener("click", onClick));
  return () => btns.forEach((b) => b.removeEventListener("click", onClick));
}
