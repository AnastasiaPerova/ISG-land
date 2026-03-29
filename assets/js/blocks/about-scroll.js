import gsap from "gsap";

/**
 * About: липкий трек как quality-scroll.
 * Два синхронных стека: фоны (слои) и контент внутри фиксированной стеклянной панели —
 * визуально движется только текст/иконки внутри контейнера.
 */

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

function progressForIndex(index, n) {
  if (n <= 1) return 0;
  return clamp01(index / (n - 1));
}

function getScrollY() {
  return window.pageYOffset ?? document.documentElement.scrollTop ?? 0;
}

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
export function initAboutScroll(root = document, options = {}) {
  const getLenis =
    typeof options.getLenis === "function" ? options.getLenis : () => null;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mq = window.matchMedia("(min-width: 1100px)");
  const track = root.querySelector("[data-isg-about-scroll]");
  if (!track) return () => {};

  const items = Array.from(track.querySelectorAll("[data-isg-about-index]"));
  const bgSlides = Array.from(track.querySelectorAll("[data-isg-about-slide]"));
  const contentSlides = Array.from(
    track.querySelectorAll(
      ".isg-about-feature-card__inner [data-isg-about-content-slide]",
    ),
  );
  const markers = Array.from(track.querySelectorAll("[data-isg-about-marker]"));
  const n = bgSlides.length;
  if (n === 0 || items.length !== n || contentSlides.length !== n) {
    return () => {};
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

  const layersEl = track.querySelector("[data-isg-about-mobile-slider]");

  const layoutTrackHeight = () => {
    if (reduced || !mq.matches) {
      track.style.minHeight = "";
      return;
    }
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

  /**
   * @param {Element[]} elements
   */
  const setSlidesStack = (elements, pFloat) => {
    const t = clamp01(pFloat) * Math.max(1, n - 1);
    elements.forEach((el, i) => {
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
      el.classList.toggle("isg-about-value-item--active", on);
      el.setAttribute("aria-pressed", on ? "true" : "false");
    });
    bgSlides.forEach((el, i) => {
      el.classList.toggle("isg-about-feature-card__layer--active", i === active);
    });
    contentSlides.forEach((el, i) => {
      el.classList.toggle("isg-about-feature-card__content-slide--active", i === active);
    });
  };

  const applyFrame = (progress) => {
    const p = clamp01(progress);
    setActiveItem(p);
    if (!mq.matches) return;
    setSlidesStack(bgSlides, p);
    setSlidesStack(contentSlides, p);
  };

  const syncFromScroll = () => {
    if (reduced || !mq.matches) return;
    applyFrame(trackProgress01());
  };

  const goToIndex = (index) => {
    const idx = Math.max(0, Math.min(n - 1, Number(index)));
    if (reduced || !mq.matches) {
      applyFrame(progressForIndex(idx, n));
      const slide = bgSlides[idx];
      if (!mq.matches && layersEl && slide) {
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

  const syncActiveFromLayersScroll = () => {
    if (!layersEl || bgSlides.length === 0) return;
    const root = layersEl.getBoundingClientRect();
    const centerX = root.left + root.width / 2;
    let best = 0;
    let bestDist = Infinity;
    bgSlides.forEach((slide, i) => {
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

  const setupMobileLayersScroll = () => {
    clearMobile();
    if (!layersEl || mq.matches) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        syncActiveFromLayersScroll();
      });
    };

    layersEl.addEventListener("scroll", onScroll, { passive: true });
    mobileOff.push(() => layersEl.removeEventListener("scroll", onScroll));

    const onResize = () => syncActiveFromLayersScroll();
    window.addEventListener("resize", onResize);
    mobileOff.push(() => window.removeEventListener("resize", onResize));

    requestAnimationFrame(() => syncActiveFromLayersScroll());
  };

  const build = () => {
    clearDesktop();
    clearMobile();

    if (reduced || !mq.matches) {
      [...bgSlides, ...contentSlides].forEach((el) => {
        gsap.set(el, { clearProps: "transform,opacity,visibility,zIndex" });
      });
      items.forEach((el, i) => {
        el.classList.toggle("isg-about-value-item--active", i === 0);
        el.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      });
      bgSlides.forEach((el, i) => {
        el.classList.toggle("isg-about-feature-card__layer--active", i === 0);
      });
      contentSlides.forEach((el, i) => {
        el.classList.toggle("isg-about-feature-card__content-slide--active", i === 0);
      });
      if (!mq.matches) {
        setupMobileLayersScroll();
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
    }
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
    const raw = e.currentTarget.getAttribute("data-isg-about-index");
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
    [...bgSlides, ...contentSlides].forEach((el) =>
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
