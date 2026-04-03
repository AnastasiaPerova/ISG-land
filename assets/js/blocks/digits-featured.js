import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const FEATURED_MIN_WIDTH = 1101;
function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function setSlideWidthPx(section, scrollEl) {
  const w = scrollEl?.getBoundingClientRect().width ?? scrollEl?.clientWidth ?? 0;
  if (w > 0) {
    section.style.setProperty("--isg-featured-slide", `${Math.round(w)}px`);
  }
}

function measureScrollParams(cardsEl, scrollEl) {
  const centerEl = cardsEl.querySelector(".center");
  gsap.set(cardsEl, { x: 0, force3D: true });
  const cols = cardsEl.querySelector(".columns--start");
  if (cols) gsap.set(cols, { x: 0, force3D: true });
  void cardsEl.offsetHeight;

  const viewport = Math.round(scrollEl.getBoundingClientRect().width || scrollEl.clientWidth || 0);
  const panel = Math.round(cardsEl.getBoundingClientRect().width || cardsEl.clientWidth || viewport);
  const centerWidth = centerEl?.clientWidth || centerEl?.getBoundingClientRect().width || panel;
  const centerStyle = centerEl ? window.getComputedStyle(centerEl) : null;
  const centerPadL = centerStyle ? parseFloat(centerStyle.paddingLeft) || 0 : 0;
  const centerPadR = centerStyle ? parseFloat(centerStyle.paddingRight) || 0 : 0;
  const visibleRow = Math.round(Math.max(0, centerWidth - centerPadL - centerPadR));
  const content = cols ? Math.round(cols.scrollWidth) : 0;
  const overflow = Math.max(0, content - visibleRow);
  return {
    viewport,
    panel,
    visibleRow,
    content,
    overflow,
    total: panel + overflow,
  };
}

function buildFeaturedTween(section, scrollEl, cardsEl, imageEl, mm, killTween) {
  killTween();
  setSlideWidthPx(section, scrollEl);

  if (!mm.matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    imageEl?.style.setProperty("--isg-digits-img-effect", "0");
    imageEl?.style.setProperty("--isg-digits-image-x", "0px");
    imageEl?.style.setProperty("--isg-digits-img-shift-x", "0px");
    return null;
  }

  void cardsEl.offsetHeight;
  const { panel, overflow, total } = measureScrollParams(cardsEl, scrollEl);
  const imageBlockShiftMaxPx = Math.min(260, Math.max(64, Math.round(panel * 0.17)));

  const syncImageEffect = (self) => {
    const pFull = clamp01(self.progress);
    const pEnter = panel > 0 ? clamp01((pFull * total) / panel) : pFull;
    imageEl?.style.setProperty("--isg-digits-img-effect", pEnter.toFixed(5));
    imageEl?.style.setProperty("--isg-digits-image-x", `${(-imageBlockShiftMaxPx * pEnter).toFixed(2)}px`);
    imageEl?.style.setProperty("--isg-digits-img-shift-x", "0px");
  };

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: `+=${total}`,
      pin: scrollEl,
      scrub: true,
      invalidateOnRefresh: true,
      anticipatePin: 1,
      onUpdate: syncImageEffect,
      onRefresh: syncImageEffect,
    },
  });

  tl.fromTo(cardsEl, { x: 0 }, { x: -panel, duration: panel, ease: "none" });

  if (overflow > 0) {
    const columnsEl = cardsEl.querySelector(".columns--start");
    if (columnsEl) {
      tl.fromTo(columnsEl, { x: 0 }, { x: -overflow, duration: overflow, ease: "none" });
    }
  }

  return tl;
}

/**
 * Digits featured: фон «прилипает» к окну .scroll, карточки наезжают поверх по вертикальному скроллу.
 */
export function initDigitsFeatured(root = document) {
  const cleanups = [];

  root.querySelectorAll(".isg-digits-section.component--featured").forEach((section) => {
    const scrollEl = section.querySelector("[data-isg-featured-scroll]");
    const inner = section.querySelector("[data-isg-featured-inner]");
    const cardsEl = section.querySelector("[data-isg-featured-cards]");
    const imageEl = section.querySelector(".isg-digits-featured__image");
    if (!scrollEl || !inner || !cardsEl) return;

    const mm = window.matchMedia(`(min-width: ${FEATURED_MIN_WIDTH}px)`);
    let tween = null;
    let layoutKey = "";

    const killTween = () => {
      tween?.scrollTrigger?.kill();
      tween?.kill();
      tween = null;
      gsap.set(cardsEl, { clearProps: "transform" });
      const cols = cardsEl.querySelector(".columns--start");
      if (cols) gsap.set(cols, { clearProps: "transform" });
      imageEl?.style.setProperty("--isg-digits-img-effect", "0");
      imageEl?.style.setProperty("--isg-digits-image-x", "0px");
      imageEl?.style.setProperty("--isg-digits-img-shift-x", "0px");
    };

    const rebuild = () => {
      const { panel, overflow, content, visibleRow } = measureScrollParams(cardsEl, scrollEl);
      const nextKey = `${mm.matches ? 1 : 0}:${panel}:${visibleRow}:${content}:${overflow}`;
      if (nextKey === layoutKey && tween) return;
      layoutKey = nextKey;
      tween = buildFeaturedTween(section, scrollEl, cardsEl, imageEl, mm, killTween);
    };

    let refreshRaf = 0;
    const scheduleFeaturedRefresh = () => {
      if (refreshRaf) cancelAnimationFrame(refreshRaf);
      refreshRaf = requestAnimationFrame(() => {
        refreshRaf = 0;
        ScrollTrigger.refresh();
      });
    };

    let rebuildRaf = 0;
    const scheduleRebuild = () => {
      if (rebuildRaf) return;
      rebuildRaf = requestAnimationFrame(() => {
        rebuildRaf = 0;
        setSlideWidthPx(section, scrollEl);
        rebuild();
        ScrollTrigger.refresh();
      });
    };

    const ro = new ResizeObserver(() => {
      scheduleRebuild();
    });
    ro.observe(scrollEl);
    ro.observe(inner);
    ro.observe(cardsEl);

    setSlideWidthPx(section, scrollEl);
    const kickoff = () => {
      rebuild();
      requestAnimationFrame(() => {
        setSlideWidthPx(section, scrollEl);
        scheduleFeaturedRefresh();
        rebuild();
      });
    };

    if (!scrollEl.clientWidth) {
      requestAnimationFrame(() => {
        kickoff();
      });
    } else {
      kickoff();
    }

    const onFonts = () => {
      setSlideWidthPx(section, scrollEl);
      scheduleRebuild();
    };
    if (document.fonts?.ready) {
      document.fonts.ready.then(onFonts).catch(() => {});
    }

    const onChange = () => {
      setSlideWidthPx(section, scrollEl);
      scheduleRebuild();
    };

    mm.addEventListener("change", onChange);
    window.addEventListener("resize", onChange);

    cleanups.push(() => {
      if (refreshRaf) cancelAnimationFrame(refreshRaf);
      if (rebuildRaf) cancelAnimationFrame(rebuildRaf);
      mm.removeEventListener("change", onChange);
      window.removeEventListener("resize", onChange);
      ro.disconnect();
      section.style.removeProperty("--isg-featured-slide");
      killTween();
    });
  });

  return () => {
    cleanups.forEach((fn) => fn());
  };
}
