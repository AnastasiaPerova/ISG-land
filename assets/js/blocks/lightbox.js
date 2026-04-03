/**
 * Лайтбокс: data-isg-lightbox="<url>". Альбом = все такие элементы в том же
 * [data-isg-slider] или в .isg-about-certs. Стрелки, ←/→, зацикливание.
 * Открытие/закрытие: GSAP (backdrop + panel + медиа).
 */

import gsap from "gsap";

const LB_ID = "isg-lightbox";

/** @param {string} s */
function normalizeSrcAttr(s) {
  if (!s || typeof s !== "string") return "";
  let t = s.trim();
  if (t.startsWith("./")) t = t.slice(2);
  return t;
}

/** @param {string} src */
function isAllowedLightboxSrc(src) {
  if (!src || typeof src !== "string") return false;
  const t = src.trim();
  if (t.startsWith("javascript:") || t.startsWith("data:")) return false;
  return t.startsWith("assets/") || t.startsWith("./assets/") || t.startsWith("/");
}

function isVideoSrc(src) {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(src.trim());
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** @param {Element | null | undefined} node */
function getSliderSwiper(node) {
  if (!(node instanceof Element)) return null;
  const slider = node.closest(".isg-slider.swiper");
  if (!slider) return null;
  return slider.swiper || null;
}

/** @param {any} swiper */
function resetSwiperInteraction(swiper) {
  if (!swiper || swiper.destroyed) return;
  swiper.allowClick = true;
  const touch = swiper.touchEventsData;
  if (touch && typeof touch === "object") {
    touch.isTouched = false;
    touch.isMoved = false;
    touch.startMoving = false;
    touch.allowTouchCallbacks = true;
  }
  try {
    swiper.update();
  } catch (_) {
    /* noop */
  }
}

/**
 * @param {HTMLElement} overlay
 * @param {{ restoreFocus?: boolean, resumeAutoplay?: boolean }} [opts]
 */
function resetOverlayState(overlay, opts = {}) {
  const { restoreFocus = false, resumeAutoplay = false } = opts;
  const img = overlay.querySelector(".isg-lightbox__img");
  const vid = overlay.querySelector(".isg-lightbox__video");
  const btnPrev = overlay.querySelector(".isg-lightbox__nav--prev");
  const btnNext = overlay.querySelector(".isg-lightbox__nav--next");
  const counter = overlay.querySelector(".isg-lightbox__counter");
  const originAnchor = overlay._isgOriginAnchor || null;
  const originSwiper = overlay._isgOriginSwiper || null;

  overlay._isgOpenToken = (overlay._isgOpenToken || 0) + 1;
  killLbTweens(overlay);
  overlay.classList.add("isg-lightbox--inactive");
  overlay.setAttribute("hidden", "");
  overlay.setAttribute("aria-hidden", "true");

  if (img) {
    img.removeAttribute("src");
    img.alt = "";
    img.hidden = false;
  }
  if (vid) {
    try {
      vid.pause();
    } catch (_) {
      /* noop */
    }
    vid.removeAttribute("src");
    try {
      vid.load();
    } catch (_) {
      /* noop */
    }
    vid.hidden = true;
  }

  overlay._isgAlbum = null;
  overlay._isgIndex = 0;
  overlay._isgOriginAnchor = null;
  overlay._isgOriginSwiper = null;

  if (btnPrev) btnPrev.hidden = true;
  if (btnNext) btnNext.hidden = true;
  if (counter) {
    counter.hidden = true;
    counter.textContent = "";
  }

  document.body.style.overflow = "";
  const hk = overlay._isgLightboxOnKey;
  if (hk) document.removeEventListener("keydown", hk);

  resetSwiperInteraction(originSwiper);
  if (resumeAutoplay) originSwiper?.autoplay?.start?.();
  if (restoreFocus && originAnchor instanceof HTMLElement && originAnchor.isConnected) {
    try {
      originAnchor.focus({ preventScroll: true });
    } catch (_) {
      /* noop */
    }
  }
}

/** @param {HTMLElement} overlay */
function killLbTweens(overlay) {
  const nodes = overlay.querySelectorAll(
    ".isg-lightbox__backdrop, .isg-lightbox__panel, .isg-lightbox__img, .isg-lightbox__video, .isg-lightbox__counter, .isg-lightbox__nav",
  );
  gsap.killTweensOf(nodes);
  if (overlay._isgLbTl) {
    overlay._isgLbTl.kill();
    overlay._isgLbTl = null;
  }
}

/** @param {HTMLElement} overlay */
function waitActiveMedia(overlay) {
  const img = overlay.querySelector(".isg-lightbox__img");
  const vid = overlay.querySelector(".isg-lightbox__video");
  if (img && !img.hidden && img.src) {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => resolve();
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
    });
  }
  if (vid && !vid.hidden && vid.src) return Promise.resolve();
  return Promise.resolve();
}

