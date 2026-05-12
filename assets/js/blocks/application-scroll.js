import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  splitHeadingIntoChars,
  restoreHeading,
} from "./intro-section-scroll.js";

gsap.registerPlugin(ScrollTrigger);

// Утилита: ограничивает значение в диапазоне [0..1].
function clamp01(t) {
  return Math.max(0, Math.min(1, t));
}

// Утилита: easing-кривая для плавной динамики.
function easeOutCubic(t) {
  const u = clamp01(t);
  return 1 - (1 - u) ** 3;
}

// Утилита: перевод абсолютного значения в нормализованный прогресс [0..1].
function map01(value, start, end) {
  if (end <= start) return value >= end ? 1 : 0;
  return clamp01((value - start) / (end - start));
}

function warmAccordionMedia(item, priority = "low") {
  item?.querySelectorAll?.(".isg-accordion__img").forEach((img) => {
    if (!(img instanceof HTMLImageElement)) return;
    img.loading = "eager";
    img.decoding = "async";
    if ("fetchPriority" in img) {
      img.fetchPriority = priority;
    }
    if (!img.complete && typeof img.decode === "function") {
      img.decode().catch(() => {});
    }
  });
}


// Длина скролл-трека в высотах экрана (3.45 * 100vh).
// Конфиг таймингов секции: видео (секунды), скролл-фазы [0..1], смещения (px).
const APP_SCROLL_SCRUB_VH = 3.2;

// Время видео (сек): когда слова заголовка начинают появляться.
const TITLE_WORD_IN_START_SEC = 1.01;
// Время видео (сек): длительность фазы появления слов заголовка.
const TITLE_WORD_IN_DURATION_SEC = 3.2;
// Время видео (сек): разброс по времени между словами при появлении.
const TITLE_WORD_IN_SPREAD_SEC = 1.45;

// Время видео (сек): когда слова заголовка начинают исчезать.
const TITLE_WORD_OUT_START_SEC = 3.4;
// Время видео (сек): длительность фазы исчезновения слов заголовка.
const TITLE_WORD_OUT_DURATION_SEC = 1.2;
// Время видео (сек): разброс по времени между словами при исчезновении.
const TITLE_WORD_OUT_SPREAD_SEC = 0.7;

// Начальный сдвиг аккордеона по X для анимации выезда (px).
const ACCORDION_IN_X_PX = 56;
// Время видео (сек): момент начала выезда блока аккордеона.
const ACCORDION_IN_START_SEC = 5;
// Время видео (сек): длительность выезда аккордеона.
const ACCORDION_IN_DURATION_SEC = 0.9;

// Прогресс скролла [0..1]: конец опциональной preplay-фазы (0 = отключена).
const MASTER_PREPLAY_END = 0;
// Прогресс скролла [0..1]: до этой точки видео управляется скроллом.
const C_VIDEO_SCROLL_END = 0.88;
// Прогресс скролла [0..1]: с этой точки стартует автопереключение вкладок аккордеона.
const C_BODY_IN_START = 0.74;
const C_BODY_IN_END = 0.9;
const C_ACCORDION_START = C_BODY_IN_END;
// Прогресс скролла [0..1]: здесь автопереключение вкладок аккордеона заканчивается.
const C_ACCORDION_END = 1;

// Компиляция шейдера. При ошибке возвращаем null и отключаем WebGL-эффект.
function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

