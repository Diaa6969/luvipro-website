"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function CinemaMotion({ children, className = "" }: { children: ReactNode; className?: string }) {
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(pointer: fine)");
    let frame = 0;
    let visible = false;

    const update = () => {
      frame = 0;
      const bounds = element.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (window.innerHeight - bounds.top) / (window.innerHeight + bounds.height)));
      element.style.setProperty("--cinema-progress", String(progress));
    };
    const schedule = () => {
      if (visible && !reduced.matches && !frame) frame = requestAnimationFrame(update);
    };
    const pointer = (event: PointerEvent) => {
      if (reduced.matches || !fine.matches) return;
      const bounds = element.getBoundingClientRect();
      element.style.setProperty("--cinema-x", String((event.clientX - bounds.left) / bounds.width - 0.5));
      element.style.setProperty("--cinema-y", String((event.clientY - bounds.top) / bounds.height - 0.5));
    };
    const reset = () => {
      element.style.removeProperty("--cinema-x");
      element.style.removeProperty("--cinema-y");
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      schedule();
    });
    observer.observe(element);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reduced.addEventListener("change", schedule);
    element.addEventListener("pointermove", pointer);
    element.addEventListener("pointerleave", reset);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reduced.removeEventListener("change", schedule);
      element.removeEventListener("pointermove", pointer);
      element.removeEventListener("pointerleave", reset);
    };
  }, []);

  return <div ref={stage} className={`cinema-motion ${className}`}>{children}</div>;
}
