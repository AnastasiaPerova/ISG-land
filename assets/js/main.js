import { initLenisSmoothScroll, getLenis } from "./blocks/smooth-scroll.js";
import { initAccordions } from "./blocks/accordion.js";
import { initSliders } from "./blocks/sliders.js";
import { initScrollReveal } from "./blocks/scroll-reveal.js";
import { initToTop } from "./blocks/to-top.js";
import { initNavPillSliders, syncNavPillSliders } from "./blocks/nav-pill-slider.js";
import { initHeaderDrawer } from "./blocks/header-drawer.js";
import { initHeaderContactStatus } from "./blocks/header-contact-status.js";
import { initHeaderScrollVisibility } from "./blocks/header-scroll-visibility.js";
import { initLangNav } from "./blocks/lang-nav.js";
import { initDigitsFeatured } from "./blocks/digits-featured.js";
import { initApplicationScroll } from "./blocks/application-scroll.js";
import { initQualityScroll } from "./blocks/quality-scroll.js";
import { initQualitySkip } from "./blocks/quality-skip.js";
import { initIntroSectionScroll } from "./blocks/intro-section-scroll.js";
import { initIntroBgEntranceScale } from "./blocks/intro-bg-entrance-scale.js";
import { initIntroExitBlur } from "./blocks/intro-exit-blur.js";
import { initProductContentLineDraw } from "./blocks/product-content-line-draw.js";
import { initIsgButtonHover } from "./blocks/rfq-intro-btn-hover.js";
import { initRfqCustomSelects } from "./blocks/rfq-custom-select.js";
import { initSpecCardsReveal } from "./blocks/spec-cards-reveal.js";
import { initQualityCardsReveal } from "./blocks/quality-cards-reveal.js";
import { initMobileHorizontalDrag } from "./blocks/mobile-horizontal-drag.js";
import { initSectionAnchors } from "./blocks/section-anchors.js";
import { initFooterReveal } from "./blocks/footer-reveal.js";
import { initLightbox } from "./blocks/lightbox.js";
import { initTitleAnim } from "./blocks/title-anim.js";
import { initFilledItemsAnim } from "./blocks/filled-items-anim.js";
import { initSectionSurfaceOverlap } from "./blocks/section-surface-overlap.js";
import { initProductContentParallax } from "./blocks/product-content-parallax.js";
import { initProductSizeItemsReveal } from "./blocks/product-size-items-reveal.js";
import { initBodyCopyReveal } from "./blocks/body-copy-reveal.js";
import gsap from "gsap";
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
let qualityCardsRevealDisposer = null;
let specCardsRevealDisposer = null;
const PRELOADER_STEPS = {
  partials: { from: 0, to: 45, label: "Loading sections" },
  init: { from: 45, to: 70, label: "Initializing interface" },
  fonts: { from: 70, to: 80, label: "Loading typography" },
  images: { from: 80, to: 96, label: "Loading images" },
  finalize: { from: 96, to: 100, label: "Finalizing page" },
};
const PRELOADER_LOCK_CLASS = "isg-preloader-active";

function setPreloaderScrollLock(locked) {
  document.documentElement.classList.toggle(PRELOADER_LOCK_CLASS, locked);
  document.body.classList.toggle(PRELOADER_LOCK_CLASS, locked);
}

function createPreloaderController() {
  const root = document.getElementById("isg-preloader");
  if (!root) {
    return {
      playExit: () => Promise.resolve(),
      setProgress: () => {},
      setStepProgress: () => {},
      complete: () => {},
    };
  }

  const valueEl = root.querySelector("[data-isg-preloader-value]");
  const labelEl = root.querySelector("[data-isg-preloader-label]");
  const barEl = root.querySelector("[data-isg-preloader-bar]");
  const progressEl = root.querySelector(".isg-preloader__bar");
  const srEl = root.querySelector(".isg-preloader__sr");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let current = 0;

  gsap.set(root, { opacity: 1, clearProps: "visibility" });
  if (barEl) gsap.set(barEl, { scaleX: 0, transformOrigin: "left center" });
  if (valueEl) gsap.set(valueEl, { clearProps: "all", autoAlpha: 1 });
  if (labelEl) gsap.set(labelEl, { clearProps: "all", autoAlpha: 1 });
  if (progressEl) gsap.set(progressEl, { clearProps: "all", autoAlpha: 1 });

  const animateBar = (value) => {
    if (!barEl) return;
    if (reduced) {
      gsap.set(barEl, { scaleX: value / 100 });
      return;
    }
    gsap.to(barEl, {
      scaleX: value / 100,
      duration: 0.48,
      ease: "power3.out",
      overwrite: true,
    });
  };

  const render = (value, label) => {
    current = Math.max(current, Math.max(0, Math.min(100, Math.round(value))));
    if (valueEl) valueEl.textContent = `${current}%`;
    if (labelEl && label) labelEl.textContent = label;
    animateBar(current);
    if (progressEl) progressEl.setAttribute("aria-valuenow", String(current));
    if (srEl) srEl.textContent = label ? `${label}: ${current}%` : `Loading ${current}%`;
  };

  render(0, "Preparing assets");

  return {
    playExit() {
      if (reduced) return Promise.resolve();
      return new Promise((resolve) => {
        const tl = gsap.timeline({ defaults: { ease: "power2.inOut" }, onComplete: resolve });

        if (labelEl) {
          tl.to(labelEl, { autoAlpha: 0, duration: 0.18 }, 0);
        }
        if (progressEl) {
          tl.to(progressEl, { autoAlpha: 0, duration: 0.2 }, 0);
        }
        if (valueEl) {
          tl.to(valueEl, { autoAlpha: 0, yPercent: 8, scale: 0.96, duration: 0.3 }, 0.02);
        }

        tl.to(root, { opacity: 0, duration: 0.28 }, 0.12);
      });
    },
    setProgress(value, label) {
      render(value, label);
    },
    setStepProgress(step, ratio = 1, label = step.label) {
      const clamped = Math.max(0, Math.min(1, ratio));
      render(step.from + (step.to - step.from) * clamped, label);
    },
    complete(label = "Ready") {
      render(100, label);
    },
  };
}

function nextFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}

async function stabilizeScrollLayout(passes = 2) {
  for (let i = 0; i < passes; i += 1) {
    getLenis()?.resize();
    ScrollTrigger.refresh();
    await nextFrame();
  }
}

function disposeInternals() {
  try {
    qualityCardsRevealDisposer?.();
  } catch (_) {
    
  }
  qualityCardsRevealDisposer = null;

  try {
    specCardsRevealDisposer?.();
  } catch (_) {
    
  }
  specCardsRevealDisposer = null;

  while (disposers.length) {
    const off = disposers.pop();
    try {
      off?.();
    } catch (_) {
      
    }
  }
  ScrollTrigger.getAll().forEach((t) => t.kill());
}

function bootQualityCardsReveal(root = document) {
  try {
    qualityCardsRevealDisposer?.();
  } catch (_) {
    
  }
  qualityCardsRevealDisposer = initQualityCardsReveal(root);
  return qualityCardsRevealDisposer;
}

function bootSpecCardsReveal(root = document) {
  try {
    specCardsRevealDisposer?.();
  } catch (_) {
    
  }
  specCardsRevealDisposer = initSpecCardsReveal(root);
  return specCardsRevealDisposer;
}

function scheduleQualityCardsRevealBoot() {
  const run = () => {
    const root = isServerRenderedMode() ? document : document.getElementById("isg-main") || document;
    if (root.querySelector?.(".isg-quality-wrapper .isg-quality-cards")) {
      bootQualityCardsReveal(root);
      return true;
    }
    return false;
  };

  if (run()) return;

  const observer = new MutationObserver(() => {
    if (run()) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener(
    "load",
    () => {
      run();
      setTimeout(run, 300);
      setTimeout(run, 1200);
    },
    { once: true },
  );
}

function scheduleSpecCardsRevealBoot() {
  const run = () => {
    const root = isServerRenderedMode() ? document : document.getElementById("isg-main") || document;
    if (root.querySelector?.(".isg-product-intro .isg-spec-cards")) {
      bootSpecCardsReveal(root);
      return true;
    }
    return false;
  };

  if (run()) return;

  const observer = new MutationObserver(() => {
    if (run()) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener(
    "load",
    () => {
      run();
      setTimeout(run, 300);
      setTimeout(run, 1200);
    },
    { once: true },
  );
}





export async function initIsgPage(root = document.body) {
  disposeInternals();
  disposers.push(initLenisSmoothScroll());
  disposers.push(initAccordions(root));
  disposers.push(await initSliders(root));
  disposers.push(initScrollReveal(root));
  disposers.push(initToTop(root));
  disposers.push(initNavPillSliders(root));
  disposers.push(initHeaderDrawer(root));
  disposers.push(initHeaderContactStatus(root));
  disposers.push(initHeaderScrollVisibility(root));
  disposers.push(initLangNav(root));
  disposers.push(initDigitsFeatured(root));
  disposers.push(initApplicationScroll(root));
  disposers.push(initSectionAnchors(root));
  disposers.push(initFooterReveal(root));
  disposers.push(initQualityScroll(root, { getLenis }));
  disposers.push(initQualitySkip(root, { getLenis }));
  disposers.push(initIntroSectionScroll(root));
  disposers.push(initIntroBgEntranceScale(root));
  disposers.push(initIntroExitBlur(root));
  disposers.push(initProductContentLineDraw(root));
  disposers.push(initIsgButtonHover(root));
  disposers.push(initRfqCustomSelects(root));
  bootSpecCardsReveal(root);
  bootQualityCardsReveal(root);
  disposers.push(initMobileHorizontalDrag(root));
  disposers.push(initLightbox(root));
  disposers.push(initTitleAnim(root));
  disposers.push(initFilledItemsAnim(root));
  disposers.push(initSectionSurfaceOverlap(root));
  disposers.push(initProductContentParallax(root));
  disposers.push(initProductSizeItemsReveal(root));
  disposers.push(initBodyCopyReveal(root));
  await stabilizeScrollLayout(2);
}

export function destroyIsgPage() {
  disposeInternals();
}

async function fetchPartialsInto(target, onProgress = () => {}) {
  const total = PARTIALS.length || 1;
  let done = 0;
  const utf8 = new TextDecoder("utf-8");
  onProgress(0);
  for (const path of PARTIALS) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
    const html = utf8.decode(await res.arrayBuffer());
    target.insertAdjacentHTML("beforeend", html);
    done += 1;
    onProgress(done / total);
  }
}






function waitForImages(root, perImageCapMs = 12000, onProgress = () => {}) {
  const images = [...root.querySelectorAll("img")];
  if (!images.length) {
    onProgress(1);
    return Promise.resolve();
  }

  let done = 0;
  const total = images.length;
  const notify = () => onProgress(done / total);
  const markDone = () => {
    done += 1;
    notify();
  };

  notify();
  return Promise.all(
    images.map((img) => {
      if (img.complete) {
        markDone();
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          markDone();
          resolve();
        };
        const timeoutId = setTimeout(finish, perImageCapMs);
        img.addEventListener("load", finish, { once: true });
        img.addEventListener("error", finish, { once: true });
      });
    }),
  );
}

async function waitForFonts(onProgress = () => {}) {
  onProgress(0);
  try {
    if (document.fonts?.ready) await document.fonts.ready;
  } catch (_) {
    
  }
  onProgress(1);
}

async function hidePreloader(preloader = null, { complete = true } = {}) {
  const el = document.getElementById("isg-preloader");
  window.ISG_PRELOADER_DONE = true;
  if (!el) {
    setPreloaderScrollLock(false);
    return;
  }
  if (complete) preloader?.complete("Ready");
  await preloader?.playExit?.();
  el.setAttribute("aria-busy", "false");
  el.classList.add("isg-preloader--done");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  await new Promise((r) => setTimeout(r, reduced ? 0 : 460));
  setPreloaderScrollLock(false);
  el.remove();
}

function isServerRenderedMode() {
  return (
    window.ISG_SERVER_RENDERED === true ||
    document.body?.classList.contains("isg-wp-theme") ||
    document.documentElement.hasAttribute("data-isg-server-rendered")
  );
}

scheduleQualityCardsRevealBoot();
scheduleSpecCardsRevealBoot();

async function reinitIsgPage() {
  const main = document.getElementById("isg-main");
  const root = isServerRenderedMode() ? document : (main || document.body);
  await initIsgPage(root);
  await stabilizeScrollLayout(2);
}

document.addEventListener("DOMContentLoaded", async () => {
  const main = document.getElementById("isg-main");
  const serverRendered = isServerRenderedMode();
  if (!main && !serverRendered) return;

  setPreloaderScrollLock(true);
  const preloader = createPreloaderController();

  if (!serverRendered) {
    try {
      await fetchPartialsInto(main, (ratio) => preloader.setStepProgress(PRELOADER_STEPS.partials, ratio));
    } catch (e) {
      console.error(e);
      main.innerHTML =
        "<p style=\"padding:2rem;font-family:sans-serif\">Start a local server from the theme folder (<code>npx serve .</code>) so partials can be loaded via fetch.</p>";
      preloader.setProgress(100, "Failed to load page");
      await hidePreloader(preloader, { complete: false });
      return;
    }
  }

  try {
    const root = serverRendered ? document : main;
    preloader.setStepProgress(PRELOADER_STEPS.init, 0);
    await initIsgPage(root);
    preloader.setStepProgress(PRELOADER_STEPS.init, 1);
    await waitForFonts((ratio) => preloader.setStepProgress(PRELOADER_STEPS.fonts, ratio));
    await waitForImages(root, 12000, (ratio) => preloader.setStepProgress(PRELOADER_STEPS.images, ratio));
    preloader.setStepProgress(PRELOADER_STEPS.finalize, 0.35);
    await stabilizeScrollLayout(3);
    preloader.setStepProgress(PRELOADER_STEPS.finalize, 1);
  } catch (e) {
    console.error(e);
  } finally {
    await hidePreloader(preloader);
    await stabilizeScrollLayout(3);
  }
});

window.addEventListener("isg:reinit", () => {
  reinitIsgPage().catch((e) => console.error(e));
});

window.ISG = { initIsgPage, destroyIsgPage, syncNavPillSliders, reinitIsgPage, isServerRenderedMode };
