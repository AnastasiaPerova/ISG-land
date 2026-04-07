const CLOSE_EVENT = "isg-close-nav-drawer";




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
    document.body.classList.add("isg-nav-drawer-open");
  };

  const close = () => {
    drawer.classList.remove("isg-nav-drawer--open");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Open menu");
    drawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("isg-nav-drawer-open");
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
