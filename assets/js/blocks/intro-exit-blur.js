import { getLenis } from "./smooth-scroll.js";

function clamp01(t) {
  return Math.max(0, Math.min(1, t));
}

const INTRO_BLUR_SELECTOR = ".isg-intro-section, .isg-hero";
const INTRO_INNER_SELECTOR = ".isg-intro-section__container, .isg-hero__conteiner";
const BLUR_SCROLL_START = 0.35;
const MAX_BLUR_PX = 14;
const BG_SHIFT_MAX_PCT = 22;
const CONTENT_SHIFT_RATIO = 0.26;
const CONTENT_SHIFT_CAP_PX = 160;

/**
 * Moves intro content on exit and keeps hero video parallax. Intro image parallax is handled
 * by the shared media-inner transform module, so we avoid touching background-position here.
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
    const mediaInner = el.querySelector(":scope > .isg-intro-media .isg-intro-media__inner");
    const videoMedia = isHero ? el.querySelector(".isg-hero__video-media") : null;
    return { el, inner, mediaInner, videoMedia, isHero };
  });

  const span = 1 - BLUR_SCROLL_START;

  const tick = () => {
    pairs.forEach(({ el, inner, mediaInner, videoMedia, isHero }) => {
      const rect = el.getBoundingClientRect();
      const blockH = rect.height || 1;
      const pastTop = Math.max(0, -rect.top);
      const scrolled = clamp01(pastTop / blockH);

      if (scrolled < 0.003) {
        if (videoMedia) {
          videoMedia.style.removeProperty("object-position");
          videoMedia.style.removeProperty("will-change");
        }
        el.style.removeProperty("filter");
        el.style.removeProperty("will-change");
        mediaInner?.style.removeProperty("filter");
        mediaInner?.style.removeProperty("will-change");
        if (inner) {
          inner.style.removeProperty("transform");
          inner.style.removeProperty("will-change");
        }
        return;
      }

      if (videoMedia) {
        const bgY = 48 + scrolled * BG_SHIFT_MAX_PCT;
        videoMedia.style.objectPosition = `50% ${bgY}%`;
      }

      if (inner) {
        const maxTy = Math.min(CONTENT_SHIFT_CAP_PX, blockH * CONTENT_SHIFT_RATIO);
        const ty = -scrolled * maxTy;
        inner.style.transform = `translate3d(0, ${ty.toFixed(2)}px, 0)`;
        inner.style.willChange = "transform";
      }

      if (isHero) {
        el.style.removeProperty("filter");
        el.style.removeProperty("will-change");
        videoMedia?.style.setProperty("will-change", "object-position");
        return;
      }

      const u =
        span > 0 ? clamp01((scrolled - BLUR_SCROLL_START) / span) : scrolled >= BLUR_SCROLL_START ? 1 : 0;
      const px = u * MAX_BLUR_PX;
      mediaInner?.style.setProperty("will-change", "transform, filter");

      if (px > 0.35) {
        mediaInner?.style.setProperty("filter", `blur(${px.toFixed(2)}px)`);
        el.style.removeProperty("filter");
        el.style.removeProperty("will-change");
      } else {
        mediaInner?.style.removeProperty("filter");
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
    pairs.forEach(({ el, inner, mediaInner, videoMedia }) => {
      el.style.removeProperty("filter");
      el.style.removeProperty("will-change");
      mediaInner?.style.removeProperty("filter");
      mediaInner?.style.removeProperty("will-change");
      if (videoMedia) {
        videoMedia.style.removeProperty("object-position");
        videoMedia.style.removeProperty("will-change");
      }
      if (inner) {
        inner.style.removeProperty("transform");
        inner.style.removeProperty("will-change");
      }
    });
  });

  return () => disposers.forEach((fn) => fn());
}
