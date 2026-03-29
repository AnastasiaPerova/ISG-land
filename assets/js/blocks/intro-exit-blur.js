import { getLenis } from "./smooth-scroll.js";

function clamp01(t) {
  return Math.max(0, Math.min(1, t));
}

const INTRO_BLUR_SELECTOR =
  ".isg-product-intro, .isg-quality-intro, .isg-about-intro, .isg-rfq-intro, .isg-hero";

/** Уже существующие обёртки контента в разметке (без новых контейнеров) */
const INTRO_INNER_SELECTOR =
  ".isg-product-intro__conteiner, .isg-quality-intro__conteiner, .isg-about-intro__conteiner, .isg-rfq-intro__conteiner, .isg-hero__conteiner";

/** Размытие с этой доли «проскролла» блока (35% высоты блока ушло вверх) */
const BLUR_SCROLL_START = 0.35;
const MAX_BLUR_PX = 14;

/** Смещение фона по вертикали (%), нарастает с проскроллом — картинка «уезжает» вверх */
const BG_SHIFT_MAX_PCT = 22;
/** Смещение контента вверх (px), не больше доли высоты блока */
const CONTENT_SHIFT_RATIO = 0.26;
const CONTENT_SHIFT_CAP_PX = 160;

/**
 * Intro + hero: по мере скролла фон (или object-position у видео) и контент смещаются вверх; после порога — размытие.
 */
export function initIntroExitBlur(root = document) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  const sections = Array.from(root.querySelectorAll(INTRO_BLUR_SELECTOR));
  if (!sections.length) {
    return () => {};
  }

  const pairs = sections.map((el) => {
    const inner = el.querySelector(INTRO_INNER_SELECTOR);
    const isHero = el.classList.contains("isg-hero");
    const bgMedia = el.querySelector(":scope > .isg-intro-bg-media");
    const videoMedia = isHero ? el.querySelector(".isg-hero__video-media") : null;
    const bgTarget = bgMedia || el;
    return { el, inner, bgTarget, videoMedia };
  });

  const span = 1 - BLUR_SCROLL_START;

  const tick = () => {
    pairs.forEach(({ el, inner, bgTarget, videoMedia }) => {
      const rect = el.getBoundingClientRect();
      const blockH = rect.height || 1;
      const pastTop = Math.max(0, -rect.top);
      const scrolled = clamp01(pastTop / blockH);

      if (scrolled < 0.003) {
        if (videoMedia) {
          videoMedia.style.removeProperty("object-position");
          videoMedia.style.removeProperty("will-change");
        } else {
          bgTarget.style.removeProperty("background-position");
          bgTarget.style.removeProperty("will-change");
        }
        el.style.removeProperty("filter");
        el.style.removeProperty("will-change");
        if (inner) {
          inner.style.removeProperty("transform");
          inner.style.removeProperty("will-change");
        }
        return;
      }

      const bgY = 48 + scrolled * BG_SHIFT_MAX_PCT;
      if (videoMedia) {
        videoMedia.style.objectPosition = `50% ${bgY}%`;
      } else {
        bgTarget.style.backgroundPosition = `50% ${bgY}%`;
      }

      if (inner) {
        const maxTy = Math.min(CONTENT_SHIFT_CAP_PX, blockH * CONTENT_SHIFT_RATIO);
        const ty = -scrolled * maxTy;
        inner.style.transform = `translate3d(0, ${ty.toFixed(2)}px, 0)`;
        inner.style.willChange = "transform";
      }

      const u =
        span > 0 ? clamp01((scrolled - BLUR_SCROLL_START) / span) : scrolled >= BLUR_SCROLL_START ? 1 : 0;
      const px = u * MAX_BLUR_PX;
      const bgWill = videoMedia ? "object-position" : "background-position";
      const bgEl = videoMedia || bgTarget;
      if (px > 0.35) {
        el.style.filter = `blur(${px.toFixed(2)}px)`;
        el.style.setProperty("will-change", "filter");
        bgEl.style.setProperty("will-change", bgWill);
      } else {
        el.style.filter = "";
        el.style.removeProperty("will-change");
        bgEl.style.setProperty("will-change", bgWill);
      }
    });
  };

  const disposers = [];
  const lenis = getLenis();
  if (lenis) {
    lenis.on("scroll", tick);
    disposers.push(() => lenis.off("scroll", tick));
  } else {
    window.addEventListener("scroll", tick, { passive: true });
    disposers.push(() => window.removeEventListener("scroll", tick));
  }

  const onResize = () => tick();
  window.addEventListener("resize", onResize);
  disposers.push(() => window.removeEventListener("resize", onResize));

  requestAnimationFrame(() => {
    requestAnimationFrame(tick);
  });

  disposers.push(() => {
    pairs.forEach(({ el, inner, bgTarget, videoMedia }) => {
      el.style.removeProperty("filter");
      el.style.removeProperty("will-change");
      if (videoMedia) {
        videoMedia.style.removeProperty("object-position");
        videoMedia.style.removeProperty("will-change");
      } else {
        bgTarget.style.removeProperty("background-position");
        bgTarget.style.removeProperty("will-change");
      }
      if (inner) {
        inner.style.removeProperty("transform");
        inner.style.removeProperty("will-change");
      }
    });
  });

  return () => disposers.forEach((fn) => fn());
}
