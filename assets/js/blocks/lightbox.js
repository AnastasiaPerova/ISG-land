/**
 * Лайтбокс: data-isg-lightbox="<url>". Альбом = все такие элементы в том же
 * [data-isg-slider] или в .isg-about-certs. Стрелки, ←/→, зацикливание.
 */

const LB_ID = "isg-lightbox";

/** @param {string} s */
function normalizeSrcAttr(s) {
  if (!s || typeof s !== "string") return "";
  let t = s.trim();
  if (t.startsWith("./")) t = t.slice(2);
  return t;
}

/** @param {string} src */
function isAllowedImageSrc(src) {
  if (!src || typeof src !== "string") return false;
  const t = src.trim();
  if (t.startsWith("javascript:") || t.startsWith("data:")) return false;
  return t.startsWith("assets/") || t.startsWith("./assets/") || t.startsWith("/");
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
    const raw = el.getAttribute("data-isg-lightbox");
    if (!raw || !isAllowedImageSrc(raw)) continue;
    const src = normalizeSrcAttr(raw);
    const alt =
      el.getAttribute("aria-label") ||
      el.querySelector(".isg-filled-item__text")?.textContent?.trim() ||
      "";
    out.push({ src, alt });
  }
  return out;
}

function ensureOverlay() {
  let el = document.getElementById(LB_ID);
  if (el) return el;

  el = document.createElement("div");
  el.id = LB_ID;
  el.className = "isg-lightbox";
  el.setAttribute("hidden", "");
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", "Image gallery");
  el.innerHTML = `
    <button type="button" class="isg-lightbox__backdrop" aria-label="Close"></button>
    <div class="isg-lightbox__panel">
      <button type="button" class="isg-lightbox__nav isg-lightbox__nav--prev" aria-label="Previous image" hidden>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>
      <div class="isg-lightbox__stage">
        <img class="isg-lightbox__img" alt="" decoding="async" />
        <span class="isg-lightbox__counter" aria-live="polite" hidden></span>
      </div>
      <button type="button" class="isg-lightbox__nav isg-lightbox__nav--next" aria-label="Next image" hidden>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>
      <button type="button" class="isg-lightbox__close" aria-label="Close">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
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
  const btnPrev = overlay.querySelector(".isg-lightbox__nav--prev");
  const btnNext = overlay.querySelector(".isg-lightbox__nav--next");
  const counter = overlay.querySelector(".isg-lightbox__counter");

  const showAt = (i) => {
    const album = overlay._isgAlbum;
    if (!album?.length || !img) return;
    const n = album.length;
    overlay._isgIndex = ((i % n) + n) % n;
    const item = album[overlay._isgIndex];
    img.src = item.src;
    img.alt = item.alt || "";
    const single = n <= 1;
    if (btnPrev) btnPrev.hidden = single;
    if (btnNext) btnNext.hidden = single;
    if (counter) {
      counter.hidden = single;
      counter.textContent = single ? "" : `${overlay._isgIndex + 1} / ${n}`;
    }
  };
  overlay._isgShowAt = showAt;

  const close = () => {
    overlay.setAttribute("hidden", "");
    if (img) {
      img.removeAttribute("src");
      img.alt = "";
    }
    overlay._isgAlbum = null;
    overlay._isgIndex = 0;
    if (btnPrev) btnPrev.hidden = true;
    if (btnNext) btnNext.hidden = true;
    if (counter) {
      counter.hidden = true;
      counter.textContent = "";
    }
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKey);
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

  overlay._isgAlbum = album;

  const hk = overlay._isgLightboxOnKey;
  if (hk) document.removeEventListener("keydown", hk);

  overlay._isgShowAt(start);
  overlay.removeAttribute("hidden");
  document.body.style.overflow = "hidden";
  if (hk) document.addEventListener("keydown", hk);
}

const DRAG_PX = 14;

/**
 * @param {ParentNode} [root]
 */
export function initLightbox(root = document.body) {
  ensureOverlay();

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
    const moved = Math.hypot(e.clientX - ptr.x, e.clientY - ptr.y);
    if (moved <= DRAG_PX) {
      const src = ptr.t.getAttribute("data-isg-lightbox");
      if (src && isAllowedImageSrc(src)) openLightbox(ptr.t);
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
    root.removeEventListener("pointerdown", onPtrDown);
    document.removeEventListener("pointerup", onPtrUp);
    document.removeEventListener("pointercancel", onPtrCancel);
    root.removeEventListener("click", onClick);
  };
}
