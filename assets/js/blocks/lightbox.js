





import gsap from "gsap";
import { getLenis } from "./smooth-scroll.js";

const LB_ID = "isg-lightbox";
const LIGHTBOX_OPEN_CLASS = "isg-lightbox-open";


function normalizeSrcAttr(s) {
  if (!s || typeof s !== "string") return "";
  let t = s.trim();
  if (t.startsWith("./")) t = t.slice(2);
  return t;
}


function isAllowedLightboxSrc(src) {
  if (!src || typeof src !== "string") return false;
  const t = src.trim();
  if (t.startsWith("javascript:") || t.startsWith("data:")) return false;
  return (
    t.startsWith("assets/") ||
    t.startsWith("./assets/") ||
    t.startsWith("/") ||
    t.startsWith("http://") ||
    t.startsWith("https://")
  );
}

function isVideoSrc(src) {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(src.trim());
}

function getYouTubeEmbedUrl(src) {
  try {
    const url = new URL(src, window.location.origin);
    const host = url.hostname.toLowerCase();
    let videoId = "";

    if (host === "youtu.be") {
      videoId = url.pathname.replace(/^\/+/, "").split("/")[0] || "";
    } else if (host.includes("youtube.com")) {
      if (url.pathname.startsWith("/watch")) {
        videoId = url.searchParams.get("v") || "";
      } else if (url.pathname.startsWith("/embed/") || url.pathname.startsWith("/shorts/")) {
        videoId = url.pathname.split("/")[2] || "";
      }
    }

    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : "";
  } catch (_) {
    return "";
  }
}

function getVimeoEmbedUrl(src) {
  try {
    const url = new URL(src, window.location.origin);
    const host = url.hostname.toLowerCase();
    if (!host.includes("vimeo.com")) return "";

    const parts = url.pathname.split("/").filter(Boolean);
    const videoId = parts[0] === "video" ? parts[1] : parts[0];
    return videoId && /^\d+$/.test(videoId)
      ? `https://player.vimeo.com/video/${videoId}?autoplay=1`
      : "";
  } catch (_) {
    return "";
  }
}

function getEmbedUrl(src) {
  return getYouTubeEmbedUrl(src) || getVimeoEmbedUrl(src) || "";
}

function getLightboxKind(src, kindAttr = "") {
  if (kindAttr === "embed") return "embed";
  if (isVideoSrc(src)) return "video";
  if (getEmbedUrl(src)) return "embed";
  if (kindAttr === "video") return "video";
  return "image";
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}


function getSliderSwiper(node) {
  if (!(node instanceof Element)) return null;
  const slider = node.closest(".isg-slider.swiper");
  if (!slider) return null;
  return slider.swiper || null;
}


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
    
  }
}

function lockDocumentScroll(overlay) {
  if (!overlay || overlay._isgScrollLock) return;

  const scrollY = window.scrollY || window.pageYOffset || 0;
  const lenis = getLenis?.() || null;
  overlay._isgScrollLock = {
    scrollY,
    lenis,
    htmlClassHadOpen: document.documentElement.classList.contains(LIGHTBOX_OPEN_CLASS),
    bodyClassHadOpen: document.body.classList.contains(LIGHTBOX_OPEN_CLASS),
    htmlOverflow: document.documentElement.style.overflow,
    bodyOverflow: document.body.style.overflow,
    bodyTouchAction: document.body.style.touchAction,
  };

  lenis?.stop?.();
  document.documentElement.classList.add(LIGHTBOX_OPEN_CLASS);
  document.body.classList.add(LIGHTBOX_OPEN_CLASS);
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  document.body.style.touchAction = "none";
}

function unlockDocumentScroll(overlay) {
  const lock = overlay?._isgScrollLock;
  if (!lock) return;

  document.documentElement.style.overflow = lock.htmlOverflow;
  document.body.style.overflow = lock.bodyOverflow;
  document.body.style.touchAction = lock.bodyTouchAction;
  if (!lock.htmlClassHadOpen) {
    document.documentElement.classList.remove(LIGHTBOX_OPEN_CLASS);
  }
  if (!lock.bodyClassHadOpen) {
    document.body.classList.remove(LIGHTBOX_OPEN_CLASS);
  }

  window.scrollTo(0, lock.scrollY || 0);
  lock.lenis?.start?.();
  overlay._isgScrollLock = null;
}





