import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const instances = new WeakMap();

function getCardVars(index, total, mobile) {
  const center = (total - 1) / 2;
  const side = index - center;
  return {
    rotateX: mobile ? -12 : -24,
    rotateY: side * (mobile ? 1.5 : 2.75),
    rotateZ: side * (mobile ? 0.5 : 1),
    xPercent: side * (mobile ? 1.5 : 2.5),
    yPercent: mobile ? 10 : 16,
    scale: mobile ? 0.97 : 0.92,
  };
}

function getParts(wrap) {
  const cards = Array.from(wrap.querySelectorAll(".isg-spec-card"));
  const contentNodes = cards.flatMap((card) =>
    Array.from(card.querySelectorAll(".isg-spec-card__head, .isg-spec-card__value, .isg-spec-card__meta")),
  );
  return { cards, contentNodes };
}

function clearRevealState(wrap) {
  const { cards, contentNodes } = getParts(wrap);
  gsap.killTweensOf([wrap, ...cards, ...contentNodes]);
  gsap.set([wrap, ...cards, ...contentNodes], {
    clearProps:
      "opacity,visibility,transform,clipPath,webkitClipPath,filter,backfaceVisibility,willChange,transformStyle,perspective",
  });
  delete wrap.dataset.isgSpecCardsRevealInit;
}

export function initSpecCardsReveal(root = document) {
  const wraps = Array.from(root.querySelectorAll(".isg-spec-cards")).filter((wrap) => wrap instanceof HTMLElement);
  if (!wraps.length) return () => {};

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const disabledViewport = window.matchMedia("(max-width: 1099px)").matches;
  if (reduced || disabledViewport) {
    wraps.forEach((wrap) => {
      instances.get(wrap)?.();
      instances.delete(wrap);
      clearRevealState(wrap);
    });
    return () => {};
  }

  const mobile = window.matchMedia("(max-width: 640px)").matches;
  const cleanups = [];

  wraps.forEach((wrap) => {
    instances.get(wrap)?.();
    instances.delete(wrap);
    wrap.dataset.isgSpecCardsRevealInit = "1";

    const { cards, contentNodes } = getParts(wrap);
    if (!cards.length) {
      delete wrap.dataset.isgSpecCardsRevealInit;
      return;
    }

    gsap.set(wrap, {
      perspective: mobile ? 900 : 1400,
      transformStyle: "preserve-3d",
    });

    cards.forEach((card, index) => {
      const vars = getCardVars(index, cards.length, mobile);
      gsap.set(card, {
        autoAlpha: 0,
        clipPath: "inset(100% 0% -14% 0% round var(--isg-card-br))",
        webkitClipPath: "inset(100% 0% -14% 0% round var(--isg-card-br))",
        rotateX: vars.rotateX,
        rotateY: vars.rotateY,
        rotateZ: vars.rotateZ,
        xPercent: vars.xPercent,
        yPercent: vars.yPercent,
        scale: vars.scale,
        transformOrigin: "50% 112%",
        transformStyle: "preserve-3d",
        backfaceVisibility: "hidden",
        willChange: "opacity, transform, clip-path",
      });
    });

    gsap.set(contentNodes, {
      autoAlpha: 0,
      yPercent: 10,
      filter: "blur(5px)",
      willChange: "opacity, transform, filter",
    });

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: wrap,
        start: "top 115%",
        end: "top 68%",
        scrub: mobile ? 1.15 : 1.6,
        invalidateOnRefresh: true,
      },
    });

    tl.to(
      cards,
      {
        autoAlpha: 1,
        clipPath: "inset(0% 0% -1% 0% round var(--isg-card-br))",
        webkitClipPath: "inset(0% 0% -1% 0% round var(--isg-card-br))",
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        xPercent: 0,
        yPercent: 0,
        scale: 1,
        stagger: {
          each: mobile ? 0.08 : 0.065,
          from: "start",
        },
        duration: 1.12,
      },
      0,
    ).to(
      contentNodes,
      {
        autoAlpha: 1,
        yPercent: 0,
        filter: "blur(0px)",
        stagger: {
          each: mobile ? 0.045 : 0.035,
          from: "start",
        },
        duration: 0.75,
      },
      0.28,
    );

    const syncInitialProgress = () => ScrollTrigger.refresh();
    requestAnimationFrame(() => requestAnimationFrame(syncInitialProgress));
    window.addEventListener("load", syncInitialProgress, { once: true });

    const cleanup = () => {
      window.removeEventListener("load", syncInitialProgress);
      tl.scrollTrigger?.kill();
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
