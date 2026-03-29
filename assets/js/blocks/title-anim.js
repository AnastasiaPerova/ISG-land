import gsap from "gsap";

/**
 * Intro с побуквенной заливкой (intro-section-scroll) — не трогать .isg-about-intro h2.isg-display.
 */
const HEADING_SELECTORS = [
  ".isg-product-content h2.isg-h2",
  ".isg-about-text-grid h2.isg-h2",
  ".isg-about-team-block h2.isg-h2",
  ".isg-about-gallery-block h2.isg-h2",
];

const M = "isg-title-anim__measure";

function doubleRaf(fn) {
  requestAnimationFrame(() => {
    requestAnimationFrame(fn);
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

  heading.classList.add("isg-title-anim");
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

  headings.forEach((h2) => {
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
  });

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      headings.forEach((h2) => {
        void h2.offsetHeight;
      });
    });
  }

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
