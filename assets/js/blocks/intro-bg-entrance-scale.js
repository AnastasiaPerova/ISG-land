import gsap from "gsap";
import { getLenis } from "./smooth-scroll.js";

function clamp01(t) {
  return Math.max(0, Math.min(1, t));
}

/** Perlin smootherstep — нулевая производная на 0 и 1, визуально мягче smoothstep. */
function smootherstep01(u) {
  const x = clamp01(u);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/**
 * Шире диапазон по скроллу + smootherstep — медленнее и плавнее, ближе к ощущению дрейфа фона-«видео».
 */
const RANGE_START_FRAC = 1.1;
const RANGE_END_FRAC = -0.1;
/** Стартовый масштаб фона (выше = заметнее «зум» к финальному 1) */
const SCALE_FROM = 1.22;

const BG_MEDIA_CLASS = "isg-intro-bg-media";

/**
 * Интро с data-isg-intro-scroll: фон выносится в слой, scale уменьшается по мере появления блока во viewport.
 */
export function initIntroBgEntranceScale(root = document) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  /** @type { { section: HTMLElement; media: HTMLElement }[] } */
  const pairs = [];

  root.querySelectorAll("[data-isg-intro-scroll]").forEach((node) => {
    if (!(node instanceof HTMLElement) || node.dataset.isgIntroBgMediaInit) {
      return;
    }
    const inlineBg = node.style.backgroundImage;
    const computedBg = window.getComputedStyle(node).backgroundImage;
    const src =
      inlineBg && inlineBg !== "none" && inlineBg.includes("url")
        ? inlineBg
        : computedBg && computedBg !== "none" && computedBg.includes("url")
          ? computedBg
          : null;
    if (!src) {
      return;
    }

    const pos = window.getComputedStyle(node).backgroundPosition || "center center";
    const media = document.createElement("div");
    media.className = BG_MEDIA_CLASS;
    media.setAttribute("aria-hidden", "true");
    media.style.backgroundImage = src;
    media.style.backgroundSize = "cover";
    media.style.backgroundPosition = pos;
    media.style.backgroundRepeat = "no-repeat";

    node.dataset.isgIntroBgImageBackup = src;
    node.style.backgroundImage = "none";
    node.insertBefore(media, node.firstChild);
    node.dataset.isgIntroBgMediaInit = "1";

    gsap.set(media, { scale: SCALE_FROM, force3D: true });
    pairs.push({ section: node, media });
  });

  if (!pairs.length) {
    return () => {};
  }

  const tick = () => {
    const vh = window.innerHeight || 1;
    const rangeStart = vh * RANGE_START_FRAC;
    const rangeEnd = vh * RANGE_END_FRAC;
    const denom = Math.max(1e-6, rangeStart - rangeEnd);

    pairs.forEach(({ section, media }) => {
      const top = section.getBoundingClientRect().top;
      let u = (rangeStart - top) / denom;
      u = clamp01(u);
      const t = smootherstep01(u);
      const scale = SCALE_FROM + (1 - SCALE_FROM) * t;

      gsap.set(media, { scale, force3D: true });
      if (u > 0.02 && u < 0.98) {
        media.style.willChange = "transform";
      } else {
        media.style.removeProperty("will-change");
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
    pairs.forEach(({ section, media }) => {
      gsap.set(media, { clearProps: "scale,transform,will-change" });
      media.remove();
      const backup = section.dataset.isgIntroBgImageBackup;
      if (backup) {
        section.style.backgroundImage = backup;
      } else {
        section.style.removeProperty("background-image");
      }
      delete section.dataset.isgIntroBgImageBackup;
      delete section.dataset.isgIntroBgMediaInit;
    });
  });

  return () => disposers.forEach((fn) => fn());
}