/**
 * Таймлайн открытия (paused): вызовите .play() после снятия --inactive и загрузки медиа.
 * @param {HTMLElement} overlay
 * @returns {gsap.core.Timeline}
 */
function createOpenTimeline(overlay) {
  const backdrop = overlay.querySelector(".isg-lightbox__backdrop");
  const panel = overlay.querySelector(".isg-lightbox__panel");
  const img = overlay.querySelector(".isg-lightbox__img");
  const vid = overlay.querySelector(".isg-lightbox__video");
  const reduce = prefersReducedMotion();

  /** @type {Element | null} */
  let media = null;
  if (img && !img.hidden) media = img;
  else if (vid && !vid.hidden) media = vid;

  gsap.set(backdrop, { opacity: 0 });
  gsap.set(panel, {
    opacity: 0,
    scale: reduce ? 1 : 0.9,
    y: reduce ? 0 : 32,
    transformOrigin: "50% 50%",
    force3D: true,
  });
  if (media) {
    const isVid = media.tagName === "VIDEO";
    gsap.set(media, {
      opacity: 0,
      scale: reduce ? 1 : 0.93,
      transformOrigin: "50% 50%",
      force3D: true,
      ...(!isVid && !reduce ? { filter: "blur(14px)" } : {}),
    });
  }

  const durPanel = reduce ? 0.2 : 0.58;
  const durBackdrop = reduce ? 0.18 : 0.5;
  const ease = "power3.out";

  const tl = gsap.timeline({
    paused: true,
    onComplete: () => {
      if (backdrop) gsap.set(backdrop, { clearProps: "opacity" });
      if (panel) gsap.set(panel, { clearProps: "opacity,transform" });
      if (media && media.tagName === "IMG") gsap.set(media, { clearProps: "opacity,transform,filter" });
      if (media && media.tagName === "VIDEO") gsap.set(media, { clearProps: "opacity,transform" });
    },
  });

  tl.to(backdrop, { opacity: 1, duration: durBackdrop, ease: "power2.out" }, 0);
  tl.to(panel, { opacity: 1, scale: 1, y: 0, duration: durPanel, ease }, reduce ? 0 : "-=0.34");
  if (media && !reduce) {
    const isVid = media.tagName === "VIDEO";
    tl.to(
      media,
      isVid
        ? { opacity: 1, scale: 1, duration: 0.45, ease: "power2.out" }
        : { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.48, ease: "power2.out" },
      "-=0.4",
    );
  } else if (media) {
    tl.to(media, { opacity: 1, duration: 0.15 }, "-=0.08");
  }

  overlay._isgLbTl = tl;
  return tl;
}

/**
 * @param {HTMLElement} overlay
 * @param {() => void} onComplete
 */
function playCloseTimeline(overlay, onComplete) {
  const backdrop = overlay.querySelector(".isg-lightbox__backdrop");
  const panel = overlay.querySelector(".isg-lightbox__panel");
  const img = overlay.querySelector(".isg-lightbox__img");
  const vid = overlay.querySelector(".isg-lightbox__video");
  const reduce = prefersReducedMotion();

  /** @type {Element | null} */
  let media = null;
  if (img && !img.hidden) media = img;
  else if (vid && !vid.hidden) media = vid;

  killLbTweens(overlay);

  if (reduce) {
    onComplete();
    return;
  }

  const tl = gsap.timeline({
    onComplete: () => {
      if (backdrop) gsap.set(backdrop, { clearProps: "opacity" });
      if (panel) gsap.set(panel, { clearProps: "opacity,transform" });
      if (media) gsap.set(media, { clearProps: "opacity,transform,filter" });
      onComplete();
    },
  });

  tl.to(panel, { opacity: 0, scale: 0.94, y: 20, duration: 0.36, ease: "power2.in" }, 0);
  if (media) {
    tl.to(
      media,
      media.tagName === "VIDEO"
        ? { opacity: 0, scale: 0.96, duration: 0.28, ease: "power2.in" }
        : { opacity: 0, scale: 0.96, filter: "blur(8px)", duration: 0.3, ease: "power2.in" },
      0.02,
    );
  }
  tl.to(backdrop, { opacity: 0, duration: 0.34, ease: "power1.in" }, 0.12);
  overlay._isgLbTl = tl;
}

