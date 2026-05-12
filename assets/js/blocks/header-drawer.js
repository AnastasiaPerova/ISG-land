const CLOSE_EVENT = "isg-close-nav-drawer";

let lockedScrollY = 0;

function lockBodyScroll() {
  lockedScrollY = window.scrollY || window.pageYOffset || 0;
  document.body.classList.add("isg-nav-drawer-open");
  document.body.style.position = "fixed";
  document.body.style.top = `-${lockedScrollY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
}

function unlockBodyScroll() {
  const shouldRestore = document.body.classList.contains("isg-nav-drawer-open");

  document.body.classList.remove("isg-nav-drawer-open");
  document.body.style.removeProperty("position");
  document.body.style.removeProperty("top");
  document.body.style.removeProperty("left");
  document.body.style.removeProperty("right");
  document.body.style.removeProperty("width");

  if (shouldRestore) {
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

  const close = () => {
    drawer.classList.remove("isg-nav-drawer--open");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Open menu");
    drawer.setAttribute("aria-hidden", "true");
    unlockBodyScroll();
  };

  const onBurgerClick = () => {
    if (drawer.classList.contains("isg-nav-drawer--open")) close();
    else open();
  };

  const onCloseEvent = () => close();
  const onNavLinkClick = () => close();

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