function resetOverlayState(overlay, opts = {}) {
  const { restoreFocus = false, resumeAutoplay = false } = opts;
  const img = overlay.querySelector(".isg-lightbox__img");
  const vid = overlay.querySelector(".isg-lightbox__video");
  const frame = overlay.querySelector(".isg-lightbox__embed");
  const btnPrev = overlay.querySelector(".isg-lightbox__nav--prev");
  const btnNext = overlay.querySelector(".isg-lightbox__nav--next");
  const counter = overlay.querySelector(".isg-lightbox__counter");
  const originAnchor = overlay._isgOriginAnchor || null;
  const originSwiper = overlay._isgOriginSwiper || null;

  overlay._isgOpenToken = (overlay._isgOpenToken || 0) + 1;
  killLbTweens(overlay);
  overlay.classList.add("isg-lightbox--inactive");
  overlay.classList.remove("isg-lightbox--video", "isg-lightbox--embed", "isg-lightbox--image");
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
      
    }
    vid.removeAttribute("src");
    try {
      vid.load();
    } catch (_) {
      
    }
    vid.hidden = true;
  }
  if (frame) {
    frame.removeAttribute("src");
    frame.hidden = true;
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

  unlockDocumentScroll(overlay);
  const hk = overlay._isgLightboxOnKey;
  if (hk) document.removeEventListener("keydown", hk);

  resetSwiperInteraction(originSwiper);
  if (resumeAutoplay) originSwiper?.autoplay?.start?.();
  if (restoreFocus && originAnchor instanceof HTMLElement && originAnchor.isConnected) {
    try {
      originAnchor.focus({ preventScroll: true });
    } catch (_) {
      
    }
  }
}


function killLbTweens(overlay) {
  const nodes = overlay.querySelectorAll(
    ".isg-lightbox__backdrop, .isg-lightbox__panel, .isg-lightbox__img, .isg-lightbox__video, .isg-lightbox__embed, .isg-lightbox__counter, .isg-lightbox__nav",
  );
  gsap.killTweensOf(nodes);
  if (overlay._isgLbTl) {
    overlay._isgLbTl.kill();
    overlay._isgLbTl = null;
  }
}


function waitActiveMedia(overlay) {
  const img = overlay.querySelector(".isg-lightbox__img");
  const vid = overlay.querySelector(".isg-lightbox__video");
  const frame = overlay.querySelector(".isg-lightbox__embed");
  if (img && !img.hidden && img.src) {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => resolve();
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
    });
  }
  if (frame && !frame.hidden && frame.src) return Promise.resolve();
  if (vid && !vid.hidden && vid.src) return Promise.resolve();
  return Promise.resolve();
}






function createOpenTimeline(overlay) {
  const backdrop = overlay.querySelector(".isg-lightbox__backdrop");
  const panel = overlay.querySelector(".isg-lightbox__panel");
  const img = overlay.querySelector(".isg-lightbox__img");
  const vid = overlay.querySelector(".isg-lightbox__video");
  const frame = overlay.querySelector(".isg-lightbox__embed");
  const reduce = prefersReducedMotion();

  
  let media = null;
  if (img && !img.hidden) media = img;
  else if (vid && !vid.hidden) media = vid;
  else if (frame && !frame.hidden) media = frame;

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
      if (media && (media.tagName === "VIDEO" || media.tagName === "IFRAME")) gsap.set(media, { clearProps: "opacity,transform" });
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





function playCloseTimeline(overlay, onComplete) {
  const backdrop = overlay.querySelector(".isg-lightbox__backdrop");
  const panel = overlay.querySelector(".isg-lightbox__panel");
  const img = overlay.querySelector(".isg-lightbox__img");
  const vid = overlay.querySelector(".isg-lightbox__video");
  const frame = overlay.querySelector(".isg-lightbox__embed");
  const reduce = prefersReducedMotion();

  
  let media = null;
  if (img && !img.hidden) media = img;
  else if (vid && !vid.hidden) media = vid;
  else if (frame && !frame.hidden) media = frame;

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
      media.tagName === "VIDEO" || media.tagName === "IFRAME"
        ? { opacity: 0, scale: 0.96, duration: 0.28, ease: "power2.in" }
        : { opacity: 0, scale: 0.96, filter: "blur(8px)", duration: 0.3, ease: "power2.in" },
      0.02,
    );
  }
  tl.to(backdrop, { opacity: 0, duration: 0.34, ease: "power1.in" }, 0.12);
  overlay._isgLbTl = tl;
}


