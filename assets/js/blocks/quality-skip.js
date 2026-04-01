function getStickyHeaderOffset(root) {
  const header =
    root.querySelector("[data-isg-sticky-header]") ||
    document.querySelector("[data-isg-sticky-header]");
  if (!header) return 0;
  const rect = header.getBoundingClientRect();
  return Math.max(0, Math.round(rect.height || 0));
}

function getNextSibling(el) {
  let next = el?.nextElementSibling ?? null;
  while (next) {
    if (next instanceof HTMLElement && !next.hasAttribute("hidden") && next.offsetHeight > 0) {
      return next;
    }
    next = next.nextElementSibling;
  }
  return null;
}

function findNextTarget(btn) {
  const localScope =
    btn.closest(".isg-about-content-block, .isg-quality-content") || btn.closest("[data-isg-block]");
  let target = getNextSibling(localScope);

  if (!target) {
    const topBlock = btn.closest("[data-isg-block]");
    target = getNextSibling(topBlock);
  }

  if (!target) {
    const main = document.getElementById("isg-main") || document.body;
    const currentTop = window.pageYOffset + btn.getBoundingClientRect().top;
    const candidates = Array.from(main.children).filter(
      (el) => el instanceof HTMLElement && el.offsetHeight > 0,
    );
    const next = candidates
      .map((el) => ({
        el,
        top: window.pageYOffset + el.getBoundingClientRect().top,
      }))
      .filter((item) => item.top > currentTop + 24)
      .sort((a, b) => a.top - b.top)[0];
    target = next?.el || null;
  }

  if (!target) return null;

  if (target.classList.contains("isg-intro-pin")) {
    const nested = target.querySelector("section");
    if (nested) return nested;
  }

  return target;
}

/**
 * Skip button in `.isg-quality-list-wrap` that scrolls to the next content section.
 * @param {ParentNode} [root]
 * @param {{ getLenis?: () => any }} [opts]
 */
export function initQualitySkip(root = document, opts = {}) {
  const getLenis = typeof opts.getLenis === "function" ? opts.getLenis : null;

  const onClick = (e) => {
    const targetBtn =
      e.target instanceof Element ? e.target.closest("[data-isg-skip-next]") : null;
    if (!targetBtn || !root.contains(targetBtn)) return;

    e.preventDefault();

    const target = findNextTarget(targetBtn);
    if (!target) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const offset = getStickyHeaderOffset(root) + 8;
    const lenis = getLenis?.();

    if (lenis) {
      lenis.scrollTo(target, {
        offset: -offset,
        immediate: reduced,
        lock: false,
        force: true,
        duration: reduced ? 0 : 1.05,
      });
      return;
    }

    const y = window.pageYOffset + target.getBoundingClientRect().top - offset;
    window.scrollTo({
      top: Math.max(0, y),
      behavior: reduced ? "auto" : "smooth",
    });
  };

  root.addEventListener("click", onClick);
  return () => {
    root.removeEventListener("click", onClick);
  };
}
