import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Эффект «reveal из-под sticky hero»:
 * — #isg-hero липнет сверху (CSS) + spacer даёт длину фазы «контент едет снизу»;
 * — #isg-application с отрицательным margin заходит под hero (z-index ниже);
 * — transform только на [data-isg-hero-scene-reveal] внутри .isg-app__scene — sticky остаётся на внешней оболочке.
 */
export function initHeroStickyReveal(root = document) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mq = window.matchMedia("(min-width: 1100px)");
  const disposers = [];

  const stack = root.querySelector("[data-isg-hero-reveal]");
  const app = root.querySelector("[data-isg-hero-reveal-next]");
  const scene = app?.querySelector(".isg-app__scene");
  const revealLayer =
    app?.querySelector("[data-isg-hero-scene-reveal]") ?? scene;

  if (!stack || !app || !scene || !revealLayer) {
    return () => {};
  }

  const clearRevealMotion = () => {
    gsap.set(revealLayer, { clearProps: "transform" });
  };

  let st = null;

  const build = () => {
    if (st) {
      st.kill();
      st = null;
    }
    if (reduced || !mq.matches) {
      clearRevealMotion();
      return;
    }

    st = ScrollTrigger.create({
      trigger: app,
      start: "top bottom",
      end: "top top",
      scrub: 0.5,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = self.progress;
        /* Сдвиг вниз → 0: блок визуально «выезжает» снизу из-под липнущего hero */
        const liftVh = (1 - p) * 22;
        gsap.set(revealLayer, { y: `${liftVh}vh` });
      },
    });
  };

  build();

  const onMq = () => {
    build();
    ScrollTrigger.refresh();
  };

  if (!reduced) {
    mq.addEventListener("change", onMq);
    disposers.push(() => mq.removeEventListener("change", onMq));
  }

  disposers.push(() => {
    if (st) st.kill();
    clearRevealMotion();
  });

  return () => disposers.forEach((fn) => fn());
}
