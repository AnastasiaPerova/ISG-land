import gsap from "gsap";

function wrapPlainButtonLabel(btn) {
  if (btn.dataset.isgRfqBtnHoverInit === "1") return;
  if (btn.querySelector(".isg-btn__scroll-track")) return;
  if (btn.children.length > 0) return;

  const raw = btn.textContent.replace(/\s+/g, " ").trim();
  if (!raw) return;

  btn.textContent = "";
  const track = document.createElement("span");
  track.className = "isg-btn__scroll-track";
  const inner = document.createElement("span");
  inner.className = "isg-btn__scroll-inner";
  inner.textContent = raw;
  track.appendChild(inner);
  btn.appendChild(track);
  if (!btn.hasAttribute("aria-label")) btn.setAttribute("aria-label", raw);
  btn.dataset.isgRfqBtnHoverInit = "1";
}

/**
 * Блок isg-rfq-intro: лёгкий сдвиг кнопки + GSAP-прокрутка подписи внутри padding-кнопки.
 */
export function initRfqIntroButtonHover(root = document) {
  const intro = root.querySelector(".isg-rfq-intro");
  if (!intro) return () => {};

  const btns = Array.from(intro.querySelectorAll("a.isg-btn, button.isg-btn"));
  if (!btns.length) return () => {};

  btns.forEach(wrapPlainButtonLabel);

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return () => {};

  const cleanups = [];

  btns.forEach((btn) => {
    const track = btn.querySelector(".isg-btn__scroll-track");
    const inner = btn.querySelector(".isg-btn__scroll-inner");
    if (!track || !inner) return;

    let tl;

    const onEnter = () => {
      gsap.killTweensOf([btn, inner]);
      if (tl) tl.kill();

      gsap.to(btn, { x: 5, y: -4, duration: 0.38, ease: "power2.out" });

      const ow = Math.max(0, inner.scrollWidth - track.clientWidth);
      const dur = Math.min(2.35, Math.max(0.72, ow / 115));

      if (ow > 6) {
        tl = gsap.timeline({ repeat: -1, repeatDelay: 0.22 });
        tl.to(inner, { x: -ow, duration: dur, ease: "power1.inOut" });
        tl.to(inner, { x: 0, duration: dur, ease: "power1.inOut" });
      } else {
        tl = gsap.timeline({ repeat: -1, yoyo: true, repeatDelay: 0.18 });
        tl.to(inner, { x: -8, duration: 1.05, ease: "sine.inOut" });
      }
    };

    const onLeave = () => {
      if (tl) tl.kill();
      tl = null;
      gsap.killTweensOf([btn, inner]);
      gsap.to(btn, { x: 0, y: 0, duration: 0.32, ease: "power2.out" });
      gsap.to(inner, { x: 0, duration: 0.32, ease: "power2.out" });
    };

    btn.addEventListener("mouseenter", onEnter);
    btn.addEventListener("mouseleave", onLeave);
    btn.addEventListener("focus", onEnter);
    btn.addEventListener("blur", onLeave);

    cleanups.push(() => {
      btn.removeEventListener("mouseenter", onEnter);
      btn.removeEventListener("mouseleave", onLeave);
      btn.removeEventListener("focus", onEnter);
      btn.removeEventListener("blur", onLeave);
      if (tl) tl.kill();
      gsap.killTweensOf([btn, inner]);
      gsap.set([btn, inner], { clearProps: "transform" });
    });
  });

  return () => cleanups.forEach((fn) => fn());
}
