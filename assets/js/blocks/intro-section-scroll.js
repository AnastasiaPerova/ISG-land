import gsap from "gsap";
import { getLenis } from "./smooth-scroll.js";

function clamp01(t) {
  return Math.max(0, Math.min(1, t));
}

function smoothstep(t) {
  const u = clamp01(t);
  return u * u * (3 - 2 * u);
}

function easeOutCubic(t) {
  const u = clamp01(t);
  return 1 - (1 - u) ** 3;
}

function easeInOutCubic(t) {
  const u = clamp01(t);
  return u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
}


const VIEWPORT_COVER_START = 0.26;
const VIEWPORT_COVER_START_MOBILE = 0.14;


const HEADROOM_VH = 0.92;
const HEADROOM_VH_MOBILE = 0.52;

const EXIT_HOLD_MIN_VISIBLE_FRAC = 0.1;


const FILL_PROGRESS_POWER = 1.08;
const CHAR_FILL_WINDOW = 1.18;
const CHAR_FILL_LEAD = 0.72;
const CHAR_FILL_TAIL = 0.9;
const TITLE_REVEAL_DELAY = 0.28;
const TITLE_REVEAL_DURATION = 1.1;
const TITLE_REVEAL_Y = 28;
const BODY_REVEAL_DELAY = 0.52;
const BODY_REVEAL_DURATION = 1;
const BODY_REVEAL_Y = 22;




function introScrollProgress(introRoot, session) {
  const rect = introRoot.getBoundingClientRect();
  const vh = window.innerHeight || 1;
  const mobile = window.matchMedia("(max-width: 1099px)").matches;
  const visibleH = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
  const blockH = rect.height || 1;
  const gate = Math.min(
    vh * (mobile ? VIEWPORT_COVER_START_MOBILE : VIEWPORT_COVER_START),
    blockH * (mobile ? 0.55 : 0.9),
  );
  if (visibleH < gate) {
    session.peakP = 0;
    return 0;
  }

  const headroom = Math.max(
    mobile ? blockH * 0.28 : blockH * 0.16,
    vh * (mobile ? HEADROOM_VH_MOBILE : HEADROOM_VH),
  );
  let pRaw = clamp01((visibleH - gate) / headroom);

  if (mobile) {
    const travelStart = vh;
    const travelEnd = Math.max(1, -blockH * 0.24);
    const travelProgress = clamp01((travelStart - rect.top) / (travelStart - travelEnd));
    pRaw = Math.max(pRaw, travelProgress);
  }

  session.peakP = Math.max(session.peakP, pRaw);

  if (session.peakP < 0.99) return pRaw;

  const fracVisible = visibleH / blockH;
  const k = EXIT_HOLD_MIN_VISIBLE_FRAC;
  if (fracVisible >= k) {
    return Math.max(pRaw, 1);
  }
  const u = smoothstep(fracVisible / k);
  return u * 1 + (1 - u) * pRaw;
}

export function splitHeadingIntoChars(h2) {
  if (h2.dataset.isgIntroSplit === "1") return;
  const raw = h2.textContent.replace(/\s+/g, " ").trim();
  if (!raw) return;

  h2.dataset.isgIntroOriginal = h2.innerHTML;
  h2.textContent = "";
  h2.setAttribute("aria-label", raw);
  h2.classList.add("isg-intro-reveal__title");

  const line = document.createElement("span");
  line.className = "isg-intro-reveal__chars";
  line.setAttribute("aria-hidden", "true");

  const words = raw.split(" ");

  const appendChar = (parent, ch, isSpace) => {
    const wrap = document.createElement("span");
    wrap.className = "isg-intro-char";
    if (isSpace) wrap.classList.add("isg-intro-char--ws");

    const ghost = document.createElement("span");
    ghost.className = "isg-intro-char__ghost";
    const solid = document.createElement("span");
    solid.className = "isg-intro-char__solid";
    const displayCh = isSpace ? "\u00a0" : ch;
    ghost.textContent = displayCh;
    solid.textContent = displayCh;

    wrap.appendChild(ghost);
    wrap.appendChild(solid);
    parent.appendChild(wrap);
  };

  for (let w = 0; w < words.length; w += 1) {
    const wordText = words[w];
    const wordEl = document.createElement("span");
    wordEl.className = "isg-intro-word";

    for (let i = 0; i < wordText.length; i += 1) {
      appendChar(wordEl, wordText[i], false);
    }

    line.appendChild(wordEl);

    if (w < words.length - 1) {
      appendChar(line, " ", true);
    }
  }

  h2.appendChild(line);
  h2.dataset.isgIntroSplit = "1";
}

