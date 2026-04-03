import gsap from "gsap";
import Swiper from "swiper";
import { Autoplay, FreeMode, Navigation } from "swiper/modules";

function setupSliderDragCursor() {
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const mobileViewport = matchMedia("(max-width: 1099px)");
  if (!finePointer.matches || mobileViewport.matches) {
    return { bind: () => () => {}, destroy: () => {} };
  }

  const el = document.createElement("div");
  el.className = "isg-slider__drag-cursor";
  el.setAttribute("aria-hidden", "true");
  el.textContent = "Drag";
  document.body.appendChild(el);

  /** @type {Set<Element>} */
  const inside = new Set();
  /** @type {Map<Element, { defaultLabel: string }>} */
  const labels = new Map();

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
    if (on) {
      const active = Array.from(inside).at(-1);
      const meta = labels.get(active);
      el.textContent = meta?.defaultLabel || "Drag";
    }
    el.classList.toggle("isg-slider__drag-cursor--visible", on);
    el.classList.remove("isg-slider__drag-cursor--click-to-see");
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
      const label = "Drag";
      const targets = Array.from(slider.querySelectorAll(".isg-slider-item__img"));
      if (!targets.length) {
        return () => {};
      }

      const handlers = targets.map((target) => {
        labels.set(target, { defaultLabel: label });

        const onEnter = () => {
          inside.add(target);
          syncDom();
        };
        const onLeave = () => {
          inside.delete(target);
          syncDom();
        };
        target.addEventListener("pointerenter", onEnter);
        target.addEventListener("pointerleave", onLeave);
        return { target, onEnter, onLeave };
      });

      const onSliderLeave = () => {
        handlers.forEach(({ target }) => inside.delete(target));
        syncDom();
      };
      slider.addEventListener("pointerleave", onSliderLeave);

      return () => {
        slider.removeEventListener("pointerleave", onSliderLeave);
        handlers.forEach(({ target, onEnter, onLeave }) => {
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
    slidesPerView: 1.1,
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
    modules: [Navigation, Autoplay, FreeMode],
    speed: 5200,
    loop: true,
    rewind: false,
    grabCursor: true,
    allowTouchMove: true,
    watchOverflow: true,
    freeMode: {
      enabled: true,
      momentum: false,
      minimumVelocity: 0.02,
      sticky: false,
    },
    centeredSlides: false,
    slidesPerView: 1.18,
    // Gallery slides are interactive buttons (lightbox trigger),
    // so allow drag from these elements too.
    focusableElements: "input, select, option, textarea, label",
    spaceBetween: gapPx,
    slidesOffsetBefore: 16,
    slidesOffsetAfter: 20,
    navigation:
      prev && next
        ? {
            prevEl: prev,
            nextEl: next,
          }
        : undefined,
    autoplay: {
      delay: 0,
      disableOnInteraction: false,
      pauseOnMouseEnter: true,
      waitForTransition: true,
    },
    breakpoints: {
      480: { slidesPerView: 1.35, slidesOffsetBefore: 24, slidesOffsetAfter: 36, spaceBetween: gapPx },
      768: { slidesPerView: 2.12, slidesOffsetBefore: 16, slidesOffsetAfter: 64, spaceBetween: gapPx },
      1024: { slidesPerView: 2.14, slidesOffsetBefore: 16, slidesOffsetAfter: 96, spaceBetween: gapPx },
      1400: { slidesPerView: 2.18, slidesOffsetBefore: 30, slidesOffsetAfter: 120, spaceBetween: gapPx },
    },
  };
}

function bindSliderReveal(slider, swiper, onReady = () => {}) {
  const items = Array.from(slider.querySelectorAll(".isg-slider__item.swiper-slide")).filter(
    (el) => !el.classList.contains("swiper-slide-duplicate"),
  );
  if (!items.length) {
    onReady();
    return () => {};
  }

  let hasPlayed = false;
  let rafId = 0;

  gsap.set(slider, { opacity: 0 });
  gsap.set(items, {
    opacity: 0,
    y: 72,
    rotateY: 18,
    rotateZ: -1.4,
    scale: 0.92,
    transformOrigin: "50% 100%",
    filter: "blur(10px)",
  });

  const play = () => {
    if (hasPlayed) return;
    hasPlayed = true;

    const tl = gsap.timeline({
      onComplete: () => {
        onReady();
      },
    });

    tl.to(slider, {
      opacity: 1,
      duration: 0.2,
      ease: "power1.out",
    }).to(
      items,
      {
        opacity: 1,
        y: 0,
        rotateY: 0,
        rotateZ: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 1.15,
        stagger: {
          each: 0.08,
          from: "start",
        },
        ease: "power4.out",
      },
      0,
    );
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        rafId = requestAnimationFrame(play);
      });
    },
    { threshold: 0.15 },
  );

  observer.observe(slider);
  swiper?.autoplay?.stop?.();

  return () => {
    observer.disconnect();
    if (rafId) cancelAnimationFrame(rafId);
    gsap.killTweensOf(slider);
    gsap.killTweensOf(items);
    gsap.set(slider, { clearProps: "opacity" });
    gsap.set(items, { clearProps: "opacity,transform,filter,transformOrigin" });
  };
}

