import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const instances = new WeakMap();

function getParts(wrap) {
  const cards = Array.from(wrap.querySelectorAll(".isg-quality-card"));
  const images = cards.map((card) => card.querySelector(".isg-quality-card__img")).filter(Boolean);
  const contents = cards.map((card) => card.querySelector(".isg-quality-card__content")).filter(Boolean);
  return { cards, images, contents };
}

function clearRevealState(wrap) {
  const { cards, images, contents } = getParts(wrap);
  gsap.killTweensOf([wrap, ...cards, ...images, ...contents]);
  gsap.set([wrap, ...cards, ...images, ...contents], {
    clearProps:
      "opacity,visibility,transform,clipPath,webkitClipPath,filter,willChange,transformStyle,perspective",
  });
  delete wrap.dataset.isgQualityCardsRevealInit;
}

function getCardVars(index, total, mobile, compact) {
  const center = (total - 1) / 2;
  const side = index - center;
  return {
    rotateX: mobile ? -22 : -46,
    rotateY: side * (mobile ? 2.5 : 5),
    rotateZ: side * (mobile ? 1 : 2.2),
    xPercent: side * (mobile ? 3 : 5.5),
    yPercent: mobile ? 18 : compact ? 23 : 32,
    scale: mobile ? 0.94 : 0.84,
  };
}

export function initQualityCardsReveal(root = document) {
  const wraps = Array.from(root.querySelectorAll(".isg-quality-cards")).filter((wrap) => wrap instanceof HTMLElement);
  if (!wraps.length) return () => {};

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    wraps.forEach((wrap) => {
      instances.get(wrap)?.();
      instances.delete(wrap);
      clearRevealState(wrap);
    });
    return () => {};
  }

  const mobile = window.matchMedia("(max-width: 640px)").matches;
  const compact = window.matchMedia("(max-width: 1099px)").matches;
  const cleanups = [];

  wraps.forEach((wrap) => {
    instances.get(wrap)?.();
    instances.delete(wrap);
    wrap.dataset.isgQualityCardsRevealInit = "1";

    const { cards, images, contents } = getParts(wrap);
    if (!cards.length) {
      delete wrap.dataset.isgQualityCardsRevealInit;
      return;
    }

    gsap.set(wrap, {
      perspective: mobile ? 900 : 1560,
      transformStyle: "preserve-3d",
    });

    cards.forEach((card, index) => {
      const vars = getCardVars(index, cards.length, mobile, compact);
      gsap.set(card, {
        autoAlpha: 0,
        clipPath: "inset(100% 0% 0% 0% round var(--isg-card-br))",
        webkitClipPath: "inset(100% 0% 0% 0% round var(--isg-card-br))",
        rotateX: vars.rotateX,
        rotateY: vars.rotateY,
        rotateZ: vars.rotateZ,
        xPercent: vars.xPercent,
        yPercent: vars.yPercent,
        scale: vars.scale,
        transformOrigin: "50% 112%",
        transformStyle: "preserve-3d",
        willChange: "opacity, transform, clip-path",
      });
    });

    gsap.set(images, {
      scale: mobile ? 1.2 : 1.34,
      yPercent: mobile ? -10 : -20,
      filter: "saturate(0.74) contrast(1.16) brightness(0.78)",
      willChange: "transform, filter",
    });

    gsap.set(contents, {
      autoAlpha: 0,
      yPercent: 20,
      filter: "blur(10px)",
      willChange: "opacity, transform, filter",
    });

    const tl = gsap.timeline({
      paused: true,
      defaults: { ease: "power3.out" },
    });

    tl.to(
      cards,
      {
        autoAlpha: 1,
        clipPath: "inset(0% 0% 0% 0% round var(--isg-card-br))",
        webkitClipPath: "inset(0% 0% 0% 0% round var(--isg-card-br))",
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        xPercent: 0,
        yPercent: 0,
        scale: 1,
        stagger: {
          each: mobile ? 0.09 : 0.08,
          from: "start",
        },
        duration: 1.12,
      },
      0,
    )
      .to(
        images,
        {
          scale: 1,
          yPercent: 0,
          filter: "saturate(1) contrast(1) brightness(1)",
          stagger: {
            each: mobile ? 0.09 : 0.08,
            from: "start",
          },
          duration: 1.12,
        },
        0,
      )
      .to(
        contents,
        {
          autoAlpha: 1,
          yPercent: 0,
          filter: "blur(0px)",
          stagger: {
            each: mobile ? 0.07 : 0.055,
            from: "start",
          },
          duration: 0.76,
        },
        0.42,
      );

    const st = ScrollTrigger.create({
      trigger: wrap,
      start: "top 92%",
      end: "top 48%",
      animation: tl,
      scrub: 0.55,
      invalidateOnRefresh: true,
    });

    const cleanup = () => {
      st.kill();
      tl.kill();
      if (instances.get(wrap) !== cleanup) return;
      clearRevealState(wrap);
      instances.delete(wrap);
    };
    instances.set(wrap, cleanup);
    cleanups.push(cleanup);
  });

  requestAnimationFrame(() => ScrollTrigger.refresh());

  return () => {
    cleanups.forEach((off) => off());
  };
}
