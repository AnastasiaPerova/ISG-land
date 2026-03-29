/**
 * Скользящая подложка под пунктами навигации.
 * Режим `data-isg-hover-slider`: подложка только при hover/focus внутри ряда, не следует за активным пунктом при клике/скролле.
 * На пункте под слайдером выставляется `isg-nav-pill__link--slider-target` (белый текст на чёрной подложке).
 * Обычный `data-isg-nav-slider`: hover + возврат к активному (для редких случаев без hover-only).
 */
function getActiveLink(row) {
  return (
    row.querySelector(".isg-btn--active") ||
    row.querySelector('[aria-current="page"]') ||
    row.querySelector('[aria-current="true"]') ||
    row.querySelector("a.isg-btn, button.isg-btn")
  );
}

const sliderPlacementCache = new WeakMap();

function targetKey(el) {
  return el.getAttribute("href") || el.getAttribute("aria-current") || el.textContent?.trim() || "";
}

/**
 * @param {HTMLElement} row
 * @param {HTMLElement} targetEl
 * @param {{ withTargetClasses?: boolean; opacity?: string }} [opts]
 */
function placeSlider(row, targetEl, opts = {}) {
  const { withTargetClasses = true, opacity } = opts;
  const slider = row.querySelector(".isg-nav-pill__slider");
  if (!slider || !targetEl || !row.contains(targetEl)) return;

  const rowRect = row.getBoundingClientRect();
  const tRect = targetEl.getBoundingClientRect();
  const x = tRect.left - rowRect.left;
  const w = tRect.width;
  const xr = Math.round(x * 100) / 100;
  const wr = Math.round(w * 100) / 100;
  const key = targetKey(targetEl);
  const prev = sliderPlacementCache.get(row);
  if (
    prev &&
    prev.key === key &&
    prev.x === xr &&
    prev.w === wr &&
    opacity === undefined
  ) {
    if (!withTargetClasses) {
      row.querySelectorAll("a.isg-btn, button.isg-btn").forEach((btn) => {
        btn.classList.remove("isg-nav-pill__link--slider-target");
      });
    }
    return;
  }
  sliderPlacementCache.set(row, { key, x: xr, w: wr });

  slider.style.setProperty("--nav-slider-x", `${x}px`);
  slider.style.setProperty("--nav-slider-w", `${w}px`);
  if (opacity !== undefined) {
    slider.style.opacity = opacity;
  } else {
    slider.style.opacity = "1";
  }
  row.classList.add("isg-nav-pill__row--slider--init");

  row.querySelectorAll("a.isg-btn, button.isg-btn").forEach((btn) => {
    if (withTargetClasses) {
      btn.classList.toggle("isg-nav-pill__link--slider-target", btn === targetEl);
    } else {
      btn.classList.remove("isg-nav-pill__link--slider-target");
    }
  });
}

/** После программной смены активного пункта (только ряды без data-isg-hover-slider). */
export function syncNavPillSliders(root = document) {
  root
    .querySelectorAll(".isg-nav-pill__row--slider[data-isg-nav-slider]:not([data-isg-hover-slider])")
    .forEach((row) => {
      const el = getActiveLink(row);
      if (el) placeSlider(row, el, { withTargetClasses: true });
    });
}

export function initNavPillSliders(root = document) {
  const rows = root.querySelectorAll(".isg-nav-pill__row--slider[data-isg-nav-slider], .isg-nav-pill__row--slider[data-isg-hover-slider]");
  const cleanups = [];

  rows.forEach((row) => {
    const hoverOnly = row.hasAttribute("data-isg-hover-slider");
    const slider = row.querySelector(".isg-nav-pill__slider");
    const links = () => Array.from(row.querySelectorAll("a.isg-btn, button.isg-btn"));

    let lastHoverTarget = null;

    const syncToActive = () => {
      if (hoverOnly) return;
      placeSlider(row, getActiveLink(row), { withTargetClasses: true });
    };

    const hideHoverSlider = () => {
      lastHoverTarget = null;
      if (slider) slider.style.opacity = "0";
      links().forEach((btn) => btn.classList.remove("isg-nav-pill__link--slider-target"));
    };

    const showForTarget = (t) => {
      if (!links().includes(t)) return;
      lastHoverTarget = t;
      /* slider-target на пункте под слайдером — белый текст на чёрной подложке (как у языка) */
      placeSlider(row, t, { withTargetClasses: true, opacity: "1" });
    };

    const onEnter = (e) => {
      const t = e.currentTarget;
      if (hoverOnly) {
        if (links().includes(t)) showForTarget(t);
      } else if (links().includes(t)) {
        placeSlider(row, t, { withTargetClasses: true });
      }
    };

    const onLeave = () => {
      if (hoverOnly) {
        hideHoverSlider();
      } else {
        placeSlider(row, getActiveLink(row), { withTargetClasses: true });
      }
    };

    const onFocusIn = (e) => {
      const t = e.target;
      if (!t.matches?.("a.isg-btn, button.isg-btn") || !row.contains(t)) return;
      if (hoverOnly) {
        showForTarget(t);
      } else {
        placeSlider(row, t, { withTargetClasses: true });
      }
    };

    const onFocusOut = (e) => {
      if (!hoverOnly) return;
      const next = e.relatedTarget;
      if (next && row.contains(next)) return;
      hideHoverSlider();
    };

    if (!hoverOnly) {
      requestAnimationFrame(() => {
        syncToActive();
      });
    }

    links().forEach((a) => {
      a.addEventListener("mouseenter", onEnter);
      if (!hoverOnly) {
        a.addEventListener("focus", onEnter);
      }
    });
    row.addEventListener("mouseleave", onLeave);
    row.addEventListener("focusin", onFocusIn);
    if (hoverOnly) {
      row.addEventListener("focusout", onFocusOut);
    }

    const ro = new ResizeObserver(() => {
      if (hoverOnly) {
        if (lastHoverTarget && row.contains(lastHoverTarget)) {
          placeSlider(row, lastHoverTarget, { withTargetClasses: true, opacity: "1" });
        }
        return;
      }
      syncToActive();
    });
    ro.observe(row);

    const onWin = () => {
      if (hoverOnly) {
        if (lastHoverTarget && row.contains(lastHoverTarget)) {
          placeSlider(row, lastHoverTarget, { withTargetClasses: true, opacity: "1" });
        }
        return;
      }
      syncToActive();
    };
    window.addEventListener("resize", onWin);

    cleanups.push(() => {
      links().forEach((a) => {
        a.removeEventListener("mouseenter", onEnter);
        if (!hoverOnly) {
          a.removeEventListener("focus", onEnter);
        }
      });
      row.removeEventListener("mouseleave", onLeave);
      row.removeEventListener("focusin", onFocusIn);
      if (hoverOnly) {
        row.removeEventListener("focusout", onFocusOut);
      }
      ro.disconnect();
      window.removeEventListener("resize", onWin);
      if (slider) {
        slider.style.opacity = "";
        slider.style.removeProperty("--nav-slider-x");
        slider.style.removeProperty("--nav-slider-w");
      }
      links().forEach((btn) => btn.classList.remove("isg-nav-pill__link--slider-target"));
      row.classList.remove("isg-nav-pill__row--slider--init");
      sliderPlacementCache.delete(row);
    });
  });

  return () => cleanups.forEach((fn) => fn());
}
