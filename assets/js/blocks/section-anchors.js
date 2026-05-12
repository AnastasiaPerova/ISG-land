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

const DEFAULT_HEADER_OFFSET = 96;
const ANCHOR_SETTLE_EPSILON = 2;
const COMPACT_ANCHOR_QUERY = "(max-width: 1099px)";

function isCompactAnchorViewport() {
  return window.matchMedia(COMPACT_ANCHOR_QUERY).matches;
}

function stickyHeaderEl(root) {
  return root.querySelector("[data-isg-sticky-header]") || document.querySelector("[data-isg-sticky-header]");
}

function measureHeaderBottomGap(root, extra = 8) {
  const header = stickyHeaderEl(root);
  if (!(header instanceof HTMLElement)) return DEFAULT_HEADER_OFFSET;

  if (header.classList.contains("isg-site-header--hidden")) {
    return extra;
  }

  const chrome = header.querySelector(".isg-site-header__chrome");
  const measureEl = chrome instanceof HTMLElement ? chrome : header;
  const headerRect = header.getBoundingClientRect();
  const measureRect = measureEl.getBoundingClientRect();
  const visibleTop = Math.max(0, Math.min(headerRect.top, measureRect.top));
  const visibleHeight = Math.max(
    header.offsetHeight || 0,
    measureEl.offsetHeight || 0,
    Math.round(measureRect.height || 0),
  );

  return Math.max(extra, Math.ceil(visibleTop + visibleHeight + extra));
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
  let activeAnchorId = null;
  let layoutSyncRaf = 0;

  const getCurrentScrollY = () => {
    const lenis = getLenis();
    if (lenis && typeof lenis.scroll === "number") {
      return lenis.scroll;
    }
    return window.scrollY || window.pageYOffset || 0;
  };

  const getVisibleScrollOffset = () => measureHeaderBottomGap(root, 8);
  const syncPublishedOffset = () => {
    const offset = getVisibleScrollOffset();
    document.documentElement.style.setProperty("--isg-sticky-header-offset", `${offset}px`);
    return offset;
  };
  const getScrollOffsetForTarget = () => getVisibleScrollOffset();

  const settleAtSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;

    const targetTop = getSectionAnchorTop(el);
    if (!Number.isFinite(targetTop)) return;

    const expectedTop = Math.max(0, targetTop - getScrollOffsetForTarget(targetTop));
    const currentTop = Math.max(0, getCurrentScrollY());
    if (Math.abs(expectedTop - currentTop) <= ANCHOR_SETTLE_EPSILON) return;

    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(expectedTop, {
        immediate: true,
        force: true,
      });
      return;
    }

    window.scrollTo({ top: expectedTop, behavior: "auto" });
  };

  const scrollToSection = (id, { behavior = "smooth", updateHash = true } = {}) => {
    const el = document.getElementById(id);
    if (!el) return false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const instant = behavior === "auto" || reduced;
    const targetTop = getSectionAnchorTop(el);
    if (!Number.isFinite(targetTop)) return false;
    const scrollOffset = getScrollOffsetForTarget(targetTop);
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(Math.max(0, targetTop - scrollOffset), {
        immediate: instant,
        duration: instant ? 0 : 1.28,
        easing: (t) => 1 - (1 - t) ** 3,
        onComplete: () => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              settleAtSection(id);
            });
          });
        },
      });
    } else {
      const top = targetTop - scrollOffset;
      const motion = instant ? "auto" : "smooth";
      window.scrollTo({ top: Math.max(0, top), behavior: motion });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          settleAtSection(id);
        });
      });
    }
    if (updateHash) {
      try {
        history.pushState(null, "", `#${id}`);
      } catch (_) {
        
      }
    }
    activeAnchorId = id;
    return true;
  };

  const syncAnchorLayout = (id, { behavior = "auto", updateHash = false } = {}) => {
    if (!id || !document.getElementById(id)) return;
    if (layoutSyncRaf) cancelAnimationFrame(layoutSyncRaf);
    layoutSyncRaf = requestAnimationFrame(() => {
      layoutSyncRaf = 0;
      syncPublishedOffset();
      scrollToSection(id, { behavior, updateHash });
      setActiveSectionLinkAll(root, id);
    });
  };

  const closeDrawerThenScroll = (id) => {
    document.dispatchEvent(new CustomEvent(CLOSE_EVENT));
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        syncPublishedOffset();
        scrollToSection(id, { behavior: "smooth", updateHash: false });
        setActiveSectionLinkAll(root, id);
      });
    });
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
    const inDrawer = Boolean(a.closest("#isg-nav-drawer"));
    const current = nav.querySelector(".isg-btn--active")?.getAttribute("href");
    if (current === href) {
      e.preventDefault();
      if (inDrawer) {
        document.dispatchEvent(new CustomEvent(CLOSE_EVENT));
      }
      return;
    }
    e.preventDefault();
    lockAnchorNavigation(id);
    if (inDrawer) {
      closeDrawerThenScroll(id);
    } else {
      scrollToSection(id, { behavior: "smooth", updateHash: false });
      setActiveSectionLinkAll(root, id);
    }
  };

  sectionNavs(root).forEach((nav) => {
    nav.addEventListener("click", onNavClick);
  });

  const sticky = stickyHeaderEl(root);
  publishStickyHeaderVar(root);
  const ro = sticky
    ? new ResizeObserver(() => {
        syncPublishedOffset();
        if (activeAnchorId && !isCompactAnchorViewport()) {
          syncAnchorLayout(activeAnchorId);
        }
      })
    : null;
  if (sticky) ro.observe(sticky);

  const onWinResize = () => {
    syncPublishedOffset();
    if (activeAnchorId && !isCompactAnchorViewport()) {
      syncAnchorLayout(activeAnchorId);
    }
    applyActiveFromScroll();
  };

  const hash = window.location.hash?.slice(1);
  if (hash && SECTION_IDS.includes(hash)) {
    requestAnimationFrame(() => {
      syncAnchorLayout(hash, { behavior: "auto", updateHash: false });
    });
  } else {
    requestAnimationFrame(() => {
      syncPublishedOffset();
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
  window.addEventListener("load", onWinResize);

  const onPopState = () => {
    const id = window.location.hash?.slice(1);
    if (id && SECTION_IDS.includes(id)) {
      syncAnchorLayout(id, { behavior: "auto", updateHash: false });
    }
  };
  window.addEventListener("popstate", onPopState);

  document.fonts?.ready
    ?.then(() => {
      if ((activeAnchorId || hash) && !isCompactAnchorViewport()) {
        syncAnchorLayout(activeAnchorId || hash, {
          behavior: "auto",
          updateHash: false,
        });
      } else {
        onWinResize();
      }
    })
    .catch(() => {});

  return () => {
    sectionNavs(root).forEach((nav) => {
      nav.removeEventListener("click", onNavClick);
    });
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onWinResize);
    window.removeEventListener("load", onWinResize);
    window.removeEventListener("popstate", onPopState);
    ro?.disconnect();
    if (layoutSyncRaf) cancelAnimationFrame(layoutSyncRaf);
  };
}
