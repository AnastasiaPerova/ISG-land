

function warmAccordionMedia(item, priority = "low") {
  item.querySelectorAll(".isg-accordion__img").forEach((img) => {
    if (!(img instanceof HTMLImageElement)) return;
    img.loading = "eager";
    img.decoding = "async";
    if ("fetchPriority" in img) {
      img.fetchPriority = priority;
    }
    if (!img.complete && typeof img.decode === "function") {
      img.decode().catch(() => {});
    }
  });
}


export function initAccordions(root = document) {
  const handlers = [];

  root.querySelectorAll("[data-isg-accordion]").forEach((acc) => {
    acc.querySelectorAll(".isg-accordion__item").forEach((item, index) => {
      warmAccordionMedia(item, index === 0 ? "high" : "low");
    });

    const onClick = (e) => {
      const btn = e.target.closest(".isg-accordion__trigger");
      if (!btn || !acc.contains(btn)) return;
      const item = btn.closest(".isg-accordion__item");
      if (!item) return;

      const willOpen = !item.classList.contains("isg-accordion__item--open");
      warmAccordionMedia(item, "high");

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
