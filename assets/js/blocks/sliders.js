/**
 * Горизонтальные слайдеры: прокрутка .isg-slider__track по кнопкам prev/next.
 */
export function initSliders(root = document) {
  const handlers = [];

  root.querySelectorAll(".isg-slider").forEach((slider) => {
    const track = slider.querySelector(".isg-slider__track");
    const prev = slider.querySelector(".isg-slider__btn--prev");
    const next = slider.querySelector(".isg-slider__btn--next");
    if (!track || !prev || !next) return;

    const step = () => {
      const item = track.querySelector(".isg-slider__item");
      const w = item ? item.getBoundingClientRect().width + 24 : 320;
      return Math.min(w, track.clientWidth * 0.85);
    };

    const onPrev = () => {
      track.scrollBy({ left: -step(), behavior: "smooth" });
    };
    const onNext = () => {
      track.scrollBy({ left: step(), behavior: "smooth" });
    };

    prev.addEventListener("click", onPrev);
    next.addEventListener("click", onNext);
    handlers.push(() => {
      prev.removeEventListener("click", onPrev);
      next.removeEventListener("click", onNext);
    });
  });

  return () => handlers.forEach((off) => off());
}