function bindTeamReveal(slider, onReady = () => {}) {
  const cards = Array.from(slider.querySelectorAll(".isg-slider__item.swiper-slide"));
  if (!cards.length) {
    onReady();
    return () => {};
  }

  const images = cards
    .map((card) => card.querySelector(".isg-slider-item__img"))
    .filter((el) => el instanceof HTMLElement);
  const captions = cards
    .map((card) => card.querySelector(".isg-slider-item__caption"))
    .filter((el) => el instanceof HTMLElement);

  let hasPlayed = false;
  let rafId = 0;
  const sectionRoot = slider.closest("[data-isg-block]") || slider.closest("section") || slider.parentElement;
  const sectionHeading = sectionRoot?.querySelector(".isg-section-head__title.isg-h2");
  const headingAnimDelay = sectionHeading?.classList.contains("isg-title-anim") ? 1.25 : 0.45;

  gsap.set(cards, {
    opacity: 0,
    y: 88,
    scale: 0.94,
    rotateX: 8,
    transformOrigin: "50% 100%",
    filter: "blur(8px)",
  });
  gsap.set(images, {
    clipPath: "inset(18% 0% 82% 0% round 20px)",
    y: 34,
    scale: 1.04,
  });
  gsap.set(captions, { opacity: 0, y: 22 });

  const play = () => {
    if (hasPlayed) return;
    hasPlayed = true;
    const tl = gsap.timeline({
      delay: headingAnimDelay,
      onComplete: () => onReady(),
    });

    tl.to(cards, {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      filter: "blur(0px)",
      duration: 1.35,
      stagger: 0.17,
      ease: "expo.out",
    })
      .to(
        images,
        {
          clipPath: "inset(0% 0% 0% 0% round 20px)",
          y: 0,
          scale: 1,
          duration: 1.05,
          stagger: 0.17,
          ease: "expo.out",
        },
        0.18,
      )
      .to(
        captions,
        {
          opacity: 1,
          y: 0,
          duration: 0.78,
          stagger: 0.14,
          ease: "power3.out",
        },
        0.62,
      );
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        rafId = requestAnimationFrame(play);
      });
    },
    { threshold: 0.15 },
  );
  observer.observe(slider);

  return () => {
    observer.disconnect();
    if (rafId) cancelAnimationFrame(rafId);
    gsap.killTweensOf(cards);
    gsap.killTweensOf(images);
    gsap.killTweensOf(captions);
    gsap.set(cards, { clearProps: "opacity,transform,filter,transformOrigin" });
    gsap.set(images, { clearProps: "clipPath,transform" });
    gsap.set(captions, { clearProps: "opacity,transform" });
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

    const sliderMode = slider.getAttribute("data-isg-slider") || "";
    const isGallery = sliderMode === "gallery" || slider.classList.contains("isg-slider--mode-gallery");
    const isTeam = sliderMode === "team";

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
    if (isGallery) {
      swiper.on("touchStart", () => swiper?.autoplay?.stop?.());
      swiper.on("touchEnd", () => swiper?.autoplay?.start?.());
    }
    syncBar();

    const unbindDragCursor = dragCursorApi.bind(slider);
    const unbindSliderReveal = isGallery
      ? bindSliderReveal(slider, swiper, () => {
          swiper?.autoplay?.start?.();
        })
      : isTeam
        ? bindTeamReveal(slider)
        : () => {};

    disposers.push(() => {
      unbindDragCursor();
      unbindSliderReveal();
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
