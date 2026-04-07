import gsap from "gsap";

const BG_MEDIA_CLASS = "isg-intro-media";
const BG_MEDIA_INNER_CLASS = "isg-intro-media__inner";
const BG_MEDIA_IMG_CLASS = "isg-intro-media__img";
const REVEAL_DURATION = 4.6;
const REVEAL_EASE = "power4.out";
const REVEAL_SCALE_FROM = 1.16;

function extractUrl(source) {
  const match = typeof source === "string" ? source.match(/url\((['"]?)(.*?)\1\)/i) : null;
  return match?.[2] || null;
}





export function initIntroBgEntranceScale(root = document) {
  
  const createdPairs = [];
  
  const revealTargets = [];

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  root.querySelectorAll("[data-isg-intro-scroll]").forEach((node) => {
    if (!(node instanceof HTMLElement) || node.dataset.isgIntroBgMediaInit === "1") {
      return;
    }

    const existingMedia = node.querySelector(":scope > .isg-intro-media");
    if (existingMedia instanceof HTMLElement) {
      node.dataset.isgIntroBgMediaInit = "1";
      const existingImage = existingMedia.querySelector("img");
      if (existingImage instanceof HTMLElement) {
        revealTargets.push({ section: node, image: existingImage });
      }
      return;
    }

    const inlineBg = node.style.backgroundImage;
    const computedBg = window.getComputedStyle(node).backgroundImage;
    const src = extractUrl(inlineBg) || extractUrl(computedBg);
    if (!src) {
      return;
    }

    const media = document.createElement("div");
    media.className = BG_MEDIA_CLASS;
    media.setAttribute("aria-hidden", "true");

    const mediaInner = document.createElement("div");
    mediaInner.className = BG_MEDIA_INNER_CLASS;

    const img = document.createElement("img");
    img.className = BG_MEDIA_IMG_CLASS;
    img.src = src;
    img.alt = "";
    img.decoding = "async";
    img.loading = "eager";

    mediaInner.appendChild(img);
    media.appendChild(mediaInner);

    node.dataset.isgIntroBgImageBackup = inlineBg || computedBg;
    node.style.backgroundImage = "none";
    node.insertBefore(media, node.firstChild);
    node.dataset.isgIntroBgMediaInit = "1";
    createdPairs.push({ section: node, media });
    revealTargets.push({ section: node, image: img });
  });

  const observer =
    reduced || !revealTargets.length
      ? null
      : new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              const section = entry.target;
              const target = revealTargets.find((item) => item.section === section);
              if (!target || section.dataset.isgIntroMediaRevealed === "1") return;

              section.dataset.isgIntroMediaRevealed = "1";
              gsap.to(target.image, {
                scale: 1,
                duration: REVEAL_DURATION,
                ease: REVEAL_EASE,
                overwrite: true,
              });
              observer?.unobserve(section);
            });
          },
          {
            threshold: 0.24,
            rootMargin: "0px 0px -14% 0px",
          },
        );

  revealTargets.forEach(({ section, image }) => {
    if (reduced) {
      gsap.set(image, { scale: 1, clearProps: "transform" });
      section.dataset.isgIntroMediaRevealed = "1";
      return;
    }

    gsap.set(image, {
      scale: REVEAL_SCALE_FROM,
      transformOrigin: "center top",
      force3D: true,
      willChange: "transform",
    });

    const rect = section.getBoundingClientRect();
    const inView = rect.bottom > 0 && rect.top < (window.innerHeight || 1) * 0.78;
    if (inView) {
      section.dataset.isgIntroMediaRevealed = "1";
      gsap.to(image, {
        scale: 1,
        duration: REVEAL_DURATION,
        ease: REVEAL_EASE,
        overwrite: true,
      });
      return;
    }

    observer?.observe(section);
  });

  return () => {
    observer?.disconnect();
    revealTargets.forEach(({ section, image }) => {
      gsap.killTweensOf(image);
      gsap.set(image, { clearProps: "scale,transform,transformOrigin,willChange" });
      delete section.dataset.isgIntroMediaRevealed;
    });
    createdPairs.forEach(({ section, media }) => {
      media.remove();
      const backup = section.dataset.isgIntroBgImageBackup;
      if (backup && backup !== "none") {
        section.style.backgroundImage = backup;
      } else {
        section.style.removeProperty("background-image");
      }
      delete section.dataset.isgIntroBgImageBackup;
      delete section.dataset.isgIntroBgMediaInit;
    });
  };
}
