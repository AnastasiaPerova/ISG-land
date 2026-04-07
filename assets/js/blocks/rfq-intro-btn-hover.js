import gsap from "gsap";

const BTN_SHIFT_ENTER = { x: 5, y: -4, duration: 0.38, ease: "power2.out" };
const BTN_SHIFT_LEAVE = { x: 0, y: 0, duration: 0.32, ease: "power2.out" };

function wrapPlainButtonLabel(btn) {
  if (btn.dataset.isgBtnHoverInit === "1" || btn.dataset.isgRfqBtnHoverInit === "1") return;
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
  btn.dataset.isgBtnHoverInit = "1";
}

function isHeaderButton(btn) {
  return btn.closest(".isg-site-header") !== null;
}




function bindHeroWatchShift(btn) {
  if (btn.dataset.isgHeroWatchHoverInit === "1") return () => {};

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return () => {};

  btn.dataset.isgHeroWatchHoverInit = "1";

  const onEnter = () => {
    gsap.killTweensOf(btn);
    gsap.to(btn, BTN_SHIFT_ENTER);
  };

  const onLeave = () => {
    gsap.killTweensOf(btn);
    gsap.to(btn, BTN_SHIFT_LEAVE);
  };

  btn.addEventListener("mouseenter", onEnter);
  btn.addEventListener("mouseleave", onLeave);
  btn.addEventListener("focus", onEnter);
  btn.addEventListener("blur", onLeave);

  return () => {
    btn.removeEventListener("mouseenter", onEnter);
    btn.removeEventListener("mouseleave", onLeave);
    btn.removeEventListener("focus", onEnter);
    btn.removeEventListener("blur", onLeave);
    gsap.killTweensOf(btn);
    gsap.set(btn, { clearProps: "transform" });
    delete btn.dataset.isgHeroWatchHoverInit;
  };
}





export function initIsgButtonHover(root = document) {
  const btns = Array.from(root.querySelectorAll("a.isg-btn, button.isg-btn")).filter(
    (btn) => !isHeaderButton(btn),
  );
  const heroWatchBtns = Array.from(root.querySelectorAll(".isg-hero .isg-hero-watch-btn"));

  if (!btns.length && !heroWatchBtns.length) return () => {};

  btns.forEach(wrapPlainButtonLabel);

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cleanups = [];

  if (!reduced) {
    btns.forEach((btn) => {
      const track = btn.querySelector(".isg-btn__scroll-track");
      const inner = btn.querySelector(".isg-btn__scroll-inner");
      if (!track || !inner) return;

      let tl;

      const onEnter = () => {
        gsap.killTweensOf([btn, inner]);
        if (tl) tl.kill();

        gsap.to(btn, BTN_SHIFT_ENTER);

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
        gsap.to(btn, BTN_SHIFT_LEAVE);
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

    heroWatchBtns.forEach((btn) => {
      cleanups.push(bindHeroWatchShift(btn));
    });
  }

  return () => cleanups.forEach((fn) => fn());
}


export const initRfqIntroButtonHover = initIsgButtonHover;
