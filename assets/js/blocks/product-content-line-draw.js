import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const INNER_SELECTOR = ".isg-product-content__inner";
const LINES_CLASS = "isg-product-content__inner--lines-draw";
const LINE_DRAW_SELECTOR = ".isg-product-content__line-draw";

const EASE_LINE = "power2.out";
const DUR_H = 0.88;
const DUR_SEG = 0.72;
const STAGGER_SEG = 0.1;
const TL_DELAY = 0.06;

/** Когда верх триггера доходит до этой линии вьюпорта — запускаем рисование (не раньше). */
const ST_START = "top 78%";
/** Должно совпадать с логикой `start: top 78%` в ScrollTrigger. */
const VIEWPORT_START_RATIO = 0.78;

function doubleRaf(fn) {
  requestAnimationFrame(() => {
    requestAnimationFrame(fn);
  });
}

/**
 * Триггер уже «пройден» при инициализации (например, якорь / перезагрузка со скроллом) — onEnter не сработает.
 */
function isPastScrollTriggerStart(triggerEl) {
  if (!(triggerEl instanceof Element)) {
    return false;
  }
  const rect = triggerEl.getBoundingClientRect();
  const vh = window.innerHeight || 1;
  const startLine = vh * VIEWPORT_START_RATIO;
  return rect.top <= startLine;
}

/**
 * Узкий элемент у линий: не весь inner (иначе срабатывает на заголовке секции).
 */
function getLineDrawTrigger(inner, ruleLines, lineDrawEls) {
  return (
    inner.querySelector(".isg-product-content__row--rule") ||
    inner.querySelector(".isg-product-content__row--sizes") ||
    inner.querySelector(LINE_DRAW_SELECTOR) ||
    ruleLines[0] ||
    null
  );
}

/**
 * Горизонтальные линии: разделитель + сегменты под шапкой + линии над строками списка (scaleX, origin left).
 * Чёрную полосу анимируем на `.isg-rule__line` — у родителя фон прозрачный при --lines-draw.
 */
export function initProductContentLineDraw(root = document) {
  const inners = Array.from(root.querySelectorAll(INNER_SELECTOR));
  if (!inners.length) {
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

    if (!mainRuleLine && !ruleBar && !lineDrawEls.length) {
      return;
    }

    if (reduced) {
      if (mainRuleLine) {
        gsap.set(mainRuleLine, { scaleX: 1, transformOrigin: "left center", force3D: true });
      } else if (ruleBar) {
        gsap.set(ruleBar, { scaleX: 1, transformOrigin: "left center", force3D: true });
      }
      gsap.set(ruleLines, { scaleX: 1, transformOrigin: "left center", force3D: true });
      lineDrawEls.forEach((node) => {
        gsap.set(node, { scaleX: 1, transformOrigin: "left center", force3D: true });
      });
      return;
    }

    const lineTarget = mainRuleLine || ruleBar;
    if (lineTarget) {
      gsap.set(lineTarget, { scaleX: 0, transformOrigin: "left center", force3D: true });
    }
    lineDrawEls.forEach((node) => {
      gsap.set(node, { scaleX: 0, transformOrigin: "left center", force3D: true });
    });

    let played = false;

    const triggerEl = getLineDrawTrigger(inner, ruleLines, lineDrawEls);
    if (!triggerEl) {
      return;
    }

    function runReveal() {
      if (played) {
        return;
      }
      played = true;

      const tl = gsap.timeline({ delay: TL_DELAY });

      const hasMainRule = Boolean(lineTarget);

      if (lineTarget) {
        tl.to(lineTarget, {
          scaleX: 1,
          duration: DUR_H,
          ease: EASE_LINE,
          force3D: true,
        });
      }

      if (lineDrawEls.length) {
        tl.to(
          lineDrawEls,
          {
            scaleX: 1,
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
      el.querySelectorAll(".isg-rule, .isg-rule__line, .isg-product-content__line-draw").forEach((node) => {
        gsap.set(node, { clearProps: "transform" });
      });
    });
  };
}
