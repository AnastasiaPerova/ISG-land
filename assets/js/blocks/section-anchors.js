import { CLOSE_EVENT } from "./header-drawer.js";
import { getLenis } from "./smooth-scroll.js";
import { syncNavPillSliders } from "./nav-pill-slider.js";

const SECTION_IDS = [
  "isg-hero",
  "isg-digits",
  "isg-application",
  "isg-product",
  "isg-quality",
  "isg-about",
  "isg-certificates",
  "isg-rfq",
  "isg-rfq-content",
  "isg-footer",
];

const ANCHOR_DOWNWARD_NUDGE = 18;

function stickyHeaderEl(root) {
  return root.querySelector("[data-isg-sticky-header]") || document.querySelector("[data-isg-sticky-header]");
}

function measureHeaderBottomGap(root, extra = 8) {
  const header = stickyHeaderEl(root);
  if (!(header instanceof HTMLElement)) return 96;

  if (header.classList.contains("isg-site-header--hidden")) {
    return extra;
  }

  const chrome = header.querySelector(".isg-site-header__chrome");
  const measureEl = chrome instanceof HTMLElement ? chrome : header;
  return Math.max(extra, Math.ceil(measureEl.getBoundingClientRect().bottom + extra));
}

function publishStickyHeaderVar(root) {
  document.documentElement.style.setProperty(
    "--isg-sticky-header-offset",
    `${measureHeaderBottomGap(root)}px`,
  );
}

function getDocumentTop(el) {
  if (!(el instanceof HTMLElement)) return -Infinity;
  return el.getBoundingClientRect().top + window.scrollY;
}

function isAnchorStructuralChild(el) {
  if (!(el instanceof HTMLElement)) return false;
  return (
    el.matches("section") ||
    el.classList.contains("isg-section-surface") ||
    el.classList.contains("isg-intro-pin") ||
    el.classList.contains("isg-quality-wrapper") ||
    el.classList.contains("isg-product-content") ||
    el.classList.contains("isg-rfq-content")
  );
}

function getSectionAnchorTop(el) {
  if (!(el instanceof HTMLElement)) return -Infinity;

  let top = getDocumentTop(el);
  Array.from(el.children).forEach((child) => {
    if (!isAnchorStructuralChild(child)) return;
    top = Math.min(top, getDocumentTop(child));
  });

  return top;
}

function sectionNavs(root) {
  return Array.from(root.querySelectorAll("[data-isg-section-nav]"));
}

