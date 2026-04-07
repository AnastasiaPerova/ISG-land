const MOBILE_QUERY = "(max-width: 1099px)";
const DRAG_THRESHOLD = 6;
const AXIS_LOCK_RATIO = 1.1;
const SWIPE_DISTANCE_THRESHOLD = 24;
const SNAP_DURATION = 220;
const SCROLL_IDLE_DELAY = 90;

function unwrapTrack(rail) {
  const track = rail.querySelector(":scope > .isg-mobile-draggable-track");
  if (!track) return;

  Array.from(track.children).forEach((child) => rail.appendChild(child));
  track.remove();
}

function initRail(rail, itemSelector) {
  if (!rail || rail.dataset.isgMobileDragInit === "1") return () => {};

  unwrapTrack(rail);
  rail.dataset.isgMobileDragInit = "1";
  rail.classList.add("isg-mobile-draggable-rail");

  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let startScrollLeft = 0;
  let startIndex = 0;
  let dragging = false;
  let moved = false;
  let suppressClick = false;
  let snapRaf = 0;
  let scrollIdleTimer = 0;
  let lastDragDx = 0;

  const stopSnap = () => {
    if (!snapRaf) return;
    cancelAnimationFrame(snapRaf);
    snapRaf = 0;
  };

  const stopIdleSnap = () => {
    if (!scrollIdleTimer) return;
    clearTimeout(scrollIdleTimer);
    scrollIdleTimer = 0;
  };

  const getItems = () => Array.from(rail.querySelectorAll(itemSelector));

  const getSnapPoints = () => {
    const maxScrollLeft = Math.max(0, rail.scrollWidth - rail.clientWidth);
    const styles = window.getComputedStyle(rail);
    const padLeft = parseFloat(styles.paddingLeft) || 0;

    return getItems().map((item) => {
      const left = Math.max(0, Math.min(item.offsetLeft - padLeft, maxScrollLeft));
      return left;
    });
  };

  const getNearestIndex = (scrollLeft) => {
    const points = getSnapPoints();
    if (!points.length) return 0;

    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    points.forEach((point, index) => {
      const distance = Math.abs(point - scrollLeft);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    return bestIndex;
  };

  const animateTo = (targetScrollLeft, duration = SNAP_DURATION) => {
    stopSnap();
    stopIdleSnap();

    const from = rail.scrollLeft;
    const to = targetScrollLeft;
    if (Math.abs(to - from) < 1) {
      rail.scrollLeft = to;
      return;
    }

    const startedAt = performance.now();
    const easeOutCubic = (t) => 1 - (1 - t) ** 3;

    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      rail.scrollLeft = from + (to - from) * easeOutCubic(progress);

      if (progress >= 1) {
        snapRaf = 0;
        return;
      }

      snapRaf = requestAnimationFrame(tick);
    };

    snapRaf = requestAnimationFrame(tick);
  };

  const snapToCard = (preferredDirection = 0) => {
    const points = getSnapPoints();
    if (!points.length) return;

    const maxIndex = Math.max(0, points.length - 1);
    let targetIndex = getNearestIndex(rail.scrollLeft);

    if (preferredDirection !== 0) {
      targetIndex = Math.max(
        0,
        Math.min(maxIndex, startIndex + preferredDirection),
      );
    }

    animateTo(points[targetIndex] ?? rail.scrollLeft);
  };

  const scheduleIdleSnap = () => {
    stopIdleSnap();
    scrollIdleTimer = window.setTimeout(() => {
      scrollIdleTimer = 0;
      if (dragging || pointerId !== null || snapRaf) return;
      snapToCard(0);
    }, SCROLL_IDLE_DELAY);
  };

  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    stopSnap();
    stopIdleSnap();
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    startScrollLeft = rail.scrollLeft;
    startIndex = getNearestIndex(startScrollLeft);
    dragging = false;
    moved = false;
    lastDragDx = 0;
  };

  const onPointerMove = (e) => {
    if (pointerId !== e.pointerId) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (!dragging) {
      if (absDx < DRAG_THRESHOLD && absDy < DRAG_THRESHOLD) return;

      if (absDx <= absDy * AXIS_LOCK_RATIO) {
        pointerId = null;
        unbindGlobalPointerListeners();
        return;
      }

      dragging = true;
      rail.classList.add("isg-mobile-draggable--dragging");
    }

    moved = true;
    lastDragDx = dx;
    e.preventDefault();
    rail.scrollLeft = startScrollLeft - dx;
  };

  const finishPointer = (e) => {
    if (pointerId !== e.pointerId) return;

    if (dragging && moved) {
      const direction =
        Math.abs(lastDragDx) >= SWIPE_DISTANCE_THRESHOLD ? (lastDragDx < 0 ? 1 : -1) : 0;

      snapToCard(direction);

      suppressClick = true;
      window.setTimeout(() => {
        suppressClick = false;
      }, 0);
    }

    rail.classList.remove("isg-mobile-draggable--dragging");
    unbindGlobalPointerListeners();

    pointerId = null;
    dragging = false;
    moved = false;
    lastDragDx = 0;
  };

  const onClickCapture = (e) => {
    if (!suppressClick) return;
    e.preventDefault();
    e.stopPropagation();
  };

  const bindGlobalPointerListeners = () => {
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", finishPointer);
    window.addEventListener("pointercancel", finishPointer);
  };

  const unbindGlobalPointerListeners = () => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", finishPointer);
    window.removeEventListener("pointercancel", finishPointer);
  };

  const onScroll = () => {
    if (dragging || pointerId !== null || snapRaf) return;
    scheduleIdleSnap();
  };

  const onRailPointerDown = (e) => {
    if (pointerId !== null) return;
    onPointerDown(e);
    bindGlobalPointerListeners();
  };

  rail.addEventListener("pointerdown", onRailPointerDown);
  rail.addEventListener("click", onClickCapture, true);
  rail.addEventListener("scroll", onScroll, { passive: true });

  return () => {
    stopSnap();
    stopIdleSnap();
    unbindGlobalPointerListeners();
    unwrapTrack(rail);
    rail.removeEventListener("pointerdown", onRailPointerDown);
    rail.removeEventListener("click", onClickCapture, true);
    rail.removeEventListener("scroll", onScroll);
    rail.classList.remove("isg-mobile-draggable-rail", "isg-mobile-draggable--dragging");
    delete rail.dataset.isgMobileDragInit;
  };
}

export function initMobileHorizontalDrag(root = document) {
  const mq = window.matchMedia(MOBILE_QUERY);
  
  let disposers = [];

  const destroyRails = () => {
    while (disposers.length) {
      try {
        disposers.pop()();
      } catch (_) {
        
      }
    }
  };

  const buildRails = () => {
    destroyRails();
    if (!mq.matches) return;

    [
      {
        selector: ".isg-digits-section.component--featured .columns--start",
        itemSelector: ".columns__item",
      },
      {
        selector: ".isg-quality-visual__slides",
        itemSelector: ".isg-quality-visual__slide",
      },
    ].forEach(({ selector, itemSelector }) => {
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
