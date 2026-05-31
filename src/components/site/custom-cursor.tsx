"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Custom cursor — a brand-tinted dot that follows the pointer instantly and a
 * larger ring that lags behind on a spring. Scales up + tints when hovering
 * over interactive elements (a, button, [role=button], inputs).
 *
 * Renders only on desktop with a hover-capable mouse, and only when the user
 * hasn't asked for reduced motion. On touch devices and reduced-motion users,
 * the native cursor stays.
 */
export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

  // Gate: only run on pointer:fine + hover:hover, and only when reduced-motion isn't requested.
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine) and (hover: hover)");
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const update = () => setEnabled(fine.matches && !reducedMotion.matches);
    update();
    fine.addEventListener("change", update);
    reducedMotion.addEventListener("change", update);
    return () => {
      fine.removeEventListener("change", update);
      reducedMotion.removeEventListener("change", update);
    };
  }, []);

  // Track + animate
  useEffect(() => {
    if (!enabled) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Hide the native cursor only while the custom one is active. Doing this
    // at body-class level (not via CSS file) keeps the cursor visible when
    // the component is disabled.
    document.documentElement.classList.add("has-custom-cursor");

    // Cursor follows the mouse instantly; ring lags with rAF interpolation.
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let rafId = 0;
    let hovering = false;

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;

      // Re-check whether the element under the cursor is interactive. Done
      // here (not via :hover on a container) so it works no matter how the
      // page is laid out.
      const el = e.target as Element | null;
      const interactive = !!el?.closest(
        'a, button, [role="button"], input, select, textarea, [data-cursor-grow]',
      );
      if (interactive !== hovering) {
        hovering = interactive;
        ring.classList.toggle("cursor-ring--hover", interactive);
      }
    };

    const onLeave = () => {
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    };
    const onEnter = () => {
      dot.style.opacity = "1";
      ring.style.opacity = "1";
    };
    const onDown = () => ring.classList.add("cursor-ring--press");
    const onUp = () => ring.classList.remove("cursor-ring--press");

    const tick = () => {
      // Spring toward the dot position. 0.18 felt like a good lag for
      // a "magnetic" feel without being mushy.
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerenter", onEnter);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerenter", onEnter);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      cancelAnimationFrame(rafId);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden />
      <div ref={ringRef} className="cursor-ring" aria-hidden />
    </>
  );
}
