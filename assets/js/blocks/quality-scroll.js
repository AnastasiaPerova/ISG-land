import gsap from "gsap";

/**
 * Quality slides по принципу блока slides на https://toptier.relats.com/ :
 * — длинный трек, липкая сцена;
 * — прогресс 0…1 вдоль трека: при Lenis — lenis.scroll + только lenis «scroll» (без дубля window);
 * — клик по пункту (аналог .bottom .label): lenis.scrollTo(маркер, { offset: -1, … }).
 *
 * About (`data-isg-quality-about` на треке): те же маски для фото + стек `.isg-about-feature-card__content-stack` (yPercent).
 *
 * ScrollTrigger не используем: с Lenis без scrollerProxy scrub/onUpdate часто расходятся с реальным скроллом.
 */

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

/**
 * Плавное раскрытие маски: smootherstep (Ken Perlin) — нулевые 1-я и 2-я производные на 0/1,
 * мягче, чем ease-in-out cubic/quint, при той же длительности фазы.
 */
function smootherstep(t) {
  const x = clamp01(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/** Соответствует $isg-radius-2xl — скругление в clip-path: inset(… round …) */
const ISG_QUALITY_SLIDE_CLIP_RADIUS = 18;

/**
 * Прогресс стека 0…(n−1): строго линейно от p — наезд картинок 1:1 со скроллом (в т.ч. со сглаживанием Lenis).
 */
function slideTFromProgress01(pFloat, n) {
  const maxT = Math.max(1, n - 1);
  return clamp01(pFloat) * maxT;
}

/** Согласовать с min-height трека и со sticky (svh/dvh в CSS) */
function getViewportHeight() {
  if (typeof window !== "undefined" && window.visualViewport?.height) {
    return window.visualViewport.height;
  }
  return window.innerHeight;
}

function progressForIndex(index, n) {
  if (n <= 1) return 0;
  return clamp01(index / (n - 1));
}

/** Нативный scroll (без Lenis) */
function getScrollY() {
  return window.pageYOffset ?? document.documentElement.scrollTop ?? 0;
}

/**
 * Текущая позиция скролла: с Lenis — lenis.scroll (animatedScroll), иначе DOM.
 * Так trackProgress01 совпадает с тем, что реально отрисовано при сглаженном скролле.
 */
function getScrollYForProgress(getLenis) {
  const lenis = typeof getLenis === "function" ? getLenis() : null;
  if (lenis && typeof lenis.scroll === "number") {
    return lenis.scroll;
  }
  return getScrollY();
}

/** Как `section-anchors` / `scroll-margin`: низ фикс. хедера (px) */
function getHeaderScrollOffset() {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--isg-sticky-header-offset")
    .trim();
  const v = parseFloat(raw);
  return Number.isFinite(v) ? v : 88;
}

/**
 * Один трек `[data-isg-quality-scroll]`.
 * @param {Element} track
 * @param {{ getLenis?: () => { on: Function; off: Function; scrollTo: Function } | null }} [options]
 */
function initOneQualityScrollTrack(track, options = {}) {
  const getLenis =
    typeof options.getLenis === "function" ? options.getLenis : () => null;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mq = window.matchMedia("(min-width: 1100px)");

  const items = Array.from(track.querySelectorAll("[data-isg-quality-index]"));
  const slides = Array.from(track.querySelectorAll("[data-isg-quality-slide]"));
  const markers = Array.from(track.querySelectorAll("[data-isg-quality-marker]"));
  const n = slides.length;
  if (n === 0 || items.length !== n) {
    return () => {};
  }

  const aboutTrack = track.hasAttribute("data-isg-quality-about");
  let contentStackSlides = [];
  if (aboutTrack) {
    contentStackSlides = Array.from(
      track.querySelectorAll(
        ".isg-about-feature-card__content-stack [data-isg-about-content-slide]",
      ),
    );
    if (contentStackSlides.length !== n) {
      contentStackSlides = [];
    }
  }

  /** @type {(() => void)[]} */
  const disposers = [];
  /** @type {(() => void)[]} */
  let desktopOff = [];
  /** @type {(() => void)[]} */
  let mobileOff = [];

  const clearDesktop = () => {
    while (desktopOff.length) {
      try {
        desktopOff.pop()();
      } catch (_) {
        /* noop */
      }
    }
  };

  const clearMobile = () => {
    while (mobileOff.length) {
      try {
        mobileOff.pop()();
      } catch (_) {
        /* noop */
      }
    }
  };

  const slidesScrollEl = track.querySelector("[data-isg-quality-mobile-slider]");

  const layoutTrackHeight = () => {
    if (reduced || !mq.matches) {
      track.style.minHeight = "";
      return;
    }
    /**
     * Нужно: span = end − start = (H − vh + header) = (n − 1) × vh (ровно n−1 «экрана» скролла).
     * vh — тот же источник, что в trackProgress01 (visualViewport при наличии).
     */
    const vh = getViewportHeight();
    const header = getHeaderScrollOffset();
    const h = Math.max(0, n * vh - header);
    track.style.minHeight = `${Math.max(vh, h)}px`;
  };

  const layoutMarkers = () => {
    if (markers.length !== n) return;
    const trackH = track.offsetHeight;
    const vh = getViewportHeight();
    const header = getHeaderScrollOffset();
    const span = Math.max(1, trackH - vh + header);
    markers.forEach((el, i) => {
      const p = progressForIndex(i, n);
      el.style.top = `${p * span}px`;
    });
  };

  /**
   * Прогресс 0…1: зона «липкости» от момента, когда верх трека — под хедером,
   * до момента, когда низ трека — у низа вьюпорта (как на Relats), без лишнего хвоста.
   */
  const trackProgress01 = () => {
    const sy = getScrollYForProgress(getLenis);
    const rect = track.getBoundingClientRect();
    const trackTop = rect.top + sy;
    const trackBottom = rect.bottom + sy;
    const vh = getViewportHeight();
    const header = getHeaderScrollOffset();
    const start = trackTop - header;
    const end = trackBottom - vh;
    const span = end - start;
    if (!Number.isFinite(span) || Math.abs(span) < 1) return 0;
    return clamp01((sy - start) / span);
  };

  const setSlidesStackFromT = (t) => {
    slides.forEach((el, i) => {
      const raw = i === 0 ? 0 : clamp01(i - t);
      const eased = reduced ? raw : smootherstep(raw);
      const reveal = i === 0 ? 0 : 100 * eased;
      const below = reveal >= 99.98;
      /** Маска снизу + скругление (round), плавность через smootherstep на raw */
      const clipPath =
        i === 0
          ? "none"
          : `inset(0 0 ${reveal}% 0 round ${ISG_QUALITY_SLIDE_CLIP_RADIUS}px)`;
      gsap.set(el, {
        yPercent: 0,
        clipPath,
        zIndex: i + 1,
        opacity: below ? 0 : 1,
        visibility: below ? "hidden" : "visible",
        force3D: true,
      });
    });
  };

  /** Стеклянная панель About: yPercent, как в прежнем about-scroll */
  /** Стеклянная панель About: смена сверху вниз (yPercent −100→0), ушедший слайд вниз (100). */
  const setContentStackFromT = (t) => {
    if (!contentStackSlides.length) return;
    contentStackSlides.forEach((el, i) => {
      if (i === 0) {
        gsap.set(el, {
          yPercent: 0,
          zIndex: i + 1,
          opacity: 1,
          visibility: "visible",
          force3D: true,
        });
        return;
      }
      if (t > i) {
        gsap.set(el, {
          yPercent: 100,
          zIndex: i + 1,
          opacity: 0,
          visibility: "hidden",
          force3D: true,
        });
        return;
      }
      const raw = clamp01(i - t);
      const eased = reduced ? raw : smootherstep(raw);
      const yPercent = -100 * eased;
      const farAbove = yPercent <= -99.98;
      gsap.set(el, {
        yPercent,
        zIndex: i + 1,
        opacity: farAbove ? 0 : 1,
        visibility: farAbove ? "hidden" : "visible",
        force3D: true,
      });
    });
  };

  const setActiveItemFromT = (t) => {
    const active = Math.min(n - 1, Math.max(0, Math.round(t)));
    items.forEach((el, i) => {
      const on = i === active;
      el.classList.toggle("isg-quality-list-item--active", on);
      el.setAttribute("aria-pressed", on ? "true" : "false");
    });
    slides.forEach((el, i) => {
      el.classList.toggle("isg-quality-visual__slide--active", i === active);
    });
    contentStackSlides.forEach((el, i) => {
      el.classList.toggle("isg-about-feature-card__content-slide--active", i === active);
    });
  };

  const setActiveItem = (pFloat) => {
    setActiveItemFromT(slideTFromProgress01(pFloat, n));
  };

  const applyFrame = (progress) => {
    const p = clamp01(progress);
    const t = slideTFromProgress01(p, n);
    setActiveItemFromT(t);
    if (!mq.matches) return;
    setSlidesStackFromT(t);
    setContentStackFromT(t);
  };

  const syncFromScroll = () => {
    if (reduced || !mq.matches) return;
    applyFrame(trackProgress01());
  };

  const goToIndex = (index) => {
    const idx = Math.max(0, Math.min(n - 1, Number(index)));
    if (reduced || !mq.matches) {
      applyFrame(progressForIndex(idx, n));
      const slide = slides[idx];
      if (!mq.matches && slidesScrollEl && slide) {
        slide.scrollIntoView({
          behavior: reduced ? "auto" : "smooth",
          block: "nearest",
          inline: "center",
        });
      }
      return;
    }
    const marker = markers[idx];
    const lenis = getLenis();
    if (lenis && marker) {
      lenis.scrollTo(marker, {
        offset: -getHeaderScrollOffset(),
        duration: 1.35,
        force: true,
        easing: (x) => 1 - (1 - x) ** 4,
        onComplete: () => {
          applyFrame(trackProgress01());
        },
      });
      return;
    }
    if (marker) {
      const sy = getScrollYForProgress(getLenis);
      const rect = marker.getBoundingClientRect();
      const y = Math.max(0, rect.top + sy - getHeaderScrollOffset());
      window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
      requestAnimationFrame(() => applyFrame(trackProgress01()));
      return;
    }
    applyFrame(progressForIndex(idx, n));
  };

  const syncActiveFromSlidesScroll = () => {
    if (!slidesScrollEl || slides.length === 0) return;
    const root = slidesScrollEl.getBoundingClientRect();
    const centerX = root.left + root.width / 2;
    let best = 0;
    let bestDist = Infinity;
    slides.forEach((slide, i) => {
      const r = slide.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const d = Math.abs(cx - centerX);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setActiveItem(progressForIndex(best, n));
  };

  const setupMobileSlidesScroll = () => {
    clearMobile();
    if (!slidesScrollEl || mq.matches) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        syncActiveFromSlidesScroll();
      });
    };

    slidesScrollEl.addEventListener("scroll", onScroll, { passive: true });
    mobileOff.push(() => slidesScrollEl.removeEventListener("scroll", onScroll));

    const onResize = () => syncActiveFromSlidesScroll();
    window.addEventListener("resize", onResize);
    mobileOff.push(() => window.removeEventListener("resize", onResize));

    requestAnimationFrame(() => syncActiveFromSlidesScroll());
  };

  const build = () => {
    clearDesktop();
    clearMobile();

    if (reduced || !mq.matches) {
      slides.forEach((el) => {
        gsap.set(el, { clearProps: "transform,clipPath,opacity,visibility,zIndex" });
      });
      contentStackSlides.forEach((el) => {
        gsap.set(el, { clearProps: "transform,opacity,visibility,zIndex" });
      });
      items.forEach((el, i) => {
        el.classList.toggle("isg-quality-list-item--active", i === 0);
        el.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      });
      slides.forEach((el, i) => {
        el.classList.toggle("isg-quality-visual__slide--active", i === 0);
      });
      contentStackSlides.forEach((el, i) => {
        el.classList.toggle("isg-about-feature-card__content-slide--active", i === 0);
      });
      if (!mq.matches) {
        setupMobileSlidesScroll();
      }
      return;
    }

    layoutTrackHeight();
    layoutMarkers();
    applyFrame(trackProgress01());

    const lenis = getLenis();
    if (lenis) {
      lenis.on("scroll", syncFromScroll);
      desktopOff.push(() => lenis.off("scroll", syncFromScroll));
    } else {
      window.addEventListener("scroll", syncFromScroll, { passive: true });
      desktopOff.push(() =>
        window.removeEventListener("scroll", syncFromScroll),
      );
    }

    const onResize = () => {
      layoutTrackHeight();
      layoutMarkers();
      syncFromScroll();
    };
    window.addEventListener("resize", onResize);
    desktopOff.push(() => window.removeEventListener("resize", onResize));

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", onResize);
      desktopOff.push(() =>
        window.visualViewport.removeEventListener("resize", onResize),
      );
    }

    const ro = new ResizeObserver(onResize);
    ro.observe(track);
    desktopOff.push(() => ro.disconnect());
  };

  build();

  const onItemClick = (e) => {
    const raw = e.currentTarget.getAttribute("data-isg-quality-index");
    const idx = raw == null ? NaN : Number.parseInt(raw, 10);
    if (Number.isNaN(idx)) return;
    goToIndex(idx);
  };
  items.forEach((el) => {
    el.addEventListener("click", onItemClick);
    disposers.push(() => el.removeEventListener("click", onItemClick));
  });

  if (!reduced) {
    mq.addEventListener("change", build);
    disposers.push(() => mq.removeEventListener("change", build));
  }

  disposers.push(() => {
    clearDesktop();
    clearMobile();
    track.style.minHeight = "";
    slides.forEach((el) =>
      gsap.set(el, { clearProps: "transform,clipPath,opacity,visibility,zIndex" }),
    );
    contentStackSlides.forEach((el) =>
      gsap.set(el, { clearProps: "transform,opacity,visibility,zIndex" }),
    );
  });

  requestAnimationFrame(() => {
    layoutTrackHeight();
    layoutMarkers();
    syncFromScroll();
  });

  return () => {
    disposers.forEach((fn) => fn());
  };
}

/**
 * Все треки `[data-isg-quality-scroll]` внутри root (Quality + About values).
 * @param {ParentNode} [root]
 * @param {{ getLenis?: () => { on: Function; off: Function; scrollTo: Function } | null }} [options]
 */
export function initQualityScroll(root = document, options = {}) {
  const tracks = root.querySelectorAll("[data-isg-quality-scroll]");
  if (!tracks.length) return () => {};
  const offs = [];
  tracks.forEach((track) => {
    offs.push(initOneQualityScrollTrack(track, options));
  });
  return () => {
    offs.forEach((off) => off());
  };
}
