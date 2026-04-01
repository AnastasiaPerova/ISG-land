import Swiper from "swiper";
import { Navigation } from "swiper/modules";

function setupSliderDragCursor() {
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  if (!finePointer.matches) {
    return { bind: () => () => {}, destroy: () => {} };
  }

  const el = document.createElement("div");
  el.className = "isg-slider__drag-cursor";
  el.setAttribute("aria-hidden", "true");
  el.textContent = "Drag";
  document.body.appendChild(el);

  /** @type {Set<Element>} */
  const inside = new Set();
  /** @type {Map<Element, { defaultLabel: string; isLightbox: boolean; sliderKey: Element | null }>} */
  const labels = new Map();
  /** @type {WeakMap<Element, { draggedOnce: boolean }>} */
  const sliderStates = new WeakMap();
  const DRAG_SWITCH_PX = 10;

  let raf = 0;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let hasPos = false;
  const SMOOTHING = 0.18;
  const STOP_EPS = 0.15;

  const applyPos = () => {
    const half = 36;
    if (!hasPos) {
      currentX = targetX;
      currentY = targetY;
      hasPos = true;
    } else {
      currentX += (targetX - currentX) * SMOOTHING;
      currentY += (targetY - currentY) * SMOOTHING;
    }

    el.style.setProperty("--isg-cursor-x", `${currentX - half}px`);
    el.style.setProperty("--isg-cursor-y", `${currentY - half}px`);

    const dx = Math.abs(targetX - currentX);
    const dy = Math.abs(targetY - currentY);
    if (dx > STOP_EPS || dy > STOP_EPS) {
      raf = requestAnimationFrame(applyPos);
      return;
    }
    raf = 0;
  };

  const syncDom = () => {
    const on = inside.size > 0;
    let isClickToSee = false;
    if (on) {
      const active = Array.from(inside).at(-1);
      const meta = labels.get(active);
      let label = meta?.defaultLabel || "Drag";
      if (meta?.isLightbox) {
        const state = meta.sliderKey ? sliderStates.get(meta.sliderKey) : null;
        label = state?.draggedOnce ? "click\nto see" : "Drag";
      }
      el.textContent = label;
      isClickToSee = label === "click\nto see";
    }
    el.classList.toggle("isg-slider__drag-cursor--visible", on);
    el.classList.toggle("isg-slider__drag-cursor--click-to-see", on && isClickToSee);
    document.body.classList.toggle("isg-drag-cursor-active", on);
  };

  const isPointInsideTarget = (target, px, py) => {
    const r = target.getBoundingClientRect();
    return px >= r.left && px <= r.right && py >= r.top && py <= r.bottom;
  };

  const onMove = (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
    if (inside.size > 0) {
      const inAnyTarget = Array.from(labels.keys()).some((target) =>
        isPointInsideTarget(target, targetX, targetY),
      );
      if (!inAnyTarget) {
        inside.clear();
        syncDom();
      }
    }
    if (!raf) raf = requestAnimationFrame(applyPos);
  };

  window.addEventListener("pointermove", onMove, { passive: true });

  return {
    bind(slider) {
      const hasLightbox = !!slider.querySelector("[data-isg-lightbox]");
      const label = hasLightbox ? "click\nto see" : "Drag";
      if (hasLightbox && !sliderStates.has(slider)) {
        sliderStates.set(slider, { draggedOnce: false });
      }
      const resetSliderState = () => {
        if (!hasLightbox) return;
        const state = sliderStates.get(slider);
        if (!state) return;
        if (!state.draggedOnce) return;
        state.draggedOnce = false;
        sliderStates.set(slider, state);
      };
      const targets = Array.from(slider.querySelectorAll(".isg-slider-item__img"));
      if (!targets.length) {
        return () => {};
      }

      const handlers = targets.map((target) => {
        labels.set(target, { defaultLabel: label, isLightbox: hasLightbox, sliderKey: slider });
        let downX = 0;
        let downY = 0;
        let down = false;
        let pid = -1;

        const onDown = (e) => {
          if (!hasLightbox) return;
          if (e.pointerType === "mouse" && e.button !== 0) return;
          down = true;
          pid = e.pointerId;
          downX = e.clientX;
          downY = e.clientY;
        };

        const onUp = (e) => {
          if (!hasLightbox) return;
          if (!down || e.pointerId !== pid) return;
          const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
          const state = sliderStates.get(slider);
          if (state && moved > DRAG_SWITCH_PX) {
            state.draggedOnce = true;
            sliderStates.set(slider, state);
            if (inside.has(target)) syncDom();
          }
          down = false;
          pid = -1;
        };

        const onCancel = () => {
          down = false;
          pid = -1;
        };
        const onClick = () => {
          // Lightbox is opened from this click; reset state for next visit.
          resetSliderState();
        };

        const onEnter = () => {
          inside.add(target);
          syncDom();
        };
        const onLeave = () => {
          inside.delete(target);
          syncDom();
        };
        target.addEventListener("pointerdown", onDown);
        document.addEventListener("pointerup", onUp);
        document.addEventListener("pointercancel", onCancel);
        target.addEventListener("click", onClick);
        target.addEventListener("pointerenter", onEnter);
        target.addEventListener("pointerleave", onLeave);
        return { target, onDown, onUp, onCancel, onClick, onEnter, onLeave };
      });

      const onSliderLeave = () => {
        resetSliderState();
        handlers.forEach(({ target }) => inside.delete(target));
        syncDom();
      };
      slider.addEventListener("pointerleave", onSliderLeave);

      return () => {
        slider.removeEventListener("pointerleave", onSliderLeave);
        handlers.forEach(({ target, onDown, onUp, onCancel, onClick, onEnter, onLeave }) => {
          target.removeEventListener("pointerdown", onDown);
          document.removeEventListener("pointerup", onUp);
          document.removeEventListener("pointercancel", onCancel);
          target.removeEventListener("click", onClick);
          target.removeEventListener("pointerenter", onEnter);
          target.removeEventListener("pointerleave", onLeave);
          inside.delete(target);
          labels.delete(target);
        });
        syncDom();
      };
    },
    destroy() {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
      document.body.classList.remove("isg-drag-cursor-active");
      el.remove();
    },
  };
}

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

