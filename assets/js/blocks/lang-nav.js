import gsap from "gsap";

/**
 * Dropdown language switcher (desktop + drawer) with synced selected value.
 */
export function initLangNav(root = document) {
  const navs = Array.from(root.querySelectorAll("[data-isg-lang-nav]"));
  if (!navs.length) {
    return () => {};
  }
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
  const desktopHeader = window.matchMedia("(min-width: 1100px)");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let closeTimer = null;
  const CLOSE_DELAY_MS = 260;
  const animations = new WeakMap();

  const clearAnimation = (nav) => {
    const tl = animations.get(nav);
    if (tl) {
      tl.kill();
      animations.delete(nav);
    }
  };

  const getParts = (nav) => {
    const toggle = nav.querySelector("[data-isg-lang-toggle]");
    const menu = nav.querySelector("[data-isg-lang-menu]");
    if (!(toggle instanceof HTMLElement) || !(menu instanceof HTMLElement)) return null;
    const options = Array.from(menu.querySelectorAll("[data-isg-lang]")).filter((el) => el instanceof HTMLElement);
    return { toggle, menu, options };
  };

  const isNavOpen = (nav, parts = getParts(nav)) => {
    if (!parts) return false;
    return nav.classList.contains("isg-lang-dropdown--open") || parts.toggle.getAttribute("aria-expanded") === "true" || !parts.menu.hidden;
  };

  const getVisibleOptions = (parts) =>
    parts.options.filter((el) => window.getComputedStyle(el).display !== "none");

  const useStableShell = (nav) =>
    desktopHeader.matches && nav.closest(".isg-header-desktop-only") !== null;

  const useHoverBehavior = (nav) =>
    nav instanceof Element && canHover.matches && nav.closest(".isg-nav-drawer") === null;

  const getShellHeight = (nav, parts) => {
    const navRect = nav.getBoundingClientRect();
    const toggleRect = parts.toggle.getBoundingClientRect();
    const menuVisible = !parts.menu.hidden;
    const menuRect = menuVisible ? parts.menu.getBoundingClientRect() : null;
    const contentBottom = menuRect ? menuRect.bottom - navRect.top : toggleRect.height;
    return `${Math.max(toggleRect.height, contentBottom)}px`;
  };

  const resetAnimatedStyles = (parts) => {
    gsap.set(parts.menu, { clearProps: "opacity,transform,transformOrigin,overflow,pointerEvents" });
    gsap.set(parts.options, { clearProps: "opacity,transform" });
    gsap.set(parts.toggle, { clearProps: "backgroundColor" });
    gsap.set(parts.menu.parentElement, {
      clearProps: "--isg-lang-shell-scale,--isg-lang-shell-opacity,--isg-lang-shell-h",
    });
  };

  const getInitialCode = () => {
    const selected =
      root.querySelector('[data-isg-lang-nav] [data-isg-lang][aria-selected="true"]') ||
      root.querySelector("[data-isg-lang-nav] [data-isg-lang].isg-btn--active") ||
      root.querySelector("[data-isg-lang-nav] [data-isg-lang]");
    return selected?.getAttribute("data-isg-lang") || "en";
  };

  const closeNav = (nav, { immediate = false } = {}) => {
    const parts = getParts(nav);
    if (!parts) return;
    const { toggle, menu } = parts;
    const isOpen = isNavOpen(nav, parts);
    if (!isOpen) {
      toggle.setAttribute("aria-expanded", "false");
      menu.hidden = true;
      nav.classList.remove("isg-lang-dropdown--open");
      resetAnimatedStyles(parts);
      return;
    }
    const options = getVisibleOptions(parts);
    const shellHeight = getShellHeight(nav, parts);
    const stableShell = useStableShell(nav);
    clearAnimation(nav);
    toggle.setAttribute("aria-expanded", "false");

    if (immediate || reduceMotion) {
      menu.hidden = true;
      nav.classList.remove("isg-lang-dropdown--open");
      resetAnimatedStyles(parts);
      return;
    }

    if (stableShell) {
      gsap.set(nav, {
        "--isg-lang-shell-scale": 1,
        "--isg-lang-shell-opacity": 1,
        "--isg-lang-shell-h": shellHeight,
      });
    }

    const tl = gsap.timeline({
      onComplete: () => {
        menu.hidden = true;
        nav.classList.remove("isg-lang-dropdown--open");
        resetAnimatedStyles(parts);
        animations.delete(nav);
      },
    });

    tl.to(
      options,
      {
        opacity: 0,
        y: -6,
        stagger: { each: 0.03, from: "end" },
        duration: 0.12,
        ease: "power1.in",
      },
      0,
    )
      .to(
        menu,
        {
          opacity: 0,
          y: -10,
          scaleY: 0.28,
          transformOrigin: "top center",
          duration: 0.2,
          ease: "power2.in",
        },
        0,
      );

    if (!stableShell) {
      tl.to(
        nav,
        {
          "--isg-lang-shell-scale": 0.82,
          "--isg-lang-shell-opacity": 1,
          "--isg-lang-shell-h": shellHeight,
          duration: 0.16,
          ease: "power1.inOut",
        },
        0,
      )
      .to(
        nav,
        {
          "--isg-lang-shell-scale": 0,
          "--isg-lang-shell-opacity": 0,
          duration: 0.22,
          ease: "power2.in",
        },
        0.04,
      );
    }

    animations.set(nav, tl);
  };

  const closeAll = ({ except = null, immediate = false } = {}) => {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    navs.forEach((nav) => {
      if (except && nav === except) return;
      closeNav(nav, { immediate });
    });
  };

  const openNav = (nav, { immediate = false } = {}) => {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    const parts = getParts(nav);
    if (!parts) return;
    const { toggle, menu } = parts;
    closeAll({ except: nav, immediate: true });
    clearAnimation(nav);
    toggle.setAttribute("aria-expanded", "true");
    menu.hidden = false;
    nav.classList.add("isg-lang-dropdown--open");

    if (immediate || reduceMotion) {
      resetAnimatedStyles(parts);
      return;
    }

    const options = getVisibleOptions(parts);
    const shellHeight = getShellHeight(nav, parts);
    const stableShell = useStableShell(nav);

    gsap.set(menu, {
      opacity: 0,
      y: -10,
      scaleY: 0.28,
      transformOrigin: "top center",
      overflow: "hidden",
      pointerEvents: "none",
    });
    gsap.set(options, { opacity: 0, y: -8 });
    gsap.set(
      nav,
      stableShell
        ? {
            "--isg-lang-shell-scale": 1,
            "--isg-lang-shell-opacity": 1,
            "--isg-lang-shell-h": shellHeight,
          }
        : {
            "--isg-lang-shell-scale": 0,
            "--isg-lang-shell-opacity": 0,
            "--isg-lang-shell-h": shellHeight,
          },
    );

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(menu, { clearProps: "overflow,pointerEvents" });
        animations.delete(nav);
      },
    });

    if (!stableShell) {
      tl.to(nav, {
        "--isg-lang-shell-opacity": 1,
        "--isg-lang-shell-scale": 1,
        duration: 0.16,
        ease: "power2.out",
      });
    }

    tl
      .to(
        menu,
        {
          opacity: 1,
          y: 0,
          scaleY: 1,
          duration: 0.28,
          ease: "power2.out",
        },
        ">-0.02",
      )
      .to(
        options,
        {
          opacity: 1,
          y: 0,
          stagger: 0.05,
          duration: 0.2,
          ease: "power2.out",
        },
        "<0.04",
      );

    animations.set(nav, tl);
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
  closeAll({ immediate: true });

  const onClick = (e) => {
    if (!(e.target instanceof Element)) return;
    const nav = e.target.closest("[data-isg-lang-nav]");
    if (!nav) {
      if (navs.some((node) => isNavOpen(node))) {
        closeAll();
      }
      return;
    }
    if (!root.contains(nav)) return;

    const toggle = e.target.closest("[data-isg-lang-toggle]");
    if (toggle && nav.contains(toggle)) {
      const menu = nav.querySelector("[data-isg-lang-menu]");
      if (!menu) return;
      const nextOpen = toggle.getAttribute("aria-expanded") !== "true";
      if (nextOpen) {
        openNav(nav);
      } else {
        closeNav(nav);
      }
      return;
    }

    const option = e.target.closest("[data-isg-lang-menu] [data-isg-lang]");
    if (option) {
      if (!nav.contains(option)) return;
      const code = option.getAttribute("data-isg-lang");
      if (!code) return;
      e.preventDefault();
      setLang(code);
      closeNav(nav);
      return;
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
    const nav = e.currentTarget;
    if (!useHoverBehavior(nav)) return;
    openNav(nav);
  };

  const onMouseLeave = (e) => {
    const nav = e.currentTarget;
    if (!useHoverBehavior(nav)) return;
    const next = e.relatedTarget;
    if (next instanceof Node && nav instanceof Node && nav.contains(next)) {
      return;
    }
    if (closeTimer) {
      clearTimeout(closeTimer);
    }
    closeTimer = setTimeout(() => {
      closeAll();
      closeTimer = null;
    }, CLOSE_DELAY_MS);
  };

  navs.forEach((nav) => {
    nav.addEventListener("mouseenter", onMouseEnter);
    nav.addEventListener("mouseleave", onMouseLeave);
  });

  return () => {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    navs.forEach(clearAnimation);
    root.removeEventListener("click", onClick);
    document.removeEventListener("keydown", onKeyDown);
    navs.forEach((nav) => {
      nav.removeEventListener("mouseenter", onMouseEnter);
      nav.removeEventListener("mouseleave", onMouseLeave);
    });
  };
}