export function restoreHeading(h2) {
  if (h2.dataset.isgIntroSplit !== "1") return;
  const orig = h2.getAttribute("data-isg-intro-original");
  if (orig != null) h2.innerHTML = orig;
  h2.removeAttribute("data-isg-intro-original");
  h2.removeAttribute("aria-label");
  h2.classList.remove("isg-intro-reveal__title");
  delete h2.dataset.isgIntroSplit;
}

export function setCharFillsInScope(scopeEl, tLetters) {
  const chars = scopeEl.querySelectorAll(".isg-intro-char");
  const n = chars.length;
  if (!n) return;
  const travel = Math.max(1, n - 1) + CHAR_FILL_LEAD + CHAR_FILL_TAIL;
  chars.forEach((el, i) => {
    const cursor = tLetters * travel - i + CHAR_FILL_LEAD;
    const local = clamp01(cursor / CHAR_FILL_WINDOW);
    const fill = easeInOutCubic(local);
    const opacity = 0.18 + easeOutCubic(local) * 0.82;
    const y = (1 - easeOutCubic(local)) * 0.34;

    el.style.setProperty("--isg-char-fill", String(fill));
    el.style.setProperty("--isg-char-opacity", String(opacity));
    el.style.setProperty("--isg-char-y", `${y.toFixed(4)}em`);
  });
}




