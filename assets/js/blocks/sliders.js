/**
 * Sliders .isg-slider on tiny-slider (`tns` from assets/js/vendor/tiny-slider.min.js).
 */

import { ensureTinySlider } from "../vendor/tiny-slider-load.js";

/**
 * tiny-slider gutter in px from `--isg-gap`.
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
function getSliderUiState(info) {
  if (!info) {
    return { current: 1, total: 1 };
  }

  const total =
    typeof info.pages === "number" && info.pages > 0
      ? info.pages
      : Math.max(1, info.slideCount || 1);

  const current =
    typeof info.navCurrentIndex === "number"
      ? info.navCurrentIndex + 1
      : typeof info.displayIndex === "number"
        ? Math.max(1, Math.min(total, info.displayIndex))
        : Math.max(1, Math.min(total, (info.index ?? 0) + 1));

  return { current, total };
}

/** @param {import("tiny-slider").TinySliderInfo | undefined} info */
function syncNavThumb(thumb, info) {
  if (!thumb || !info) return;
  const { current, total } = getSliderUiState(info);
  if (total <= 1) {
    thumb.style.width = "100%";
    thumb.style.marginLeft = "0";
    return;
  }

  const idx0 = Math.max(0, Math.min(total - 1, current - 1));
  const thumbW = 30;
  const travel = 100 - thumbW;
  const progress = idx0 / (total - 1);
  thumb.style.width = `${thumbW}%`;
  thumb.style.marginLeft = `${progress * travel}%`;
}

function optionsTeam(track, prev, next, gapPx) {
  const opts = {
    container: track,
    mode: "carousel",
    axis: "horizontal",
    center: false,
    items: 3,
    slideBy: 1,
    gutter: gapPx,
    speed: 400,
    loop: false,
    rewind: true,
    mouseDrag: true,
    swipeAngle: 15,
    controls: !!(prev && next),
    nav: false,
    autoplay: false,
    preventScrollOnTouch: "auto",
    freezable: false,
    responsive: {
      0: { items: 1, gutter: gapPx },
      560: { items: 2, gutter: gapPx },
      1024: { items: 3, gutter: gapPx },
    },
  };
  if (prev && next) {
    opts.prevButton = prev;
    opts.nextButton = next;
  }
  return opts;
}

function optionsGallery(track, prev, next, gapPx) {
  const opts = {
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
    loop: false,
    rewind: true,
    mouseDrag: true,
    swipeAngle: 15,
    controls: !!(prev && next),
    nav: false,
    autoplay: false,
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
  if (prev && next) {
    opts.prevButton = prev;
    opts.nextButton = next;
  }
  return opts;
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
    if (!track) return;

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
      console.error("[ISG] tiny-slider: no instance.events");
      return;
    }

    const slideCount = instance.getInfo()?.slideCount ?? 0;
    const hasNav = slideCount > 3;

    let bar = null;
    let syncBar = null;

    if (hasNav) {
      bar = document.createElement("div");
      bar.className = "isg-slider-bar";
      bar.innerHTML = [
        '<div class="isg-slider-bar__line"><div class="isg-slider-bar__progress"></div></div>',
        '<div class="isg-slider-bar__controls">',
        '<button type="button" class="isg-slider-bar__arrow isg-slider-bar__arrow--prev" aria-label="Previous slide">',
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
        "</button>",
        '<span class="isg-slider-bar__counter"></span>',
        '<button type="button" class="isg-slider-bar__arrow isg-slider-bar__arrow--next" aria-label="Next slide">',
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
        "</button>",
        "</div>",
      ].join("");

      const barProgress = bar.querySelector(".isg-slider-bar__progress");
      const barCounter = bar.querySelector(".isg-slider-bar__counter");
      const barPrev = bar.querySelector(".isg-slider-bar__arrow--prev");
      const barNext = bar.querySelector(".isg-slider-bar__arrow--next");

      slider.appendChild(bar);

      barPrev.addEventListener("click", () => instance?.goTo("prev"));
      barNext.addEventListener("click", () => instance?.goTo("next"));

      syncBar = (info) => {
        const data = info ?? instance?.getInfo();
        if (!data) return;
        syncNavThumb(thumb, data);

        const { current, total } = getSliderUiState(data);
        barCounter.textContent = `${current}\u2009/\u2009${total}`;
        const pct = total <= 1 ? 100 : (current / total) * 100;
        barProgress.style.width = `${pct}%`;
      };

      instance.events.on("indexChanged", syncBar);
      instance.events.on("transitionEnd", syncBar);
      syncBar(instance.getInfo());
    }

    disposers.push(() => {
      if (bar) bar.remove();
      try {
        instance?.events?.off?.("indexChanged", syncBar);
        instance?.events?.off?.("transitionEnd", syncBar);
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
