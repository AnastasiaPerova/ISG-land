import gsap from "gsap";

const HIDDEN_CLASS = "isg-site-header--hidden";

function getStickyHeader(root) {
  return root.querySelector("[data-isg-sticky-header]") || document.querySelector("[data-isg-sticky-header]");
}

function getSiteLogo(root) {
  return root.querySelector(".isg-site-logo") || document.querySelector(".isg-site-logo");
}

export function initHeaderScrollVisibility(root = document) {
  const header = getStickyHeader(root);
  const chrome = header?.querySelector(".isg-site-header__chrome");
  const logo = getSiteLogo(root);
  if (!(header instanceof HTMLElement) || !(chrome instanceof HTMLElement)) {
    return () => {};
  }

  const targets = [chrome];
  if (logo instanceof HTMLElement) {
    targets.push(logo);
  }

  gsap.set(targets, {
    yPercent: 0,
    force3D: true,
    willChange: "transform",
  });
  header.classList.remove(HIDDEN_CLASS);

  return () => {
    header.classList.remove(HIDDEN_CLASS);
    gsap.killTweensOf(targets);
    gsap.set(targets, {
      clearProps: "transform,willChange",
    });
  };
}
