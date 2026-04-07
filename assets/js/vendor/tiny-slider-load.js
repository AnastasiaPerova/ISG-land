
let loadPromise = null;

function resolveTns() {
  const fn = globalThis.tns;
  return typeof fn === "function" ? fn : null;
}


export function ensureTinySlider() {
  const existing = resolveTns();
  if (existing) return Promise.resolve(existing);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const finish = () => {
      const fn = resolveTns();
      if (fn) {
        resolve(fn);
        return true;
      }
      return false;
    };

    if (finish()) return;

    const scripts = [...document.querySelectorAll("script[src]")];
    const existingTag = scripts.find((el) =>
      /tiny-slider(\.min)?\.js/i.test(el.getAttribute("src") || el.src || ""),
    );

    if (existingTag) {
      existingTag.addEventListener("load", () => {
        if (!finish()) {
          reject(new Error("tiny-slider загрузился, но глобальный tns отсутствует"));
        }
      });
      existingTag.addEventListener("error", () => {
        reject(new Error("Не удалось загрузить существующий скрипт tiny-slider"));
      });
      queueMicrotask(() => {
        finish();
      });
      return;
    }

    const url = new URL("./tiny-slider.min.js", import.meta.url);
    const s = document.createElement("script");
    s.src = url.href;
    s.onload = () => {
      if (!finish()) {
        reject(
          new Error(
            `Файл загружен (${url.href}), но глобальный tns не определён`,
          ),
        );
      }
    };
    s.onerror = () => {
      reject(new Error(`Не удалось загрузить tiny-slider: ${url.href}`));
    };
    document.head.appendChild(s);
  });

  return loadPromise;
}
