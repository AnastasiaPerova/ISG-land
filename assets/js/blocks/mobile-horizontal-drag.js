const MOBILE_QUERY = "(max-width: 1100px)";

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function buildTrack(rail) {
  const existing = rail.querySelector(":scope > .isg-mobile-draggable-track");
  if (existing) return existing;

  const track = document.createElement("div");
  track.className = "isg-mobile-draggable-track";
  const children = Array.from(rail.children);
  children.forEach((child) => track.appendChild(child));
  rail.appendChild(track);
  return track;
}

function initRail(rail, itemSelector) {
  if (!rail || rail.dataset.isgMobileDragInit === "1") return () => {};
  rail.dataset.isgMobileDragInit = "1";
  rail.classList.add("isg-mobile-draggable-rail");

  const track = buildTrack(rail);
  const items = () => Array.from(track.querySelectorAll(itemSelector));

  let offset = 0;
  let minOffset = 0;
  let maxOffset = 0;
  let railPadLeft = 0;
  let railPadRight = 0;
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let startOffset = 0;
  let dragging = false;
  let moved = false;
  let lastIndex = -1;
  let snapRaf = 0;

  const getCenterIndex = () => {
    const slideEls = items();
    if (!slideEls.length) return 0;
    const centerX = rail.clientWidth / 2;
    let best = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    slideEls.forEach((el, i) => {
      const cx = el.offsetLeft + el.offsetWidth / 2 + offset;
      const d = Math.abs(cx - centerX);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    return best;
  };

  const emitIndex = () => {
    const idx = getCenterIndex();
    if (idx === lastIndex) return;
    lastIndex = idx;
    rail.dispatchEvent(
      new CustomEvent("isg-mobile-drag-index", {
        detail: { index: idx },
      }),
    );
  };

  const render = () => {
    track.style.transform = `translate3d(${offset}px, 0, 0)`;
    emitIndex();
  };

  const stopSnap = () => {
    if (!snapRaf) return;
    cancelAnimationFrame(snapRaf);
    snapRaf = 0;
  };

  const getSnapOffsetForIndex = (index) => {
    const slideEls = items();
    if (!slideEls.length) return 0;
    const i = clamp(index, 0, slideEls.length - 1);
    return clamp(-slideEls[i].offsetLeft, minOffset, maxOffset);
  };

  const getNearestSnapOffset = () => {
    const slideEls = items();
    if (!slideEls.length) return 0;
    let best = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    slideEls.forEach((el, i) => {
      const target = getSnapOffsetForIndex(i);
      const d = Math.abs(target - offset);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    return getSnapOffsetForIndex(best);
  };

  const animateTo = (target, durationMs = 320) => {
    stopSnap();
    const from = offset;
    const to = clamp(target, minOffset, maxOffset);
    if (Math.abs(to - from) < 0.5) {
      offset = to;
      render();
      return;
    }

    const start = performance.now();
    const easeOutCubic = (t) => 1 - (1 - t) ** 3;

    const tick = (now) => {
      const p = clamp((now - start) / durationMs, 0, 1);
      offset = from + (to - from) * easeOutCubic(p);
      render();
      if (p >= 1) {
        snapRaf = 0;
        return;
      }
      snapRaf = requestAnimationFrame(tick);
    };

    snapRaf = requestAnimationFrame(tick);
  };

  const measure = () => {
    const railW = rail.clientWidth || 0;
    const styles = window.getComputedStyle(rail);
    railPadLeft = parseFloat(styles.paddingLeft) || 0;
    railPadRight = parseFloat(styles.paddingRight) || 0;
    const visibleW = Math.max(0, railW - railPadLeft - railPadRight);
    const trackW = track.scrollWidth || 0;
    maxOffset = 0;
    minOffset = Math.min(0, visibleW - trackW);
    offset = clamp(offset, minOffset, maxOffset);
    render();
  };

  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    stopSnap();
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    startOffset = offset;
    dragging = false;
    moved = false;
  };

  const onPointerMove = (e) => {
    if (pointerId !== e.pointerId) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (!dragging) {
      if (absDx < 8 && absDy < 8) return;

      // Start horizontal drag only when X intent is clearly stronger than Y.
      // Otherwise let the browser keep the native vertical page scroll.
      if (absDx <= absDy * 1.2) {
        pointerId = null;
        return;
      }

      dragging = true;
      rail.classList.add("isg-mobile-draggable--dragging");

      try {
        rail.setPointerCapture(e.pointerId);
      } catch (_) {
        /* noop */
      }
    }

    moved = true;
    e.preventDefault();
    offset = clamp(startOffset + dx, minOffset, maxOffset);
    render();
  };

  const finishPointer = (e) => {
    if (pointerId !== e.pointerId) return;
    if (dragging && moved) {
      e.preventDefault();
      animateTo(getNearestSnapOffset());
    }
    rail.classList.remove("isg-mobile-draggable--dragging");
    try {
      rail.releasePointerCapture(e.pointerId);
    } catch (_) {
      /* noop */
    }
    pointerId = null;
    dragging = false;
    moved = false;
  };

  const ro = new ResizeObserver(measure);
  ro.observe(rail);
  ro.observe(track);

  rail.addEventListener("pointerdown", onPointerDown);
  rail.addEventListener("pointermove", onPointerMove, { passive: false });
  rail.addEventListener("pointerup", finishPointer);
  rail.addEventListener("pointercancel", finishPointer);
  rail.addEventListener("lostpointercapture", finishPointer);

  requestAnimationFrame(measure);

  return () => {
    stopSnap();
    ro.disconnect();
    rail.removeEventListener("pointerdown", onPointerDown);
    rail.removeEventListener("pointermove", onPointerMove);
    rail.removeEventListener("pointerup", finishPointer);
    rail.removeEventListener("pointercancel", finishPointer);
    rail.removeEventListener("lostpointercapture", finishPointer);
    rail.classList.remove("isg-mobile-draggable-rail", "isg-mobile-draggable--dragging");
    delete rail.dataset.isgMobileDragInit;
    const movedChildren = Array.from(track.children);
    movedChildren.forEach((child) => rail.appendChild(child));
    track.remove();
  };
}

export function initMobileHorizontalDrag(root = document) {
  const mq = window.matchMedia(MOBILE_QUERY);
  /** @type {(() => void)[]} */
  let disposers = [];

  const destroyRails = () => {
    while (disposers.length) {
      try {
        disposers.pop()();
      } catch (_) {
        /* noop */
      }
    }
  };

  const buildRails = () => {
    destroyRails();
    if (!mq.matches) return;

    const rails = [
      {
        selector: ".isg-digits-section.component--featured .columns--start",
        itemSelector: ".columns__item",
      },
      {
        selector: ".isg-quality-visual__slides",
        itemSelector: ".isg-quality-visual__slide",
      },
    ];

    rails.forEach(({ selector, itemSelector }) => {
      root.querySelectorAll(selector).forEach((el) => {
        disposers.push(initRail(el, itemSelector));
      });
    });
  };

  const onChange = () => {
    buildRails();
  };

  buildRails();
  mq.addEventListener("change", onChange);
  window.addEventListener("resize", onChange);

  return () => {
    mq.removeEventListener("change", onChange);
    window.removeEventListener("resize", onChange);
    destroyRails();
  };
}