/** @param {Element} anchor */
function collectAlbum(anchor) {
  const slider = anchor.closest("[data-isg-slider]");
  const certs = anchor.closest(".isg-about-certs");
  /** @type {Element[]} */
  let nodes = [];
  if (slider) nodes = [...slider.querySelectorAll("[data-isg-lightbox]")];
  else if (certs) nodes = [...certs.querySelectorAll("[data-isg-lightbox]")];
  else nodes = [anchor];

  const out = [];
  for (const el of nodes) {
    if (el.closest(".swiper-slide-duplicate")) continue;
    const raw = el.getAttribute("data-isg-lightbox");
    if (!raw || !isAllowedLightboxSrc(raw)) continue;
    const src = normalizeSrcAttr(raw);
    const alt =
      el.getAttribute("aria-label") ||
      el.querySelector(".isg-filled-item__text")?.textContent?.trim() ||
      "";
    const kindAttr = el.getAttribute("data-isg-lightbox-kind");
    const kind = kindAttr === "video" || isVideoSrc(src) ? "video" : "image";
    out.push({ src, alt, kind });
  }
  return out;
}

function patchOverlayAttrs(el) {
  resetOverlayState(el);
  /* fixed у предка с transform (GSAP на .panel) ломает позицию — кнопка должна быть снаружи панели */
  const closeInPanel = el.querySelector(".isg-lightbox__panel .isg-lightbox__close");
  if (closeInPanel) {
    const backdrop = el.querySelector(".isg-lightbox__backdrop");
    backdrop?.insertAdjacentElement("afterend", closeInPanel);
  }
}

function ensureOverlay() {
  let el = document.getElementById(LB_ID);
  if (el) {
    patchOverlayAttrs(el);
    return el;
  }

  el = document.createElement("div");
  el.id = LB_ID;
  el.className = "isg-lightbox isg-lightbox--inactive";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", "Gallery");
  el.setAttribute("hidden", "");
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = `
    <button type="button" class="isg-lightbox__backdrop" aria-label="Close"></button>
    <button type="button" class="isg-lightbox__close" aria-label="Close">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
    <div class="isg-lightbox__panel">
      <button type="button" class="isg-lightbox__nav isg-lightbox__nav--prev" aria-label="Previous image" hidden>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>
      <div class="isg-lightbox__stage">
        <img class="isg-lightbox__img" alt="" decoding="async" />
        <video class="isg-lightbox__video" controls playsinline preload="none" hidden></video>
        <span class="isg-lightbox__counter" aria-live="polite" hidden></span>
      </div>
      <button type="button" class="isg-lightbox__nav isg-lightbox__nav--next" aria-label="Next image" hidden>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>
    </div>
  `;
  document.body.appendChild(el);
  return el;
}

/** @param {HTMLElement} overlay */
function bindOverlayOnce(overlay) {
  if (overlay.dataset.isgBound === "1") return;
  overlay.dataset.isgBound = "1";

  const img = overlay.querySelector(".isg-lightbox__img");
  const vid = overlay.querySelector(".isg-lightbox__video");
  const btnPrev = overlay.querySelector(".isg-lightbox__nav--prev");
  const btnNext = overlay.querySelector(".isg-lightbox__nav--next");
  const counter = overlay.querySelector(".isg-lightbox__counter");

  const showAt = (i) => {
    const album = overlay._isgAlbum;
    if (!album?.length || !img) return;
    const n = album.length;
    overlay._isgIndex = ((i % n) + n) % n;
    const item = album[overlay._isgIndex];
    const isVideo = item.kind === "video";

    if (isVideo && vid) {
      img.removeAttribute("src");
      img.alt = "";
      img.hidden = true;
      vid.hidden = false;
      vid.src = item.src;
      vid.setAttribute("aria-label", item.alt || "Video");
      try {
        vid.load();
        const p = vid.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      } catch (_) {
        /* noop */
      }
    } else {
      if (vid) {
        try {
          vid.pause();
        } catch (_) {
          /* noop */
        }
        vid.removeAttribute("src");
        try {
          vid.load();
        } catch (_) {
          /* noop */
        }
        vid.hidden = true;
      }
      img.hidden = false;
      img.src = item.src;
      img.alt = item.alt || "";
    }

    const single = n <= 1;
    if (btnPrev) btnPrev.hidden = single;
    if (btnNext) btnNext.hidden = single;
    if (counter) {
      counter.hidden = single;
      counter.textContent = single ? "" : `${overlay._isgIndex + 1} / ${n}`;
    }
  };
  overlay._isgShowAt = showAt;

  const finalizeClose = () => {
    resetOverlayState(overlay, { restoreFocus: true, resumeAutoplay: true });
  };
  overlay._isgFinalizeClose = finalizeClose;

  const close = () => {
    if (overlay.classList.contains("isg-lightbox--inactive")) return;
    playCloseTimeline(overlay, finalizeClose);
  };

  const onKey = (e) => {
    if (e.key === "Escape") {
      close();
      return;
    }
    const album = overlay._isgAlbum;
    if (!album || album.length <= 1) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      showAt(overlay._isgIndex - 1);
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      showAt(overlay._isgIndex + 1);
    }
  };

  overlay.querySelector(".isg-lightbox__backdrop")?.addEventListener("click", close);
  overlay.querySelector(".isg-lightbox__close")?.addEventListener("click", close);
  btnPrev?.addEventListener("click", (e) => {
    e.stopPropagation();
    showAt(overlay._isgIndex - 1);
  });
  btnNext?.addEventListener("click", (e) => {
    e.stopPropagation();
    showAt(overlay._isgIndex + 1);
  });

  overlay._isgLightboxClose = close;
  overlay._isgLightboxOnKey = onKey;
}

