import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const INNER_SELECTOR = ".isg-product-content__inner";
const LINES_CLASS = "isg-product-content__inner--lines-draw";
const LINE_DRAW_SELECTOR = ".isg-product-content__line-draw";
const SIZE_ROW_LINE_SELECTOR = ".isg-size-spec__row-line";

const EASE_LINE = "power2.out";
const DUR_H = 0.88;
const DUR_SEG = 0.72;
const STAGGER_SEG = 0.1;
const TL_DELAY = 0.06;
const CLIP_SUPPORTED = typeof CSS !== "undefined" && CSS.supports?.("clip-path", "inset(0 100% 0 0)");


const ST_START = "top 78%";

const VIEWPORT_START_RATIO = 0.78;

function doubleRaf(fn) {
  requestAnimationFrame(() => {
    requestAnimationFrame(fn);
  });
}




function isPastScrollTriggerStart(triggerEl) {
  if (!(triggerEl instanceof Element)) {
    return false;
  }
  const rect = triggerEl.getBoundingClientRect();
  const vh = window.innerHeight || 1;
  const startLine = vh * VIEWPORT_START_RATIO;
  return rect.top <= startLine;
}




function getLineDrawTrigger(inner, ruleLines, lineDrawEls, sizeRowLines) {
  return (
    inner.querySelector(".isg-product-content__row--rule") ||
    inner.querySelector(".isg-product-content__row--sizes") ||
    inner.querySelector(LINE_DRAW_SELECTOR) ||
    sizeRowLines[0] ||
    ruleLines[0] ||
    null
  );
}






export function initProductContentLineDraw(root = document) {
  const inners = Array.from(root.querySelectorAll(INNER_SELECTOR));
  if (!inners.length) {
    return () => {};
  }
  const isMobile = window.matchMedia("(max-width: 1099px)").matches;
  if (isMobile) {
    inners.forEach((inner) => {
      inner.classList.remove(LINES_CLASS);
      inner
        .querySelectorAll(".isg-rule, .isg-rule__line, .isg-product-content__line-draw, .isg-size-spec__row-line")
        .forEach((node) => {
          gsap.set(node, { clearProps: "transform,clipPath,x,scaleX" });
        });
    });
    return () => {};
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const triggers = [];
  const timelines = [];

  inners.forEach((inner) => {
    if (!(inner instanceof HTMLElement)) {
      return;
    }
    inner.classList.add(LINES_CLASS);

    const ruleLines = inner.querySelectorAll(".isg-rule__line");
    const mainRuleLine =
      inner.querySelector(".isg-product-content__row--rule .isg-rule__line") || ruleLines[0] || null;
    const ruleBar =
      inner.querySelector(".isg-product-content__row--rule .isg-rule") || inner.querySelector(".isg-rule");
    const lineDrawEls = inner.querySelectorAll(LINE_DRAW_SELECTOR);
    const sizeRowLines = inner.querySelectorAll(SIZE_ROW_LINE_SELECTOR);

    const segmentTargets = Array.from(
      new Set([...Array.from(lineDrawEls), ...Array.from(sizeRowLines)]),
    );

    if (!mainRuleLine && !ruleBar && !segmentTargets.length) {
      return;
    }

    if (reduced) {
      if (mainRuleLine) {
        gsap.set(mainRuleLine, { clipPath: "inset(0 0% 0 0)", x: 0, scaleX: 1, force3D: true });
      } else if (ruleBar) {
        gsap.set(ruleBar, { clipPath: "inset(0 0% 0 0)", x: 0, scaleX: 1, force3D: true });
      }
      gsap.set(ruleLines, { clipPath: "inset(0 0% 0 0)", x: 0, scaleX: 1, force3D: true });
      segmentTargets.forEach((node) => {
        gsap.set(node, { clipPath: "inset(0 0% 0 0)", x: 0, scaleX: 1, force3D: true });
      });
      return;
    }

    const lineTarget = mainRuleLine || ruleBar;
    if (lineTarget) {
      gsap.set(
        lineTarget,
        CLIP_SUPPORTED
          ? { clipPath: "inset(0 100% 0 0)", x: -24, force3D: true }
          : { scaleX: 0, x: -24, transformOrigin: "left center", force3D: true },
      );
    }
    segmentTargets.forEach((node) => {
      gsap.set(
        node,
        CLIP_SUPPORTED
          ? { clipPath: "inset(0 100% 0 0)", x: -20, force3D: true }
          : { scaleX: 0, x: -20, transformOrigin: "left center", force3D: true },
      );
    });

    let played = false;

    function runReveal() {
      if (played) {
        return;
      }
      played = true;

      const tl = gsap.timeline({ delay: TL_DELAY });

      const hasMainRule = Boolean(lineTarget);

      if (lineTarget) {
        tl.to(
          lineTarget,
          CLIP_SUPPORTED
            ? {
                clipPath: "inset(0 0% 0 0)",
                x: 0,
                duration: DUR_H,
                ease: EASE_LINE,
                force3D: true,
              }
            : {
                scaleX: 1,
                x: 0,
                duration: DUR_H,
                ease: EASE_LINE,
                force3D: true,
              },
        );
      }

      if (segmentTargets.length) {
        tl.to(
          segmentTargets,
          CLIP_SUPPORTED
            ? {
                clipPath: "inset(0 0% 0 0)",
                x: 0,
                duration: DUR_SEG,
                stagger: STAGGER_SEG,
                ease: EASE_LINE,
                force3D: true,
              }
            : {
                scaleX: 1,
                x: 0,
                duration: DUR_SEG,
                stagger: STAGGER_SEG,
                ease: EASE_LINE,
                force3D: true,
              },
          hasMainRule ? "-=0.5" : 0
        );
      }

      timelines.push(tl);
    }

    const triggerEl = getLineDrawTrigger(inner, ruleLines, lineDrawEls, sizeRowLines);
    if (!triggerEl) {
      doubleRaf(runReveal);
      return;
    }

    const st = ScrollTrigger.create({
      trigger: triggerEl,
      start: ST_START,
      once: true,
      invalidateOnRefresh: true,
      onEnter: () => {
        doubleRaf(runReveal);
      },
    });

    triggers.push(st);

    ScrollTrigger.refresh();
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      requestAnimationFrame(() => {
        if (isPastScrollTriggerStart(triggerEl)) {
          doubleRaf(runReveal);
        }
      });
    });
  });

  return () => {
    triggers.forEach((t) => t.kill());
    triggers.length = 0;
    timelines.forEach((t) => t.kill());
    timelines.length = 0;
    inners.forEach((el) => {
      el.classList.remove(LINES_CLASS);
      el
        .querySelectorAll(".isg-rule, .isg-rule__line, .isg-product-content__line-draw, .isg-size-spec__row-line")
        .forEach((node) => {
          gsap.set(node, { clearProps: "transform,clipPath,x,scaleX" });
      });
    });
  };
}
