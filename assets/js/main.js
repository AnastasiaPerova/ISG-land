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
  "partials/site-logo.html",
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

/**
 * Ждёт decode всех <img> в контейнере (в т.ч. после вставки partials).
 * @param {ParentNode} root
 * @param {number} [perImageCapMs]
 */
function waitForImages(root, perImageCapMs = 12000) {
  const images = root.querySelectorAll("img");
  if (!images.length) return Promise.resolve();
  return Promise.all(
    [...images].map((img) =>
      Promise.race([
        img.complete
          ? Promise.resolve()
          : new Promise((resolve) => {
              img.addEventListener("load", resolve, { once: true });
              img.addEventListener("error", resolve, { once: true });
            }),
        new Promise((resolve) => setTimeout(resolve, perImageCapMs)),
      ]),
    ),
  );
}

async function waitForFonts() {
  try {
    if (document.fonts?.ready) await document.fonts.ready;
  } catch (_) {
    /* noop */
  }
}

async function hidePreloader() {
  const el = document.getElementById("isg-preloader");
  if (!el) {
    document.body.classList.remove("isg-preloader-active");
    return;
  }
  el.setAttribute("aria-busy", "false");
  el.classList.add("isg-preloader--done");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  await new Promise((r) => setTimeout(r, reduced ? 0 : 460));
  document.body.classList.remove("isg-preloader-active");
  el.remove();
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
    await hidePreloader();
    return;
  }

  try {
    await initIsgPage(main);
    await waitForFonts();
    await waitForImages(main);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  } catch (e) {
    console.error(e);
  } finally {
    await hidePreloader();
  }
});

window.ISG = { initIsgPage, destroyIsgPage, syncNavPillSliders };
