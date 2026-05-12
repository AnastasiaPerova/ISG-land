

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

function isCompactViewport() {
  return window.matchMedia("(max-width: 1099px)").matches;
}

function preserveViewportPosition(el, mutate) {
  if (!isCompactViewport() || !(el instanceof HTMLElement)) {
    mutate();
    return;
  }

  const beforeTop = el.getBoundingClientRect().top;
  const startedAt = performance.now();
  const duration = 620;
  mutate();

  const keepPosition = () => {
    const afterTop = el.getBoundingClientRect().top;
    const delta = afterTop - beforeTop;
    if (Math.abs(delta) >= 1) {
      window.scrollBy({ top: delta, left: 0, behavior: "auto" });
    }

    if (performance.now() - startedAt < duration) {
      requestAnimationFrame(keepPosition);
    }
  };

  requestAnimationFrame(keepPosition);
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

      preserveViewportPosition(btn, () => {
        acc.querySelectorAll(".isg-accordion__item").forEach((i) => {
          i.classList.remove("isg-accordion__item--open");
          i.querySelector(".isg-accordion__trigger")?.setAttribute("aria-expanded", "false");
        });

        if (willOpen) {
          item.classList.add("isg-accordion__item--open");
          btn.setAttribute("aria-expanded", "true");
        }
      });
    };

    acc.addEventListener("click", onClick);
    handlers.push(() => acc.removeEventListener("click", onClick));
  });

  return () => handlers.forEach((off) => off());
}
