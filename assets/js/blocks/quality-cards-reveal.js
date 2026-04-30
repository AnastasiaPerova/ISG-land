import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function getParts(wrap) {
  const cards = Array.from(wrap.querySelectorAll(".isg-quality-card"));
  const images = cards.map((card) => card.querySelector(".isg-quality-card__img")).filter(Boolean);
  const contents = cards.map((card) => card.querySelector(".isg-quality-card__content")).filter(Boolean);
  return { cards, images, contents };
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
  const wraps = Array.from(root.querySelectorAll(".isg-quality-wrapper .isg-quality-cards"));
  if (!wraps.length) return () => {};

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

  const mobile = window.matchMedia("(max-width: 640px)").matches;
  const compact = window.matchMedia("(max-width: 1099px)").matches;
  const cleanups = [];

  wraps.forEach((wrap) => {
    const { cards, images, contents } = getParts(wrap);
    if (!cards.length) return;

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
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: wrap,
        start: "top 98%",
        end: "top 44%",
        scrub: mobile ? 0.72 : 0.95,
        invalidateOnRefresh: true,
      },
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
          each: mobile ? 0.065 : 0.052,
          from: "start",
        },
        duration: 0.9,
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
            each: mobile ? 0.065 : 0.052,
            from: "start",
          },
          duration: 0.9,
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
            each: mobile ? 0.05 : 0.04,
            from: "start",
          },
          duration: 0.6,
        },
        0.26,
      );

    cleanups.push(() => {
      tl.scrollTrigger?.kill();
      tl.kill();
      gsap.killTweensOf([wrap, ...cards, ...images, ...contents]);
      gsap.set([wrap, ...cards, ...images, ...contents], {
        clearProps:
          "opacity,visibility,transform,clipPath,webkitClipPath,filter,willChange,transformStyle,perspective",
      });
    });
  });

  requestAnimationFrame(() => ScrollTrigger.refresh());

  return () => {
    cleanups.forEach((off) => off());
  };
}