/**
 * @param {Element} anchor — элемент с data-isg-lightbox (триггер)
 */
export function openLightbox(anchor) {
  if (!anchor || !(anchor instanceof Element)) return;
  const album = collectAlbum(anchor);
  if (!album.length) return;

  const overlay = ensureOverlay();
  bindOverlayOnce(overlay);

  const raw = anchor.getAttribute("data-isg-lightbox");
  const targetSrc = normalizeSrcAttr(raw || "");
  let start = album.findIndex((x) => x.src === targetSrc);
  if (start < 0) start = 0;

  killLbTweens(overlay);
  if (!overlay.classList.contains("isg-lightbox--inactive")) {
    resetOverlayState(overlay);
  }

  overlay._isgAlbum = album;
  overlay._isgOriginAnchor = anchor;
  overlay._isgOriginSwiper = getSliderSwiper(anchor);
  overlay._isgOpenToken = (overlay._isgOpenToken || 0) + 1;
  const openToken = overlay._isgOpenToken;

  const hk = overlay._isgLightboxOnKey;
  if (hk) document.removeEventListener("keydown", hk);

  overlay._isgShowAt(start);

  const tl = createOpenTimeline(overlay);

  overlay.removeAttribute("hidden");
  overlay.classList.remove("isg-lightbox--inactive");
  overlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  overlay._isgOriginSwiper?.autoplay?.stop?.();
  if (hk) document.addEventListener("keydown", hk);

  waitActiveMedia(overlay).then(() => {
    if (overlay._isgOpenToken !== openToken || overlay.classList.contains("isg-lightbox--inactive")) return;
    requestAnimationFrame(() => {
      if (overlay._isgOpenToken !== openToken || overlay.classList.contains("isg-lightbox--inactive")) return;
      tl.play();
    });
  });
}

const DRAG_PX = 14;

/**
 * @param {ParentNode} [root]
 */
export function initLightbox(root = document.body) {
  const overlay = ensureOverlay();

  /** @type {{ t: Element; x: number; y: number; pid: number } | null} */
  let ptr = null;

  /** @param {PointerEvent} e */
  const onPtrDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const t = e.target instanceof Element ? e.target.closest("[data-isg-lightbox]") : null;
    if (!t || !root.contains(t) || !t.closest("[data-isg-slider]")) return;
    ptr = { t, x: e.clientX, y: e.clientY, pid: e.pointerId };
  };

  /** @param {PointerEvent} e */
  const onPtrUp = (e) => {
    if (!ptr || e.pointerId !== ptr.pid) return;
    const swiper = getSliderSwiper(ptr.t);
    if (swiper && swiper.allowClick === false) {
      ptr = null;
      return;
    }
    const moved = Math.hypot(e.clientX - ptr.x, e.clientY - ptr.y);
    if (moved <= DRAG_PX) {
      const src = ptr.t.getAttribute("data-isg-lightbox");
      if (src && isAllowedLightboxSrc(src)) openLightbox(ptr.t);
    }
    ptr = null;
  };

  const onPtrCancel = () => {
    ptr = null;
  };

  /** @param {MouseEvent} e */
  const onClick = (e) => {
    const t = e.target instanceof Element ? e.target.closest("[data-isg-lightbox]") : null;
    if (!t || !root.contains(t)) return;
    if (t.closest("[data-isg-slider]")) return;
    const src = t.getAttribute("data-isg-lightbox");
    if (!src) return;
    e.preventDefault();
    openLightbox(t);
  };

  root.addEventListener("pointerdown", onPtrDown);
  document.addEventListener("pointerup", onPtrUp);
  document.addEventListener("pointercancel", onPtrCancel);
  root.addEventListener("click", onClick);
  return () => {
    if (!overlay.classList.contains("isg-lightbox--inactive")) {
      overlay._isgFinalizeClose?.();
    } else {
      resetOverlayState(overlay);
    }
    root.removeEventListener("pointerdown", onPtrDown);
    document.removeEventListener("pointerup", onPtrUp);
    document.removeEventListener("pointercancel", onPtrCancel);
    root.removeEventListener("click", onClick);
  };
}