function collectAlbum(anchor) {
  const slider = anchor.closest("[data-isg-slider]");
  const certs = anchor.closest(".isg-about-certs");
  
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
    const kindAttr = (el.getAttribute("data-isg-lightbox-kind") || "").trim().toLowerCase();
    const kind = getLightboxKind(src, kindAttr);
    out.push({ node: el, src, alt, kind, embedUrl: kind === "embed" ? getEmbedUrl(src) : "" });
  }
  return out;
}

function patchOverlayAttrs(el) {
  resetOverlayState(el);
  
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
        <iframe class="isg-lightbox__embed" hidden allow="autoplay; fullscreen; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen title="Video player"></iframe>
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


function bindOverlayOnce(overlay) {
  if (overlay.dataset.isgBound === "1") return;
  overlay.dataset.isgBound = "1";

  const img = overlay.querySelector(".isg-lightbox__img");
  const vid = overlay.querySelector(".isg-lightbox__video");
  const frame = overlay.querySelector(".isg-lightbox__embed");
  const btnPrev = overlay.querySelector(".isg-lightbox__nav--prev");
  const btnNext = overlay.querySelector(".isg-lightbox__nav--next");
  const counter = overlay.querySelector(".isg-lightbox__counter");
  const backdrop = overlay.querySelector(".isg-lightbox__backdrop");
  const panel = overlay.querySelector(".isg-lightbox__panel");

  const showAt = (i) => {
    const album = overlay._isgAlbum;
    if (!album?.length || !img) return;
    const n = album.length;
    overlay._isgIndex = ((i % n) + n) % n;
    const item = album[overlay._isgIndex];
    const isVideo = item.kind === "video";
    const isEmbed = item.kind === "embed";

    overlay.classList.toggle("isg-lightbox--video", isVideo);
    overlay.classList.toggle("isg-lightbox--embed", isEmbed);
    overlay.classList.toggle("isg-lightbox--image", !isVideo && !isEmbed);

    if (isVideo && vid) {
      if (frame) {
        frame.removeAttribute("src");
        frame.hidden = true;
      }
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
        
      }
    } else if (isEmbed && frame) {
      if (vid) {
        try {
          vid.pause();
        } catch (_) {
          
        }
        vid.removeAttribute("src");
        try {
          vid.load();
        } catch (_) {
          
        }
        vid.hidden = true;
      }
      img.removeAttribute("src");
      img.alt = "";
      img.hidden = true;
      frame.hidden = false;
      frame.src = item.embedUrl || item.src;
      frame.setAttribute("title", item.alt || "Video player");
    } else {
      if (vid) {
        try {
          vid.pause();
        } catch (_) {
          
        }
        vid.removeAttribute("src");
        try {
          vid.load();
        } catch (_) {
          
        }
        vid.hidden = true;
      }
      if (frame) {
        frame.removeAttribute("src");
        frame.hidden = true;
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

  const onBackdropPointer = (e) => {
    e.preventDefault();
    e.stopPropagation();
    close();
  };

  backdrop?.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  backdrop?.addEventListener("pointerup", onBackdropPointer);
  backdrop?.addEventListener("click", onBackdropPointer);
  panel?.addEventListener("click", (e) => e.stopPropagation());
  overlay.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (target.closest(".isg-lightbox__panel") || target.closest(".isg-lightbox__close")) return;
    if (target === overlay || target.closest(".isg-lightbox__backdrop")) close();
  });
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




export function openLightbox(anchor) {
  if (!anchor || !(anchor instanceof Element)) return;
  const album = collectAlbum(anchor);
  if (!album.length) return;

  const overlay = ensureOverlay();
  bindOverlayOnce(overlay);

  const raw = anchor.getAttribute("data-isg-lightbox");
  const targetSrc = normalizeSrcAttr(raw || "");
  let start = album.findIndex((x) => x.node === anchor);
  if (start < 0) start = album.findIndex((x) => x.src === targetSrc);
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
  const activeTrigger =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  if (activeTrigger && (activeTrigger === anchor || activeTrigger.contains(anchor))) {
    try {
      activeTrigger.blur();
    } catch (_) {
      
    }
  }

  overlay.removeAttribute("hidden");
  overlay.classList.remove("isg-lightbox--inactive");
  overlay.setAttribute("aria-hidden", "false");
  lockDocumentScroll(overlay);
  overlay._isgOriginSwiper?.autoplay?.stop?.();
  if (hk) document.addEventListener("keydown", hk);
  try {
    overlay.querySelector(".isg-lightbox__close")?.focus({ preventScroll: true });
  } catch (_) {
    overlay.querySelector(".isg-lightbox__close")?.focus();
  }

  waitActiveMedia(overlay).then(() => {
    if (overlay._isgOpenToken !== openToken || overlay.classList.contains("isg-lightbox--inactive")) return;
    requestAnimationFrame(() => {
      if (overlay._isgOpenToken !== openToken || overlay.classList.contains("isg-lightbox--inactive")) return;
      tl.play();
    });
  });
}

const DRAG_PX = 14;




export function initLightbox(root = document.body) {
  const overlay = ensureOverlay();

  
  let ptr = null;
  let suppressSliderClickUntil = 0;

  
  const onPtrDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const t = e.target instanceof Element ? e.target.closest("[data-isg-lightbox]") : null;
    if (!t || !root.contains(t) || !t.closest("[data-isg-slider]")) return;
    ptr = { t, x: e.clientX, y: e.clientY, pid: e.pointerId };
  };

  
  const onPtrUp = (e) => {
    if (!ptr || e.pointerId !== ptr.pid) return;
    const moved = Math.hypot(e.clientX - ptr.x, e.clientY - ptr.y);
    if (moved <= DRAG_PX) {
      const src = ptr.t.getAttribute("data-isg-lightbox");
      if (src && isAllowedLightboxSrc(src)) {
        resetSwiperInteraction(getSliderSwiper(ptr.t));
        suppressSliderClickUntil = performance.now() + 350;
        openLightbox(ptr.t);
      }
    }
    ptr = null;
  };

  const onPtrCancel = () => {
    ptr = null;
  };

  
  const onClick = (e) => {
    const t = e.target instanceof Element ? e.target.closest("[data-isg-lightbox]") : null;
    if (!t || !root.contains(t)) return;
    if (t.closest("[data-isg-slider]")) {
      e.preventDefault();
      e.stopPropagation();
      const isKeyboardActivation = e.detail === 0;
      if (isKeyboardActivation || performance.now() > suppressSliderClickUntil) {
        const src = t.getAttribute("data-isg-lightbox");
        if (src && isAllowedLightboxSrc(src)) openLightbox(t);
      }
      return;
    }
    const src = t.getAttribute("data-isg-lightbox");
    if (!src) return;
    e.preventDefault();
    openLightbox(t);
  };

  root.addEventListener("pointerdown", onPtrDown);
  document.addEventListener("pointerup", onPtrUp);
  document.addEventListener("pointercancel", onPtrCancel);
  root.addEventListener("click", onClick, true);
  return () => {
    if (!overlay.classList.contains("isg-lightbox--inactive")) {
      overlay._isgFinalizeClose?.();
    } else {
      resetOverlayState(overlay);
    }
    root.removeEventListener("pointerdown", onPtrDown);
    document.removeEventListener("pointerup", onPtrUp);
    document.removeEventListener("pointercancel", onPtrCancel);
    root.removeEventListener("click", onClick, true);
  };
}
