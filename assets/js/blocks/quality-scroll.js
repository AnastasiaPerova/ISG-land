import gsap from "gsap";
















function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}


function findBestIndexCentered(container, elements) {
  if (!container || !elements.length) return 0;
  const root = container.getBoundingClientRect();
  const centerX = root.left + root.width / 2;
  let best = 0;
  let bestDist = Infinity;
  elements.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const d = Math.abs(cx - centerX);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  });
  return best;
}


function scrollChildToCenter(container, child, behavior = "auto") {
  if (!container || !child) return;
  const cr = container.getBoundingClientRect();
  const ir = child.getBoundingClientRect();
  const delta = ir.left + ir.width / 2 - (cr.left + cr.width / 2);
  const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
  const next = Math.max(0, Math.min(container.scrollLeft + delta, maxScroll));
  container.scrollTo({ left: next, behavior });
}





function smootherstep(t) {
  const x = clamp01(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
}


const ISG_QUALITY_SLIDE_CLIP_RADIUS = 18;




function slideTFromProgress01(pFloat, n) {
  const maxT = Math.max(1, n - 1);
  return clamp01(pFloat) * maxT;
}


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


function getScrollY() {
  return window.pageYOffset ?? document.documentElement.scrollTop ?? 0;
}





function getScrollYForProgress(getLenis) {
  const lenis = typeof getLenis === "function" ? getLenis() : null;
  if (lenis) {
    if (typeof lenis.scroll === "number") return lenis.scroll;
    if (typeof lenis.animatedScroll === "number") return lenis.animatedScroll;
  }
  return getScrollY();
}


function getHeaderScrollOffset() {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--isg-sticky-header-offset")
    .trim();
  const v = parseFloat(raw);
  return Number.isFinite(v) ? v : 88;
}






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
  const contentStackEl = aboutTrack
    ? track.querySelector(
        ".isg-about-feature-card__inner .isg-about-feature-card__content-stack",
      )
    : null;
  const contentInnerEl = aboutTrack
    ? track.querySelector(
        ".isg-about-feature-card__inner .isg-about-feature-card__content-inner",
      )
    : null;
  let mobileContentStacks = [];
  if (aboutTrack) {
    contentStackSlides = Array.from(
      track.querySelectorAll(
        ".isg-about-feature-card__inner .isg-about-feature-card__content-stack [data-isg-about-content-slide]",
      ),
    );
    if (contentStackSlides.length !== n) {
      contentStackSlides = [];
    }
  }

  const slideImgs = aboutTrack
    ? slides.map((el) => el.querySelector(".isg-quality-visual__slide-img"))
    : [];

  
  const disposers = [];
  
  let desktopOff = [];
  
  let mobileOff = [];

  const clearDesktop = () => {
    while (desktopOff.length) {
      try {
        desktopOff.pop()();
      } catch (_) {
        
      }
    }
  };

  const clearMobile = () => {
    while (mobileOff.length) {
      try {
        mobileOff.pop()();
      } catch (_) {
        
      }
    }
  };

  const slidesScrollEl = track.querySelector("[data-isg-quality-mobile-slider]");
  const listScrollEl =
    track.querySelector("[data-isg-quality-list-scroll]") ||
    track.querySelector(".isg-quality-list");
  const listWrap =
    track.querySelector(".isg-quality-list-wrap") ||
    (items[0] ? items[0].closest(".isg-quality-list-wrap") : null);
  const listCol =
    listWrap?.querySelector(".isg-quality-list") || track.querySelector(".isg-quality-list");
  const listCenter =
    listWrap?.querySelector(".isg-quality-list-center") || track.querySelector(".isg-quality-list-center");

  const layoutListCenter = () => {
    if (!listCenter || !listWrap || aboutTrack || !mq.matches) {
      listCenter?.style.removeProperty("min-height");
      return;
    }
    const labelEl = listWrap.querySelector(".isg-quality-list-wrap__label");
    const skipEl = listWrap.querySelector(".isg-quality-list-wrap__skip");
    const styles = window.getComputedStyle(listWrap);
    const padTop = parseFloat(styles.paddingTop) || 0;
    const padBottom = parseFloat(styles.paddingBottom) || 0;
    const available =
      listWrap.clientHeight -
      padTop -
      padBottom -
      (labelEl?.offsetHeight || 0) -
      (skipEl?.offsetHeight || 0);
    if (available > 0) {
      listCenter.style.minHeight = `${Math.max(0, Math.round(available))}px`;
    } else {
      listCenter.style.removeProperty("min-height");
    }
  };

  const ensureMobileContentStacks = () => {
    const existingMobileStacks = Array.from(
      track.querySelectorAll(".isg-about-feature-card__content-stack--mobile"),
    );

    if (!aboutTrack || mq.matches) {
      existingMobileStacks.forEach((el) => el.remove());
      mobileContentStacks = [];
      return;
    }

    if (!contentStackSlides.length) {
      mobileContentStacks = existingMobileStacks;
      return;
    }

    mobileContentStacks = slides.map((slide, i) => {
      let stack = slide.querySelector(".isg-about-feature-card__content-stack--mobile");
      if (!stack) {
        stack = document.createElement("div");
        stack.className =
          "isg-about-feature-card__content-stack isg-about-feature-card__content-stack--mobile";
        slide.appendChild(stack);
      }

      const clone = contentStackSlides[i]?.cloneNode(true);
      if (clone) {
        clone.classList.add("isg-about-feature-card__content-slide--active");
        stack.replaceChildren(clone);
      } else {
        stack.replaceChildren();
      }

      return stack;
    });
  };

  


  const setListColumnScrollFromT = (tFloat) => {
    if (!listCol || reduced) {
      if (listCol) gsap.set(listCol, { yPercent: 0, force3D: true });
      return;
    }

    const t = Math.min(n - 1, Math.max(0, Number.isFinite(tFloat) ? tFloat : 0));
    const yPercent = -(100 / n) * t;
    gsap.set(listCol, { yPercent, force3D: true });
  };

  const layoutTrackHeight = () => {
    if (reduced || !mq.matches) {
      track.style.minHeight = "";
      return;
    }
    



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
    const tFloat = Math.min(n - 1, Math.max(0, Number.isFinite(t) ? t : 0));

    slides.forEach((el, i) => {
      const raw = i === 0 ? 0 : clamp01(i - tFloat);
      const eased = reduced ? raw : smootherstep(raw);
      const reveal = i === 0 ? 0 : 100 * eased;
      const revealNorm = reveal / 100;
      const hidden = reveal >= 99.98;
      const clipPath =
        i === 0
          ? "none"
          : `inset(${reveal}% 0 0 0 round ${ISG_QUALITY_SLIDE_CLIP_RADIUS}px)`;

      gsap.set(el, {
        yPercent: 0,
        clipPath,
        zIndex: i + 1,
        opacity: hidden ? 0 : 1,
        visibility: hidden ? "hidden" : "visible",
        force3D: true,
      });

      const img = slideImgs[i];
      if (img && !reduced) {
        let imgYPct;
        if (i === 0) {
          const u = clamp01(tFloat / Math.max(1, n - 1));
          imgYPct = -4 + smootherstep(u) * 8;
        } else {
          imgYPct = revealNorm * 10;
        }
        gsap.set(img, { yPercent: imgYPct, force3D: true });
      }
    });
  };

  




  const setContentStackFromT = (t) => {
    if (!contentInnerEl || !contentStackSlides.length) return;
    if (reduced) {
      gsap.set(contentInnerEl, { yPercent: 0, force3D: true });
      return;
    }
    const clamped = Math.min(n - 1, Math.max(0, Number.isFinite(t) ? t : 0));
    const yPercent = -(100 / n) * clamped;
    gsap.set(contentInnerEl, { yPercent, force3D: true });
  };

  
  const layoutBoxesHeight = () => {
    if (!contentStackEl || !contentStackSlides.length) return;
    if (!mq.matches) {
      contentStackEl.style.removeProperty("height");
      return;
    }
    const maxSlideHeight = contentStackSlides.reduce((maxHeight, slide) => {
      return Math.max(maxHeight, slide.offsetHeight || 0);
    }, 0);
    if (maxSlideHeight > 0) {
      contentStackEl.style.height = `${maxSlideHeight}px`;
    }
  };

  const setActiveItemFromT = (t) => {
    const active = Math.min(n - 1, Math.max(0, Math.round(t)));
    items.forEach((el, i) => {
      const on = i === active;
      const sibling = !on && (i === active - 1 || i === active + 1);
      el.classList.toggle("isg-quality-list-item--active", on);
      el.setAttribute("aria-pressed", on ? "true" : "false");
      const li = el.closest(".isg-quality-list__li");
      if (li) {
        li.classList.toggle("isg-quality-list__item--active", on);
        li.classList.toggle("isg-quality-list__item--active-sibling", sibling);
      }
    });
    slides.forEach((el, i) => {
      el.classList.toggle("isg-quality-visual__slide--active", i === active);
    });
    contentStackSlides.forEach((el, i) => {
      el.classList.toggle("isg-about-feature-card__content-slide--active", i === active);
    });
    mobileContentStacks.forEach((el, i) => {
      el.classList.toggle("isg-about-feature-card__content-stack--active", i === active);
      el.setAttribute("aria-hidden", i === active ? "false" : "true");
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
    setListColumnScrollFromT(t);
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
      requestAnimationFrame(() => {
        applyFrame(trackProgress01());
      });
      return;
    }
    applyFrame(progressForIndex(idx, n));
  };

  
  let suppressListScroll = false;
  let suppressSlidesScroll = false;
  let suppressListTimer = 0;
  let suppressSlidesTimer = 0;

  const syncFromSlidesScroll = () => {
    if (!slidesScrollEl || slides.length === 0) return;
    const best = findBestIndexCentered(slidesScrollEl, slides);
    setActiveItem(progressForIndex(best, n));
    if (listScrollEl && items[best]) {
      suppressListScroll = true;
      clearTimeout(suppressListTimer);
      scrollChildToCenter(listScrollEl, items[best], "auto");
      suppressListTimer = window.setTimeout(() => {
        suppressListScroll = false;
      }, 100);
    }
  };

  const syncFromListScroll = () => {
    if (!listScrollEl || items.length === 0) return;
    const best = findBestIndexCentered(listScrollEl, items);
    setActiveItem(progressForIndex(best, n));
    const slide = slides[best];
    if (slide && slidesScrollEl) {
      suppressSlidesScroll = true;
      clearTimeout(suppressSlidesTimer);
      scrollChildToCenter(slidesScrollEl, slide, "auto");
      suppressSlidesTimer = window.setTimeout(() => {
        suppressSlidesScroll = false;
      }, 100);
    }
  };

  const setupMobileSlidesScroll = () => {
    clearMobile();
    if (!slidesScrollEl || mq.matches) return;

    let ticking = false;

    const onSlidesScroll = () => {
      if (suppressSlidesScroll) return;
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        syncFromSlidesScroll();
      });
    };

    slidesScrollEl.addEventListener("scroll", onSlidesScroll, { passive: true });
    mobileOff.push(() => slidesScrollEl.removeEventListener("scroll", onSlidesScroll));

    if (listScrollEl) {
      let listTicking = false;
      const onListScroll = () => {
        if (suppressListScroll) return;
        if (listTicking) return;
        listTicking = true;
        requestAnimationFrame(() => {
          listTicking = false;
          syncFromListScroll();
        });
      };

      listScrollEl.addEventListener("scroll", onListScroll, { passive: true });
      mobileOff.push(() => listScrollEl.removeEventListener("scroll", onListScroll));
    }

    const onResize = () => {
      syncFromSlidesScroll();
    };
    window.addEventListener("resize", onResize);
    mobileOff.push(() => window.removeEventListener("resize", onResize));

    mobileOff.push(() => {
      clearTimeout(suppressListTimer);
      clearTimeout(suppressSlidesTimer);
    });

    requestAnimationFrame(() => syncFromSlidesScroll());
  };

  const build = () => {
    clearDesktop();
    clearMobile();
    ensureMobileContentStacks();

    if (reduced || !mq.matches) {
      if (slidesScrollEl) slidesScrollEl.removeAttribute("data-lenis-prevent");
      if (listCol) {
        gsap.set(listCol, { clearProps: "transform" });
      }
      if (contentInnerEl) {
        gsap.set(contentInnerEl, { clearProps: "transform" });
      }
      if (contentStackEl) {
        contentStackEl.style.removeProperty("height");
      }
      slides.forEach((el) => {
        gsap.set(el, {
          clearProps: "transform,clipPath,opacity,visibility,zIndex",
        });
      });
      slideImgs.forEach((img) => {
        if (img) gsap.set(img, { clearProps: "transform" });
      });
      items.forEach((el, i) => {
        el.classList.toggle("isg-quality-list-item--active", i === 0);
        el.setAttribute("aria-pressed", i === 0 ? "true" : "false");
        const li = el.closest(".isg-quality-list__li");
        if (li) {
          li.classList.toggle("isg-quality-list__item--active", i === 0);
          li.classList.toggle(
            "isg-quality-list__item--active-sibling",
            i === 1 && n > 1,
          );
        }
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

    if (slidesScrollEl) slidesScrollEl.removeAttribute("data-lenis-prevent");

    layoutTrackHeight();
    layoutMarkers();
    layoutBoxesHeight();
    layoutListCenter();
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
      layoutBoxesHeight();
      layoutListCenter();
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

  let layoutRaf = 0;
  const requestLayoutSync = () => {
    if (layoutRaf) return;
    layoutRaf = requestAnimationFrame(() => {
      layoutRaf = 0;
      build();
    });
  };

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
    mq.addEventListener("change", requestLayoutSync);
    disposers.push(() => mq.removeEventListener("change", requestLayoutSync));
  }

  const onLoad = () => requestLayoutSync();
  window.addEventListener("load", onLoad);
  disposers.push(() => window.removeEventListener("load", onLoad));

  if (document.fonts?.ready) {
    document.fonts.ready.then(requestLayoutSync).catch(() => {});
  }

  disposers.push(() => {
    if (layoutRaf) cancelAnimationFrame(layoutRaf);
    clearDesktop();
    clearMobile();
    track.style.minHeight = "";
    listCenter?.style.removeProperty("min-height");
    if (listCol) {
      gsap.set(listCol, { clearProps: "transform" });
    }
    if (contentInnerEl) {
      gsap.set(contentInnerEl, { clearProps: "transform" });
    }
    if (contentStackEl) {
      contentStackEl.style.removeProperty("height");
    }
    slides.forEach((el) =>
      gsap.set(el, {
        clearProps: "transform,clipPath,opacity,visibility,zIndex",
      }),
    );
    slideImgs.forEach((img) => {
      if (img) gsap.set(img, { clearProps: "transform" });
    });
  });

  requestAnimationFrame(() => {
    layoutTrackHeight();
    layoutMarkers();
    layoutBoxesHeight();
    layoutListCenter();
    syncFromScroll();
  });

  return () => {
    disposers.forEach((fn) => fn());
  };
}






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
