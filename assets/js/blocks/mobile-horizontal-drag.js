const MOBILE_QUERY = "(max-width: 1100px)";

function unwrapTrack(rail) {
  const track = rail.querySelector(":scope > .isg-mobile-draggable-track");
  if (!track) return;

  Array.from(track.children).forEach((child) => rail.appendChild(child));
  track.remove();
}

function initRail(rail) {
  if (!rail || rail.dataset.isgMobileDragInit === "1") return () => {};

  unwrapTrack(rail);
  rail.dataset.isgMobileDragInit = "1";
  rail.classList.add("isg-mobile-draggable-rail");

  return () => {
    unwrapTrack(rail);
    rail.classList.remove("isg-mobile-draggable-rail", "isg-mobile-draggable--dragging");
    delete rail.dataset.isgMobileDragInit;
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

    [
      ".isg-digits-section.component--featured .columns--start",
      ".isg-quality-visual__slides",
    ].forEach((selector) => {
      root.querySelectorAll(selector).forEach((el) => {
        disposers.push(initRail(el));
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
