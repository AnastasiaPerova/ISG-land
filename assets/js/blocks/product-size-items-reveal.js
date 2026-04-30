import gsap from "gsap";

const SPEC_SELECTOR = ".isg-size-spec";
const ITEM_SELECTOR = ".isg-size-spec__item";

function isInRevealZone(node) {
  const rect = node.getBoundingClientRect();
  const triggerY = window.innerHeight * 0.9;
  return rect.top <= triggerY && rect.bottom >= 0;
}

export function initProductSizeItemsReveal(root = document) {
  const specs = Array.from(root.querySelectorAll(SPEC_SELECTOR));
  if (!specs.length) return () => {};

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 1099px)").matches;
  const cleanups = [];

  specs.forEach((spec) => {
    const items = Array.from(spec.querySelectorAll(ITEM_SELECTOR));
    if (!items.length) return;

    if (reduced || isMobile) {
      gsap.set(items, { clearProps: "opacity,visibility,transform,y,filter,willChange" });
      return;
    }

    gsap.set(items, {
      autoAlpha: 0,
      y: 24,
      filter: "blur(3px)",
      willChange: "transform, opacity, filter",
    });

    let hasPlayed = false;
    let observer = null;

    const playReveal = () => {
      if (hasPlayed) return;
      hasPlayed = true;
      observer?.disconnect();
      gsap.to(items, {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.58,
        stagger: 0.06,
        ease: "power2.out",
        overwrite: true,
        clearProps: "opacity,visibility,transform,y,filter,willChange",
      });
    };

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting || isInRevealZone(spec)) {
            playReveal();
          }
        });
      },
      {
        threshold: 0.06,
        rootMargin: "0px 0px 8% 0px",
      },
    );

    observer.observe(spec);

    requestAnimationFrame(() => {
      if (isInRevealZone(spec)) {
        playReveal();
      }
    });

    cleanups.push(() => observer?.disconnect());
    cleanups.push(() => gsap.killTweensOf(items));
  });

  return () => {
    cleanups.forEach((fn) => fn());
    specs.forEach((spec) => {
      spec.querySelectorAll(ITEM_SELECTOR).forEach((node) => {
        gsap.set(node, { clearProps: "opacity,visibility,transform,y,filter,willChange" });
      });
    });
  };
}
