import gsap from "gsap";

/**
 * Quality slides по принципу блока slides на https://toptier.relats.com/ :
 * — длинный трек, липкая сцена;
 * — прогресс 0…1 от document scrollY вдоль трека (корректно с Lenis);
 * — клик по пункту (аналог .bottom .label): lenis.scrollTo(маркер, { offset: -1, … }).
 *
 * ScrollTrigger не используем: с Lenis без scrollerProxy scrub/onUpdate часто расходятся с реальным скроллом.
 */

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

function progressForIndex(index, n) {
  if (n <= 1) return 0;
  return clamp01(index / (n - 1));
}

/** Согласован с getBoundingClientRect(): только DOM scroll, не lenis.scroll */
function getScrollY() {
  return window.pageYOffset ?? document.documentElement.scrollTop ?? 0;
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
 * @param {ParentNode} [root]
 * @param {{ getLenis?: () => { on: Function; off: Function; scrollTo: Function } | null }} [options]
 */
export function initQualityScroll(root = document, options = {}) {
  const getLenis =
    typeof options.getLenis === "function" ? options.getLenis : () => null;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mq = window.matchMedia("(min-width: 1100px)");
  const track = root.querySelector("[data-isg-quality-scroll]");
  if (!track) return () => {};

  const items = Array.from(track.querySelectorAll("[data-isg-quality-index]"));
  const slides = Array.from(track.querySelectorAll("[data-isg-quality-slide]"));
  const markers = Array.from(track.querySelectorAll("[data-isg-quality-marker]"));
  const n = slides.length;
  if (n === 0 || items.length !== n) {
    return () => {};
  }

  /** @type {(() => void)[]} */
  const disposers = [];
  /** @type {(() => void)[]} */
  let desktopOff = [];

  const clearDesktop = () => {
    while (desktopOff.length) {
      try {
        desktopOff.pop()();
      } catch (_) {
        /* noop */
      }
    }
  };

  const layoutTrackHeight = () => {
    if (reduced || !mq.matches) {
      track.style.minHeight = "";
      return;
    }
    /**
     * Нужно: span = end − start = (H − vh + header) = (n − 1) × vh (ровно n−1 «экрана» скролла).
     * При H = n×vh получалось span = (n−1)×vh + header — лишняя прокрутка после последнего слайда.
     */
    const vh = window.innerHeight;
    const header = getHeaderScrollOffset();
    const h = Math.max(0, n * vh - header);
    track.style.minHeight = `${Math.max(vh, h)}px`;
  };

  const layoutMarkers = () => {
    if (markers.length !== n) return;
    const trackH = track.offsetHeight;
    const vh = window.innerHeight;
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
    const sy = getScrollY();
    const rect = track.getBoundingClientRect();
    const trackTop = rect.top + sy;
    const trackBottom = rect.bottom + sy;
    const vh = window.innerHeight;
    const header = getHeaderScrollOffset();
    const start = trackTop - header;
    const end = trackBottom - vh;
    const span = end - start;
    if (!Number.isFinite(span) || Math.abs(span) < 1) return 0;
    return clamp01((sy - start) / span);
  };

  const setSlidesStack = (pFloat) => {
    const t = clamp01(pFloat) * Math.max(1, n - 1);
    slides.forEach((el, i) => {
      const yPercent = i === 0 ? 0 : 100 * clamp01(i - t);
      const below = yPercent >= 99.5;
      gsap.set(el, {
        yPercent,
        zIndex: i + 1,
        opacity: 1,
        visibility: below ? "hidden" : "visible",
        force3D: true,
      });
    });
  };

  const setActiveItem = (pFloat) => {
    const t = clamp01(pFloat) * Math.max(1, n - 1);
    const active = Math.round(t);
    items.forEach((el, i) => {
      const on = i === active;
      el.classList.toggle("isg-quality-list-item--active", on);
      el.setAttribute("aria-pressed", on ? "true" : "false");
    });
    slides.forEach((el, i) => {
      el.classList.toggle("isg-quality-visual__slide--active", i === active);
    });
  };

  const applyFrame = (progress) => {
    const p = clamp01(progress);
    setActiveItem(p);
    setSlidesStack(p);
  };

  const syncFromScroll = () => {
    if (reduced || !mq.matches) return;
    applyFrame(trackProgress01());
  };

  const goToIndex = (index) => {
    const idx = Math.max(0, Math.min(n - 1, Number(index)));
    if (reduced || !mq.matches) {
      applyFrame(progressForIndex(idx, n));
      return;
    }
    const marker = markers[idx];
    const lenis = getLenis();
    if (lenis && marker) {
      lenis.scrollTo(marker, {
        offset: -getHeaderScrollOffset(),
        duration: 1.15,
        force: true,
        easing: (t) => 1 - (1 - t) ** 3,
        onComplete: () => {
          applyFrame(trackProgress01());
        },
      });
      return;
    }
    if (marker) {
      const sy = getScrollY();
      const rect = marker.getBoundingClientRect();
      const y = Math.max(0, rect.top + sy - getHeaderScrollOffset());
      window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
      requestAnimationFrame(() => applyFrame(trackProgress01()));
      return;
    }
    applyFrame(progressForIndex(idx, n));
  };

  const build = () => {
    clearDesktop();

    if (reduced || !mq.matches) {
      slides.forEach((el, i) => {
        gsap.set(el, {
          yPercent: i === 0 ? 0 : 100,
          zIndex: i + 1,
          opacity: 1,
          visibility: i === 0 ? "visible" : "hidden",
          force3D: true,
        });
      });
      items.forEach((el, i) => {
        el.classList.toggle("isg-quality-list-item--active", i === 0);
        el.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      });
      slides.forEach((el, i) => {
        el.classList.toggle("isg-quality-visual__slide--active", i === 0);
      });
      return;
    }

    layoutTrackHeight();
    layoutMarkers();
    applyFrame(trackProgress01());

    const lenis = getLenis();
    if (lenis) {
      lenis.on("scroll", syncFromScroll);
      desktopOff.push(() => lenis.off("scroll", syncFromScroll));
    }
    /* Резерв: нативный scroll (Lenis всё равно двигает documentElement; часть окружений не эмитит то же, что нужно для синка) */
    window.addEventListener("scroll", syncFromScroll, { passive: true });
    desktopOff.push(() =>
      window.removeEventListener("scroll", syncFromScroll),
    );

    const onResize = () => {
      layoutTrackHeight();
      layoutMarkers();
      syncFromScroll();
    };
    window.addEventListener("resize", onResize);
    desktopOff.push(() => window.removeEventListener("resize", onResize));

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
    track.style.minHeight = "";
    slides.forEach((el) =>
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