function getSliderUiState(swiper) {
  if (!swiper) return { current: 1, total: 1 };
  const total = Math.max(1, swiper.snapGrid?.length || swiper.slides?.length || 1);
  const current = Math.max(1, Math.min(total, (swiper.snapIndex ?? 0) + 1));
  return { current, total };
}

function syncNavThumb(thumb, state) {
  if (!thumb || !state) return;
  const { current, total } = state;
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

function teamOptions(gapPx, prev, next) {
  return {
    modules: [Navigation],
    speed: 400,
    loop: false,
    rewind: true,
    grabCursor: true,
    watchOverflow: true,
    slidesPerView: 1,
    spaceBetween: gapPx,
    navigation:
      prev && next
        ? {
            prevEl: prev,
            nextEl: next,
          }
        : undefined,
    breakpoints: {
      560: { slidesPerView: 2, spaceBetween: gapPx },
      1024: { slidesPerView: 3, spaceBetween: gapPx },
    },
  };
}

function galleryOptions(gapPx, prev, next) {
  return {
    modules: [Navigation],
    speed: 400,
    loop: false,
    rewind: true,
    grabCursor: true,
    watchOverflow: true,
    centeredSlides: false,
    slidesPerView: 1.18,
    // Gallery slides are interactive buttons (lightbox trigger),
    // so allow drag from these elements too.
    focusableElements: "input, select, option, textarea, label",
    spaceBetween: gapPx,
    slidesOffsetBefore: 20,
    slidesOffsetAfter: 20,
    navigation:
      prev && next
        ? {
            prevEl: prev,
            nextEl: next,
          }
        : undefined,
    breakpoints: {
      480: { slidesPerView: 1.35, slidesOffsetBefore: 36, slidesOffsetAfter: 36, spaceBetween: gapPx },
      768: { slidesPerView: 2.12, slidesOffsetBefore: 64, slidesOffsetAfter: 64, spaceBetween: gapPx },
      1024: { slidesPerView: 2.14, slidesOffsetBefore: 96, slidesOffsetAfter: 96, spaceBetween: gapPx },
      1400: { slidesPerView: 2.18, slidesOffsetBefore: 120, slidesOffsetAfter: 120, spaceBetween: gapPx },
    },
  };
}

/**
 * @param {ParentNode} [root]
 */
export async function initSliders(root = document) {
  /** @type {(() => void)[]} */
  const disposers = [];
  const gapPx = getIsgGapPx();
  const dragCursorApi = setupSliderDragCursor();

  root.querySelectorAll(".isg-slider").forEach((slider) => {
    const track = slider.querySelector(".isg-slider__track");
    const slides = Array.from(slider.querySelectorAll(".isg-slider__item"));
    const prev = slider.querySelector(".isg-slider__btn--prev");
    const next = slider.querySelector(".isg-slider__btn--next");
    const thumb = slider.querySelector(".isg-slider-nav__thumb");
    if (!track || slides.length === 0) return;

    slider.classList.add("swiper");
    track.classList.add("swiper-wrapper");
    slides.forEach((slide) => slide.classList.add("swiper-slide"));

    const isGallery =
      slider.getAttribute("data-isg-slider") === "gallery" ||
      slider.classList.contains("isg-slider--mode-gallery");

    let swiper = null;
    try {
      swiper = new Swiper(
        slider,
        isGallery ? galleryOptions(gapPx, prev, next) : teamOptions(gapPx, prev, next),
      );
    } catch (err) {
      console.error("[ISG] swiper init:", err);
      return;
    }

    let bar = null;
    let barPrev = null;
    let barNext = null;

    const syncBar = () => {
      const state = getSliderUiState(swiper);
      const hasNav = state.total > 3;

      if (!hasNav) {
        if (bar) {
          bar.remove();
          bar = null;
          barPrev = null;
          barNext = null;
        }
        syncNavThumb(thumb, state);
        return;
      }

      if (!bar) {
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
        slider.appendChild(bar);
        barPrev = bar.querySelector(".isg-slider-bar__arrow--prev");
        barNext = bar.querySelector(".isg-slider-bar__arrow--next");
        barPrev?.addEventListener("click", () => swiper?.slidePrev());
        barNext?.addEventListener("click", () => swiper?.slideNext());
      }

      const barProgress = bar.querySelector(".isg-slider-bar__progress");
      const barCounter = bar.querySelector(".isg-slider-bar__counter");
      if (!barProgress || !barCounter) return;

      syncNavThumb(thumb, state);
      barCounter.textContent = `${state.current}\u2009/\u2009${state.total}`;
      const pct = state.total <= 1 ? 100 : (state.current / state.total) * 100;
      barProgress.style.width = `${pct}%`;
    };

    swiper.on("slideChange", syncBar);
    swiper.on("transitionEnd", syncBar);
    swiper.on("resize", syncBar);
    swiper.on("breakpoint", syncBar);
    syncBar();

    const unbindDragCursor = dragCursorApi.bind(slider);

    disposers.push(() => {
      unbindDragCursor();
      try {
        swiper?.off("slideChange", syncBar);
        swiper?.off("transitionEnd", syncBar);
        swiper?.off("resize", syncBar);
        swiper?.off("breakpoint", syncBar);
      } catch (_) {
        /* noop */
      }
      if (bar) bar.remove();
      try {
        swiper?.destroy(true, true);
      } catch (_) {
        /* noop */
      }
      swiper = null;
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
    dragCursorApi.destroy();
  };
}