export function initIntroSectionScroll(root = document) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const disposers = [];

  
  const sessions = [];

  root.querySelectorAll("[data-isg-intro-scroll]").forEach((introRoot) => {
    if (introRoot.dataset.isgIntroInit === "1") return;
    const h2List = Array.from(introRoot.querySelectorAll(".isg-title-group h2.isg-display"));
    if (!h2List.length) return;
    const titleGroup = introRoot.querySelector(".isg-title-group");
    const bodyNodes = Array.from(introRoot.querySelectorAll(".isg-body")).filter((node) => node instanceof HTMLElement);

    if (reduced) return;

    introRoot.dataset.isgIntroInit = "1";

    h2List.forEach((h2) => splitHeadingIntoChars(h2));

    const hasChars = h2List.some((h2) => h2.querySelectorAll(".isg-intro-char").length > 0);
    if (!hasChars) {
      h2List.forEach((h2) => restoreHeading(h2));
      delete introRoot.dataset.isgIntroInit;
      return;
    }

    const applyFrame = (p) => {
      const prog = easeInOutCubic(clamp01(p));
      const tLetters = easeOutCubic(clamp01(prog ** FILL_PROGRESS_POWER));
      h2List.forEach((h2) => setCharFillsInScope(h2, tLetters));
    };

    const session = {
      introRoot,
      h2List,
      titleGroup: titleGroup instanceof HTMLElement ? titleGroup : null,
      bodyNodes,
      peakP: 0,
      tick: () => {},
    };
    session.tick = () => {
      applyFrame(introScrollProgress(introRoot, session));
    };
    sessions.push(session);
  });

  if (!sessions.length) {
    return () => {};
  }

  const titleRevealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const session = sessions.find((item) => item.introRoot === entry.target);
        const titleGroup = session?.titleGroup;
        if (!session || !titleGroup || titleGroup.dataset.isgTitleRevealDone === "1") return;

        titleGroup.dataset.isgTitleRevealDone = "1";
        gsap.to(titleGroup, {
          autoAlpha: 1,
          y: 0,
          duration: TITLE_REVEAL_DURATION,
          delay: TITLE_REVEAL_DELAY,
          ease: "power2.out",
          overwrite: true,
        });
        titleRevealObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.2,
      rootMargin: "0px 0px -10% 0px",
    },
  );

  sessions.forEach((session) => {
    if (!session.titleGroup) return;
    gsap.set(session.titleGroup, {
      autoAlpha: 0,
      y: TITLE_REVEAL_Y,
      willChange: "transform, opacity",
    });

    const rect = session.introRoot.getBoundingClientRect();
    const inView = rect.bottom > 0 && rect.top < (window.innerHeight || 1) * 0.9;
    if (inView) {
      session.titleGroup.dataset.isgTitleRevealDone = "1";
      gsap.to(session.titleGroup, {
        autoAlpha: 1,
        y: 0,
        duration: TITLE_REVEAL_DURATION,
        delay: TITLE_REVEAL_DELAY,
        ease: "power2.out",
        overwrite: true,
      });
      return;
    }

    titleRevealObserver.observe(session.introRoot);
  });

  sessions.forEach((session) => {
    if (!session.bodyNodes.length) return;

    const animateBodies = () => {
      gsap.to(session.bodyNodes, {
        autoAlpha: 1,
        y: 0,
        duration: BODY_REVEAL_DURATION,
        delay: BODY_REVEAL_DELAY,
        stagger: 0.08,
        ease: "power2.out",
        overwrite: true,
      });
    };

    gsap.set(session.bodyNodes, {
      autoAlpha: 0,
      y: BODY_REVEAL_Y,
      willChange: "transform, opacity",
    });

    const rect = session.introRoot.getBoundingClientRect();
    const inView = rect.bottom > 0 && rect.top < (window.innerHeight || 1) * 0.9;
    if (inView) {
      animateBodies();
      return;
    }

    const bodyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateBodies();
          bodyObserver.disconnect();
        });
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    bodyObserver.observe(session.introRoot);
    disposers.push(() => bodyObserver.disconnect());
  });

  const runAll = () => {
    sessions.forEach((s) => s.tick());
  };

  const lenis = getLenis();
  if (lenis) {
    lenis.on("scroll", runAll);
    disposers.push(() => lenis.off("scroll", runAll));
  } else {
    window.addEventListener("scroll", runAll, { passive: true });
    disposers.push(() => window.removeEventListener("scroll", runAll));
  }

  const onResize = () => runAll();
  window.addEventListener("resize", onResize);
  disposers.push(() => window.removeEventListener("resize", onResize));

  const onLoad = () => runAll();
  window.addEventListener("load", onLoad, { once: true });

  if (document.fonts?.ready) {
    document.fonts.ready.then(runAll).catch(runAll);
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(runAll);
  });

  disposers.push(() => {
    titleRevealObserver.disconnect();
    window.removeEventListener("load", onLoad);
    sessions.forEach((s) => {
      if (s.titleGroup) {
        gsap.killTweensOf(s.titleGroup);
        gsap.set(s.titleGroup, { clearProps: "opacity,visibility,transform,y,willChange" });
        delete s.titleGroup.dataset.isgTitleRevealDone;
      }
      if (s.bodyNodes.length) {
        gsap.killTweensOf(s.bodyNodes);
        gsap.set(s.bodyNodes, { clearProps: "opacity,visibility,transform,y,willChange" });
      }
      s.h2List.forEach((h2) => {
        restoreHeading(h2);
      });
      delete s.introRoot.dataset.isgIntroInit;
    });
  });

  return () => disposers.forEach((fn) => fn());
}