// Линковка vertex + fragment в WebGL-программу.
function createProgram(gl, vertSource, fragSource) {
  const vert = createShader(gl, gl.VERTEX_SHADER, vertSource);
  const frag = createShader(gl, gl.FRAGMENT_SHADER, fragSource);
  if (!vert || !frag) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

// Визуальный WebGL-оверлей поверх видео (grain/wave/vignette).
function createAppWebGLEffect(mediaEl, section) {
  if (!mediaEl) return null;
  const canvas = document.createElement("canvas");
  canvas.className = "isg-app__glfx";
  canvas.setAttribute("aria-hidden", "true");
  mediaEl.appendChild(canvas);

  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
  });

  if (!gl) {
    canvas.remove();
    return null;
  }

  const vertSource = `
    attribute vec2 a_pos;
    varying vec2 v_uv;
    void main() {
      v_uv = a_pos * 0.5 + 0.5;
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;
  const fragSource = `
    precision mediump float;
    varying vec2 v_uv;
    uniform vec2 u_res;
    uniform float u_time;
    uniform float u_progress;
    uniform float u_strength;

    float hash(vec2 p) {
      p = fract(p * vec2(443.897, 441.423));
      p += dot(p, p + 19.19);
      return fract(p.x * p.y);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / max(u_res, vec2(1.0));
      vec2 centered = uv - 0.5;
      float dist = length(centered * vec2(1.1, 1.0));
      float vignette = smoothstep(0.92, 0.16, dist);

      float grain = hash(uv * vec2(920.0, 640.0) + u_time * 18.0) - 0.5;
      float waveA = sin((uv.y + u_time * 0.14) * 30.0) * 0.5 + 0.5;
      float waveB = sin((uv.x * 1.2 - u_time * 0.1) * 22.0) * 0.5 + 0.5;
      float wave = (waveA * 0.58 + waveB * 0.42) * u_strength;

      float pulse = (sin(u_time * 0.9 + u_progress * 4.2) * 0.5 + 0.5) * 0.08 * u_strength;
      vec3 tint = mix(vec3(0.08, 0.18, 0.32), vec3(0.16, 0.48, 0.84), wave);
      vec3 color = tint * (0.14 + grain * 0.16 + pulse) * vignette;
      float alpha = clamp((0.06 + 0.18 * u_strength) * vignette, 0.0, 0.34);

      gl_FragColor = vec4(color, alpha);
    }
  `;

  const program = createProgram(gl, vertSource, fragSource);
  if (!program) {
    canvas.remove();
    return null;
  }

  const posLoc = gl.getAttribLocation(program, "a_pos");
  const resLoc = gl.getUniformLocation(program, "u_res");
  const timeLoc = gl.getUniformLocation(program, "u_time");
  const progressLoc = gl.getUniformLocation(program, "u_progress");
  const strengthLoc = gl.getUniformLocation(program, "u_strength");
  const buffer = gl.createBuffer();
  if (!buffer) {
    gl.deleteProgram(program);
    canvas.remove();
    return null;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  let rafId = 0;
  let running = true;
  let startTime = performance.now();
  let currentProgress = 0;
  let currentStrength = 0;
  let targetStrength = 0;

  // Синхронизируем размер canvas с контейнером и DPR.
  const updateSize = () => {
    const rect = mediaEl.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.max(2, Math.round(rect.width * dpr));
    const h = Math.max(2, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    canvas.style.width = `${Math.max(1, Math.round(rect.width))}px`;
    canvas.style.height = `${Math.max(1, Math.round(rect.height))}px`;
    gl.viewport(0, 0, w, h);
  };

  // Постоянный рендер оверлея через rAF.
  const render = (now) => {
    if (!running) return;
    const t = (now - startTime) / 1000;
    currentStrength += (targetStrength - currentStrength) * 0.08;

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(resLoc, canvas.width, canvas.height);
    gl.uniform1f(timeLoc, t);
    gl.uniform1f(progressLoc, currentProgress);
    gl.uniform1f(strengthLoc, currentStrength);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    rafId = requestAnimationFrame(render);
  };

  const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateSize) : null;
  resizeObserver?.observe(mediaEl);
  updateSize();
  rafId = requestAnimationFrame(render);

  return {
    // Обновление интенсивности эффекта по прогрессу секции и прозрачности заголовка.
    update({ progress = 0, titleOpacity = 0 }) {
      currentProgress = clamp01(progress);
      const manualBoost = section.classList.contains("isg-app--gl-boost") ? 1.24 : 1;
      targetStrength = clamp01((0.26 + currentProgress * 0.64 + titleOpacity * 0.2) * manualBoost);
    },
    destroy() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      canvas.remove();
    },
  };
}

export function initApplicationScroll(root = document) {
  // Инициализация scroll-сцены секции application (desktop/mobile/reduced).
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const disposers = [];
  const mqDesktop = window.matchMedia("(min-width: 1100px)");

  root.querySelectorAll("[data-isg-app-scroll]").forEach((section) => {
    const postEl = section.querySelector(".isg-app__post");
    const scene = section.querySelector(".isg-app__scene");
    const mediaEl = section.querySelector(".isg-app__media");
    const video = section.querySelector(".isg-app__video");
    const head = section.querySelector(".isg-app-scroll__head");
    const stageIntro = section.querySelector(".isg-app-scroll__stage-intro");
    const stageBody = section.querySelector(".isg-app-scroll__stage-body");
    const appLeft = section.querySelector(".isg-app-left");
    const appRight = section.querySelector(".isg-app-right");
    const items = section.querySelectorAll(".isg-accordion__item");
    const acc = section.querySelector(".isg-accordion--app-scroll");
    const mobileBg = section.dataset.isgMobileBg || "";

    if (!video || !scene || !stageBody) return;

    items.forEach((item, index) => {
      warmAccordionMedia(item, index === 0 ? "high" : "low");
    });

    const titleH2s = Array.from(scene.querySelectorAll(".isg-title-group h2.isg-display"));

    // Нормализуем диапазоны появления/исчезновения заголовка под реальную длину видео.
    const resolveTitleTimeRanges = (duration) => {
      const safeDuration = duration && Number.isFinite(duration) ? duration : 0;
      const inStart = TITLE_WORD_IN_START_SEC;
      const inEnd = inStart + TITLE_WORD_IN_DURATION_SEC;

      let outStart = TITLE_WORD_OUT_START_SEC;
      if (safeDuration > 0 && safeDuration <= outStart + TITLE_WORD_OUT_DURATION_SEC + 0.2) {
        outStart = Math.max(inEnd + 0.25, safeDuration * 0.72);
      }
      const outEnd = outStart + TITLE_WORD_OUT_DURATION_SEC;

      return { inStart, inEnd, outStart, outEnd };
    };

    // Общая видимость заголовка = fade-in * fade-out.
    const getTitleGroupOpacityFromVideoTime = (videoTime, duration) => {
      const { inStart, inEnd, outStart, outEnd } = resolveTitleTimeRanges(duration);
      const inOpacity = easeOutCubic(map01(videoTime, inStart, inEnd));
      const outOpacity = 1 - easeOutCubic(map01(videoTime, outStart, outEnd));
      return clamp01(inOpacity * outOpacity);
    };

    // Прогресс появления body-контента (аккордеонной части) по времени видео.
    const getBodyInFromVideoTime = (videoTime, duration) => {
      const d = duration && Number.isFinite(duration) ? duration : 0;
      const { outEnd } = resolveTitleTimeRanges(duration);
      const safeStart = Math.min(outEnd, Math.max(d - 0.25, 0));
      const safeEnd = Math.min(safeStart + ACCORDION_IN_DURATION_SEC, Math.max(d - 0.04, safeStart + 0.12));
      return map01(videoTime, safeStart, safeEnd);
    };

    // Прогресс автопереключения вкладок аккордеона в рамках scroll-фазы.
    const getBodyInFromContentProgress = (contentP) => {
      return easeOutCubic(map01(contentP, C_BODY_IN_START, C_BODY_IN_END));
    };

    const getAccordionProgressFromContentProgress = (contentP) => {
      return map01(contentP, C_ACCORDION_START, C_ACCORDION_END);
    };

    // По-словная анимация заголовка по времени видео.
    const getLeftOffscreenX = () => {
      const fallback = -Math.max(window.innerWidth + 48, 420);
      if (!appLeft) return fallback;
      const rect = appLeft.getBoundingClientRect();
      if (!rect.width && !rect.right) return fallback;
      return -(rect.right + 48);
    };

    const getRightOffscreenX = () => {
      const fallback = Math.max(window.innerWidth + 48, 420);
      if (!appRight) return fallback;
      const rect = appRight.getBoundingClientRect();
      if (!rect.width && !rect.left) return fallback;
      return Math.max(0, window.innerWidth - rect.left + 48);
    };

    const setTitleWordsByVideoTime = (videoTime, duration) => {
      const { inStart, inEnd, outStart, outEnd } = resolveTitleTimeRanges(duration);
      titleH2s.forEach((h2) => {
        if (h2.dataset.isgIntroSplit !== "1") return;
        const words = h2.querySelectorAll(".isg-intro-word");
        const chars = h2.querySelectorAll(".isg-intro-char");
        const n = Math.max(1, words.length);
        const inStep = n > 1 ? TITLE_WORD_IN_SPREAD_SEC / (n - 1) : 0;
        const outStep = n > 1 ? TITLE_WORD_OUT_SPREAD_SEC / (n - 1) : 0;

        words.forEach((wordEl, i) => {
          const inLocal = easeOutCubic(map01(videoTime, inStart + i * inStep, inEnd + i * inStep));
          const outLocal = easeOutCubic(map01(videoTime, outStart + i * outStep, outEnd + i * outStep));
          // Симметричный плавный профиль: мягкое появление и такое же мягкое исчезновение.
          const opacity = clamp01(inLocal * (1 - outLocal));
          wordEl.style.opacity = String(opacity);
        });

        chars.forEach((charEl) => {
          charEl.style.setProperty("--isg-char-fill", "1");
          charEl.style.setProperty("--isg-char-opacity", "1");
          charEl.style.setProperty("--isg-char-y", "0em");
        });
      });
    };

    const setTitleWordsStaticVisible = () => {
      titleH2s.forEach((h2) => {
        if (h2.dataset.isgIntroSplit !== "1") return;
        h2.querySelectorAll(".isg-intro-word").forEach((wordEl) => {
          wordEl.style.opacity = "1";
        });
        h2.querySelectorAll(".isg-intro-char").forEach((charEl) => {
          charEl.style.setProperty("--isg-char-fill", "1");
          charEl.style.setProperty("--isg-char-opacity", "1");
          charEl.style.setProperty("--isg-char-y", "0em");
        });
      });
    };

    let videoSeekRaf = 0;
    let pendingVideoTime = null;
    let accordionManual = false;
    let manualAccordionIdx = -1;
    let accordionAutoStartP = null;
    let leftOffscreenX = -Math.max(window.innerWidth + 48, 420);
    let accordionOffscreenX = Math.max(window.innerWidth + 48, 420);
    let accordionHeightCleanup = 0;
    let st = null;
    let currentMode = "";
    let glFx = null;
    let titleSplit = false;

    const ensureDesktopEffects = () => {
      if (!glFx) {
        glFx = createAppWebGLEffect(mediaEl, section);
      }
      if (!titleSplit) {
        titleH2s.forEach((h2) => splitHeadingIntoChars(h2));
        titleSplit = true;
      }
    };

    const destroyDesktopEffects = () => {
      glFx?.destroy();
      glFx = null;
    };

    // Реальный seek выполняем в rAF, чтобы снизить дерганье currentTime.
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

    // Буферизуем target currentTime и отдаём в flush.
    const queueVideoTime = (target) => {
      pendingVideoTime = target;
      if (!videoSeekRaf) {
        videoSeekRaf = requestAnimationFrame(flushVideoSeek);
      }
    };

    // Главная связка: scroll progress -> video currentTime.
    const syncVideoToContentProgress = (contentP) => {
      const d = video.duration;
      if (!d || !Number.isFinite(d)) return 0;
      const start = 0;
      const end = Math.max(0, d - 0.04);
      const videoP = map01(contentP, 0, C_VIDEO_SCROLL_END);
      const eased = easeOutCubic(videoP);
      const t = start + (end - start) * eased;
      const next = Math.min(Math.max(t, 0), end);
      queueVideoTime(next);
      return next;
    };

    // Держим открытой только одну вкладку.
    const setAccordionIndex = (idx) => {
      const nextIdx = idx < 0 && items.length ? 0 : idx;
      items.forEach((item, i) => {
        const on = i === nextIdx && nextIdx >= 0;
        item.classList.toggle("isg-accordion__item--open", on);
        item.querySelector(".isg-accordion__trigger")?.setAttribute("aria-expanded", on ? "true" : "false");
      });
    };

    const clearAccordionIndex = () => {
      items.forEach((item) => {
        item.classList.remove("isg-accordion__item--open");
        item.querySelector(".isg-accordion__trigger")?.setAttribute("aria-expanded", "false");
      });
    };

    const lockMobileAccordionHeight = (mutate) => {
      if (!acc || mqDesktop.matches || reduced) {
        mutate();
        return;
      }

      window.clearTimeout(accordionHeightCleanup);
      const from = acc.offsetHeight;
      acc.style.height = `${from}px`;
      acc.style.overflow = "hidden";
      acc.style.transition = "height 0.52s cubic-bezier(0.22, 1, 0.36, 1)";

      mutate();

      requestAnimationFrame(() => {
        const to = acc.scrollHeight;
        acc.style.height = `${Math.max(from, to)}px`;
        requestAnimationFrame(() => {
          acc.style.height = `${to}px`;
        });
      });

      accordionHeightCleanup = window.setTimeout(() => {
        acc.style.removeProperty("height");
        acc.style.removeProperty("overflow");
        acc.style.removeProperty("transition");
      }, 620);
    };

    const applyMobileStaticMedia = () => {
      section.classList.add("isg-app--mobile-static");
      if (mediaEl && mobileBg) {
        mediaEl.style.backgroundImage = `url("${mobileBg}")`;
        mediaEl.style.backgroundSize = "cover";
        mediaEl.style.backgroundPosition = "center";
      }
      if (video) {
        video.style.opacity = "0";
        video.style.visibility = "hidden";
      }
      const glCanvas = mediaEl?.querySelector(".isg-app__glfx");
      if (glCanvas) glCanvas.style.display = "none";
    };

    const clearMobileStaticMedia = () => {
      section.classList.remove("isg-app--mobile-static");
      if (mediaEl) {
        mediaEl.style.removeProperty("background-image");
        mediaEl.style.removeProperty("background-size");
        mediaEl.style.removeProperty("background-position");
      }
      if (video) {
        video.style.removeProperty("opacity");
        video.style.removeProperty("visibility");
      }
      const glCanvas = mediaEl?.querySelector(".isg-app__glfx");
      if (glCanvas) glCanvas.style.removeProperty("display");
    };

    // Управляем видимостью и интерактивностью body-слоя.
    const setBodyLayer = (opacity, yPx) => {
      const vis = opacity > 0.02 ? "visible" : "hidden";
      gsap.set(stageBody, {
        opacity,
        visibility: vis,
        y: yPx,
        pointerEvents: opacity > 0.02 ? "auto" : "none",
      });
    };

    // Ручной клик переводит аккордеон в manual-mode.
    const onAccordionClick = (e) => {
      const btn = e.target.closest(".isg-accordion__trigger");
      if (!btn || !acc || !acc.contains(btn)) return;
      const item = btn.closest(".isg-accordion__item");
      const idx = Array.from(items).indexOf(item);
      if (idx < 0) return;
      if (!mqDesktop.matches) {
        const isOpen = item.classList.contains("isg-accordion__item--open");
        if (isOpen) return;
        warmAccordionMedia(item, "high");
        lockMobileAccordionHeight(() => {
          items.forEach((entry) => {
            const open = entry === item;
            entry.classList.toggle("isg-accordion__item--open", open);
            entry.querySelector(".isg-accordion__trigger")?.setAttribute("aria-expanded", open ? "true" : "false");
          });
        });
        return;
      }
      const isOpen = item.classList.contains("isg-accordion__item--open");
      if (isOpen) return;
      warmAccordionMedia(item, "high");
      accordionManual = false;
      manualAccordionIdx = -1;
      setAccordionIndex(idx);
    };

    // Упрощенная ветка для prefers-reduced-motion.
    if (acc) {
      acc.addEventListener("click", onAccordionClick);
      disposers.push(() => acc.removeEventListener("click", onAccordionClick));
    }

    if (reduced) {
      if (!mqDesktop.matches) {
        applyMobileStaticMedia();
        setTitleWordsStaticVisible();
      }
      section.style.minHeight = "";
      if (postEl) postEl.style.height = "";
      if (head) gsap.set(head, { clearProps: "opacity,visibility,transform" });
      if (stageIntro) gsap.set(stageIntro, { clearProps: "opacity,visibility,transform" });
      gsap.set(stageBody, { clearProps: "opacity,visibility,transform,pointerEvents" });
      if (appLeft) gsap.set(appLeft, { clearProps: "opacity,transform" });
      if (appRight) gsap.set(appRight, { clearProps: "opacity,transform" });
      setAccordionIndex(items.length ? 0 : -1);
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
      disposers.push(() => clearMobileStaticMedia());
      return;
    }

    video.pause();
    video.muted = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");

    // Расчет длины scroll-трека секции в пикселях.
    const applyTrackHeights = () => {
      const H = window.innerHeight;
      const scrubPx = Math.round(H * APP_SCROLL_SCRUB_VH);
      if (postEl) postEl.style.height = `${scrubPx}px`;
      section.style.minHeight = "";
      leftOffscreenX = getLeftOffscreenX();
      accordionOffscreenX = getRightOffscreenX();
    };
    const clearTrackHeights = () => {
      if (postEl) postEl.style.height = "";
      section.style.minHeight = "";
    };

    const scrubEndPx = () => Math.round(window.innerHeight * APP_SCROLL_SCRUB_VH);

    // Сброс секции в стартовый кадр.
    const applyInitialFrame = () => {
      accordionManual = false;
      manualAccordionIdx = -1;
      accordionAutoStartP = null;
      try {
        video.pause();
      } catch (_) {}
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
      setTitleWordsByVideoTime(0, video.duration);
      glFx?.update({ progress: 0, titleOpacity: 0 });
      setBodyLayer(0, 0);
      if (appLeft) gsap.set(appLeft, { opacity: 1, x: leftOffscreenX });
      if (appRight) gsap.set(appRight, { opacity: 1, x: accordionOffscreenX });
      setAccordionIndex(items.length ? 0 : -1);
    };

    // Статичный сценарий вне desktop-режима.
    const setStaticFrame = () => {
      accordionManual = false;
      manualAccordionIdx = -1;
      accordionAutoStartP = null;
      pendingVideoTime = null;
      destroyDesktopEffects();
      applyMobileStaticMedia();
      try {
        video.pause();
      } catch (_) {}
      clearTrackHeights();
      if (st) {
        st.kill();
        st = null;
      }
      stageIntro?.style.setProperty("display", "block");
      if (head) gsap.set(head, { opacity: 0, visibility: "hidden", y: 0 });
      if (stageIntro) gsap.set(stageIntro, { opacity: 1, visibility: "visible", y: 0 });
      setTitleWordsStaticVisible();
      glFx?.update({ progress: 0, titleOpacity: 0 });
      setBodyLayer(1, 0);
      if (appLeft) gsap.set(appLeft, { opacity: 1, x: 0 });
      if (appRight) gsap.set(appRight, { opacity: 1, x: 0 });
      setAccordionIndex(items.length ? 0 : -1);
      try {
        if (video.duration && Number.isFinite(video.duration)) {
          video.currentTime = 0;
        }
      } catch (_) {}
    };

    // Основная desktop-сцена со ScrollTrigger и scrub-синхронизацией.
    const buildDesktopScene = () => {
      ensureDesktopEffects();
      stageIntro?.style.removeProperty("display");
      applyTrackHeights();
      applyInitialFrame();

      const scrollTriggerEl = scene;
      const scrollStart = "top top";

      st = ScrollTrigger.create({
        trigger: scrollTriggerEl,
        start: scrollStart,
        end: () => "+=" + scrubEndPx(),
        scrub: 0.68,
        invalidateOnRefresh: true,
        onLeaveBack: () => {
          applyInitialFrame();
          accordionAutoStartP = null;
          pendingVideoTime = null;
        },
        onUpdate: (self) => {
          // 1) Прогресс секции и синхронизация видео.
          const p = clamp01(self.progress);

          const contentP = map01(p, MASTER_PREPLAY_END, 1);
          const targetVideoTime = syncVideoToContentProgress(contentP);

          // 2) Заголовок + WebGL оверлей поверх видео.
          setTitleWordsByVideoTime(targetVideoTime, video.duration);
          const titleGroupOpacity = getTitleGroupOpacityFromVideoTime(targetVideoTime, video.duration);
          glFx?.update({ progress: contentP, titleOpacity: titleGroupOpacity });

          const tVis = titleGroupOpacity > 0.008 ? "visible" : "hidden";
          if (head) gsap.set(head, { opacity: titleGroupOpacity, visibility: tVis, y: 0 });
          if (stageIntro) gsap.set(stageIntro, { opacity: 0, visibility: "hidden", y: 0 });

          // 3) Ввод body-блока и сдвиг аккордеона.
          const bodyIn = getBodyInFromVideoTime(targetVideoTime, video.duration);
          const bodyOp = bodyIn;
          const bodyY = 0;
          setBodyLayer(bodyOp, bodyY);
          if (appLeft) {
            gsap.set(appLeft, { opacity: 1, x: leftOffscreenX * (1 - bodyIn) });
          }
          if (appRight) {
            if (bodyIn > 0.995) {
              gsap.set(appRight, { opacity: 1, clearProps: "transform" });
            } else {
              gsap.set(appRight, { opacity: 1, x: accordionOffscreenX * (1 - bodyIn) });
            }
          }

          // 4) Авто-переключение вкладок (если нет ручного override).
          const n = items.length;
          let idx = -1;
          if (accordionManual) {
            idx = manualAccordionIdx;
          } else if (n > 0 && bodyIn > 0.98) {
            if (accordionAutoStartP == null) {
              accordionAutoStartP = contentP;
            }
            const tabP = map01(contentP, accordionAutoStartP, C_ACCORDION_END);
            if (tabP <= 0) idx = 0;
            else if (tabP >= 1) idx = n - 1;
            else {
              idx = Math.min(Math.floor(tabP * n), n - 1);
            }
          } else if (accordionAutoStartP != null) {
            accordionAutoStartP = null;
          }
          setAccordionIndex(idx);

        },
      });
    };

    // Пересборка режима при resize/смене брейкпоинта.
    const rebuild = () => {
      const nextMode = reduced ? "reduced" : mqDesktop.matches ? "desktop" : "mobile";
      if (nextMode === currentMode && (nextMode !== "desktop" || st)) {
        if (nextMode === "desktop") {
          applyTrackHeights();
          ScrollTrigger.refresh();
        }
        return;
      }

      currentMode = nextMode;

      if (nextMode === "desktop") {
        clearMobileStaticMedia();
        buildDesktopScene();
      } else {
        setStaticFrame();
      }
    };

    rebuild();

    let lastLayoutWidth = window.innerWidth;
    const onResize = () => {
      const width = window.innerWidth;
      if (!mqDesktop.matches && width === lastLayoutWidth) return;
      lastLayoutWidth = width;
      rebuild();
    };
    window.addEventListener("resize", onResize);

    const onDesktopChange = () => {
      rebuild();
    };
    mqDesktop.addEventListener("change", onDesktopChange);

    if (mqDesktop.matches) {
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }

    // Полный cleanup: listeners, стили, raf, WebGL, ScrollTrigger.
    disposers.push(() => {
      if (videoSeekRaf) cancelAnimationFrame(videoSeekRaf);
      try {
        video.pause();
      } catch (_) {}
      window.removeEventListener("resize", onResize);
      mqDesktop.removeEventListener("change", onDesktopChange);
      window.clearTimeout(accordionHeightCleanup);
      if (acc) {
        acc.style.removeProperty("height");
        acc.style.removeProperty("overflow");
        acc.style.removeProperty("transition");
      }
      titleH2s.forEach((h2) => {
        restoreHeading(h2);
      });
      clearMobileStaticMedia();
      clearTrackHeights();
      stageIntro?.style.removeProperty("display");
      if (head) gsap.set(head, { clearProps: "opacity,visibility,transform" });
      if (stageIntro) gsap.set(stageIntro, { clearProps: "opacity,visibility,transform" });
      gsap.set(stageBody, { clearProps: "opacity,visibility,transform,pointerEvents" });
      if (appLeft) gsap.set(appLeft, { clearProps: "opacity,transform" });
      if (appRight) gsap.set(appRight, { clearProps: "opacity,transform" });
      destroyDesktopEffects();
      st?.kill();
      st = null;
    });

    // Когда metadata готова — синхронизируем состояние по текущему скроллу.
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
      const contentP = map01(prog, MASTER_PREPLAY_END, 1);
      const targetVideoTime = syncVideoToContentProgress(contentP);
      setTitleWordsByVideoTime(targetVideoTime, video.duration);
      const titleGroupOpacity = getTitleGroupOpacityFromVideoTime(targetVideoTime, video.duration);
      glFx?.update({ progress: contentP, titleOpacity: titleGroupOpacity });
    };
    video.addEventListener("loadedmetadata", onMeta);
    disposers.push(() => video.removeEventListener("loadedmetadata", onMeta));
  });

  return () => disposers.forEach((fn) => fn());
}
