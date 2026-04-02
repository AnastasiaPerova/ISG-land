/**
 * Dropdown language switcher (desktop + drawer) with synced selected value.
 */
export function initLangNav(root = document) {
  const navs = Array.from(root.querySelectorAll("[data-isg-lang-nav]"));
  if (!navs.length) {
    return () => {};
  }
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");

  const getInitialCode = () => {
    const selected =
      root.querySelector('[data-isg-lang-nav] [data-isg-lang][aria-selected="true"]') ||
      root.querySelector("[data-isg-lang-nav] [data-isg-lang].isg-btn--active") ||
      root.querySelector("[data-isg-lang-nav] [data-isg-lang]");
    return selected?.getAttribute("data-isg-lang") || "en";
  };

  const closeAll = () => {
    navs.forEach((nav) => {
      const toggle = nav.querySelector("[data-isg-lang-toggle]");
      const menu = nav.querySelector("[data-isg-lang-menu]");
      if (!toggle || !menu) return;
      toggle.setAttribute("aria-expanded", "false");
      menu.hidden = true;
      nav.classList.remove("isg-lang-dropdown--open");
    });
  };

  const openNav = (nav) => {
    const toggle = nav.querySelector("[data-isg-lang-toggle]");
    const menu = nav.querySelector("[data-isg-lang-menu]");
    if (!toggle || !menu) return;
    closeAll();
    toggle.setAttribute("aria-expanded", "true");
    menu.hidden = false;
    nav.classList.add("isg-lang-dropdown--open");
  };

  const setLang = (code) => {
    navs.forEach((nav) => {
      const current = nav.querySelector("[data-isg-lang-current]");
      nav.querySelectorAll("[data-isg-lang]").forEach((option) => {
        const on = option.getAttribute("data-isg-lang") === code;
        option.classList.toggle("isg-btn--active", on);
        option.setAttribute("aria-selected", on ? "true" : "false");
      });
      if (current) {
        current.textContent = code.toUpperCase();
      }
    });
  };

  setLang(getInitialCode());
  closeAll();

  const onClick = (e) => {
    const toggle = e.target.closest("[data-isg-lang-toggle]");
    if (toggle) {
      const nav = toggle.closest("[data-isg-lang-nav]");
      if (!nav || !root.contains(nav)) return;
      const menu = nav.querySelector("[data-isg-lang-menu]");
      if (!menu) return;
      const nextOpen = toggle.getAttribute("aria-expanded") !== "true";
      closeAll();
      if (nextOpen) {
        openNav(nav);
      }
      return;
    }

    const option = e.target.closest("[data-isg-lang]");
    if (option) {
      const nav = option.closest("[data-isg-lang-nav]");
      if (!nav || !root.contains(nav)) return;
      const code = option.getAttribute("data-isg-lang");
      if (!code) return;
      e.preventDefault();
      setLang(code);
      closeAll();
      return;
    }

    if (!e.target.closest("[data-isg-lang-nav]")) {
      closeAll();
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      closeAll();
    }
  };

  root.addEventListener("click", onClick);
  document.addEventListener("keydown", onKeyDown);

  const onMouseEnter = (e) => {
    if (!canHover.matches) return;
    const nav = e.currentTarget;
    openNav(nav);
  };

  const onMouseLeave = () => {
    if (!canHover.matches) return;
    closeAll();
  };

  navs.forEach((nav) => {
    nav.addEventListener("mouseenter", onMouseEnter);
    nav.addEventListener("mouseleave", onMouseLeave);
  });

  return () => {
    root.removeEventListener("click", onClick);
    document.removeEventListener("keydown", onKeyDown);
    navs.forEach((nav) => {
      nav.removeEventListener("mouseenter", onMouseEnter);
      nav.removeEventListener("mouseleave", onMouseLeave);
    });
  };
}
