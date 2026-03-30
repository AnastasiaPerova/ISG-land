/**
 * Слайдеры .isg-slider на tiny-slider (`tns` из assets/js/vendor/tiny-slider.min.js).
 * Загрузка через ensureTinySlider() — не обязательно вручную ставить <script> перед main.js.
 * — team: Center (демо ganlanyuan.github.io/tiny-slider/demo/)
 * — gallery: full-viewport + fixedWidth + edgePadding (края обрезаны, как демо fixedWidth-edgePadding / Responsive на ganlanyuan.github.io/tiny-slider/demo/)
 */

import { ensureTinySlider } from "../vendor/tiny-slider-load.js";

/**
 * Gutter tiny-slider в px из `--isg-gap` (совпадает с `$isg-gap` в _variables.scss).
 */
function getIsgGapPx() {
  const root = document.documentElement;
  const raw = getComputedStyle(root).getPropertyValue("--isg-gap").trim();
  if (raw.endsWith("rem")) {
    const rem = parseFloat(raw);
    const fs = parseFloat(getComputedStyle(root).fontSize) || 16;
    return Math.max(0, Math.round(rem * fs));
  }
  if (raw.endsWith("px")) {
    return Math.round(parseFloat(raw));
  }
  return 29;
}

/** @param {import("tiny-slider").TinySliderInfo | undefined} info */
function syncNavThumb(thumb, info) {
  if (!thumb || !info) return;
  const n = info.slideCount || 1;
  if (n <= 1) {
    thumb.style.width = "100%";
    thumb.style.marginLeft = "0";
    return;
  }
  // В loop у `index` есть смещение клонов; для UI нужен displayIndex (1…slideCount из getInfo).
  const display =
    typeof info.displayIndex === "number"
      ? info.displayIndex
      : ((info.index ?? 0) % n) + 1;
  const idx0 = Math.max(0, Math.min(n - 1, display - 1));
  const thumbW = 30;
  const travel = 100 - thumbW;
  const progress = idx0 / (n - 1);
  thumb.style.width = `${thumbW}%`;
  thumb.style.marginLeft = `${progress * travel}%`;
}

function optionsTeam(track, prev, next, gapPx) {
  return {
    container: track,
    mode: "carousel",
    axis: "horizontal",
    center: false,
    /* Три карточки целиком в ширине контейнера слайдера (fluid), без fixedWidth */
    items: 3,
    slideBy: 1,
    gutter: gapPx,
    speed: 400,
    loop: true,
    mouseDrag: true,
    swipeAngle: 15,
    controls: true,
    nav: false,
    autoplay: false,
    prevButton: prev,
    nextButton: next,
    preventScrollOnTouch: "auto",
    freezable: false,
    responsive: {
      0: { items: 1, gutter: gapPx },
      560: { items: 2, gutter: gapPx },
      1024: { items: 3, gutter: gapPx },
    },
  };
}

function optionsGallery(track, prev, next, gapPx) {
  return {
    container: track,
    mode: "carousel",
    axis: "horizontal",
    center: false,
    items: 1,
    slideBy: 1,
    fixedWidth: 560,
    edgePadding: 120,
    gutter: gapPx,
    speed: 400,
    loop: true,
    mouseDrag: true,
    swipeAngle: 15,
    controls: true,
    nav: false,
    autoplay: false,
    prevButton: prev,
    nextButton: next,
    preventScrollOnTouch: "auto",
    freezable: false,
    responsive: {
      0: { fixedWidth: 280, edgePadding: 20, gutter: gapPx },
      480: { fixedWidth: 320, edgePadding: 36, gutter: gapPx },
      768: { fixedWidth: 420, edgePadding: 64, gutter: gapPx },
      1024: { fixedWidth: 480, edgePadding: 96, gutter: gapPx },
      1400: { fixedWidth: 560, edgePadding: 120, gutter: gapPx },
    },
  };
}

/**
 * @param {ParentNode} [root]
 */
export async function initSliders(root = document) {
  /** @type {(() => void)[]} */
  const disposers = [];

  let tns;
  try {
    tns = await ensureTinySlider();
  } catch (err) {
    console.error("[ISG] tiny-slider:", err instanceof Error ? err.message : err);
    return () => {};
  }

  const gapPx = getIsgGapPx();

  root.querySelectorAll(".isg-slider").forEach((slider) => {
    const track = slider.querySelector(".isg-slider__track");
    const prev = slider.querySelector(".isg-slider__btn--prev");
    const next = slider.querySelector(".isg-slider__btn--next");
    const thumb = slider.querySelector(".isg-slider-nav__thumb");
    if (!track || !prev || !next) return;

    const isGallery =
      slider.getAttribute("data-isg-slider") === "gallery" ||
      slider.classList.contains("isg-slider--mode-gallery");
    const opts = isGallery
      ? optionsGallery(track, prev, next, gapPx)
      : optionsTeam(track, prev, next, gapPx);

    /** @type {import("tiny-slider").TinySliderInstance | null} */
    let instance = null;

    try {
      instance = tns(opts);
    } catch (err) {
      console.error("[ISG] tiny-slider init:", err);
      return;
    }

    if (!instance?.events) {
      console.error("[ISG] tiny-slider: нет instance.events");
      return;
    }

    const onIndex = (info) => {
      syncNavThumb(thumb, info ?? instance?.getInfo());
    };

    instance.events.on("indexChanged", onIndex);
    instance.events.on("transitionEnd", onIndex);
    onIndex(instance.getInfo());

    disposers.push(() => {
      try {
        instance?.events?.off?.("indexChanged", onIndex);
        instance?.events?.off?.("transitionEnd", onIndex);
      } catch (_) {
        /* noop */
      }
      try {
        instance?.destroy?.();
      } catch (_) {
        /* noop */
      }
      instance = null;
    });
  });

  return () => {
    while (disposers.length) {
      try {
        disposers.pop()?.();
      } catch (_) {
        /* noop */
      }
    }
  };
}
