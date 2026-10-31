/** Carefully curated stock footage of AUTOMOTIVE OBJECTS only.
 * No intentionally filmed persons, paperwork, screen UI or written overlays.
 * Pexels Free License permits commercial websites, but visible trademarks
 * may carry separate rights: perform visual logo/text check before production.
 * Every src is unique and HTTP 206 / MP4 header verified in CI (2026-10-31).
 */
export const CLIPS = {
  ambient: { src: "https://videos.pexels.com/video-files/11901729/11901729-hd_1920_1080_25fps.mp4", page: "https://www.pexels.com/video/11901729/", subject: "Car headlight reflecting sunset; full-site ambient backdrop" },
  hero: { src: "https://videos.pexels.com/video-files/4707143/4707143-hd_1920_1080_24fps.mp4", page: "https://www.pexels.com/video/4707143/", subject: "Car headlight illuminating; no filmed people" },
  standard: { src: "https://videos.pexels.com/video-files/6159202/6159202-hd_1920_1080_30fps.mp4", page: "https://www.pexels.com/video/6159202/", subject: "Close-up of car paint" },
  premium: { src: "https://videos.pexels.com/video-files/8104040/8104040-hd_1920_1080_25fps.mp4", page: "https://www.pexels.com/video/8104040/", subject: "Close-up of rotating wheel" },
  surface: { src: "https://videos.pexels.com/video-files/6157786/6157786-hd_1920_1080_30fps.mp4", page: "https://www.pexels.com/video/6157786/", subject: "Detailed car surface" },
  gloss: { src: "https://videos.pexels.com/video-files/6159204/6159204-hd_1920_1080_30fps.mp4", page: "https://www.pexels.com/video/6159204/", subject: "Close-up of vehicle exterior reflections" },
  light: { src: "https://videos.pexels.com/video-files/5309342/5309342-hd_1920_1080_25fps.mp4", page: "https://www.pexels.com/video/5309342/", subject: "Reflections on a headlight" },
  paintwork: { src: "https://videos.pexels.com/video-files/6157864/6157864-hd_1920_1080_30fps.mp4", page: "https://www.pexels.com/video/6157864/", subject: "Close-up of finished paint" },
  wheel: { src: "https://videos.pexels.com/video-files/5419070/5419070-hd_1920_1080_25fps.mp4", page: "https://www.pexels.com/video/5419070/", subject: "Car headlight by evening coast" },
} as const;
export type FilmScene = keyof typeof CLIPS;
