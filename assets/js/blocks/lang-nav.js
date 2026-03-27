import { syncNavPillSliders } from "./nav-pill-slider.js";

/**
 * Синхронизация EN/PL между десктопом и drawer + обновление слайдера языка.
 */
export function initLangNav(root = document) {
  const onClick = (e) => {
    const a = e.target.closest("a[data-isg-lang]");
    if (!a) return;
    const row = a.closest("[data-isg-lang-nav]");
    if (!row || !root.contains(row)) return;
    e.preventDefault();
    const code = a.getAttribute("data-isg-lang");
    if (!code) return;

    root.querySelectorAll("[data-isg-lang-nav] a[data-isg-lang]").forEach((link) => {
      const on = link.getAttribute("data-isg-lang") === code;
      link.classList.toggle("isg-btn--active", on);
      if (on) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    syncNavPillSliders(root);
  };

  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
