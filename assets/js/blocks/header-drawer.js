const CLOSE_EVENT = "isg-close-nav-drawer";

let lockedScrollY = 0;
let scrollLockState = null;

function lockBodyScroll() {
  if (scrollLockState) return;
  lockedScrollY = window.scrollY || window.pageYOffset || 0;
  scrollLockState = {
    htmlOverflow: document.documentElement.style.overflow,
    bodyOverflow: document.body.style.overflow,
    bodyTouchAction: document.body.style.touchAction,
  };
  document.body.classList.add("isg-nav-drawer-open");
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  document.body.style.touchAction = "none";
}

function unlockBodyScroll({ restoreScroll = true } = {}) {
  const shouldRestore = document.body.classList.contains("isg-nav-drawer-open");

  document.body.classList.remove("isg-nav-drawer-open");
  if (scrollLockState) {
    document.documentElement.style.overflow = scrollLockState.htmlOverflow;
    document.body.style.overflow = scrollLockState.bodyOverflow;
    document.body.style.touchAction = scrollLockState.bodyTouchAction;
  }
  scrollLockState = null;

  if (shouldRestore && restoreScroll) {
    window.scrollTo({ top: lockedScrollY, left: 0, behavior: "auto" });
  }
}




export function initHeaderDrawer(root = document) {
  const btn = root.querySelector("[data-isg-burger]");
  const drawer = root.querySelector("#isg-nav-drawer");
  if (!btn || !drawer) return () => {};
  const navLinks = Array.from(drawer.querySelectorAll(".isg-nav-drawer__nav a[href]"));

  const open = () => {
    drawer.classList.add("isg-nav-drawer--open");
    btn.setAttribute("aria-expanded", "true");
    btn.setAttribute("aria-label", "Close menu");
    drawer.setAttribute("aria-hidden", "false");
    lockBodyScroll();
  };

  const close = ({ restoreScroll = true } = {}) => {
    drawer.classList.remove("isg-nav-drawer--open");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Open menu");
    drawer.setAttribute("aria-hidden", "true");
    unlockBodyScroll({ restoreScroll });
  };

  const onBurgerClick = () => {
    if (drawer.classList.contains("isg-nav-drawer--open")) close();
    else open();
  };

  const onCloseEvent = (e) => close({ restoreScroll: e?.detail?.restoreScroll !== false });
  const onNavLinkClick = (e) => {
    const href = e.currentTarget?.getAttribute?.("href") || "";
    if (href.startsWith("#")) return;
    close();
  };

  const onEsc = (e) => {
    if (e.key === "Escape" && drawer.classList.contains("isg-nav-drawer--open")) {
      close();
    }
  };

  btn.addEventListener("click", onBurgerClick);
  drawer.querySelectorAll("[data-isg-drawer-close]").forEach((el) => {
    el.addEventListener("click", close);
  });
  navLinks.forEach((link) => link.addEventListener("click", onNavLinkClick));
  document.addEventListener(CLOSE_EVENT, onCloseEvent);
  document.addEventListener("keydown", onEsc);

  return () => {
    btn.removeEventListener("click", onBurgerClick);
    drawer.querySelectorAll("[data-isg-drawer-close]").forEach((el) => {
      el.removeEventListener("click", close);
    });
    navLinks.forEach((link) => link.removeEventListener("click", onNavLinkClick));
    document.removeEventListener(CLOSE_EVENT, onCloseEvent);
    document.removeEventListener("keydown", onEsc);
    close();
  };
}

export { CLOSE_EVENT };
