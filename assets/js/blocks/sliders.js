import gsap from "gsap";
import Swiper from "swiper";
import { Navigation } from "swiper/modules";

const COMPACT_SLIDER_QUERY = "(max-width: 1099px)";

function isCompactSliderViewport() {
  return window.matchMedia(COMPACT_SLIDER_QUERY).matches;
}

function shouldUseStaticSliderReveal() {
  return (
    isCompactSliderViewport() ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

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

  
  const targets = new Map();

  let raf = 0;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let hasPos = false;
  let sizeHalf = 49;
  let visible = false;
  let activeTarget = null;
  let destroyed = false;
  let scrollRaf = 0;
  const SMOOTHING = 0.16;
  const STOP_EPS = 0.2;

  const recalcSize = () => {
    sizeHalf = el.offsetWidth * 0.5 || 49;
  };

  const show = (target) => {
    activeTarget = target;
    const meta = targets.get(target);
    el.textContent = meta?.label || "Drag";
    if (visible) return;
    visible = true;
    el.classList.add("isg-slider__drag-cursor--visible");
    el.classList.remove("isg-slider__drag-cursor--click-to-see");
    document.body.classList.add("isg-drag-cursor-active");
  };

  const hide = () => {
    activeTarget = null;
    if (!visible) return;
    visible = false;
    el.classList.remove("isg-slider__drag-cursor--visible", "isg-slider__drag-cursor--click-to-see");
    document.body.classList.remove("isg-drag-cursor-active");
  };

  const queueFrame = () => {
    if (!raf && visible) {
      raf = requestAnimationFrame(tick);
    }
  };

  function tick() {
    raf = 0;
    if (!visible) return;

    if (!hasPos) {
      currentX = targetX;
      currentY = targetY;
      hasPos = true;
    } else {
      currentX += (targetX - currentX) * SMOOTHING;
      currentY += (targetY - currentY) * SMOOTHING;
    }

    el.style.setProperty("--isg-cursor-x", `${currentX - sizeHalf}px`);
    el.style.setProperty("--isg-cursor-y", `${currentY - sizeHalf}px`);

    const dx = Math.abs(targetX - currentX);
    const dy = Math.abs(targetY - currentY);
    if (dx > STOP_EPS || dy > STOP_EPS) {
      raf = requestAnimationFrame(tick);
    }
  }

  const findBoundTarget = (node) => {
    if (!(node instanceof Element)) return null;

    const direct = node.closest(".isg-slider__track.swiper-wrapper, .isg-slider__track");
    if (direct && targets.has(direct)) return direct;

    const slider = node.closest(".isg-slider");
    if (!slider) return null;

    for (const target of targets.keys()) {
      if (slider.contains(target)) return target;
    }
    return null;
  };

  const activateFromNode = (node) => {
    const nextTarget = findBoundTarget(node);
    if (nextTarget) {
      show(nextTarget);
      queueFrame();
      return;
    }
    hide();
  };

  const onMove = (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
    activateFromNode(document.elementFromPoint(targetX, targetY));
  };

  const syncFromPoint = () => {
    if (!hasPos) return;
    activateFromNode(document.elementFromPoint(targetX, targetY));
  };

  const queueScrollSync = () => {
    if (scrollRaf || !hasPos) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0;
      syncFromPoint();
    });
  };

  const onPointerEnd = () => {
    syncFromPoint();
  };

  const onLeaveViewport = () => {
    hide();
  };

  const onVisibilityChange = () => {
    if (document.visibilityState !== "visible") {
      hide();
    }
  };

  const onResize = () => {
    recalcSize();
    if (visible) queueFrame();
  };

  recalcSize();
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerup", onPointerEnd, { passive: true });
  window.addEventListener("pointercancel", onPointerEnd, { passive: true });
  window.addEventListener("scroll", queueScrollSync, { passive: true });
  window.addEventListener("blur", onLeaveViewport);
  window.addEventListener("resize", onResize, { passive: true });
  document.addEventListener("visibilitychange", onVisibilityChange);

  return {
    bind(slider) {
      if (destroyed) return () => {};

      const label = "Drag";
      const sliderTargets = Array.from(
        new Set(
          Array.from(
            slider.querySelectorAll(".isg-slider__track.swiper-wrapper, .isg-slider__track"),
          ),
        ),
      );
      if (!sliderTargets.length) {
        return () => {};
      }

      sliderTargets.forEach((target) => {
        targets.set(target, { label });
      });

      const onPointerEnter = (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
        activateFromNode(e.target);
      };

      const onPointerLeave = (e) => {
        const nextTarget = e.relatedTarget instanceof Element ? findBoundTarget(e.relatedTarget) : null;
        if (!nextTarget) {
          hide();
        }
      };

      const onPointerDown = (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
        activateFromNode(e.target);
      };

      slider.addEventListener("pointerenter", onPointerEnter, true);
      slider.addEventListener("pointerleave", onPointerLeave, true);
      slider.addEventListener("pointerdown", onPointerDown, true);

      return () => {
        slider.removeEventListener("pointerenter", onPointerEnter, true);
        slider.removeEventListener("pointerleave", onPointerLeave, true);
        slider.removeEventListener("pointerdown", onPointerDown, true);
        sliderTargets.forEach((target) => {
          targets.delete(target);
          if (activeTarget === target) {
            hide();
          }
        });
      };
    },
    destroy() {
      destroyed = true;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onPointerEnd);
      window.removeEventListener("pointercancel", onPointerEnd);
      window.removeEventListener("scroll", queueScrollSync);
      window.removeEventListener("blur", onLeaveViewport);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (raf) cancelAnimationFrame(raf);
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      hide();
      el.remove();
    },
  };
}

