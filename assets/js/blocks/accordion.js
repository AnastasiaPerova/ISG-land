/**
 * Accordion: один открытый пункт; анимация высоты — CSS (grid 0fr → 1fr).
 */
export function initAccordions(root = document) {
  const handlers = [];

  root.querySelectorAll("[data-isg-accordion]").forEach((acc) => {
    const onClick = (e) => {
      const btn = e.target.closest(".isg-accordion__trigger");
      if (!btn || !acc.contains(btn)) return;
      const item = btn.closest(".isg-accordion__item");
      if (!item) return;

      const willOpen = !item.classList.contains("isg-accordion__item--open");

      acc.querySelectorAll(".isg-accordion__item").forEach((i) => {
        i.classList.remove("isg-accordion__item--open");
        i.querySelector(".isg-accordion__trigger")?.setAttribute("aria-expanded", "false");
      });

      if (willOpen) {
        item.classList.add("isg-accordion__item--open");
        btn.setAttribute("aria-expanded", "true");
      }
    };

    acc.addEventListener("click", onClick);
    handlers.push(() => acc.removeEventListener("click", onClick));
  });

  return () => handlers.forEach((off) => off());
}
