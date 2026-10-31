"use client";

import { useEffect, useRef, useState } from "react";

type Footage = "studio" | "detail" | "night" | "engine";

// Verified Mixkit Video Free License for each source (commercial website use).
// Source pages and licensing notes: docs/cinematic-real-footage.md
const clips: Record<Footage, string> = {
  studio: "https://assets.mixkit.co/videos/preview/mixkit-parked-red-sports-car-66-large.mp4",
  detail: "https://assets.mixkit.co/videos/preview/mixkit-closeup-of-red-sports-car-49-large.mp4",
  night: "https://assets.mixkit.co/videos/preview/mixkit-rear-view-of-a-car-through-the-city-42033-large.mp4",
  engine: "https://assets.mixkit.co/videos/preview/mixkit-closeup-of-sports-car-engine-65-large.mp4",
};

export function RealCarFootage({
  clip,
  label,
  variant = "card",
  uvOverlay = false,
}: {
  clip: Footage;
  label: string;
  variant?: "hero" | "card" | "strip";
  uvOverlay?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotion = () => setReducedMotion(media.matches);
    applyMotion();
    media.addEventListener("change", applyMotion);
    return () => media.removeEventListener("change", applyMotion);
  }, []);

  useEffect(() => {
    if (!container.current || !("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => setVisible(entries[0]?.isIntersecting ?? false),
      { rootMargin: "120px", threshold: 0.08 },
    );
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    if (visible && !reducedMotion) {
      void element.play().catch(() => { /* Static fallback remains visible. */ });
    } else {
      element.pause();
    }
  }, [visible, reducedMotion, ready]);

  const play = visible && !reducedMotion && !failed;

  return (
    <div
      ref={container}
      className={`real-car-footage real-car-footage-${variant} ${ready ? "has-footage" : ""} relative isolate overflow-hidden rounded-2xl`}
      role="img"
      aria-label={label}
    >
      <div className="real-car-fallback" aria-hidden="true" />
      {!reducedMotion && visible && !failed && (
        <video
          ref={video}
          className="real-car-video"
          src={clips[clip]}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          disablePictureInPicture
          disableRemotePlayback
          aria-hidden="true"
          tabIndex={-1}
          onLoadedData={() => setReady(true)}
          onError={() => setFailed(true)}
        />
      )}
      <div className="real-car-tint" aria-hidden="true" />
      {uvOverlay && <div className="real-car-uv-sweep" aria-hidden="true" />}
      <div className="real-car-vignette" aria-hidden="true" />
    </div>
  );
}
