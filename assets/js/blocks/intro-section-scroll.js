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

/** Когда видимая высота intro ≥ этой доли вьюпорта — начинаем прогресс (ранний, заметный старт) */
const VIEWPORT_COVER_START = 0.26;

/** Больше vh = дольше скролл до полного текста = анимация читается лучше */
const HEADROOM_VH = 0.92;

const EXIT_HOLD_MIN_VISIBLE_FRAC = 0.1;

/** Смягчение кривой заливки по прогрессу скролла */
const FILL_PROGRESS_POWER = 1.08;

/**
 * Прогресс 0→1 от видимой части секции в вьюпорте; peakP — плавный откат при уходе блока.
 */
function introScrollProgress(introRoot, session) {
  const rect = introRoot.getBoundingClientRect();
  const vh = window.innerHeight || 1;
  const visibleH = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
  const blockH = rect.height || 1;
  const gate = Math.min(vh * VIEWPORT_COVER_START, blockH * 0.9);
  if (visibleH < gate) {
    session.peakP = 0;
    return 0;
  }

  const headroom = vh * HEADROOM_VH;
  const pRaw = clamp01((visibleH - gate) / headroom);
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
  chars.forEach((el, i) => {
    const raw = tLetters * n - i;
    el.style.setProperty("--isg-char-fill", String(clamp01(raw)));
  });
}

/**
 * Intro: только побуквенная заливка по скроллу (без fade по opacity).
 */
export function initIntroSectionScroll(root = document) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const disposers = [];

  /** @type {{ introRoot: Element; h2List: HTMLHeadingElement[]; peakP: number; tick: () => void }[]} */
  const sessions = [];

  root.querySelectorAll("[data-isg-intro-scroll]").forEach((introRoot) => {
    if (introRoot.dataset.isgIntroInit === "1") return;
    const h2List = Array.from(introRoot.querySelectorAll(".isg-title-group h2.isg-display"));
    if (!h2List.length) return;

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
    window.removeEventListener("load", onLoad);
    sessions.forEach((s) => {
      s.h2List.forEach((h2) => {
        restoreHeading(h2);
      });
      delete s.introRoot.dataset.isgIntroInit;
    });
  });

  return () => disposers.forEach((fn) => fn());
}
