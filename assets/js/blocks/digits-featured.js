import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const FEATURED_MIN_WIDTH = 1101;

function setSlideWidthPx(section, scrollEl) {
  const w = scrollEl?.getBoundingClientRect().width ?? scrollEl?.clientWidth ?? 0;
  if (w > 0) {
    section.style.setProperty("--isg-featured-slide", `${Math.round(w)}px`);
  }
}

/**
 * Фото на всю .scroll; .cards с left:100% и width=W полностью за правым краем до скролла.
 * Сдвиг по X = W — панель наезжает ровно на один вьюпорт (та же величина, что --isg-featured-slide).
 */
function measureCardsScrollDistance(cardsEl, scrollEl) {
  gsap.set(cardsEl, { x: 0, force3D: true });
  void cardsEl.offsetHeight;

  const raw = scrollEl.getBoundingClientRect().width || scrollEl.clientWidth || 0;
  return Math.max(0, Math.round(raw));
}

function buildFeaturedTween(section, scrollEl, cardsEl, imageEl, mm, killTween) {
  killTween();
  setSlideWidthPx(section, scrollEl);

  if (!mm.matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    imageEl?.style.removeProperty("--isg-digits-img-effect");
    return null;
  }

  void cardsEl.offsetHeight;
  const scrollDist = measureCardsScrollDistance(cardsEl, scrollEl);

  const syncImageEffect = (self) => {
    const p = self.progress;
    imageEl?.style.setProperty("--isg-digits-img-effect", p.toFixed(5));
  };

  return gsap.fromTo(
    cardsEl,
    { x: 0 },
    {
      x: -scrollDist,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: `+=${scrollDist}`,
        pin: scrollEl,
        scrub: true,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        onUpdate: syncImageEffect,
        onRefresh: syncImageEffect,
      },
    },
  );
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

    const killTween = () => {
      tween?.scrollTrigger?.kill();
      tween?.kill();
      tween = null;
      gsap.set(cardsEl, { clearProps: "transform" });
      imageEl?.style.removeProperty("--isg-digits-img-effect");
    };

    const rebuild = () => {
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

    const ro = new ResizeObserver(() => {
      setSlideWidthPx(section, scrollEl);
      requestAnimationFrame(() => {
        rebuild();
        ScrollTrigger.refresh();
      });
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
      scheduleFeaturedRefresh();
      rebuild();
    };
    if (document.fonts?.ready) {
      document.fonts.ready.then(onFonts).catch(() => {});
    }

    const onChange = () => {
      setSlideWidthPx(section, scrollEl);
      scheduleFeaturedRefresh();
      rebuild();
    };

    mm.addEventListener("change", onChange);
    window.addEventListener("resize", onChange);

    cleanups.push(() => {
      if (refreshRaf) cancelAnimationFrame(refreshRaf);
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
