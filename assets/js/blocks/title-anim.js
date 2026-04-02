import gsap from "gsap";

/**
 * Intro с побуквенной заливкой (intro-section-scroll) — не трогать .isg-about-intro h2.isg-display.
 */
const HEADING_SELECTORS = [
  ".isg-section-head__title.isg-h2",
  ".isg-about-text-grid h2.isg-h2",
];

const M = "isg-title-anim__measure";

function doubleRaf(fn) {
  requestAnimationFrame(() => {
    requestAnimationFrame(fn);
  });
}

function doubleRafPromise() {
  return new Promise((resolve) => {
    doubleRaf(resolve);
  });
}

/**
 * Разбивает текст на строки по фактическому переносу (offsetTop слов), затем строит маски.
 */
function splitHeadingIntoLines(heading) {
  const raw = heading.textContent.replace(/\s+/g, " ").trim();
  if (!raw) {
    return [];
  }
  const words = raw.split(" ");
  /* До измерения — тот же шрифт, что у финального .isg-h2.isg-title-anim (H3), иначе переносы считаются по headline и ломаются при меньшем размере. */
  heading.classList.add("isg-title-anim");
  heading.textContent = "";

  words.forEach((w, i) => {
    const s = document.createElement("span");
    s.className = M;
    s.textContent = w;
    heading.appendChild(s);
    if (i < words.length - 1) {
      heading.appendChild(document.createTextNode(" "));
    }
  });

  const spans = Array.from(heading.querySelectorAll(`.${M}`));
  if (!spans.length) {
    heading.classList.remove("isg-title-anim");
    return [];
  }

  void heading.offsetHeight;

  const groups = [];
  for (let i = 0; i < spans.length; i++) {
    if (i > 0 && Math.abs(spans[i].offsetTop - spans[i - 1].offsetTop) > 2) {
      groups.push([]);
    }
    if (groups.length === 0) {
      groups.push([]);
    }
    groups[groups.length - 1].push(spans[i]);
  }

  heading.textContent = "";
  const lineInners = [];
  groups.forEach((group) => {
    const mask = document.createElement("span");
    mask.className = "isg-title-anim__line-mask";
    const inner = document.createElement("span");
    inner.className = "isg-title-anim__line-inner";
    group.forEach((span, i) => {
      inner.appendChild(document.createTextNode(span.textContent));
      if (i < group.length - 1) {
        inner.appendChild(document.createTextNode(" "));
      }
    });
    mask.appendChild(inner);
    heading.appendChild(mask);
    lineInners.push(inner);
  });

  return lineInners;
}

export function initTitleAnim(root = document) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  /** @type {HTMLElement[]} */
  const headings = [];
  HEADING_SELECTORS.forEach((sel) => {
    root.querySelectorAll(sel).forEach((el) => {
      if (!(el instanceof HTMLElement)) {
        return;
      }
      if (el.closest("[data-isg-title-anim-skip]")) {
        return;
      }
      headings.push(el);
    });
  });

  const originals = new Map();
  /** @type {IntersectionObserver[]} */
  const observers = [];
  /** @type {gsap.core.Tween[]} */
  const tweens = [];

  function wireHeading(h2) {
    const origHtml = h2.innerHTML;
    originals.set(h2, origHtml);
    const lineInners = splitHeadingIntoLines(h2);
    if (!lineInners.length) {
      originals.delete(h2);
      return;
    }

    gsap.set(lineInners, {
      yPercent: 112,
      opacity: 0,
      scale: 0.98,
      filter: "blur(4px)",
      transformOrigin: "50% 0%",
    });

    const play = () => {
      const tw = gsap.to(lineInners, {
        yPercent: 0,
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.95,
        stagger: 0.1,
        ease: "power3.out",
      });
      tweens.push(tw);
    };

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          obs.unobserve(entry.target);
          doubleRaf(play);
        });
      },
      { root: null, rootMargin: "0px", threshold: 0 }
    );

    observers.push(obs);
    doubleRaf(() => obs.observe(h2));
  }

  const start = () => {
    headings.forEach(wireHeading);
  };

  /** После загрузки шрифтов и стабилизации ширины — иначе переносы «слова в одну строку» считаются неверно. */
  const run = async () => {
    if (document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch {
        /* ignore */
      }
    }
    await doubleRafPromise();
    start();
  };

  void run();

  return () => {
    observers.forEach((o) => o.disconnect());
    observers.length = 0;
    tweens.forEach((tw) => tw.kill());
    tweens.length = 0;
    originals.forEach((html, el) => {
      el.innerHTML = html;
      el.classList.remove("isg-title-anim");
    });
    originals.clear();
  };
}
