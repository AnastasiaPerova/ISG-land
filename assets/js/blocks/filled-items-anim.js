import gsap from "gsap";

export function initFilledItemsAnim(root = document) {
  const groups = Array.from(root.querySelectorAll(".isg-filled-items"));
  if (!groups.length) return () => {};

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  /** @type {IntersectionObserver[]} */
  const observers = [];
  /** @type {Array<() => void>} */
  const disposers = [];

  groups.forEach((group) => {
    const items = Array.from(group.querySelectorAll(".isg-filled-item"));
    if (!items.length) return;
    const contentNodes = Array.from(
      new Set(
        items.flatMap((item) =>
          Array.from(item.querySelectorAll(".isg-filled-item__text, .isg-filled-item__go, span")),
        ),
      ),
    );

    if (!reduced) {
      gsap.set(items, {
        x: -28,
        y: 0,
        scale: 1,
        clipPath: "inset(0 100% 0 0 round 22px)",
        webkitClipPath: "inset(0 100% 0 0 round 22px)",
        filter: "blur(4px)",
        transformOrigin: "0% 50%",
      });
      gsap.set(contentNodes, {
        opacity: 0,
        x: 18,
      });
    }

    const reveal = () => {
      if (reduced) return;
      const tl = gsap.timeline();
      tl.to(items, {
        x: 0,
        clipPath: "inset(0 0% 0 0 round 22px)",
        webkitClipPath: "inset(0 0% 0 0 round 22px)",
        filter: "blur(0px)",
        stagger: 0.08,
        duration: 0.88,
        ease: "power4.out",
      }).to(
        contentNodes,
        {
          opacity: 1,
          x: 0,
          stagger: 0.045,
          duration: 0.56,
          ease: "power2.out",
        },
        0.18,
      );
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.disconnect();
          reveal();
        });
      },
      { threshold: 0.2 },
    );
    observer.observe(group);
    observers.push(observer);

    if (reduced || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    items.forEach((item) => {
      const move = (e) => {
        const r = item.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width - 0.5) * 8;
        const y = ((e.clientY - r.top) / r.height - 0.5) * 8;
        gsap.to(item, {
          x,
          y,
          scale: 1.02,
          duration: 0.24,
          ease: "power2.out",
          overwrite: "auto",
        });
      };

      const enter = () => {
        gsap.to(item, {
          y: -2,
          duration: 0.26,
          ease: "power2.out",
          overwrite: "auto",
        });
      };

      const leave = () => {
        gsap.to(item, {
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.34,
          ease: "power3.out",
          overwrite: "auto",
        });
      };

      item.addEventListener("pointermove", move);
      item.addEventListener("pointerenter", enter);
      item.addEventListener("pointerleave", leave);

      disposers.push(() => {
        item.removeEventListener("pointermove", move);
        item.removeEventListener("pointerenter", enter);
        item.removeEventListener("pointerleave", leave);
      });
    });
  });

  return () => {
    observers.forEach((o) => o.disconnect());
    disposers.forEach((off) => off());
  };
}
