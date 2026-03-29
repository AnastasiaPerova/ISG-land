import { initLenisSmoothScroll, getLenis } from "./blocks/smooth-scroll.js";
import { initAccordions } from "./blocks/accordion.js";
import { initSliders } from "./blocks/sliders.js";
import { initScrollReveal } from "./blocks/scroll-reveal.js";
import { initToTop } from "./blocks/to-top.js";
import { initNavPillSliders, syncNavPillSliders } from "./blocks/nav-pill-slider.js";
import { initHeaderDrawer } from "./blocks/header-drawer.js";
import { initLangNav } from "./blocks/lang-nav.js";
import { initDigitsFeatured } from "./blocks/digits-featured.js";
import { initApplicationScroll } from "./blocks/application-scroll.js";
import { initQualityScroll } from "./blocks/quality-scroll.js";
import { initAboutScroll } from "./blocks/about-scroll.js";
import { initIntroSectionScroll } from "./blocks/intro-section-scroll.js";
import { initIntroBgEntranceScale } from "./blocks/intro-bg-entrance-scale.js";
import { initIntroExitBlur } from "./blocks/intro-exit-blur.js";
import { initProductContentLineDraw } from "./blocks/product-content-line-draw.js";
import { initIsgButtonHover } from "./blocks/rfq-intro-btn-hover.js";
import { initRfqCustomSelects } from "./blocks/rfq-custom-select.js";
import { initSpecCardsReveal } from "./blocks/spec-cards-reveal.js";
import { initSectionAnchors } from "./blocks/section-anchors.js";
import { initFooterReveal } from "./blocks/footer-reveal.js";
import { initLightbox } from "./blocks/lightbox.js";
import { initTitleAnim } from "./blocks/title-anim.js";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const PARTIALS = [
  "partials/site-header.html",
  "partials/hero.html",
  "partials/section-application.html",
  "partials/section-digits.html",
  "partials/section-product-range.html",
  "partials/section-quality.html",
  "partials/section-about.html",
  "partials/section-rfq.html",
  "partials/footer.html",
];

let disposers = [];

function disposeInternals() {
  while (disposers.length) {
    const off = disposers.pop();
    try {
      off?.();
    } catch (_) {
      /* noop */
    }
  }
  ScrollTrigger.getAll().forEach((t) => t.kill());
}

/**
 * Полное обновление интерактива после подмены DOM (Barba.js hooks).
 * @param {ParentNode} root — контейнер с блоками [data-isg-block]
 */
export async function initIsgPage(root = document.body) {
  disposeInternals();
  disposers.push(initLenisSmoothScroll());
  disposers.push(initAccordions(root));
  disposers.push(await initSliders(root));
  disposers.push(initScrollReveal(root));
  disposers.push(initToTop(root));
  disposers.push(initNavPillSliders(root));
  disposers.push(initHeaderDrawer(root));
  disposers.push(initLangNav(root));
  disposers.push(initDigitsFeatured(root));
  disposers.push(initApplicationScroll(root));
  disposers.push(initSectionAnchors(root));
  disposers.push(initFooterReveal(root));
  disposers.push(initQualityScroll(root, { getLenis }));
  disposers.push(initAboutScroll(root, { getLenis }));
  disposers.push(initIntroSectionScroll(root));
  disposers.push(initIntroBgEntranceScale(root));
  disposers.push(initIntroExitBlur(root));
  disposers.push(initProductContentLineDraw(root));
  disposers.push(initIsgButtonHover(root));
  disposers.push(initRfqCustomSelects(root));
  disposers.push(initSpecCardsReveal(root));
  disposers.push(initLightbox(root));
  disposers.push(initTitleAnim(root));
  ScrollTrigger.refresh();
  requestAnimationFrame(() => {
    ScrollTrigger.refresh();
  });
}

export function destroyIsgPage() {
  disposeInternals();
}

async function fetchPartialsInto(target) {
  for (const path of PARTIALS) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
    const html = await res.text();
    target.insertAdjacentHTML("beforeend", html);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const main = document.getElementById("isg-main");
  if (!main) return;

  try {
    await fetchPartialsInto(main);
  } catch (e) {
    console.error(e);
    main.innerHTML =
      "<p style=\"padding:2rem;font-family:sans-serif\">Запустите локальный сервер из папки темы (<code>npx serve .</code>), чтобы partials подгружались через fetch.</p>";
    return;
  }

  await initIsgPage(main);
});

window.ISG = { initIsgPage, destroyIsgPage, syncNavPillSliders };
