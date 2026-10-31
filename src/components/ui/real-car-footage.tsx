"use client";

import { useEffect, useRef, useState } from "react";

type Footage = "studio" | "detail" | "night" | "engine";

// Authentic Pexels automotive/traffic footage (Pexels License, commercial use).
// CDN sources below returned HTTP 206 + MP4 headers in GitHub CI on 2026-10-31.
// Footage is illustrative; it is NOT a recording of a LUVIPRO inspection.
const clips: Record<Footage, string> = {
  studio: "https://videos.pexels.com/video-files/5258413/5258413-hd_1920_1080_25fps.mp4",
  detail: "https://videos.pexels.com/video-files/10433645/10433645-hd_1920_1080_25fps.mp4",
  night: "https://videos.pexels.com/video-files/5258413/5258413-hd_1920_1080_25fps.mp4",
  engine: "https://videos.pexels.com/video-files/1192116/1192116-sd_640_360_30fps.mp4",
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