function getCssVarPx(name, fallback = 0) {
  const probe = document.createElement("div");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.width = `var(${name})`;
  document.body.appendChild(probe);

  const width = parseFloat(getComputedStyle(probe).width);
  probe.remove();

  if (Number.isFinite(width)) {
    return Math.max(0, Math.round(width));
  }

  return fallback;
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
  const compact = isCompactSliderViewport();
  return {
    modules: [Navigation],
    speed: compact ? 300 : 400,
    loop: false,
    rewind: true,
    grabCursor: true,
    passiveListeners: true,
    touchStartPreventDefault: false,
    threshold: compact ? 8 : 4,
    resistanceRatio: compact ? 0.42 : 0.85,
    watchOverflow: true,
    slidesPerView: compact ? 1.1 : 1.1,
    slidesPerGroup: 1,
    longSwipesRatio: compact ? 0.18 : 0.5,
    spaceBetween: gapPx,
    navigation:
      prev && next
        ? {
            prevEl: prev,
            nextEl: next,
          }
        : undefined,
    breakpoints: compact
      ? {}
      : {
          560: { slidesPerView: 2.2, spaceBetween: gapPx },
          1100: { slidesPerView: 3, spaceBetween: gapPx },
        },
  };
}

function galleryOptions(gapPx, prev, next) {
  const compact = isCompactSliderViewport();
  return {
    modules: [Navigation],
    speed: compact ? 300 : 420,
    loop: false,
    rewind: true,
    grabCursor: true,
    allowTouchMove: true,
    passiveListeners: true,
    touchStartPreventDefault: false,
    threshold: compact ? 6 : 4,
    resistanceRatio: compact ? 0.35 : 0.45,
    watchOverflow: true,
    freeMode: false,
    centeredSlides: false,
    slidesPerGroup: 1,
    slidesPerGroupSkip: 0,
    followFinger: true,
    shortSwipes: true,
    longSwipes: true,
    longSwipesRatio: compact ? 0.18 : 0.22,
    longSwipesMs: 220,
    touchRatio: compact ? 1.12 : 1,
    touchAngle: 36,
    nested: true,
    preventClicks: true,
    preventClicksPropagation: true,
    slideToClickedSlide: false,
    slidesPerView: 1.18,
    
    
    focusableElements: "input, select, option, textarea, label",
    spaceBetween: gapPx,
    slidesOffsetBefore: 0,
    slidesOffsetAfter: 0,
    navigation:
      prev && next
        ? {
            prevEl: prev,
            nextEl: next,
          }
        : undefined,
    breakpoints: {
      480: { slidesPerView: 1.28, slidesOffsetBefore: 0, slidesOffsetAfter: 0, spaceBetween: gapPx },
      768: { slidesPerView: 1.5, slidesOffsetBefore: 0, slidesOffsetAfter: 0, spaceBetween: gapPx },
      1100: { slidesPerView: 2.12, slidesOffsetBefore: 0, slidesOffsetAfter: 0, spaceBetween: gapPx },
      1440: { slidesPerView: 2.18, slidesOffsetBefore: 0, slidesOffsetAfter: 0, spaceBetween: gapPx },
    },
  };
}

function bindSliderReveal(slider, swiper, onReady = () => {}) {
  const items = Array.from(slider.querySelectorAll(".isg-slider__item.swiper-slide")).filter(
    (el) => !el.classList.contains("swiper-slide-duplicate"),
  );
  if (shouldUseStaticSliderReveal()) {
    gsap.set(slider, { clearProps: "opacity" });
    gsap.set(items, { clearProps: "opacity,transform,filter,transformOrigin" });
    onReady();
    return () => {};
  }
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
  if (shouldUseStaticSliderReveal()) {
    gsap.set(cards, { clearProps: "opacity,transform,filter,transformOrigin" });
    onReady();
    return () => {};
  }
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
    clipPath: "inset(18% 0% 82% 0% round var(--isg-ui-br))",
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
          clipPath: "inset(0% 0% 0% 0% round var(--isg-ui-br))",
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




export async function initSliders(root = document) {
  
  const disposers = [];
  const gapPx = getCssVarPx("--isg-card-gap", 16);
  const dragCursorApi = setupSliderDragCursor();
  const compactUi = window.matchMedia(COMPACT_SLIDER_QUERY);

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
      if (compactUi.matches) {
        if (bar) {
          bar.remove();
          bar = null;
          barPrev = null;
          barNext = null;
        }
        syncNavThumb(thumb, state);
        return;
      }
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
    const unbindSliderReveal = isGallery
      ? bindSliderReveal(slider, swiper)
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
        
      }
      if (bar) bar.remove();
      try {
        swiper?.destroy(true, true);
      } catch (_) {
        
      }
      swiper = null;
    });
  });

  return () => {
    while (disposers.length) {
      try {
        disposers.pop()?.();
      } catch (_) {
        
      }
    }
    dragCursorApi.destroy();
  };
}
