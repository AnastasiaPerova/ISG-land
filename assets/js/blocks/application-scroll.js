import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  splitHeadingIntoChars,
  restoreHeading,
  setCharFillsInScope,
} from "./intro-section-scroll.js";

gsap.registerPlugin(ScrollTrigger);

function clamp01(t) {
  return Math.max(0, Math.min(1, t));
}

function easeOutCubic(t) {
  const u = clamp01(t);
  return 1 - (1 - u) ** 3;
}


const APP_SCROLL_SCRUB_VH = 3.45;


const P_TITLE_FADE_IN_END = 0.24;
const P_TITLE_FADE_OUT_START = 0.3;
const P_TITLE_FADE_OUT_END = 0.44;


const P_BODY_IN_START = 0.46;
const P_BODY_IN_END = 0.58;
const P_TABS_START = 0.52;
const P_TABS_END = 0.84;
const P_CTA_START = 0.8;
const P_CTA_END = 0.95;





export function initApplicationScroll(root = document) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const disposers = [];
  const mqDesktop = window.matchMedia("(min-width: 1100px)");

  root.querySelectorAll("[data-isg-app-scroll]").forEach((section) => {
    const postEl = section.querySelector(".isg-app__post");
    const scene = section.querySelector(".isg-app__scene");
    const video = section.querySelector(".isg-app__video");
    const head = section.querySelector(".isg-app-scroll__head");
    const stageIntro = section.querySelector(".isg-app-scroll__stage-intro");
    const stageBody = section.querySelector(".isg-app-scroll__stage-body");
    const appRight = section.querySelector(".isg-app-right");
    const items = section.querySelectorAll(".isg-accordion__item");
    const acc = section.querySelector(".isg-accordion--app-scroll");
    const titleH2s = Array.from(scene.querySelectorAll(".isg-title-group h2.isg-display"));

    if (!video || !scene || !stageBody) return;

    const setTitleCharProgress = (fill01) => {
      const tLetters = easeOutCubic(fill01);
      titleH2s.forEach((h2) => {
        if (h2.dataset.isgIntroSplit !== "1") return;
        setCharFillsInScope(h2, tLetters);
      });
    };

    let videoSeekRaf = 0;
    let pendingVideoTime = null;
    let accordionManual = false;
    let manualAccordionIdx = -1;
    let st = null;
    let currentMode = "";

    const flushVideoSeek = () => {
      videoSeekRaf = 0;
      if (pendingVideoTime == null) return;
      const target = pendingVideoTime;
      pendingVideoTime = null;
      try {
        if (typeof video.fastSeek === "function") {
          video.fastSeek(target);
        } else {
          video.currentTime = target;
        }
      } catch (_) {}
    };

    
    const syncVideoToPhaseProgress = (vn) => {
      const d = video.duration;
      if (!d || !Number.isFinite(d)) return;
      const t = Math.min(Math.max(vn * d, 0), Math.max(d - 0.04, 0));
      pendingVideoTime = t;
      if (!videoSeekRaf) {
        videoSeekRaf = requestAnimationFrame(flushVideoSeek);
      }
    };

    const freezeVideoLastFrame = () => {
      const d = video.duration;
      if (!d || !Number.isFinite(d)) return;
      const t = Math.max(0, d - 0.04);
      pendingVideoTime = t;
      if (!videoSeekRaf) {
        videoSeekRaf = requestAnimationFrame(flushVideoSeek);
      }
    };

    const setAccordionIndex = (idx) => {
      items.forEach((item, i) => {
        const on = i === idx && idx >= 0;
        item.classList.toggle("isg-accordion__item--open", on);
        item.querySelector(".isg-accordion__trigger")?.setAttribute("aria-expanded", on ? "true" : "false");
      });
    };

    const setBodyLayer = (opacity, yPx) => {
      const vis = opacity > 0.02 ? "visible" : "hidden";
      gsap.set(stageBody, {
        opacity,
        visibility: vis,
        y: yPx,
        pointerEvents: opacity > 0.02 ? "auto" : "none",
      });
    };

    const onAccordionClick = (e) => {
      const btn = e.target.closest(".isg-accordion__trigger");
      if (!btn || !acc || !acc.contains(btn)) return;
      const item = btn.closest(".isg-accordion__item");
      const idx = Array.from(items).indexOf(item);
      if (idx < 0) return;
      const isOpen = item.classList.contains("isg-accordion__item--open");
      accordionManual = true;
      if (isOpen) {
        manualAccordionIdx = -1;
        setAccordionIndex(-1);
      } else {
        manualAccordionIdx = idx;
        setAccordionIndex(idx);
      }
    };

    if (reduced) {
      section.style.minHeight = "";
      if (postEl) postEl.style.height = "";
      if (head) gsap.set(head, { clearProps: "opacity,visibility,transform" });
      if (stageIntro) gsap.set(stageIntro, { clearProps: "opacity,visibility,transform" });
      gsap.set(stageBody, { clearProps: "opacity,visibility,transform,pointerEvents" });
      if (appRight) gsap.set(appRight, { clearProps: "opacity,transform" });
      setAccordionIndex(items.length - 1);
      const onEnd = () => {
        try {
          const d = video.duration;
          if (d && Number.isFinite(d)) {
            video.currentTime = Math.min(d - 0.1, d * 0.95);
          }
        } catch (_) {}
      };
      video.addEventListener("loadedmetadata", onEnd, { once: true });
      disposers.push(() => video.removeEventListener("loadedmetadata", onEnd));
      return;
    }

    if (acc) {
      acc.addEventListener("click", onAccordionClick);
      disposers.push(() => acc.removeEventListener("click", onAccordionClick));
    }

    titleH2s.forEach((h2) => splitHeadingIntoChars(h2));

    video.pause();
    video.muted = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");

    const applyTrackHeights = () => {
      const H = window.innerHeight;
      const scrubPx = Math.round(H * APP_SCROLL_SCRUB_VH);
      if (postEl) postEl.style.height = `${scrubPx}px`;
      section.style.minHeight = "";
    };
    const clearTrackHeights = () => {
      if (postEl) postEl.style.height = "";
      section.style.minHeight = "";
    };

    const scrubEndPx = () => Math.round(window.innerHeight * APP_SCROLL_SCRUB_VH);

    const applyInitialFrame = () => {
      accordionManual = false;
      manualAccordionIdx = -1;
      try {
        const d = video.duration;
        if (d && Number.isFinite(d)) {
          video.currentTime = 0;
        }
      } catch (_) {}
      const titleHidden = () => {
        const v = "hidden";
        if (mqDesktop.matches) {
          if (head) gsap.set(head, { opacity: 0, visibility: v, y: 0 });
          if (stageIntro) gsap.set(stageIntro, { opacity: 0, visibility: v, y: 0 });
        } else {
          if (head) gsap.set(head, { opacity: 0, visibility: v, y: 0 });
          if (stageIntro) gsap.set(stageIntro, { opacity: 0, visibility: v, y: 0 });
        }
      };
      titleHidden();
      setTitleCharProgress(0);
      setBodyLayer(0, 28);
      if (appRight) gsap.set(appRight, { opacity: 0, y: 20 });
      setAccordionIndex(-1);
    };

    const setStaticFrame = () => {
      accordionManual = false;
      manualAccordionIdx = -1;
      pendingVideoTime = null;
      clearTrackHeights();
      if (st) {
        st.kill();
        st = null;
      }
      stageIntro?.style.setProperty("display", "block");
      if (head) gsap.set(head, { opacity: 0, visibility: "hidden", y: 0 });
      if (stageIntro) gsap.set(stageIntro, { opacity: 1, visibility: "visible", y: 0 });
      setTitleCharProgress(1);
      setBodyLayer(1, 0);
      if (appRight) gsap.set(appRight, { opacity: 1, y: 0 });
      setAccordionIndex(items.length ? 0 : -1);
      try {
        if (video.duration && Number.isFinite(video.duration)) {
          video.currentTime = 0;
        }
      } catch (_) {}
    };

    const buildDesktopScene = () => {
      stageIntro?.style.removeProperty("display");
      applyTrackHeights();
      applyInitialFrame();

      const scrollTriggerEl = scene;
      const scrollStart = "top top";

      st = ScrollTrigger.create({
        trigger: scrollTriggerEl,
        start: scrollStart,
        end: () => "+=" + scrubEndPx(),
        scrub: 0.55,
        invalidateOnRefresh: true,
        onLeaveBack: () => {
          applyInitialFrame();
          pendingVideoTime = null;
        },
        onUpdate: (self) => {
          const p = clamp01(self.progress);

          if (p < P_TABS_START) {
            accordionManual = false;
            manualAccordionIdx = -1;
          }

          if (p <= 0.002) {
            try {
              const d = video.duration;
              if (d && Number.isFinite(d)) {
                video.currentTime = 0;
              }
            } catch (_) {}
          } else if (p <= P_TITLE_FADE_IN_END) {
            syncVideoToPhaseProgress(clamp01(p / P_TITLE_FADE_IN_END));
          } else {
            freezeVideoLastFrame();
          }

          const fill01 = p < P_TITLE_FADE_IN_END ? clamp01(p / P_TITLE_FADE_IN_END) : 1;
          setTitleCharProgress(fill01);

          const titleGroupOpacity =
            p < P_TITLE_FADE_OUT_START
              ? 1
              : p >= P_TITLE_FADE_OUT_END
                ? 0
                : 1 -
                  clamp01((p - P_TITLE_FADE_OUT_START) / (P_TITLE_FADE_OUT_END - P_TITLE_FADE_OUT_START));

          const tVis = titleGroupOpacity > 0.008 ? "visible" : "hidden";
          if (head) gsap.set(head, { opacity: titleGroupOpacity, visibility: tVis, y: 0 });
          if (stageIntro) gsap.set(stageIntro, { opacity: 0, visibility: "hidden", y: 0 });

          const bodyIn =
            p < P_BODY_IN_START ? 0 : clamp01((p - P_BODY_IN_START) / (P_BODY_IN_END - P_BODY_IN_START));
          const bodyOp = bodyIn;
          const bodyY = 28 * (1 - bodyIn);
          setBodyLayer(bodyOp, bodyY);

          const n = items.length;
          let idx = -1;
          if (accordionManual) {
            idx = manualAccordionIdx;
          } else if (n > 0 && bodyOp > 0.35 && p >= P_TABS_START) {
            const tabP = clamp01((p - P_TABS_START) / (P_TABS_END - P_TABS_START));
            if (tabP <= 0) idx = -1;
            else if (tabP >= 1) idx = n - 1;
            else {
              idx = Math.min(Math.floor(tabP * n), n - 1);
            }
          }
          setAccordionIndex(idx);

          const ctaT = p <= P_CTA_START ? 0 : clamp01((p - P_CTA_START) / (P_CTA_END - P_CTA_START));
          if (appRight) {
            gsap.set(appRight, { opacity: ctaT, y: 18 * (1 - ctaT) });
          }
        },
      });
    };

    const rebuild = () => {
      const nextMode = reduced ? "reduced" : mqDesktop.matches ? "desktop" : "mobile";
      if (nextMode === currentMode && (nextMode !== "desktop" || st)) {
        if (nextMode === "desktop") {
          applyTrackHeights();
        }
        ScrollTrigger.refresh();
        return;
      }

      currentMode = nextMode;

      if (nextMode === "desktop") {
        buildDesktopScene();
      } else {
        setStaticFrame();
      }
    };

    rebuild();

    const onResize = () => {
      rebuild();
    };
    window.addEventListener("resize", onResize);

    const onDesktopChange = () => {
      rebuild();
    };
    mqDesktop.addEventListener("change", onDesktopChange);

    requestAnimationFrame(() => ScrollTrigger.refresh());

    disposers.push(() => {
      if (videoSeekRaf) cancelAnimationFrame(videoSeekRaf);
      window.removeEventListener("resize", onResize);
      mqDesktop.removeEventListener("change", onDesktopChange);
      titleH2s.forEach((h2) => {
        restoreHeading(h2);
      });
      clearTrackHeights();
      stageIntro?.style.removeProperty("display");
      if (head) gsap.set(head, { clearProps: "opacity,visibility,transform" });
      if (stageIntro) gsap.set(stageIntro, { clearProps: "opacity,visibility,transform" });
      gsap.set(stageBody, { clearProps: "opacity,visibility,transform,pointerEvents" });
      if (appRight) gsap.set(appRight, { clearProps: "opacity,transform" });
      st?.kill();
      st = null;
    });

    const onMeta = () => {
      pendingVideoTime = null;
      if (currentMode !== "desktop" || !st) {
        try {
          if (video.duration && Number.isFinite(video.duration)) {
            video.currentTime = 0;
          }
        } catch (_) {}
        return;
      }

      const prog = clamp01(st.progress);
      if (prog <= 0.001) {
        try {
          if (video.duration && Number.isFinite(video.duration)) {
            video.currentTime = 0;
          }
        } catch (_) {}
      } else if (prog <= P_TITLE_FADE_IN_END) {
        syncVideoToPhaseProgress(clamp01(prog / P_TITLE_FADE_IN_END));
      } else {
        freezeVideoLastFrame();
      }
    };
    video.addEventListener("loadedmetadata", onMeta);
    disposers.push(() => video.removeEventListener("loadedmetadata", onMeta));
  });

  return () => disposers.forEach((fn) => fn());
}
