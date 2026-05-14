import gsap from "gsap";

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
  if (reduced) {
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
      paused: true,
      defaults: { ease: "power3.out" },
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
          each: mobile ? 0.08 : 0.07,
          from: "start",
        },
        duration: 1.05,
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
        duration: 0.7,
      },
      0.28,
    );

    let observer = null;
    const play = () => {
      tl.play();
      observer?.disconnect();
      observer = null;
    };

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) play();
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
      );
      observer.observe(wrap);
    } else {
      requestAnimationFrame(play);
    }

    const cleanup = () => {
      observer?.disconnect();
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