function setActiveSectionLinkAll(root, id) {
  sectionNavs(root).forEach((nav) => {
    const links = Array.from(nav.querySelectorAll('a[href^="#"]'));
    links.forEach((a) => {
      const match = id != null && a.getAttribute("href") === `#${id}`;
      a.classList.toggle("isg-btn--active", match);
      if (match) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  });
  syncNavPillSliders(root);
}


let anchorNavLockId = null;
let anchorNavLockTimer = null;

function lockAnchorNavigation(id) {
  anchorNavLockId = id;
  clearTimeout(anchorNavLockTimer);
  anchorNavLockTimer = setTimeout(() => {
    anchorNavLockId = null;
    anchorNavLockTimer = null;
  }, 2200);
}

function clearAnchorNavigationLock() {
  anchorNavLockId = null;
  clearTimeout(anchorNavLockTimer);
  anchorNavLockTimer = null;
}




export function initSectionAnchors(root = document) {
  if (!sectionNavs(root).length) return () => {};

  const getCurrentScrollY = () => {
    const lenis = getLenis();
    if (lenis && typeof lenis.scroll === "number") {
      return lenis.scroll;
    }
    return window.scrollY || window.pageYOffset || 0;
  };

  const getVisibleScrollOffset = () => measureHeaderBottomGap(root, 8);
  const getScrollOffsetForTarget = (targetTop) => {
    const currentY = Math.max(0, getCurrentScrollY());
    const isScrollingDown = targetTop > currentY + 24;
    return isScrollingDown
      ? Math.max(0, 8 - ANCHOR_DOWNWARD_NUDGE)
      : getVisibleScrollOffset();
  };

  const scrollToSection = (id, { behavior = "smooth", updateHash = true } = {}) => {
    const el = document.getElementById(id);
    if (!el) return false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const instant = behavior === "auto" || reduced;
    const targetTop = getSectionAnchorTop(el);
    const scrollOffset = getScrollOffsetForTarget(targetTop);
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(Math.max(0, targetTop - scrollOffset), {
        immediate: instant,
        duration: instant ? 0 : 1.28,
        easing: (t) => 1 - (1 - t) ** 3,
      });
    } else {
      const top = targetTop - scrollOffset;
      const motion = instant ? "auto" : "smooth";
      window.scrollTo({ top: Math.max(0, top), behavior: motion });
    }
    if (updateHash) {
      try {
        history.pushState(null, "", `#${id}`);
      } catch (_) {
        
      }
    }
    return true;
  };

  const navHrefIdSet = () => {
    const ids = new Set();
    sectionNavs(root).forEach((nav) => {
      nav.querySelectorAll('a[href^="#"]').forEach((a) => {
        const id = a.getAttribute("href").slice(1);
        if (id) ids.add(id);
      });
    });
    return ids.size ? ids : null;
  };

  
  const applyActiveFromScroll = () => {
    const probe = getCurrentScrollY() + getVisibleScrollOffset() + 28;
    const hrefIds = navHrefIdSet();

    let scrollId = SECTION_IDS[0];
    for (const id of SECTION_IDS) {
      const el = document.getElementById(id);
      if (!el) continue;
      if (getSectionAnchorTop(el) <= probe) scrollId = id;
    }

    let activeId = null;
    const idx = SECTION_IDS.indexOf(scrollId);
    if (hrefIds) {
      for (let i = idx; i >= 0; i--) {
        const id = SECTION_IDS[i];
        if (hrefIds.has(id)) {
          activeId = id;
          break;
        }
      }
    } else {
      activeId = scrollId;
    }

    if (anchorNavLockId != null) {
      if (activeId === anchorNavLockId) {
        clearAnchorNavigationLock();
      } else {
        return;
      }
    }

    const prev = root
      .querySelector("[data-isg-section-nav] a.isg-btn--active")
      ?.getAttribute("href")
      ?.slice(1);
    if (prev !== activeId) {
      setActiveSectionLinkAll(root, activeId);
    }
  };

  const onNavClick = (e) => {
    const nav = e.currentTarget;
    const a = e.target.closest("a");
    if (!a || !nav.contains(a)) return;
    const href = a.getAttribute("href");
    if (!href?.startsWith("#")) return;
    const id = href.slice(1);
    if (!id || !document.getElementById(id)) return;
    const current = nav.querySelector(".isg-btn--active")?.getAttribute("href");
    if (current === href) {
      e.preventDefault();
      if (a.closest("#isg-nav-drawer")) {
        document.dispatchEvent(new CustomEvent(CLOSE_EVENT));
      }
      return;
    }
    e.preventDefault();
    lockAnchorNavigation(id);
    scrollToSection(id, { behavior: "smooth", updateHash: false });
    setActiveSectionLinkAll(root, id);
    if (a.closest("#isg-nav-drawer")) {
      document.dispatchEvent(new CustomEvent(CLOSE_EVENT));
    }
  };

  sectionNavs(root).forEach((nav) => {
    nav.addEventListener("click", onNavClick);
  });

  const sticky = stickyHeaderEl(root);
  publishStickyHeaderVar(root);
  const ro = sticky ? new ResizeObserver(() => publishStickyHeaderVar(root)) : null;
  if (sticky) ro.observe(sticky);

  const onWinResize = () => {
    publishStickyHeaderVar(root);
    applyActiveFromScroll();
  };

  const hash = window.location.hash?.slice(1);
  if (hash && SECTION_IDS.includes(hash)) {
    requestAnimationFrame(() => {
      publishStickyHeaderVar(root);
      scrollToSection(hash, { behavior: "auto", updateHash: false });
      setActiveSectionLinkAll(root, hash);
    });
  } else {
    requestAnimationFrame(() => {
      publishStickyHeaderVar(root);
      applyActiveFromScroll();
    });
  }

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      applyActiveFromScroll();
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onWinResize, { passive: true });

  const onPopState = () => {
    const id = window.location.hash?.slice(1);
    if (id && SECTION_IDS.includes(id)) {
      publishStickyHeaderVar(root);
      scrollToSection(id, { behavior: "auto", updateHash: false });
      setActiveSectionLinkAll(root, id);
    }
  };
  window.addEventListener("popstate", onPopState);

  return () => {
    sectionNavs(root).forEach((nav) => {
      nav.removeEventListener("click", onNavClick);
    });
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onWinResize);
    window.removeEventListener("popstate", onPopState);
    ro?.disconnect();
  };
}
