"use client";

import { useEffect, useRef, useState } from "react";
import { CLIPS, type FilmScene } from "@/lib/semantic-film-clips";

type FilmMode = "ambient" | "hero" | "card" | "section";

/**
 * Silent cinematic footage behind copy, NEVER an embedded rectangular video
 * inside a card. Each scene maps to relevant footage of the actual subject
 * (paintwork, workshop inspection, diagnostic device, business documentation).
 *
 * Footage is licensed stock, not a real LUVIPRO examination. Videos load only
 * near the viewport, pause offscreen, and respect reduced-motion/save-data.
 */
export function SemanticFilm({
  scene,
  mode = "card",
}: {
  scene: FilmScene;
  mode?: FilmMode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const player = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(mode === "ambient");
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const dataSave = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    const update = () => setMotionAllowed(!query.matches && !dataSave);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (mode === "ambient") return;
    const node = root.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const watch = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.01,
      rootMargin: "130px",
    });
    watch.observe(node);
    return () => watch.disconnect();
  }, [mode]);

  useEffect(() => {
    const v = player.current;
    if (!v) return;
    if (inView && motionAllowed && !failed) {
      void v.play().catch(() => { /* If autoplay is blocked, the dark fallback remains. */ });
    } else {
      v.pause();
    }
  }, [inView, motionAllowed, failed]);

  const load = inView && motionAllowed && !failed;
  return (
    <div
      ref={root}
      className={`semantic-film semantic-film-${mode}`}
      aria-hidden="true"
    >
      <div className="semantic-film-still" />
      {load && (
        <video
          ref={player}
          key={scene}
          className="semantic-film-video"
          src={CLIPS[scene].src}
          preload={mode === "hero" ? "metadata" : "none"}
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
          disableRemotePlayback
          tabIndex={-1}
          onError={() => setFailed(true)}
        />
      )}
      <div className="semantic-film-contrast" />
      <div className="semantic-film-light" />
    </div>
  );
}
